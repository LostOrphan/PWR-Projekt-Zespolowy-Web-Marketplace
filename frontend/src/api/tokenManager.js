import Cookies from 'universal-cookie'
import { API_ENDPOINTS } from './config'

const cookies = new Cookies()

// Decode JWT token to check expiration
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const payload = JSON.parse(atob(parts[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    // If token expires in less than 1 minute, consider it expired
    return payload.exp < currentTime + 60
  } catch (err) {
    return true
  }
}

// Refresh the access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = cookies.get('refresh_token')
    
    if (!refreshToken) {
      return { success: false, error: 'Brak refresh tokenu' }
    }

    const response = await fetch(API_ENDPOINTS.refresh, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    })

    const data = await response.json()

    if (response.status === 200 && data.access) {
      // Update the access token in cookies
      cookies.set('token', data.access, { path: '/' })
      return { success: true, data }
    } else {
      // Refresh token is invalid, user needs to login again
      cookies.remove('token', { path: '/' })
      cookies.remove('refresh_token', { path: '/' })
      cookies.remove('username', { path: '/' })
      return { success: false, error: 'Sesja wygasła. Zaloguj się ponownie.' }
    }
  } catch (err) {
    console.error('Token refresh error:', err)
    return { success: false, error: 'Błąd przy odświeżaniu tokenu' }
  }
}

// Wrapper for API calls that handles token refresh on 401
export const fetchWithTokenRefresh = async (url, options = {}) => {
  const { 'Authorization': authHeader, ...restHeaders } = options.headers || {}
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...restHeaders,
      ...(authHeader && { Authorization: authHeader }),
    },
  })

  // If unauthorized and we have a token, try to refresh it
  if (response.status === 401 && authHeader?.includes('Bearer')) {
    const refreshResult = await refreshAccessToken()
    
    if (refreshResult.success) {
      const newToken = refreshResult.data.access
      // Retry the original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...restHeaders,
          Authorization: `Bearer ${newToken}`,
        },
      })
    }
  }

  return response
}

export default { isTokenExpired, refreshAccessToken, fetchWithTokenRefresh }
