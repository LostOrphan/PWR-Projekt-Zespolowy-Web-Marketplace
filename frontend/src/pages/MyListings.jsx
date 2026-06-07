import '../styles/Home.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import { getCategories, getUserListings } from '../api/listings'
import userAvatar from '../assets/user.png'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'

export default function MyListings() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const categoriesResult = await getCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }

      if (!cookies.token) {
        navigate('/login')
        return
      }

      const listingsResult = await getUserListings(cookies.token)
      if (listingsResult.success) {
        setListings(listingsResult.data)
      }

      setLoading(false)
    }
    fetchData()
  }, [cookies.token, navigate])

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header/>

      {/* Main content area */}
      <div className="content-wrapper">
        {/* Main content */}
        <main className="main-content">
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

          {/* Listings Section */}
          <div className="category-section">
            <h2 className="category-title">Moje ogłoszenia</h2>
            <div className="product-row">
              {loading ? (
                <p>Wczytywanie...</p>
              ) : listings.length > 0 ? (
                listings.map((listing) => (
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
                    </div>
                  </div>
                ))
              ) : (
                <p>Nie masz żadnych ogłoszeń. <button onClick={() => navigate('/addproduct')} style={{backgroundColor: 'transparent', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline'}}>Dodaj pierwsze ogłoszenie</button></p>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer/>
      </div>
    </div>
  )
}
