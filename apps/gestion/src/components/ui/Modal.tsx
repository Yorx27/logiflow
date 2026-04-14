import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={`relative bg-carbon-800 border border-carbon-700 rounded-card shadow-2xl
                    w-full ${SIZES[size]} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-carbon-700">
          <h2 className="font-display font-bold text-lg text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-carbon-700 flex items-center justify-center
                       text-carbon-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
