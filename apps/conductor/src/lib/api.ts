import axios from 'axios'
import { useConductorStore } from '../stores/conductorStore'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

export const api = axios.create({ baseURL: BASE, timeout: 30_000 })

api.interceptors.request.use((config) => {
  const token = useConductorStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useConductorStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
