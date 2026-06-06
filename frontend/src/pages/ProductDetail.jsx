import '../styles/ProductDetail.css'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { getListingById, getCategories } from '../api/listings'
import { logoutUser } from '../api/auth'
import userAvatar from '../assets/user.png'

export default function ProductDetail() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [listing, setListing] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])
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

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }

  const handleRevealPhone = async () => {
    if (!cookies.token) {
      navigate('/login')
      return
    }

    setPhoneLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/listings/${id}/phone/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cookies.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (response.ok) {
        setPhoneNumber(data.phone_number)
      } else {
        alert(data.error || 'Nie udało się pobrać numeru telefonu')
      }
    } catch (err) {
      console.error('Error revealing phone:', err)
      alert('Błąd przy pobieraniu numeru telefonu')
    } finally {
      setPhoneLoading(false)
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">
          <div className='header-item left-side'>
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
          </div>
          <div className='header-logo-item'><h1 onClick={() => navigate('/')}>Aplikacja Marketplace</h1></div>
          <div className='header-item right-side'>
            <div>
              {!cookies.username && (
                <div className="user-section">
                  <button
                    onClick={() => navigate('/login')}
                    className="dropdown-btn"
                  >Zaloguj się</button>
                </div>
              )}
              {cookies.username && (
                <div className="user-section">

                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="dropdown-btn"
                  >
                    {cookies.username} ▼
                  </button>
                  {userDropdownOpen && (
                    <div className="dropdown-menu">
                      <button onClick={() => navigate('/mylistings')} className="dropdown-link" style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem'}}>Moje ogłoszenia</button>
                      <button onClick={() => navigate('/purchase-history')} className="dropdown-link" style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem'}}>Historia zakupów</button>
                      <button onClick={() => navigate('/addproduct')} className="dropdown-link" style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem'}}>Dodaj ogłoszenie</button>
                      <button onClick={handleLogout} className="dropdown-link" style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem'}}>Wyloguj się</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Main content area */}
      <div className="content-wrapper">
        <main className="main-content">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button onClick={() => navigate('/')} className="back-btn">Strona Główna</button>
            <button onClick={() => navigate(-1)} className="back-btn">← Wróć</button>
          </div>
          
          {loading ? (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <p>Ładowanie...</p>
            </div>
          ) : listing ? (
            <div className="product-detail-wrapper">
              {/* Left: Image Gallery */}
              <div className="product-gallery">
                <div className="product-image-container">
                  {listing.images && listing.images.length > 0 ? (
                    <>
                      <img 
                        src={listing.images[currentImageIndex].image} 
                        alt={listing.title} 
                        className="product-detail-image"
                        onError={(e) => {
                          e.target.src = userAvatar
                        }}
                      />
                      {listing.images.length > 1 && (
                        <>
                          <button onClick={handlePreviousImage} className="image-nav-btn prev-btn">←</button>
                          <button onClick={handleNextImage} className="image-nav-btn next-btn">→</button>
                          <div className="image-counter">{currentImageIndex + 1} / {listing.images.length}</div>
                        </>
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
                  <div className="image-thumbnails">
                    {listing.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`thumbnail ${currentImageIndex === idx ? 'active' : ''}`}
                      >
                        <img src={img.image} alt={`Thumbnail ${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="product-info-panel">
                <h1 className="product-title">{listing.title}</h1>
                
                <div className="product-price-section">
                  <span className="price-label">Cena:</span>
                  <span className="price">{listing.price} PLN</span>
                </div>

                {/* Key Info Cards */}
                <div className="info-cards">
                  {listing.location && (
                    <div className="info-card">
                      <h3>Lokalizacja</h3>
                      <p>{listing.location.city}</p>
                    </div>
                  )}
                  
                  {listing.category && (
                    <div className="info-card">
                      <h3>Kategoria</h3>
                      <p>{listing.category.name}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="description-section">
                  <h2>Opis</h2>
                  <p>{listing.description || 'Brak opisu'}</p>
                </div>

                {/* Seller Info */}
                <div className="seller-section">
                  <h2>Sprzedawca</h2>
                  <div className="seller-card">
                    <img src={userAvatar} alt="Seller" className="seller-avatar" />
                    <div className="seller-details">
                      <p className="seller-name">{listing.seller.first_name} {listing.seller.last_name}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="action-buttons">
                  {listing.seller.email === cookies.username ? (
                    <>
                      <button 
                        onClick={() => navigate(`/product/${listing.id}/edit`)}
                        className="btn-primary"
                      >
                        Edytuj ogłoszenie
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          if (cookies.username) {
                            navigate(`/product/${listing.id}/checkout`)
                          } else {
                            navigate('/login')
                          }
                        }}
                        className="btn-primary"
                      >
                        Kup teraz
                      </button>
                      <button 
                        onClick={handleRevealPhone}
                        className="btn-secondary"
                        disabled={phoneLoading}
                      >
                        {phoneLoading ? 'Ładowanie...' : phoneNumber ? phoneNumber : 'Skontaktuj się ze sprzedawcą'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <p>Ogłoszenie nie znalezione</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>&copy; 2026 Aplikacja Marketplace</p>
        </footer>
      </div>
    </div>
  )
}
