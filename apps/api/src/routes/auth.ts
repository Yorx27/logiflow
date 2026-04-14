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
