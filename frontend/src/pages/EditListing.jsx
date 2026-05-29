import '../styles/AddProduct.css'
import { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useNavigate, useParams } from 'react-router-dom'
import { getListingById, updateListing, getCategories, getLocations, changeListingStatus } from '../api/listings'

export default function EditListing() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [street, setStreet] = useState('')
  const [buildingNumber, setBuildingNumber] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  const [location, setLocation] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [cookies] = useCookies(['token'])
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [statusChanging, setStatusChanging] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const catResult = await getCategories()
      if (catResult.success) {
        setCategories(catResult.data)
      }

      const locResult = await getLocations()
      if (locResult.success) {
        setLocations(locResult.data)
      }

      const listingResult = await getListingById(id)
      if (listingResult.success) {
        const listing = listingResult.data
        setTitle(listing.title)
        setCategory(listing.category.id)
        setPrice(listing.price)
        setDescription(listing.description)
        setStreet(listing.street || '')
        setBuildingNumber(listing.building_number || '')
        setApartmentNumber(listing.apartment_number || '')
        setLocation(listing.location?.id || '')
        setLocationSearch(listing.location?.city || '')
        setExistingImages(listing.images || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const newPreviews = files.map((file) => URL.createObjectURL(file))

    setImageFiles((prev) => [...prev, ...files])
    setPreviewImages((prev) => [...prev, ...newPreviews])
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(previewImages[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const filteredLocations = locations.filter((loc) =>
    loc.city.toLowerCase().includes(locationSearch.toLowerCase())
  )

  const handleLocationSelect = (locId, locCity) => {
    setLocation(locId)
    setLocationSearch(locCity)
    setShowLocationDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!category) {
      setError('Wybierz kategorię')
      return
    }

    try {
      const result = await updateListing(id, {
        title,
        category,
        price,
        description,
        location,
        street,
        buildingNumber,
        apartmentNumber,
        imageFiles,
      }, cookies.token)

      if (result.success) {
        navigate(`/product/${id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Edit listing error:', err)
      setError('Błąd połączenia z serwerem')
    }
  }

  const handleChangeStatus = async (newStatus) => {
    setStatusChanging(true)
    const result = await changeListingStatus(id, newStatus, cookies.token)
    
    if (result.success) {
      navigate(`/product/${id}`)
    } else {
      setError(result.error)
      setStatusChanging(false)
    }
  }

  if (loading) {
    return <div>Wczytywanie...</div>
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-wrapper-reg">
          <button 
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#ffffff',
              color: '#333',
              border: '1px solid #ddd9cc',
              padding: '12px 20px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.3s, border-color 0.3s',
              marginBottom: '1.5rem',
              width: 'fit-content'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9f8f5'
              e.target.style.borderColor = '#c9c2b8'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff'
              e.target.style.borderColor = '#ddd9cc'
            }}
            title="Wróć do poprzedniej strony"
          >
            ← Wróć
          </button>
          <h1>Edytuj ogłoszenie</h1>
          {error && <div style={{color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '0.9rem'}}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Tytuł ogłoszenia:</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="np. ścianka działowa"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Kategoria:</label>
              <select
                id="category"
                className="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">-- Wybierz kategorię --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              Zdjęcia:
              <div className='photos'>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {existingImages.map((img) => (
                    <div key={img.id} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={img.image}
                        alt="Existing"
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {previewImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={img}
                        alt={`Preview ${idx}`}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="price">Cena (zł):</label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Opis:</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz waszą ofertę"
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Lokalizacja (Miasto):</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="location"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    setShowLocationDropdown(true)
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Zacznij wpisywać nazwę miasta"
                />
                {showLocationDropdown && filteredLocations.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #ddd',
                    borderTop: 'none',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10
                  }}>
                    {filteredLocations.map((loc) => (
                      <button
                        type="button"
                        key={loc.id}
                        onClick={() => handleLocationSelect(loc.id, loc.city)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: 'none',
                          background: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        {loc.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="street">Ulica:</label>
              <input
                type="text"
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="buildingNumber">Numer budynku:</label>
              <input
                type="text"
                id="buildingNumber"
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="apartmentNumber">Numer lokalu:</label>
              <input
                type="text"
                id="apartmentNumber"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
              />
            </div>
            <button type="submit" className="add-btn">Zapisz zmiany</button>
            
            {/* Status Change Buttons */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #ddd9cc' }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>Zmień status ogłoszenia:</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => handleChangeStatus('Zakończone')}
                  disabled={statusChanging}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: statusChanging ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: statusChanging ? 0.6 : 1,
                  }}
                >
                  {statusChanging ? 'Zmiana...' : '✓ Oznacz jako zakończone'}
                </button>
                <button 
                  type="button"
                  onClick={() => handleChangeStatus('Usunięte')}
                  disabled={statusChanging}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: statusChanging ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: statusChanging ? 0.6 : 1,
                  }}
                >
                  {statusChanging ? 'Usuwanie...' : '🗑 Usuń ogłoszenie'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
