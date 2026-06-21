import '../styles/AddProduct.css'
import { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useNavigate, useParams } from 'react-router-dom'
import { getListingById, updateListing, getCategories, getLocations, getDeliveryMethods, changeListingStatus } from '../api/listings'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'

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
  const [deliveryMethods, setDeliveryMethods] = useState([])
  const [selectedDeliveryMethods, setSelectedDeliveryMethods] = useState([])
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [cookies] = useCookies(['token'])
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [statusChanging, setStatusChanging] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const catResult = await getCategories()
      if (catResult.success) setCategories(catResult.data)

      const locResult = await getLocations()
      if (locResult.success) setLocations(locResult.data)

      let fetchedDelivery = []
      const delResult = await getDeliveryMethods()
      if (delResult.success) {
        setDeliveryMethods(delResult.data)
        fetchedDelivery = delResult.data
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
        setDeletedImageIds([])
        
        // Jeśli ogłoszenie ma metody dostawy, załaduj je. Jeśli nie, wybierz pierwszą z listy (odbiór osobisty) jako domyślną.
        if (listing.delivery_methods && listing.delivery_methods.length > 0) {
          setSelectedDeliveryMethods(listing.delivery_methods)
        } else if (fetchedDelivery.length > 0) {
          setSelectedDeliveryMethods([fetchedDelivery[0].id])
        }
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
    setDeletedImageIds((prev) => [...prev, imageId])
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
        title, category, price, description, location,
        street, buildingNumber, apartmentNumber,
        deliveryMethods: selectedDeliveryMethods,
        imageFiles,
        deletedImageIds,
      }, cookies.token)

      if (result.success) {
        navigate(`/product/${id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
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

  if (loading) return <div className="loading-state">Wczytywanie...</div>

  return (
    <div className="login-container">
      <Header />
      <div className="login-card">
        <div className="login-form-wrapper-reg">
          <h1>Edytuj ogłoszenie</h1>
          {error && <div className="error-message">{error}</div>}

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
              <label>Zdjęcia:</label>
              <div className="photos">
                <input type="file"  multiple accept="image/*" onChange={handleImageSelect} />

                {/* Istniejące zdjęcia */}
                {existingImages.length > 0 && (
                  <div className="photo-wrapper">
                    {existingImages.map((img) => (
                      <div key={img.id} className="photo-preview">
                        <img src={img.image} alt="Existing" />
                        <button type="button" onClick={() => removeExistingImage(img.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nowe podglądy */}
                {previewImages.length > 0 && (
                  <div className="photo-wrapper">
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="photo-preview">
                        <img src={img} alt={`Preview ${idx}`} />
                        <button type="button" onClick={() => removeImage(idx)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="price">Cena (zł):</label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Lokalizacja (Miasto):</label>
              <div className="location-dropdown">
                <input
                  type="text"
                  id="location"
                  required
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    setShowLocationDropdown(true)
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Zacznij wpisywać nazwę miasta"
                />
                <span className="location-arrow">▼</span>
                {showLocationDropdown && filteredLocations.length > 0 && (
                  <div className="dropdown-menu-location">
                    {filteredLocations.map((loc) => (
                      <button
                        type="button"
                        key={loc.id}
                        className="dropdown-link-btn"
                        onClick={() => handleLocationSelect(loc.id, loc.city)}
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
              <input type="text" id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="buildingNumber">Numer budynku:</label>
              <input type="text" id="buildingNumber" value={buildingNumber} onChange={(e) => setBuildingNumber(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="apartmentNumber">Numer lokalu:</label>
              <input type="text" id="apartmentNumber" value={apartmentNumber} onChange={(e) => setApartmentNumber(e.target.value)} />
            </div>

            <div className="form-group delivery-group">
              <label className="delivery-label">Metody dostawy:</label>
              <div className="delivery-list">
                {deliveryMethods.length > 0 ? (
                  deliveryMethods.map((method) => (
                    <label key={method.id} className="delivery-item">
                      <input
                        type="checkbox"
                        className="delivery-checkbox"
                        required={selectedDeliveryMethods.length === 0}
                        checked={selectedDeliveryMethods.includes(method.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeliveryMethods([...selectedDeliveryMethods, method.id])
                          } else {
                            setSelectedDeliveryMethods(selectedDeliveryMethods.filter(id => id !== method.id))
                          }
                        }}
                      />
                      {method.name}
                    </label>
                  ))
                ) : (
                  <p className="delivery-empty">Brak dostępnych metod dostawy</p>
                )}
              </div>
            </div>

            <button type="submit" className="add-btn">Zapisz zmiany</button>

            {/* Sekcja zmiany statusu */}
            <div className="status-section">
              <p className="status-title">Zmień status ogłoszenia:</p>
              <div className="status-actions">
                <button
                  type="button"
                  className="status-btn status-btn-success"
                  onClick={() => handleChangeStatus('Zakończone')}
                  disabled={statusChanging}
                >
                  {statusChanging ? 'Zmiana...' : '✓ Oznacz jako zakończone'}
                </button>
                <button
                  type="button"
                  className="status-btn status-btn-danger"
                  onClick={() => handleChangeStatus('Usunięte')}
                  disabled={statusChanging}
                >
                  {statusChanging ? 'Usuwanie...' : '🗑 Usuń ogłoszenie'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}