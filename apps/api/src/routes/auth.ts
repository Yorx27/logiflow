import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { conductor: true },
    })
    if (!user || !user.activo) throw new AppError('Credenciales inválidas', 401)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new AppError('Credenciales inválidas', 401)

    const payload = { userId: user.id, rol: user.rol, conductorId: user.conductorId }
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })

    const { password: _, ...userSafe } = user
    res.json({ data: { user: userSafe, accessToken, refreshToken } })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new AppError('Refresh token requerido', 400)
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
    const newToken = jwt.sign(
      { userId: payload.userId, rol: payload.rol, conductorId: payload.conductorId },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' },
    )
    res.json({ data: { accessToken: newToken } })
  } catch (e) {
    next(e)
  }
})

// ── Endpoint público: lista conductores activos para la pantalla de login ──
authRouter.get('/conductores-activos', async (_req, res, next) => {
  try {
    const data = await prisma.conductor.findMany({
      where: { estado: { not: 'INACTIVO' } },
      select: { id: true, nombre: true, licencia: true, estado: true },
      orderBy: { nombre: 'asc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})

// ── Login por conductorId + password (sin necesidad de conocer el email) ──
authRouter.post('/login-conductor', async (req, res, next) => {
  try {
    const { conductorId, password } = req.body
    if (!conductorId || !password) throw new AppError('Datos incompletos', 400)

    const conductor = await prisma.conductor.findFirst({
      where: { id: conductorId },
      include: { usuario: true },
    })
    if (!conductor?.usuario || !conductor.usuario.activo)
      throw new AppError('Conductor sin cuenta activa', 401)

    const valid = await bcrypt.compare(password, conductor.usuario.password)
    if (!valid) throw new AppError('PIN incorrecto', 401)

    const payload = {
      userId: conductor.usuario.id,
      rol: conductor.usuario.rol,
      conductorId: conductor.id,
    }
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '12h' })
    const { password: _, ...usuarioSafe } = conductor.usuario
    res.json({ data: { accessToken, conductor: { ...conductor, usuario: usuarioSafe } } })
  } catch (e) { next(e) }
})

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user!.userId },
      include: { conductor: true },
      omit: { password: true } as never,
    })
    if (!user) throw new AppError('Usuario no encontrado', 404)
    res.json({ data: user })
  } catch (e) {
    next(e)
  }
})
