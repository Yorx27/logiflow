import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { formatTiempo } from '@logiflow/utils'
import { prisma } from '../utils/prisma'

export const rutaRouter = Router()
rutaRouter.use(authenticate)

function generarAlertasPesado(km: number, min: number): string[] {
  const alertas: string[] = []
  if (km > 100) alertas.push('Ruta larga — verificar permisos de circulación para carga pesada')
  if (min > 180) alertas.push('Tiempo estimado superior a 3h — considerar descanso obligatorio')
  alertas.push('Verificar restricciones de horario para transporte pesado en CDMX (6–10h / 18–22h)')
  return alertas
}

async function geocodificar(direccion: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(direccion)
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=mx`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LogiFlow/1.0 (admin@logiflow.com)' },
    })
    const json = await res.json() as any[]
    if (!json.length) return null
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) }
  } catch {
    return null
  }
}

rutaRouter.post('/calcular', async (req, res, next) => {
  try {
    const { origenDireccion, destinoLat, destinoLng, tipoTransporte } = z.object({
      origenDireccion: z.string().optional(),
      destinoLat: z.number(),
      destinoLng: z.number(),
      tipoTransporte: z.string().optional(),
    }).parse(req.body)

    const cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } })

    let origen: { lat: number; lng: number } | null = null

    if (origenDireccion) {
      origen = await geocodificar(origenDireccion)
    }
    if (!origen && cfg?.latOrigen && cfg?.lngOrigen) {
      origen = { lat: cfg.latOrigen, lng: cfg.lngOrigen }
    }
    if (!origen) throw new AppError('No se pudo obtener coordenadas de origen', 400)

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destinoLng},${destinoLat}?overview=false`
    const osrmRes = await fetch(osrmUrl)
    if (!osrmRes.ok) throw new AppError('Error al calcular ruta con OSRM', 502)
    const osrmJson = await osrmRes.json() as any

    if (!osrmJson.routes?.length) throw new AppError('No se encontró ruta', 404)
    const { distance, duration } = osrmJson.routes[0]
    const km = Math.round((distance / 1000) * 10) / 10
    const min = Math.round(duration / 60)

    const COSTO_KM: Record<string, number> = {
      TORTON: 18, RABON: 14, VAN: 10, PICKUP: 8, PLATAFORMA: 20,
    }
    const costoPorKm = COSTO_KM[tipoTransporte || ''] || 10
    const costo = Math.round(km * costoPorKm * 100) / 100

    const alertas = generarAlertasPesado(km, min)

    res.json({ data: { km, tiempo: formatTiempo(min), costo, alertas } })
  } catch (e) { next(e) }
})

rutaRouter.post('/geocodificar', async (req, res, next) => {
  try {
    const { direccion } = z.object({ direccion: z.string().min(3) }).parse(req.body)
    const result = await geocodificar(direccion)
    if (!result) throw new AppError('No se encontró la dirección', 404)
    res.json({ data: result })
  } catch (e) { next(e) }
})
