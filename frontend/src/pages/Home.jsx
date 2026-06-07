import '../styles/Home.css'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'
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
      <Header/>

      {/* Main content area */}
      <div className="content-wrapper">
        {/* Main content */}
        <main className="main-content">

          {/* Searching section */}
          <div id ="searching-container">
          <form onSubmit={handleSearch} className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder="Szukaj produktów..."
              name="search"
            />
            <button class="search-button">Szukaj</button>
          </form>
          <div>Filtry wyszukiwania</div>
          <div id = "filters-section">
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
                  >
                    Wszystkie
                  </button>
                  {categories.map((category) => (
                    <button 
                      onClick={() => handleCategoryFilter(category.id)}
                      key={category.id} 
                      className="dropdown-link"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            
            <div className="category-dropdown"  ref={locationDropdownRef}>
              <input
                type="text"
                className="dropdown-btn city-label"
                value={locationSearch}
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                onChange={(e) => {
                  setLocationSearch(e.target.value)
                  setLocationDropdownOpen(true)
                }}
                placeholder="Wpisz miasto..."
              />
              <div className="city-options">▼</div>
              {locationDropdownOpen && (
                <div className="dropdown-menu city-menu">
                  <button 
                    onClick={() => handleClearLocation()}
                    className="dropdown-link"
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
                      >
                        {location.city}
                      </a>
                    ))
                  ) : (
                    <div className="dropdown-link">
                      Brak wyników
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
            </div>
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
        
      </div>
      <Footer/>
    </div>
  )
}
