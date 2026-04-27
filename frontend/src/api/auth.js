import { API_ENDPOINTS } from './config'

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
    const errors = Object.values(data).flat().join(', ')
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

export const logoutUser = (removeCookie) => {
  removeCookie('username', { path: '/' })
  removeCookie('token', { path: '/' })
  return { success: true }
}
