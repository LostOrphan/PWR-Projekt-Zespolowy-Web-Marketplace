import { API_ENDPOINTS } from './config'
import Cookies from 'universal-cookie'
const cookies = new Cookies()

export const registerUser = async (userData) => {
  const response = await fetch(API_ENDPOINTS.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone_num: userData.phone || null,
      password: userData.password,
    }),
  })

  const data = await response.json()

  if (response.status === 201) {
    return { success: true, data }
  } else if (response.status === 400) {
    const errors = Object.values(data).flat().join(' ')
    return { success: false, error: errors || 'Błąd walidacji' }
  } else {
    return { success: false, error: 'Błąd serwera' }
  }
}

export const loginUser = async (credentials) => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  })

  const data = await response.json()

  if (response.status === 200) {
    return { success: true, data }
  } else if (response.status === 401) {
    return { success: false, error: 'Nieprawidłowy email lub hasło' }
  } else if (response.status === 400) {
    const errors = Object.values(data).flat().join(', ')
    return { success: false, error: errors || 'Błąd walidacji' }
  } else {
    return { success: false, error: 'Błąd serwera' }
  }
}

export const refreshToken = async (refreshToken) => {
  try {
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

    if (response.status === 200) {
      return { success: true, data }
    } else {
      return { success: false, error: 'Nie można odświeżyć tokenu' }
    }
  } catch (err) {
    console.error('Refresh token error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const logoutUser = (removeCookie) => {
  removeCookie('username', { path: '/' })
  removeCookie('token', { path: '/' })
  removeCookie('refresh_token', { path: '/' })
  return { success: true }
}

export const getUserProfile = async (token) => {
  try {
    if (!token) return { success: false, error: 'Brak tokenu autoryzacji.' }

    const response = await fetch(API_ENDPOINTS.profile, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data }
    } else if (response.status === 401) {
      return { success: false, error: 'Sesja wygasła. Zaloguj się ponownie.' }
    } else {
      return { success: false, error: 'Nie udało się pobrać danych profilu.' }
    }
  } catch (err) {
    console.error('Fetch profile error:', err)
    return { success: false, error: 'Błąd połączenia z serwerem.' }
  }
}

export const updateUserProfile = async (userData, token) => {
  try {
    if (!token) return { success: false, error: 'Brak tokenu autoryzacji.' }

    const bodyData = {
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone_num: userData.phone || null,
    }

    if (userData.password) {
      bodyData.password = userData.password
    }

    const response = await fetch(API_ENDPOINTS.profile, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    })

    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data }
    } else if (response.status === 400) {
      const errors = Object.values(data).flat().join(' ')
      return { success: false, error: errors || 'Błąd walidacji danych.' }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji lub sesja wygasła.' }
    } else {
      return { success: false, error: 'Błąd serwera podczas zapisu.' }
    }
  } catch (err) {
    console.error('Update profile error:', err)
    return { success: false, error: 'Błąd połączenia z serwerem.' }
  }
}