import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useConductorStore } from '../stores/conductorStore';
export function LoginPage() {
    const nav = useNavigate();
    const { setSession } = useConductorStore();
    const [selectedId, setSelectedId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { data: conductores = [] } = useQuery({
        queryKey: ['conductores-login'],
        queryFn: async () => {
            // For login page, fetch without auth
            const r = await axios.get('/api/conductores', {
                headers: { Authorization: `Bearer ${localStorage.getItem('demo-token') || ''}` },
            });
            return r.data.data;
        },
        retry: false,
    });
    async function handleLogin() {
        if (!selectedId) {
            setError('Selecciona un conductor');
            return;
        }
        setError('');
        setLoading(true);
        try {
            // Login with conductor email (MVP: no PIN)
            const cond = conductores.find((c) => c.id === selectedId);
            if (!cond) {
                setError('Conductor no encontrado');
                return;
            }
            // Map conductor to email
            const emailMap = {
                'Carlos Mendoza': 'carlos@logiflow.com',
                'María González': 'maria@logiflow.com',
                'Roberto Sánchez': 'roberto@logiflow.com',
            };
            const email = emailMap[cond.nombre] || `${cond.nombre.toLowerCase().split(' ')[0]}@logiflow.com`;
            const res = await axios.post('/api/auth/login', { email, password: 'conductor123' });
            setSession(cond, res.data.data.accessToken);
            nav('/inicio', { replace: true });
        }
        catch {
            setError('Error al iniciar sesión');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-carbon-900 flex flex-col items-center justify-center p-5", children: _jsxs("div", { className: "w-full max-w-sm space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30", children: _jsx("span", { className: "font-display font-black text-carbon-900 text-4xl", children: "L" }) }), _jsx("h1", { className: "font-display font-bold text-3xl text-white", children: "LogiFlow" }), _jsx("p", { className: "text-carbon-400 mt-1", children: "Portal del Conductor" })] }), _jsxs("div", { className: "card space-y-4", children: [_jsx("h2", { className: "font-display font-semibold text-lg", children: "Selecciona tu perfil" }), _jsx("div", { className: "space-y-2", children: conductores.filter(c => c.estado !== 'INACTIVO').map((c) => (_jsxs("button", { onClick: () => setSelectedId(c.id), className: `w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left
                  ${selectedId === c.id
                                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                                    : 'bg-carbon-700/50 border-carbon-700 text-carbon-300 hover:bg-carbon-700'}`, children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0
                  ${selectedId === c.id ? 'bg-amber-500/30 text-amber-400' : 'bg-carbon-600 text-carbon-300'}`, children: c.nombre.charAt(0) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white", children: c.nombre }), _jsx("p", { className: "text-xs font-mono opacity-70", children: c.licencia })] }), selectedId === c.id && _jsx("span", { className: "ml-auto text-amber-400", children: "\u2713" })] }, c.id))) }), error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3", children: error })), _jsx("button", { onClick: handleLogin, disabled: loading || !selectedId, className: "btn-primary", children: loading ? 'Entrando...' : '🚀 Entrar al Sistema' })] })] }) }));
}
