import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Notificacion } from '@logiflow/types'

export function useNotifBadge() {
  const { data } = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: async () => {
      const res = await api.get('/notificaciones')
      return res.data.data
    },
    refetchInterval: 60_000,
  })
  return data?.filter((n) => !n.leida).length ?? 0
}
