import { useUIStore } from '../../stores/uiStore'

const COLORS = {
  success: 'bg-green-500/20 border-green-500/50 text-green-300',
  error: 'bg-red-500/20 border-red-500/50 text-red-300',
  warning: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
}
const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm
                      shadow-lg pointer-events-auto max-w-sm animate-slide-up ${COLORS[t.type]}`}
          onClick={() => removeToast(t.id)}
        >
          <span>{ICONS[t.type]}</span>
          <span className="text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
