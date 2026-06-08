import { API_ENDPOINTS } from './config'
import { refreshAccessToken } from './tokenManager'
import Cookies from 'universal-cookie'

const cookies = new Cookies()

// Helper function to handle API calls with automatic token refresh
const fetchWithAuthRefresh = async (url, options = {}) => {
  let response = await fetch(url, options)

  // If unauthorized and we have a token, try to refresh it
  if (response.status === 401 && options.headers?.Authorization?.includes('Bearer')) {
    const refreshResult = await refreshAccessToken()
    
    if (refreshResult.success) {
      const newToken = refreshResult.data.access
      // Retry the original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      })
    }
  }

  return response
}

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (data && typeof data === 'object') {
    return data.results || []
  }

  return []
}

export const getCategories = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.categories)
    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data: normalizeListResponse(data) }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu kategorii' }
    }
  } catch (err) {
    console.error('Get categories error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const getLocations = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.locations)
    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data: normalizeListResponse(data) }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu lokalizacji' }
    }
  } catch (err) {
    console.error('Get locations error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const getListings = async (filters = {}, fetchAll = false) => {
  try {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_ENDPOINTS.listings}?${params}`)
    const data = await response.json()

    if (response.status === 200) {
      if (!fetchAll) {
        // ZMIANA: Zwracaj cały obiekt 'data', a nie tylko 'data.results'
        return { success: true, data: data } 
      }

      const allResults = [...(data.results || [])]
      let nextUrl = data.next
      // ... reszta pętli bez zmian

      while (nextUrl) {
        const nextResponse = await fetch(nextUrl)
        const nextData = await nextResponse.json()

        if (nextResponse.status === 200) {
          allResults.push(...(nextData.results || []))
          nextUrl = nextData.next
        } else {
          return { success: false, error: 'Błąd przy pobieraniu ogłoszeń' }
        }
      }

      return { success: true, data: allResults }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu ogłoszeń' }
    }
  } catch (err) {
    console.error('Get listings error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const getListingById = async (id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.listings}${id}/`)
    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data }
    } else {
      return { success: false, error: 'Ogłoszenie nie znalezione' }
    }
  } catch (err) {
    console.error('Get listing error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const searchListings = async (query, filters = {}, fetchAll = false) => {
  try {
    const params = new URLSearchParams({ search: query, ...filters })
    const response = await fetch(`${API_ENDPOINTS.listings}?${params}`)
    const data = await response.json()

    if (response.status === 200) {
      if (!fetchAll) {
        return { success: true, data: data.results || [] }
      }

      // Fetch all pages if fetchAll is true
      const allResults = [...(data.results || [])]
      let nextUrl = data.next

      while (nextUrl) {
        const nextResponse = await fetch(nextUrl)
        const nextData = await nextResponse.json()

        if (nextResponse.status === 200) {
          allResults.push(...(nextData.results || []))
          nextUrl = nextData.next
        } else {
          return { success: false, error: 'Błąd przy pobieraniu ogłoszeń' }
        }
      }

      return { success: true, data: allResults }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu ogłoszeń' }
    }
  } catch (err) {
    console.error('Search listings error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const createListing = async (listingData, token) => {
  try {
    if (!token) {
      return { success: false, error: 'Token nie znaleziony. Zaloguj się ponownie.' }
    }

    const formData = new FormData()
    formData.append('title', listingData.title)
    formData.append('category', parseInt(listingData.category))
    formData.append('price', parseFloat(listingData.price))
    formData.append('description', listingData.description)
    if (listingData.location) {
      formData.append('location', parseInt(listingData.location))
    }
    if (listingData.street) {
      formData.append('street', listingData.street)
    }
    if (listingData.buildingNumber) {
      formData.append('building_number', listingData.buildingNumber)
    }
    if (listingData.apartmentNumber) {
      formData.append('apartment_number', listingData.apartmentNumber)
    }

    // Append delivery methods
    if (listingData.deliveryMethods && listingData.deliveryMethods.length > 0) {
      listingData.deliveryMethods.forEach((methodId) => {
        formData.append('delivery_methods', methodId)
      })
    }

    // Append image files
    if (listingData.imageFiles && listingData.imageFiles.length > 0) {
      listingData.imageFiles.forEach((file) => {
        formData.append('uploaded_images', file)
      })
    }

    console.log('Creating listing with token:', token.substring(0, 20) + '...')

    const response = await fetchWithAuthRefresh(API_ENDPOINTS.listings, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (response.status === 201) {
      return { success: true, data }
    } else if (response.status === 400) {
      const errors = Object.values(data).flat().join(' ')
      return { success: false, error: errors || 'Błąd walidacji' }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji' }
    } else {
      return { success: false, error: 'Błąd serwera' }
    }
  } catch (err) {
    console.error('Create listing error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const getUserListings = async (token) => {
  try {
    if (!token) {
      return { success: false, error: 'Token nie znaleziony. Zaloguj się ponownie.' }
    }

    const response = await fetchWithAuthRefresh(`${API_ENDPOINTS.listings}my_listings/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data: Array.isArray(data) ? data : [] }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji' }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu ogłoszeń' }
    }
  } catch (err) {
    console.error('Get user listings error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const updateListing = async (id, listingData, token) => {
  try {
    if (!token) {
      return { success: false, error: 'Token nie znaleziony. Zaloguj się ponownie.' }
    }

    const formData = new FormData()
    formData.append('title', listingData.title)
    formData.append('category', parseInt(listingData.category))
    formData.append('price', parseFloat(listingData.price))
    formData.append('description', listingData.description)
    if (listingData.location) {
      formData.append('location', parseInt(listingData.location))
    }
    if (listingData.street) {
      formData.append('street', listingData.street)
    }
    if (listingData.buildingNumber) {
      formData.append('building_number', listingData.buildingNumber)
    }
    if (listingData.apartmentNumber) {
      formData.append('apartment_number', listingData.apartmentNumber)
    }

    // Append delivery methods
    if (listingData.deliveryMethods && listingData.deliveryMethods.length > 0) {
      listingData.deliveryMethods.forEach((methodId) => {
        formData.append('delivery_methods', methodId)
      })
    }

    // Append image files
    if (listingData.imageFiles && listingData.imageFiles.length > 0) {
      listingData.imageFiles.forEach((file) => {
        formData.append('uploaded_images', file)
      })
    }

    const response = await fetchWithAuthRefresh(`${API_ENDPOINTS.listings}${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data }
    } else if (response.status === 400) {
      const errors = Object.values(data).flat().join(' ')
      return { success: false, error: errors || 'Błąd walidacji' }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji' }
    } else if (response.status === 403) {
      return { success: false, error: 'Nie masz uprawnień do edycji tego ogłoszenia' }
    } else {
      return { success: false, error: 'Błąd serwera' }
    }
  } catch (err) {
    console.error('Update listing error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const changeListingStatus = async (id, status, token) => {
  try {
    if (!token) {
      return { success: false, error: 'Token nie znaleziony. Zaloguj się ponownie.' }
    }

    const response = await fetchWithAuthRefresh(`${API_ENDPOINTS.listings}${id}/change_status/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data }
    } else if (response.status === 400) {
      return { success: false, error: data.error || 'Błąd przy zmianie statusu' }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji' }
    } else if (response.status === 403) {
      return { success: false, error: 'Nie masz uprawnień do zmiany statusu tego ogłoszenia' }
    } else if (response.status === 404) {
      return { success: false, error: 'Ogłoszenie nie znalezione' }
    } else {
      return { success: false, error: 'Błąd serwera' }
    }
  } catch (err) {
    console.error('Change status error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const getDeliveryMethods = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.deliveryMethods)
    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data: normalizeListResponse(data) }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu metod dostawy' }
    }
  } catch (err) {
    console.error('Get delivery methods error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const createOrder = async (orderData, token) => {
  try {
    if (!token) {
      return { success: false, error: 'Token nie znaleziony. Zaloguj się ponownie.' }
    }

    const response = await fetchWithAuthRefresh(API_ENDPOINTS.orders, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    const data = await response.json()

    if (response.status === 201) {
      // Change listing status to "Zakończone" (Completed) after successful order
      const listingId = orderData.listing
      const statusResult = await changeListingStatus(listingId, 'Zakończone', token)
      
      if (!statusResult.success) {
        console.warn('Order created but failed to update listing status:', statusResult.error)
        // Still return success since the order was created
      }
      
      return { success: true, data }
    } else if (response.status === 400) {
      const errors = Object.values(data).flat().join(' ')
      return { success: false, error: errors || 'Błąd walidacji' }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji' }
    } else {
      return { success: false, error: 'Błąd serwera' }
    }
  } catch (err) {
    console.error('Create order error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}

export const getUserOrders = async (token) => {
  try {
    if (!token) {
      return { success: false, error: 'Token nie znaleziony. Zaloguj się ponownie.' }
    }

    const response = await fetchWithAuthRefresh(API_ENDPOINTS.orders, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data: normalizeListResponse(data) }
    } else if (response.status === 401) {
      return { success: false, error: 'Brak autoryzacji' }
    } else {
      return { success: false, error: 'Błąd przy pobieraniu zamówień' }
    }
  } catch (err) {
    console.error('Get user orders error:', err)
    return { success: false, error: 'Błąd połączenia' }
  }
}