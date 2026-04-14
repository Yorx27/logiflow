import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from './errorHandler'

const uploadDir = process.env.UPLOAD_DIR || './uploads'

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(uploadDir, 'fotos')
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new AppError('Solo se permiten archivos de imagen', 400))
    return
  }
  cb(null, true)
}

export const uploadFotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    files: 8,
  },
})

// Upload para documentos de entrega (PDF + imágenes)
const storageDocumentos = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(uploadDir, 'documentos')
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilterDocumentos = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.mimetype)) {
    cb(new AppError('Solo se permiten imágenes o PDF', 400))
    return
  }
  cb(null, true)
}

export const uploadDocumentos = multer({
  storage: storageDocumentos,
  fileFilter: fileFilterDocumentos,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
})

export function getFileUrl(filename: string, subfolder = 'fotos'): string {
  return `/uploads/${subfolder}/${path.basename(filename)}`
}

export function saveFirma(base64: string): string {
  const dir = path.resolve(uploadDir, 'firmas')
  ensureDir(dir)
  const filename = `${uuidv4()}.png`
  const filepath = path.join(dir, filename)
  const data = base64.replace(/^data:image\/png;base64,/, '')
  fs.writeFileSync(filepath, Buffer.from(data, 'base64'))
  return `/uploads/firmas/${filename}`
}
