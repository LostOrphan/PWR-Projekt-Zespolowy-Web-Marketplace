import '../styles/Home.css'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import { getCategories, searchListings } from '../api/listings'
import userAvatar from '../assets/user.png'

export default function Search() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])
  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      const categoriesResult = await getCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }

      if (searchQuery.trim()) {
        const filters = selectedCategory !== null ? { category: selectedCategory } : {}
        const result = await searchListings(searchQuery, filters, true)
        if (result.success) {
          setFilteredListings(result.data)
        }
      }
      
      setLoading(false)
    }
    fetchData()
  }, [searchQuery, selectedCategory])

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId)
    setDropdownOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const query = formData.get('search')
    if (query.trim()) {
      setSearchParams({ q: query })
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
          {/* Search Bar with Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '40px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: '#ffffff',
                color: '#333',
                border: '1px solid #ddd9cc',
                padding: '16px 24px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.3s, border-color 0.3s',
                whiteSpace: 'nowrap',
                flexShrink: 0
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
            <form onSubmit={handleSearch} className="search-bar-container" style={{ flex: 1, margin: 0 }}>
              <input
                type="text"
                className="search-bar"
                placeholder="Szukaj produktów..."
                name="search"
                defaultValue={searchQuery}
              />
            </form>
          </div>

          {/* Listings Section */}
          <div className="category-section">
            <h2 className="category-title">
              Wyniki wyszukiwania dla: "{searchQuery}"
              {selectedCategory && ` - ${categories.find(cat => cat.id === selectedCategory)?.name || 'Kategoria'}`}
            </h2>
            <div className="product-row">
              {loading ? (
                <p>Wczytywanie...</p>
              ) : filteredListings.length > 0 ? (
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
                      />
                    ) : (
                      <div style={{ width: '100%', height: '200px', backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Brak zdjęcia
                      </div>
                    )}
                    <div className="product-info">
                      <h3>{listing.title}</h3>
                      <p className="product-price">{listing.price} PLN</p>
                      <p className="product-description">{listing.description.substring(0, 100)}...</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>Brak wyników wyszukiwania.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
