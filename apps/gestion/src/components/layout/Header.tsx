import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { disconnectSocket } from '../../lib/socket'

export function Header() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()

  function handleLogout() {
    disconnectSocket()
    logout()
    window.location.href = '/login'
  }

  return (
    <header className="h-14 bg-carbon-800/80 backdrop-blur-sm border-b border-carbon-700
                       flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-carbon-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        <div className="w-5 h-0.5 bg-carbon-300 mb-1 rounded" />
        <div className="w-5 h-0.5 bg-carbon-300 mb-1 rounded" />
        <div className="w-5 h-0.5 bg-carbon-300 rounded" />
      </button>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-white leading-none">{user?.nombre}</p>
          <p className="text-xs text-carbon-400 mt-0.5">{user?.rol}</p>
        </div>
        <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/40 rounded-full
                        flex items-center justify-center text-amber-400 font-bold text-sm">
          {user?.nombre?.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-carbon-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-carbon-700"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
