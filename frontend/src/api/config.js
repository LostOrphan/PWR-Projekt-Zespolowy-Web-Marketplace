// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  register: `${API_BASE_URL}/api/users/register/`,
  login: `${API_BASE_URL}/api/auth/login/`,
  listings: `${API_BASE_URL}/api/listings/`,
  categories: `${API_BASE_URL}/api/categories/`,
  locations: `${API_BASE_URL}/api/locations/`,
}

export default API_BASE_URL
