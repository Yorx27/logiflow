import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export interface JwtPayload {
  userId: string
  rol: string
  conductorId?: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new AppError('Token requerido', 401)
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    next()
  } catch {
    throw new AppError('Token inválido o expirado', 401)
  }
}

export function requireRol(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      throw new AppError('No tienes permiso para esta acción', 403)
    }
    next()
  }
}
