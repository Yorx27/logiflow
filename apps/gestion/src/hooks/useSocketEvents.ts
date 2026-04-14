import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../stores/authStore'
import { toast } from '../stores/uiStore'

export function useSocketEvents() {
  const { user, accessToken } = useAuthStore()
  const qc = useQueryClient()

  useEffect(() => {
    if (!user) return
    const socket = getSocket(accessToken || undefined)

    socket.emit('join:rol', { rol: user.rol, conductorId: user.conductorId })

    socket.on('entrega:actualizada', () => {
      qc.invalidateQueries({ queryKey: ['entregas'] })
      qc.invalidateQueries({ queryKey: ['solicitudes'] })
    })

    socket.on('solicitud:nueva', ({ ot, cliente }: { ot: string; cliente: string }) => {
      toast.info(`Nueva solicitud ${ot} de ${cliente}`)
      qc.invalidateQueries({ queryKey: ['solicitudes'] })
    })

    socket.on('notificacion:nueva', ({ mensaje, tipo }: { mensaje: string; tipo: string }) => {
      const t = tipo.toLowerCase() as 'success' | 'error' | 'warning' | 'info'
      toast[t]?.(mensaje) ?? toast.info(mensaje)
      qc.invalidateQueries({ queryKey: ['notificaciones'] })
    })

    socket.on('conductor:estado', () => {
      qc.invalidateQueries({ queryKey: ['conductores'] })
    })

    socket.on('dashboard:kpis', () => {
      qc.invalidateQueries({ queryKey: ['kpis'] })
    })

    return () => {
      socket.off('entrega:actualizada')
      socket.off('solicitud:nueva')
      socket.off('notificacion:nueva')
      socket.off('conductor:estado')
      socket.off('dashboard:kpis')
    }
  }, [user, accessToken, qc])
}
