import axios from 'axios'

function normalizeApiBaseUrl(value) {
  const baseUrl = (value || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')).replace(/\/+$/, '')
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function handleAuthExpired() {
  localStorage.removeItem('token')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleAuthExpired()
    }
    return Promise.reject(error)
  }
)

export default api
