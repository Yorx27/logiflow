import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
export function LoginPage() {
    const nav = useNavigate();
    const { setAuth } = useAuthStore();
    const [email, setEmail] = useState('admin@logiflow.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = res.data.data;
            setAuth(user, accessToken, refreshToken);
            nav('/dashboard', { replace: true });
        }
        catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-carbon-900 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20", children: _jsx("span", { className: "font-display font-black text-carbon-900 text-3xl", children: "L" }) }), _jsx("h1", { className: "font-display font-bold text-3xl text-white", children: "LogiFlow" }), _jsx("p", { className: "text-carbon-400 mt-1 text-sm", children: "Sistema de Gesti\u00F3n Log\u00EDstica" })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { className: "font-display font-semibold text-xl mb-6 text-white", children: "Iniciar Sesi\u00F3n" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Correo electr\u00F3nico" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "input", placeholder: "admin@logiflow.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Contrase\u00F1a" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "input", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2", children: error })), _jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full mt-2", children: loading ? 'Iniciando...' : 'Iniciar Sesión' })] }), _jsxs("div", { className: "mt-5 pt-4 border-t border-carbon-700", children: [_jsx("p", { className: "text-xs text-carbon-500 mb-2", children: "Usuarios demo:" }), _jsxs("div", { className: "space-y-1 text-xs text-carbon-400", children: [_jsx("div", { children: "admin@logiflow.com / admin123" }), _jsx("div", { children: "operador1@logiflow.com / operador123" }), _jsx("div", { children: "carlos@logiflow.com / conductor123" })] })] })] }), _jsx("p", { className: "text-center text-carbon-500 text-xs mt-4", children: "Powered by RAGA \u00B7 CDMX" })] }) }));
}
