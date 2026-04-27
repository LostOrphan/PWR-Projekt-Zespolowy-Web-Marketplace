import '../styles/Home.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import { getCategories, getListings } from '../api/listings'
import userAvatar from '../assets/user.png'

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])

  useEffect(() => {
    const fetchData = async () => {
      const categoriesResult = await getCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }

      const listingsResult = await getListings({}, true)
      if (listingsResult.success) {
        setListings(listingsResult.data)
        setFilteredListings(listingsResult.data)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId)
    setDropdownOpen(false)
    
    if (categoryId === null) {
      setFilteredListings(listings)
    } else {
      setFilteredListings(listings.filter(listing => listing.category === categoryId))
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
                  <button 
                    onClick={() => handleCategoryFilter(null)}
                    className="dropdown-link"
                    style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem'}}
                  >
                    Wszystkie
                  </button>
                  {categories.map((category) => (
                    <button 
                      onClick={() => handleCategoryFilter(category.id)}
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
          <div className='header-logo-item'><h1>Aplikacja Marketplace</h1></div>
          <div className='header-item right-side'>
            <div>
          {/*TODO FUNCTIONALITY FOR USER DISPLAY*/}
          {/*ADDITIONAL: SITES/BUTTONS FOR FOLLOWED OFFERS/FOR SALE, SOLD ITEMS, BOUGHT ITEMS*/}
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
            <img src={userAvatar} alt="User avatar" className="user-avatar" />
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="dropdown-btn"
            >
              {cookies.username} ▼
            </button>
            {userDropdownOpen && (
              <div className="dropdown-menu">
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
        {/* Main content */}
        <main className="main-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder="Szukaj produktów..."
            />
          </div>

          {/* Listings Section */}
          <div className="category-section">
            <h2 className="category-title">
              {selectedCategory ? categories.find(cat => cat.id === selectedCategory)?.name || 'Kategoria' : 'Najnowsze ogłoszenia'}
            </h2>
            <div className="product-row">
              {filteredListings.length > 0 ? (
                filteredListings.map((listing) => (
                  <div 
                    key={listing.id} 
                    className="product-card" 
                    onClick={() => navigate(`/product/${listing.id}`)}
                  >
                    {listing.images && listing.images.length > 0 ? (
                      <img 
                        src={listing.images[0].image} 
                        alt={listing.title} 
                        className="product-image"
                        onError={(e) => {
                          e.target.src = userAvatar
                        }}
                      />
                    ) : (
                      <img 
                        src={userAvatar} 
                        alt="No image" 
                        className="product-image"
                      />
                    )}
                    <p className="product-name">{listing.title}</p>
                    <p className="product-price">{listing.price} zł</p>
                  </div>
                ))
              ) : (
                <p style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem'}}>Brak ogłoszeń w tej kategorii</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="app-footer">
            <p>&copy; 2026 Aplikacja Marketplace</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
