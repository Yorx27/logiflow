import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SignatureCanvas from 'react-signature-canvas'
import { api } from '../lib/api'
import { toast } from '../stores/toastStore'
import type { Entrega, Evidencia } from '@logiflow/types'

// ─── Sub-components ────────────────────────────────────────────────────────────

function CheckItem({ label, checked, onToggle, timestamp }: {
  label: string; checked: boolean; onToggle: () => void; timestamp?: string | null
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`check-item w-full ${checked ? 'check-item-active' : 'check-item-inactive'}`}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
        ${checked ? 'bg-green-500 border-green-500' : 'border-carbon-500'}`}>
        {checked && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{label}</p>
        {checked && timestamp && (
          <p className="text-xs opacity-60 mt-0.5">{new Date(timestamp).toLocaleTimeString('es-MX')}</p>
        )}
      </div>
    </button>
  )
}

function PhotoGrid({ fotos, onRemove }: { fotos: { url: string; name: string }[]; onRemove: (i: number) => void }) {
  if (!fotos.length) return null
  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {fotos.map((f, i) => (
        <div key={i} className="relative aspect-square">
          <img src={f.url} alt={f.name} className="w-full h-full object-cover rounded-lg bg-carbon-700" />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
          >×</button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ChecklistPage() {
  const { entregaId } = useParams<{ entregaId: string }>()
  const nav = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [checks, setChecks] = useState<Record<string, string | null>>({})
  const [fotosDescarga, setFotosDescarga] = useState<{ url: string; name: string; file: File }[]>([])
  const [fotosDocs, setFotosDocs] = useState<{ url: string; name: string; file: File }[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [uploading, setUploading] = useState(false)
  const sigRef = useRef<SignatureCanvas>(null)
  const fileDescRef = useRef<HTMLInputElement>(null)
  const fileDocsRef = useRef<HTMLInputElement>(null)

  const { data: entrega } = useQuery<Entrega>({
    queryKey: ['entrega', entregaId],
    queryFn: async () => { const r = await api.get(`/entregas`); return (r.data.data as Entrega[]).find((e) => e.id === entregaId)! },
    enabled: !!entregaId,
  })

  const { data: evidencia, refetch: refetchEv } = useQuery<Evidencia | null>({
    queryKey: ['evidencia', entregaId],
    queryFn: async () => { const r = await api.get(`/evidencias/${entregaId}`); return r.data.data },
    enabled: !!entregaId,
  })

  // Sync checks from server
  useEffect(() => {
    if (evidencia) {
      setChecks({
        llegada: evidencia.checkLlegada || null,
        contacto: evidencia.checkContacto || null,
        descarga: evidencia.checkDescarga || null,
        conteo: evidencia.checkConteo || null,
        condicion: evidencia.checkCondicion || null,
        remision: evidencia.checkRemision || null,
        acuse: evidencia.checkAcuse || null,
      })
    }
  }, [evidencia])

  async function toggleCheck(tipo: string) {
    if (checks[tipo]) return // already checked, can't uncheck
    const ts = new Date().toISOString()
    setChecks((c) => ({ ...c, [tipo]: ts }))
    try {
      await api.post(`/evidencias/${entregaId}/check`, { tipo, timestamp: ts })
      refetchEv()
    } catch {
      toast.error('Error al registrar check')
      setChecks((c) => ({ ...c, [tipo]: null }))
    }
  }

  function handleFotos(files: FileList | null, categoria: 'descarga' | 'docs') {
    if (!files) return
    const arr = Array.from(files)
    const newFotos = arr.map((f) => ({ url: URL.createObjectURL(f), name: f.name, file: f }))
    if (categoria === 'descarga') setFotosDescarga((p) => [...p, ...newFotos].slice(0, 8))
    else setFotosDocs((p) => [...p, ...newFotos].slice(0, 8))
  }

  async function uploadFotos(categoria: 'DESCARGA' | 'DOCUMENTOS', fotos: { file: File }[]) {
    if (!fotos.length) return
    const form = new FormData()
    fotos.forEach((f) => form.append('fotos', f.file))
    form.append('categoria', categoria)
    await api.post(`/evidencias/${entregaId}/fotos`, form)
  }

  async function handleFinalizar() {
    setUploading(true)
    try {
      // Upload photos
      await uploadFotos('DESCARGA', fotosDescarga)
      await uploadFotos('DOCUMENTOS', fotosDocs)

      // Upload signature if present
      if (!sigRef.current?.isEmpty()) {
        const firma = sigRef.current!.toDataURL('image/png')
        await api.post(`/evidencias/${entregaId}/firma`, { firma })
      }

      // Finalize
      await api.put(`/evidencias/${entregaId}/finalizar`, { observaciones })
      qc.invalidateQueries({ queryKey: ['mis-entregas'] })
      toast.success('¡Entrega completada!')
      nav('/inicio')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al finalizar')
    } finally {
      setUploading(false)
    }
  }

  // Progress
  const STEPS = ['Llegada', 'Descarga', 'Documentación', 'Confirmación']
  const progressPct = ((step) / (STEPS.length - 1)) * 100

  // Validations
  const canStep1 = !!checks.llegada
  const canStep2 = !!checks.descarga
  const canStep3 = !!checks.remision

  return (
    <div className="min-h-screen flex flex-col bg-carbon-900">
      {/* Header */}
      <div className="bg-carbon-800 border-b border-carbon-700 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => nav('/inicio')} className="w-9 h-9 bg-carbon-700 rounded-xl flex items-center justify-center text-carbon-300">←</button>
          <div className="flex-1">
            <p className="font-display font-bold text-white">{entrega?.solicitud?.cliente}</p>
            <p className="text-xs font-mono text-carbon-400">{entrega?.solicitud?.ot}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-500 text-carbon-900' : 'bg-carbon-700 text-carbon-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-0.5 flex-1 bg-carbon-700 rounded overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: i < step ? '100%' : '0%' }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-carbon-400 text-center">{STEPS[step]}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">

        {/* PASO 1: Llegada */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg text-white">Paso 1 — Llegada al destino</h2>
            {entrega?.solicitud?.direccionEntrega && (
              <div className="card bg-blue-500/5 border-blue-500/20">
                <p className="text-sm text-blue-300">📍 {entrega.solicitud.direccionEntrega}</p>
              </div>
            )}
            <CheckItem label="Confirmar llegada al destino" checked={!!checks.llegada} onToggle={() => toggleCheck('llegada')} timestamp={checks.llegada} />
            <CheckItem label="Contacto con receptor establecido" checked={!!checks.contacto} onToggle={() => toggleCheck('contacto')} timestamp={checks.contacto} />
            {!checks.llegada && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                Debes confirmar la llegada para continuar
              </p>
            )}
          </div>
        )}

        {/* PASO 2: Descarga */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg text-white">Paso 2 — Descarga de mercancía</h2>
            <CheckItem label="Descarga iniciada" checked={!!checks.descarga} onToggle={() => toggleCheck('descarga')} timestamp={checks.descarga} />
            <CheckItem label="Conteo de piezas verificado" checked={!!checks.conteo} onToggle={() => toggleCheck('conteo')} timestamp={checks.conteo} />
            <CheckItem label="Mercancía en buen estado" checked={!!checks.condicion} onToggle={() => toggleCheck('condicion')} timestamp={checks.condicion} />

            {/* Fotos descarga */}
            <div>
              <p className="label">Fotos de descarga ({fotosDescarga.length}/8)</p>
              <button
                type="button"
                onClick={() => fileDescRef.current?.click()}
                disabled={fotosDescarga.length >= 8}
                className="btn-ghost text-sm"
              >
                📷 Tomar / Subir Fotos
              </button>
              <input
                ref={fileDescRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => handleFotos(e.target.files, 'descarga')}
              />
              <PhotoGrid fotos={fotosDescarga} onRemove={(i) => setFotosDescarga((p) => p.filter((_, j) => j !== i))} />
            </div>
          </div>
        )}

        {/* PASO 3: Documentación */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-white">Paso 3 — Documentación</h2>
            <CheckItem label="Remisión / Carta porte entregada" checked={!!checks.remision} onToggle={() => toggleCheck('remision')} timestamp={checks.remision} />
            <CheckItem label="Acuse de recibo obtenido" checked={!!checks.acuse} onToggle={() => toggleCheck('acuse')} timestamp={checks.acuse} />

            {/* Fotos docs */}
            <div>
              <p className="label">Fotos de documentos firmados ({fotosDocs.length}/8)</p>
              <button
                type="button"
                onClick={() => fileDocsRef.current?.click()}
                disabled={fotosDocs.length >= 8}
                className="btn-ghost text-sm"
              >
                📄 Tomar / Subir Fotos
              </button>
              <input
                ref={fileDocsRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => handleFotos(e.target.files, 'docs')}
              />
              <PhotoGrid fotos={fotosDocs} onRemove={(i) => setFotosDocs((p) => p.filter((_, j) => j !== i))} />
            </div>

            {/* Firma digital */}
            <div>
              <p className="label">Firma digital del receptor</p>
              <div className="bg-white rounded-xl overflow-hidden border border-carbon-600">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#0d0f14"
                  canvasProps={{
                    className: 'w-full',
                    style: { height: 160, display: 'block', touchAction: 'none' },
                  }}
                />
              </div>
              <button type="button" onClick={() => sigRef.current?.clear()} className="text-xs text-carbon-400 mt-2 underline">
                Limpiar firma
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Confirmación */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-white">Paso 4 — Confirmación</h2>

            {/* Summary */}
            <div className="card space-y-2">
              <p className="font-semibold text-carbon-300 text-sm">Resumen de checks</p>
              {[
                ['llegada', 'Llegada'], ['contacto', 'Contacto'], ['descarga', 'Descarga'],
                ['conteo', 'Conteo'], ['condicion', 'Condición'], ['remision', 'Remisión'], ['acuse', 'Acuse'],
              ].map(([key, label]) => (
                <div key={key} className={`flex items-center gap-2 text-sm ${checks[key] ? 'text-green-400' : 'text-carbon-600'}`}>
                  <span>{checks[key] ? '✅' : '⬜'}</span>
                  <span>{label}</span>
                  {checks[key] && <span className="text-xs opacity-60 ml-auto">{new Date(checks[key]!).toLocaleTimeString('es-MX')}</span>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="card text-center">
                <p className="text-carbon-400 text-xs">Fotos descarga</p>
                <p className="font-bold text-white text-lg">{fotosDescarga.length}</p>
              </div>
              <div className="card text-center">
                <p className="text-carbon-400 text-xs">Fotos documentos</p>
                <p className="font-bold text-white text-lg">{fotosDocs.length}</p>
              </div>
            </div>

            {sigRef.current && !sigRef.current.isEmpty() && (
              <div className="card flex items-center gap-2 text-green-400 text-sm">
                <span>✅</span> Firma digital capturada
              </div>
            )}

            <div>
              <label className="label">Observaciones finales</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="input"
                rows={3}
                placeholder="Alguna observación sobre la entrega..."
              />
            </div>

            <button
              onClick={handleFinalizar}
              disabled={uploading}
              className="btn-primary text-base"
            >
              {uploading ? 'Enviando evidencias...' : '✅ Confirmar Entrega'}
            </button>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-carbon-800 border-t border-carbon-700 px-4 py-3 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-none w-auto px-5">← Anterior</button>
        )}
        {step < 3 && (
          <button
            onClick={() => {
              if (step === 0 && !canStep1) { toast.error('Confirma tu llegada primero'); return }
              if (step === 1 && !canStep2) { toast.error('Confirma el inicio de descarga'); return }
              if (step === 2 && !canStep3) { toast.error('Confirma la entrega de remisión'); return }
              setStep(s => s + 1)
            }}
            className="btn-primary"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  )
}
