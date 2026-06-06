import '../styles/Home.css'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import { getCategories, getLocations, getListings } from '../api/listings'
import userAvatar from '../assets/user.png'

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationSearch, setLocationSearch] = useState('')
  const categoryDropdownRef = useRef(null)
  const locationDropdownRef = useRef(null)
  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setLocationDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const categoriesResult = await getCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }

      const locationsResult = await getLocations()
      if (locationsResult.success) {
        setLocations(locationsResult.data)
      }

      const listingsResult = await getListings({}, true)
      if (listingsResult.success) {
        setListings(listingsResult.data)
        setFilteredListings(listingsResult.data)
      }
    }
    fetchData()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const query = formData.get('search')
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }


  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId)
    setDropdownOpen(false)
    applyFilters(categoryId, selectedLocation)
  }

  const handleLocationFilter = (locationId, locationCity) => {
    setSelectedLocation(locationId)
    setLocationSearch(locationCity)
    setLocationDropdownOpen(false)
    applyFilters(selectedCategory, locationId)
  }

  const handleClearLocation = () => {
    setSelectedLocation(null)
    setLocationSearch('')
    applyFilters(selectedCategory, null)
  }

  const filteredLocations = locations.filter((loc) =>
    loc.city.toLowerCase().includes(locationSearch.toLowerCase())
  )

  const applyFilters = (categoryId, locationId) => {
    let filtered = listings

    if (categoryId !== null) {
      filtered = filtered.filter(listing => listing.category?.id === categoryId)
    }

    if (locationId !== null) {
      filtered = filtered.filter(listing => listing.location?.id === locationId)
    }

    setFilteredListings(filtered)
  }
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">
          <div className='header-item left-side'>
            <div className="category-dropdown" ref={categoryDropdownRef}>
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
            <div className="category-dropdown" style={{marginLeft: '1rem', position: 'relative', minWidth: '200px'}} ref={locationDropdownRef}>
              <input
                type="text"
                className="dropdown-btn"
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value)
                  setLocationDropdownOpen(true)
                }}
                onFocus={() => setLocationDropdownOpen(true)}
                placeholder="Wpisz miasto..."
                style={{ paddingRight: '30px', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              />
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#333', fontSize: '12px' }}>▼</div>
              {locationDropdownOpen && (
                <div className="dropdown-menu" style={{ maxHeight: '250px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '100%', boxSizing: 'border-box', zIndex: 10 }}>
                  <button 
                    onClick={() => handleClearLocation()}
                    className="dropdown-link"
                    style={{width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem 1rem', display: 'block'}}
                  >
                    Wszystkie
                  </button>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <a
                        key={location.id}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handleLocationFilter(location.id, location.city)
                        }}
                        className="dropdown-link"
                        style={{width: '100%', textAlign: 'left', cursor: 'pointer', padding: '0.5rem 1rem', display: 'block'}}
                      >
                        {location.city}
                      </a>
                    ))
                  ) : (
                    <div className="dropdown-link" style={{ pointerEvents: 'none', color: '#999', padding: '0.5rem 1rem' }}>
                      Brak wyników
                    </div>
                  )}
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
        {/* Main content */}
        <main className="main-content">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder="Szukaj produktów..."
              name="search"
            />
          </form>

          {/* Listings Section */}
          <div className="category-section">
            <h2 className="category-title">
              {selectedCategory || selectedLocation 
                ? (() => {
                    let title = ''
                    if (selectedCategory) {
                      title = categories.find(cat => cat.id === selectedCategory)?.name || ''
                    }
                    if (selectedLocation) {
                      if (title) title += ' - '
                      title += locationSearch
                    }
                    return title.trim()
                  })()
                : 'Najnowsze ogłoszenia'}
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
                <p style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem'}}>Brak ogłoszeń spełniających kryteria filtru</p>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>&copy; 2026 Aplikacja Marketplace</p>
        </footer>
      </div>
    </div>
  )
}
