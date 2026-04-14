import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
export function useNotifBadge() {
    const { data } = useQuery({
        queryKey: ['notificaciones'],
        queryFn: async () => {
            const res = await api.get('/notificaciones');
            return res.data.data;
        },
        refetchInterval: 60000,
    });
    return data?.filter((n) => !n.leida).length ?? 0;
}
