// Konfiguracja API dla frontendu
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  register: `${API_BASE_URL}/api/users/register/`,
  login: `${API_BASE_URL}/api/auth/login/`,
  refresh: `${API_BASE_URL}/api/auth/refresh/`,
  listings: `${API_BASE_URL}/api/listings/`,
  categories: `${API_BASE_URL}/api/categories/`,
  locations: `${API_BASE_URL}/api/locations/`,
  deliveryMethods: `${API_BASE_URL}/api/delivery-methods/`,
  orders: `${API_BASE_URL}/api/orders/`,
}

export default API_BASE_URL
