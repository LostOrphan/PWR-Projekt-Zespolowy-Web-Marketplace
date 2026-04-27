import '../styles/Home.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import userAvatar from '../assets/user.png'
import productImage from '../assets/gniazdo.webp'
import { CookiesProvider, useCookies } from 'react-cookie'

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  {/* TODO: LOGGED MUST BE A PERMAMENT VARIABLE*/}
  const [logged, setLogged] = useState(false)
  const navigate = useNavigate()
  const [cookies] = useCookies(['username'])
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">

          {/*TODO: FUNCTIONALITY FOR CATEGORY MENU*/}
          {/*OPTIONALLY CHANGE THE FORM OF THE CATEGORY LIST*/}
          
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
                  <a href="#" className="dropdown-link">Kategoria 1</a>
                  <a href="#" className="dropdown-link">Kategoria 2</a>
                  <a href="#" className="dropdown-link">Kategoria 3</a>
                </div>
              )}
              
              
            </div>
            
          </div>
          <div className='header-logo-item'><h1>Aplikacja Marketplace</h1></div>
          <div className='header-item right-side'>
            <div>
          {!cookies.username && (<button
          
                onClick={() => navigate('/login')}
                className="dropdown-btn"
                >Dodaj ogłoszenie</button>)}
          {cookies.username && (<button
          
                onClick={() => navigate('/addproduct')}
                className="dropdown-btn"
                >Dodaj ogłoszenie</button>)}
          </div>
          
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
            <span className="user-name">{cookies.username}</span>
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
          {/* Search Bar - */}
          
          {/*TODO: WRITE FUNCTIONALITY FOR SEARCH BAR*/}
          
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder="Szukaj produktów..."
            />
          </div>

          {/*TODO: WRITE FUNCTIONALITY FOR PRODUCT LISTINGS / CATEGORIES*/}

          {/* Category Section 1 */}
          <div className="category-section">
            <h2 className="category-title">Popularne</h2>
            <div className="product-row">
              {[...Array(15)].map((_, index) => (
                <div key={index} className="product-card" onClick={() => navigate('/product')}>
                  <img src={productImage} alt="Product" className="product-image" />
                  <p className="product-name">Produkt</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Section 2 */}
          <div className="category-section">
            <h2 className="category-title">Odzież</h2>
            <div className="product-row">
              {[...Array(15)].map((_, index) => (
                <div key={index} className="product-card" onClick={() => navigate('/product')}>
                  <img src={productImage} alt="Product" className="product-image" />
                  <p className="product-name">Produkt</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Section 3 */}
          <div className="category-section">
            <h2 className="category-title">Elektronika</h2>
            <div className="product-row">
              {[...Array(15)].map((_, index) => (
                <div key={index} className="product-card" onClick={() => navigate('/product')}>
                  <img src={productImage} alt="Product" className="product-image" />
                  <p className="product-name">Produkt</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Section 4 */}
          <div className="category-section">
            <h2 className="category-title">Książki</h2>
            <div className="product-row">
              {[...Array(15)].map((_, index) => (
                <div key={index} className="product-card" onClick={() => navigate('/product')}>
                  <img src={productImage} alt="Product" className="product-image" />
                  <p className="product-name">Produkt</p>
                </div>
              ))}
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
