import '../styles/ProductDetail.css'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getListingById, getCategories } from '../api/listings'
import userAvatar from '../assets/user.png'

export default function ProductDetail() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [listing, setListing] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const listingResult = await getListingById(id)
      if (listingResult.success) {
        setListing(listingResult.data)
      }

      const categoriesResult = await getCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }
      setLoading(false)
    }
    fetchData()
    setCurrentImageIndex(0)
  }, [id])

  const handlePreviousImage = () => {
    if (listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? listing.images.length - 1 : prevIndex - 1
      )
    }
  }

  const handleNextImage = () => {
    if (listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === listing.images.length - 1 ? 0 : prevIndex + 1
      )
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">
          <div className="category-dropdown">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="dropdown-btn"
            >
              Kategorie ▼
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {categories.map((category) => (
                  <button 
                    onClick={() => {
                      navigate('/')
                      setDropdownOpen(false)
                    }}
                    key={category.id} 
                    className="dropdown-link"
                    style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem'}}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 onClick={() => navigate('/')} className="header-title">Aplikacja Marketplace</h1>
          <div className="user-section">
            <img src={userAvatar} alt="User avatar" className="user-avatar" />
          </div>
        </div>
      </header>
t
      {/* Main content area */}
      <div className="content-wrapper">
        <main className="main-content">
          <button onClick={() => navigate(-1)} className="back-btn">← Wróć</button>
          
          {loading ? (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <p>Ładowanie...</p>
            </div>
          ) : listing ? (
            <div className="product-detail-wrapper">
              {/* Product Image Section - Left Panel */}
              <div className="product-image-panel">
                <div className="product-image-container">
                  {listing.images && listing.images.length > 0 ? (
                    <>
                      {listing.images.length > 1 && (
                        <button onClick={handlePreviousImage} className="image-nav-btn prev-btn">←</button>
                      )}
                      <img 
                        src={listing.images[currentImageIndex].image} 
                        alt={listing.title} 
                        className="product-detail-image"
                        onError={(e) => {
                          e.target.src = userAvatar
                        }}
                      />
                      {listing.images.length > 1 && (
                        <button onClick={handleNextImage} className="image-nav-btn next-btn">→</button>
                      )}
                    </>
                  ) : (
                    <img 
                      src={userAvatar} 
                      alt="No image" 
                      className="product-detail-image"
                    />
                  )}
                </div>
                {listing.images && listing.images.length > 1 && (
                  <div className="image-counter">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                )}
              </div>

              {/* Product Info Section - Right Panel */}
              <div className="product-info-panel">
                <h1 className="product-detail-name">{listing.title}</h1>
               
                <div className="product-price">
                  <span className="price">{listing.price} zł</span>
                </div>

                <div className="product-description">
                  <h2>Opis produktu</h2>
                  <p>{listing.description || 'Brak opisu'}</p>
                </div>

                {listing.location && (
                  <div className="product-location">
                    <h2>Lokalizacja</h2>
                    <p>{listing.location.city}</p>
                  </div>
                )}

                <div className="seller-info">
                  <h2>Informacje o sprzedawcy</h2>
                  <div className="seller-card">
                    <img src={userAvatar} alt="Seller" className="seller-avatar" />
                    <div className="seller-details">
                      <p className="seller-name">{listing.seller.first_name} {listing.seller.last_name}</p>
                      <p className="seller-email">{listing.seller.email}</p>
                      {listing.seller.phone_num && (
                        <p className="seller-phone">{listing.seller.phone_num}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="product-actions">
                  <button className="buy-now-btn">Kup teraz</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <p>Ogłoszenie nie znalezione</p>
            </div>
          )}

          {/* Footer */}
          <footer className="app-footer">
            <p>&copy; 2026 Aplikacja Marketplace</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
