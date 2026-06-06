import '../styles/AddProduct.css'
import { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import { createListing, getCategories, getLocations, getDeliveryMethods } from '../api/listings'

export default function AddProduct() {
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
  const [cookies] = useCookies(['token'])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategoriesAndLocations = async () => {
      const catResult = await getCategories()
      if (catResult.success) {
        setCategories(catResult.data)
      }

      const locResult = await getLocations()
      if (locResult.success) {
        setLocations(locResult.data)
      }

      const delResult = await getDeliveryMethods()
      if (delResult.success) {
        setDeliveryMethods(delResult.data)
      }
    }
    fetchCategoriesAndLocations()
  }, [])

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
      const result = await createListing({
        title,
        category,
        price,
        description,
        location,
        street,
        buildingNumber,
        apartmentNumber,
        deliveryMethods: selectedDeliveryMethods,
        imageFiles,
      }, cookies.token)

      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Add product error:', err)
      setError('Błąd połączenia z serwerem')
    }
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
          <h1>Dodaj ogłoszenie</h1>
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
                style ={{ backgroundColor: '#fff', color: '#333' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Kategoria:</label>
              <select
                id="category"
                style ={{ backgroundColor: '#fff', color: '#333' }}
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
              <label htmlFor="price">Cena:</label>
              <input
                type="number"
                step="0.01"
                style ={{ backgroundColor: '#fff', color: '#333' }}
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="w złotówkach"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Opis produktu:</label>
              <textarea
                id="description"
                style ={{ backgroundColor: '#fff', color: '#333' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="twój mądry opis"
                rows="7"
                cols="70"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="location">Lokalizacja (Miasto):</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '50%' }}>
                <input
                  type="text"
                  id="location"
                  className="select-category"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    setShowLocationDropdown(true)
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Wpisz miasto..."
                  style={{ paddingRight: '30px', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff', color: '#333' }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#333', fontSize: '12px' }}>▼</div>
                {showLocationDropdown && (
                  <div className="dropdown-menu" style={{ maxHeight: '250px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '50%', boxSizing: 'border-box' }}>
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc) => (
                        <a
                          key={loc.id}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handleLocationSelect(loc.id, loc.city)
                          }}
                          className="dropdown-link"
                        >
                          {loc.city}
                        </a>
                      ))
                    ) : (
                      <div className="dropdown-link" style={{ pointerEvents: 'none', color: '#999' }}>
                        Brak wyników
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="street">Ulica:</label>
              <input
                type="text"
                id="street"
                style ={{ backgroundColor: '#fff', color: '#333' }}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Nazwa ulicy"
              />
            </div>
            <div className="form-group">
              <label htmlFor="buildingNumber">Nr budynku:</label>
              <input
                type="text"
                id="buildingNumber"
                style ={{ backgroundColor: '#fff', color: '#333' }}
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
                placeholder="Nr budynku"
              />
            </div>
            <div className="form-group">
              <label htmlFor="apartmentNumber">Nr mieszkania:</label>
              <input
                type="text"
                id="apartmentNumber"
                style ={{ backgroundColor: '#fff', color: '#333' }}
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                placeholder="Nr mieszkania"
              />
            </div>
            <div className="form-group" style={{ marginLeft: 0, paddingLeft: 0 }}>
              <label style={{ margin: 0, marginBottom: '8px', display: 'block' }}>Metody dostawy:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginLeft: 0, paddingLeft: 0 }}>
                {deliveryMethods.length > 0 ? (
                  deliveryMethods.map((method) => (
                    <label key={method.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', margin: 0, marginLeft: '0px', fontSize: '14px', padding: '2px 0', lineHeight: '1' }}>
                      <input
                        type="checkbox"
                        checked={selectedDeliveryMethods.includes(method.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeliveryMethods([...selectedDeliveryMethods, method.id])
                          } else {
                            setSelectedDeliveryMethods(selectedDeliveryMethods.filter(id => id !== method.id))
                          }
                        }}
                        style={{ margin: 0, padding: 0,  width: '16px', height: '16px', backgroundColor: '#fff', color: '#333' }}
                      />
                      {method.name}
                    </label>
                  ))
                ) : (
                  <p style={{ color: '#999', margin: 0, fontSize: '14px' }}>Brak dostępnych metod dostawy</p>
                )}
              </div>
            </div>
            <button type="submit" className="add-btn">Dodaj ogłoszenie</button>
          </form>
        </div>
      </div>
    </div>
  )
}
