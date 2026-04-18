import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useConductorStore } from '../stores/conductorStore'

// URL base sin autenticación (para endpoints públicos)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

interface ConductorPublico {
  id: string
  nombre: string
  licencia: string
  estado: string
}

export function LoginPage() {
  const nav = useNavigate()
  const { setSession } = useConductorStore()
  const [selectedId, setSelectedId] = useState('')
  const [pin, setPin] = useState('conductor123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Usa endpoint PÚBLICO — sin token, sin 401
  const { data: conductores = [], isError } = useQuery<ConductorPublico[]>({
    queryKey: ['conductores-login-publico'],
    queryFn: async () => {
      const r = await axios.get(`${API_BASE}/auth/conductores-activos`)
      return r.data.data
    },
    retry: 2,
    staleTime: 60_000,
  })

  async function handleLogin() {
    if (!selectedId) { setError('Selecciona un conductor'); return }
    setError(''); setLoading(true)
    try {
      // Usa el nuevo endpoint que recibe conductorId + password
      const res = await axios.post(`${API_BASE}/auth/login-conductor`, {
        conductorId: selectedId,
        password: pin,
      })
      const { accessToken, conductor } = res.data.data
      setSession(conductor, accessToken)
      nav('/inicio', { replace: true })
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Error al iniciar sesión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-carbon-900 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <span className="font-display font-black text-carbon-900 text-4xl">L</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white">LogiFlow</h1>
          <p className="text-carbon-400 mt-1">Portal del Conductor</p>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-lg">Selecciona tu perfil</h2>

          {isError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              No se pudo cargar la lista. Verifica tu conexión.
            </div>
          )}

          <div className="space-y-2">
            {conductores.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left
                  ${selectedId === c.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-carbon-700/50 border-carbon-700 text-carbon-300 hover:bg-carbon-700'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0
                  ${selectedId === c.id ? 'bg-amber-500/30 text-amber-400' : 'bg-carbon-600 text-carbon-300'}`}>
                  {c.nombre.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{c.nombre}</p>
                  <p className="text-xs font-mono opacity-70">{c.licencia}</p>
                </div>
                {selectedId === c.id && <span className="ml-auto text-amber-400">✓</span>}
              </button>
            ))}
            {conductores.length === 0 && !isError && (
              <p className="text-carbon-500 text-sm text-center py-4">Cargando conductores...</p>
            )}
          </div>

          {selectedId && (
            <div className="space-y-1">
              <label className="text-xs text-carbon-400">Contraseña</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="input"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading || !selectedId} className="btn-primary">
            {loading ? 'Entrando...' : '🚀 Entrar al Sistema'}
          </button>
        </div>

      </div>
    </div>
  )
}
