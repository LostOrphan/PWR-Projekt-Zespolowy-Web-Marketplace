import '../styles/Home.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import userAvatar from '../assets/user.png'
import productImage from '../assets/gniazdo.webp'

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">

          {/*TODO: FUNCTIONALITY FOR CATEGORY MENU*/}
          {/*OPTIONALLY CHANGE THE FORM OF THE CATEGORY LIST*/}
          
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
          <h1>Aplikacja Marketplace</h1>

          {/*TODO FUNCTIONALITY FOR USER DISPLAY*/}
          {/*ADDITIONAL: SITES/BUTTONS FOR FOLLOWED OFFERS/FOR SALE, SOLD ITEMS, BOUGHT ITEMS*/}
          
          <div className="user-section">
            <img src={userAvatar} alt="User avatar" className="user-avatar" />
            <span className="user-name">Użytkownik</span>
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
