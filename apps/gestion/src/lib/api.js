import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
export const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
});
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
api.interceptors.response.use((r) => r, async (error) => {
    if (error.response?.status === 401) {
        const refresh = useAuthStore.getState().refreshToken;
        if (refresh) {
            try {
                const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
                useAuthStore.getState().setTokens(data.data.accessToken, refresh);
                error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return axios(error.config);
            }
            catch {
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        else {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
