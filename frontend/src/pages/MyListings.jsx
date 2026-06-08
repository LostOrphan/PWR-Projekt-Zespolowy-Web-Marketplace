import '../styles/Home.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import { getCategories, getUserListings } from '../api/listings'
import userAvatar from '../assets/user.png'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'
import Listing from '../pages/components/Listing.jsx'

export default function MyListings() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
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
         

          {/* Listings Section */}
          <div className="category-section">
            <h2 className="category-title">Moje ogłoszenia</h2>
            <div className="product-grid">
                            {listings.length > 0 ? (
                              listings.map((listing) => (
                                <Listing
                                  id={listing.id} 
                                  images ={listing.images}
                                  title={listing.title} 
                                  price={listing.price}
                                  city={listing.location?.city || ''}
                                  date={listing.created_at?.slice(0, 10)}
                                  />
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
