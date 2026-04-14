import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { SolBadge } from '../components/ui/StatoBadge'
import type { Entrega } from '@logiflow/types'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function CalendarioPage() {
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const { data: entregas = [] } = useQuery<Entrega[]>({
    queryKey: ['entregas-calendario'],
    queryFn: async () => { const r = await api.get('/entregas'); return r.data.data },
  })

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1)

  function entregasForDay(day: number) {
    const d = new Date(year, month, day)
    return entregas.filter((e) => {
      const fecha = e.solicitud?.fechaEntrega
      if (!fecha) return false
      const f = new Date(fecha)
      return f.getFullYear() === d.getFullYear() && f.getMonth() === d.getMonth() && f.getDate() === d.getDate()
    })
  }

  const selectedEntregas = selectedDay
    ? entregas.filter((e) => {
        const fecha = e.solicitud?.fechaEntrega
        if (!fecha) return false
        const f = new Date(fecha)
        return (
          f.getFullYear() === selectedDay.getFullYear() &&
          f.getMonth() === selectedDay.getMonth() &&
          f.getDate() === selectedDay.getDate()
        )
      })
    : []

  // Weekly summary
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  const weekEntregas = entregas.filter((e) => {
    const fecha = e.solicitud?.fechaEntrega
    if (!fecha) return false
    const f = new Date(fecha)
    return f >= startOfWeek && f <= endOfWeek
  })

  return (
    <div className="space-y-5">
      <h1 className="font-display font-bold text-2xl text-white">Calendario</h1>

      {/* Weekly summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Esta semana', value: weekEntregas.length, icon: '📅' },
          { label: 'Completadas', value: weekEntregas.filter(e => e.estado === 'COMPLETADA').length, icon: '✅' },
          { label: 'Pendientes', value: weekEntregas.filter(e => e.estado === 'PENDIENTE' || e.estado === 'ASIGNADA').length, icon: '⏳' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display font-bold text-2xl text-white">{s.value}</div>
            <div className="text-xs text-carbon-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">{MESES[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrent(new Date(year, month - 1))} className="btn-ghost text-sm px-3">‹</button>
              <button onClick={() => setCurrent(new Date())} className="btn-ghost text-sm px-3">Hoy</button>
              <button onClick={() => setCurrent(new Date(year, month + 1))} className="btn-ghost text-sm px-3">›</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs text-carbon-500 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={i} />
              const ents = entregasForDay(day)
              const today = new Date()
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
              const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === month && selectedDay?.getFullYear() === year
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(new Date(year, month, day))}
                  className={`aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-sm transition-colors
                    ${isSelected ? 'bg-amber-500/20 border border-amber-500/50' : isToday ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-carbon-700'}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-blue-400' : isSelected ? 'text-amber-400' : 'text-carbon-300'}`}>{day}</span>
                  {ents.length > 0 && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="card">
          <h3 className="font-semibold text-sm text-carbon-300 mb-4">
            {selectedDay ? selectedDay.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona un día'}
          </h3>
          {selectedEntregas.length === 0 ? (
            <p className="text-carbon-500 text-sm text-center py-8">Sin entregas este día</p>
          ) : (
            <div className="space-y-3">
              {selectedEntregas.map((e) => (
                <div key={e.id} className="bg-carbon-700/50 rounded-lg p-3 space-y-1">
                  <p className="font-mono text-amber-400 text-xs">{e.solicitud?.ot}</p>
                  <p className="font-medium text-sm">{e.solicitud?.cliente}</p>
                  {e.conductor && <p className="text-xs text-carbon-400">👤 {e.conductor.nombre}</p>}
                  <SolBadge estado={e.estado} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
