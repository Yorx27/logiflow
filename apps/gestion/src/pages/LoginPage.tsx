import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const nav = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('admin@logiflow.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
      nav('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <span className="font-display font-black text-carbon-900 text-3xl">L</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white">LogiFlow</h1>
          <p className="text-carbon-400 mt-1 text-sm">Sistema de Gestión Logística</p>
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-xl mb-6 text-white">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@logiflow.com"
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-carbon-700">
            <p className="text-xs text-carbon-500 mb-2">Usuarios demo:</p>
            <div className="space-y-1 text-xs text-carbon-400">
              <div>admin@logiflow.com / admin123</div>
              <div>operador1@logiflow.com / operador123</div>
              <div>carlos@logiflow.com / conductor123</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
