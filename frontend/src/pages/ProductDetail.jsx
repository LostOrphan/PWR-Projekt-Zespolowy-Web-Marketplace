import '../styles/ProductDetail.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import userAvatar from '../assets/user.png'
import productImage from '../assets/gniazdo.webp'

export default function ProductDetail() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">
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
          <h1 onClick={() => navigate('/')} className="header-title">Aplikacja Marketplace</h1>
          <div className="user-section">
            <img src={userAvatar} alt="User avatar" className="user-avatar" />
            <span className="user-name">Użytkownik</span>
          </div>
        </div>
      </header>

      {/*TODO: FUNCTIONALITY FOR PRODUCT VIEWING, PROBABLY ROUTE EACH PRODUCT TO A SEPPERATE /product/[id] SUBPAGE*/}

      {/* Main content area */}
      <div className="content-wrapper">
        <main className="main-content">

          {/*TODO: THIS BUTTON SUCKS, CHANGE*/}
        
          <button onClick={() => navigate(-1)} className="back-btn">← Wróć</button>
          
          <div className="product-detail-container">
            {/* Product Image Section */}
            <div className="product-image-section">
              <img src={productImage} alt="Product" className="product-detail-image" />
            </div>

            {/* Product Info Section */}
            <div className="product-info-section">
              <h1 className="product-detail-name">Gniazdo elektryczne</h1>
             
              <div className="product-price">
                <span className="price">21,37 zł</span>
              </div>

              <div className="product-description">
                <h2>Opis produktu</h2>
                <p>
                  Wysokiej jakości gniazdo elektryczne z zaawansowanymi funkcjami bezpieczeństwa.
                  Idealny do domowego i biurowego użytku. Wytrzymały materiał gwarantuje długowieczność.
                  Certyfikowany i testowany na zgodność z normami bezpieczeństwa.
                </p>
              </div>

              <div className="seller-info">
                <h2>Informacje o sprzedawcy</h2>
                <div className="seller-card">
                  <img src={userAvatar} alt="Seller" className="seller-avatar" />
                  <div className="seller-details">
                    <p className="seller-name">Jan Kowalski</p>
                    <p className="seller-rating">★★★★★ (4.8 / 5)</p>
                    <p className="seller-description">Sprzedawca od 3 lat - zaufany i niezawodny</p>
                    <button className="contact-seller-btn">Skontaktuj się ze sprzedawcą</button>
                  </div>
                </div>
              </div>

              <div className="product-actions">
                <button className="buy-now-btn">Kup teraz</button>
              </div>
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
