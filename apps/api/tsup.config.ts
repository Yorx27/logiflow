import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  noExternal: ['@logiflow/types', '@logiflow/utils'],
  external: ['@prisma/client', 'bcryptjs', 'exceljs', 'pdfkit'],
  clean: true,
  sourcemap: false,
  minify: false,
})
