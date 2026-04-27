import { API_ENDPOINTS } from './config'

export const getCategories = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.categories)
    const data = await response.json()

    if (response.status === 200) {
      return { success: true, data: data.results || [] }
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
    const allResults = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await fetch(`${API_ENDPOINTS.locations}?page=${page}`)
      const data = await response.json()

      if (response.status === 200) {
        allResults.push(...(data.results || []))
        hasMore = !!data.next
        page++
      } else {
        return { success: false, error: 'Błąd przy pobieraniu lokalizacji' }
      }
    }

    return { success: true, data: allResults }
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

    // Append image files
    if (listingData.imageFiles && listingData.imageFiles.length > 0) {
      listingData.imageFiles.forEach((file) => {
        formData.append('uploaded_images', file)
      })
    }

    console.log('Creating listing with token:', token.substring(0, 20) + '...')

    const response = await fetch(API_ENDPOINTS.listings, {
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
      const errors = Object.values(data).flat().join(', ')
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