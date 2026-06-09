import '../styles/Home.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'
import Listing from '../pages/components/Listing.jsx'
import { getCategories, getLocations, getListings, searchListings } from '../api/listings'

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])

  const [listings, setListings] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationSearch, setLocationSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const categoryDropdownRef = useRef(null)
  const locationDropdownRef = useRef(null)
  const observer = useRef()
  const isFetching = useRef(false)

  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])

  const fetchPageData = useCallback(async (pageNumber, currentSearch, catId, locId, showComp, minP, maxP, isNewFilter = false) => {
    if (isFetching.current) return
    isFetching.current = true
    setLoadingMore(true)

    let result
    const params = { page: pageNumber }
    if (catId) params.category = catId
    if (locId) params.location = locId
    if (minP) params.min_price = minP
    if (maxP) params.max_price = maxP

    if (!showComp) {
      params.status = 1
    }

    if (currentSearch.trim()) {
      result = await searchListings(currentSearch, params, false)
    } else {
      result = await getListings(params, false)
    }

    if (result.success) {
      const newItems = result.data.results || []
      const nextUrl = result.data.next

      setListings((prev) => (isNewFilter ? newItems : [...prev, ...newItems]))
      setHasMore(!!nextUrl)
    } else {
      setHasMore(false)
    }

    setLoadingMore(false)
    isFetching.current = false
  }, [])

  const triggerRef = useCallback((node) => {
    if (loadingMore || !hasMore || listings.length === 0) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !isFetching.current) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1
          fetchPageData(nextPage, searchQuery, selectedCategory, selectedLocation, showCompleted, priceMin, priceMax, false)
          return nextPage
        })
      }
    })

    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore, searchQuery, selectedCategory, selectedLocation, showCompleted, priceMin, priceMax, fetchPageData, listings])

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
    const initData = async () => {
      const categoriesResult = await getCategories()
      if (categoriesResult.success) setCategories(categoriesResult.data)

      const locationsResult = await getLocations()
      if (locationsResult.success) setLocations(locationsResult.data)

      fetchPageData(1, '', null, null, false, '', '', true)
    }
    initData()
  }, [fetchPageData])

  const triggerNewFilter = (cat, loc, search, showComp, minP, maxP) => {
    setPage(1)
    setHasMore(true)
    setListings([])
    fetchPageData(1, search, cat, loc, showComp, minP, maxP, true)
  }

  const handleToggleCompleted = () => {
    const nextVal = !showCompleted
    setShowCompleted(nextVal)
    triggerNewFilter(selectedCategory, selectedLocation, searchQuery, nextVal, priceMin, priceMax)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const query = formData.get('search') || ''
    setSearchQuery(query)
    triggerNewFilter(selectedCategory, selectedLocation, query, showCompleted, priceMin, priceMax)
  }

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId)
    setDropdownOpen(false)
    triggerNewFilter(categoryId, selectedLocation, searchQuery, showCompleted, priceMin, priceMax)
  }

  const handleLocationFilter = (locationId, locationCity) => {
    setSelectedLocation(locationId)
    setLocationSearch(locationCity)
    setLocationDropdownOpen(false)
    triggerNewFilter(selectedCategory, locationId, searchQuery, showCompleted, priceMin, priceMax)
  }

  const handleClearLocation = () => {
    setSelectedLocation(null)
    setLocationSearch('')
    triggerNewFilter(selectedCategory, null, searchQuery, showCompleted, priceMin, priceMax)
  }

  const handlePriceApply = (e) => {
    e.preventDefault()
    triggerNewFilter(selectedCategory, selectedLocation, searchQuery, showCompleted, priceMin, priceMax)
  }

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setSelectedLocation(null)
    setLocationSearch('')
    setSearchQuery('')
    setShowCompleted(false)
    setPriceMin('')
    setPriceMax('')
    triggerNewFilter(null, null, '', false, '', '')
  }

  const filteredLocations = locations.filter((loc) =>
    loc.city.toLowerCase().includes(locationSearch.toLowerCase())
  )

  return (
    <div className="app-container">
      <Header />

      <div className="content-wrapper">
        <main className="main-content">

          <div id="searching-container">
            <form onSubmit={handleSearch} className="search-bar-container">
              <input
                type="text"
                className="search-bar"
                placeholder="Szukaj produktów..."
                name="search"
              />
              <button className="search-button">Szukaj</button>
            </form>
            
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)} 
              className="toggle-filters-btn"
            >
              Filtry wyszukiwania {showFilters ? '▲' : '▼'}
            </button>

            {showFilters && (
              <div id="filters-section">
                <div className="category-dropdown" ref={categoryDropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} className="dropdown-btn">
                    {selectedCategory
                      ? categories.find(cat => cat.id === selectedCategory)?.name
                      : 'Kategorie'} ▼
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <button onClick={() => handleCategoryFilter(null)} className="dropdown-link">
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

                <div className="category-dropdown" ref={locationDropdownRef}>
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
                      <button onClick={() => handleClearLocation()} className="dropdown-link">
                        Wszystkie
                      </button>
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((location) => (
                          <button
                            type="button"
                            key={location.id}
                            onClick={(e) => {
                              e.preventDefault()
                              handleLocationFilter(location.id, location.city)
                            }}
                            className="dropdown-link location-btn-item"
                          >
                            {location.city}
                          </button>
                        ))
                      ) : (
                        <div className="dropdown-link">Brak wyników</div>
                      )}
                    </div>
                  )}
                </div>

                {/* BLOK FILTROWANIA CENY */}
                <form onSubmit={handlePriceApply} className="price-filter-form">
                  <input
                    type="number"
                    className="dropdown-btn price-input"
                    placeholder="Cena od"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <input
                    type="number"
                    className="dropdown-btn price-input"
                    placeholder="Cena do"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                  <button type="submit" className="search-button price-submit-btn">OK</button>
                </form>

                <div className="category-dropdown">
                  <button
                    type="button"
                    onClick={handleToggleCompleted}
                    className={`dropdown-btn ${showCompleted ? 'btn-completed-active' : ''}`}
                  >
                    {showCompleted ? 'Ukryj zakończone' : 'Pokaż zakończone'}
                  </button>
                </div>

                <div className='category-dropdown'>
                  <button onClick={handleClearFilters} className="search-button reset-filters-btn">
                    Resetuj filtry
                  </button>
                </div>
              </div>
            )}
          </div>

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
                : 'Dostępne ogłoszenia'}
            </h2>

            <div className="product-grid">
              {listings.length > 0 ? (
                listings.map((listing) => (
                  <Listing
                    key={listing.id}
                    id={listing.id}
                    images={listing.images}
                    title={listing.title}
                    price={listing.price}
                    city={listing.location?.city || ''}
                    date={listing.created_at?.slice(0, 10)}
                    status={listing.status}
                  />
                ))
              ) : (
                !loadingMore && <p className="no-listings-error">Brak ogłoszeń spełniających kryteria filtru</p>
              )}
            </div>

            <div ref={triggerRef} className="scroll-trigger-container">
              {loadingMore && <p className="loading-more-text">Ładowanie kolejnych ogłoszeń...</p>}
            </div>

          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}