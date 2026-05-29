import '../styles/AddProduct.css'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { getListingById, getDeliveryMethods, createOrder } from '../api/listings'
import { logoutUser } from '../api/auth'
import userAvatar from '../assets/user.png'

export default function Checkout() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [listing, setListing] = useState(null)
  const [deliveryMethods, setDeliveryMethods] = useState([])
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('card')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(['username', 'token'])
  const { id } = useParams()

  const paymentMethods = [
    { value: 'card', label: 'Karta kredytowa/debetowa' },
    { value: 'transfer', label: 'Przelewy24 (P24)' },
    { value: 'bank', label: 'Przelew bankowy' },
    { value: 'paypal', label: 'PayPal' },
  ]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const listingResult = await getListingById(id)
      if (listingResult.success) {
        setListing(listingResult.data)
      }

      const deliveryResult = await getDeliveryMethods()
      if (deliveryResult.success) {
        setDeliveryMethods(deliveryResult.data)
        if (deliveryResult.data.length > 0) {
          setSelectedDeliveryMethod(deliveryResult.data[0].id)
        }
      }

      setLoading(false)
    }
    fetchData()
  }, [id])

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')
    setProcessing(true)

    if (!selectedDeliveryMethod) {
      setError('Wybierz metodę dostawy')
      setProcessing(false)
      return
    }

    if (!selectedPayment) {
      setError('Wybierz metodę płatności')
      setProcessing(false)
      return
    }

    try {
      const result = await createOrder(
        {
          listing: listing.id,
          delivery_method: parseInt(selectedDeliveryMethod),
          delivery_details: `Payment method: ${selectedPayment}`,
        },
        cookies.token
      )

      if (result.success) {
        navigate(`/product/${id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Order error:', err)
      setError('Błąd przy złożeniu zamówienia')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Wczytywanie...</div>
  }

  if (!listing) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Ogłoszenie nie znalezione</div>
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-bottom">
          <div className="header-item left-side">
            <div className="category-dropdown">
              <button className="dropdown-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                Kategorie ▼
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-link"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                    }}
                    onClick={() => {
                      navigate('/')
                      setDropdownOpen(false)
                    }}
                  >
                    Wszystkie
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="header-logo-item">
            <h1 onClick={() => navigate('/')}>Aplikacja Marketplace</h1>
          </div>
          <div className="header-item right-side">
            <div>
              {!cookies.username && (
                <div className="user-section">
                  <button onClick={() => navigate('/login')} className="dropdown-btn">
                    Zaloguj się
                  </button>
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
                      <button
                        onClick={() => navigate('/mylistings')}
                        className="dropdown-link"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        Moje ogłoszenia
                      </button>
                      <button
                        onClick={() => navigate('/purchase-history')}
                        className="dropdown-link"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        Historia zakupów
                      </button>
                      <button
                        onClick={() => navigate('/addproduct')}
                        className="dropdown-link"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        Dodaj ogłoszenie
                      </button>
                      <button
                        onClick={handleLogout}
                        className="dropdown-link"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        Wyloguj się
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="content-wrapper">
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
              marginBottom: '2rem',
              width: 'fit-content',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9f8f5'
              e.target.style.borderColor = '#c9c2b8'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff'
              e.target.style.borderColor = '#ddd9cc'
            }}
          >
            ← Wróć
          </button>

          <div className="login-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="login-form-wrapper-reg">
              <h1>Potwierdzenie zamówienia</h1>

              {error && (
                <div
                  style={{
                    color: '#d32f2f',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#ffebee',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Order Summary */}
              <div
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#f5f1e8',
                  borderRadius: '8px',
                  border: '1px solid #ddd9cc',
                }}
              >
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Podsumowanie zamówienia</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Artykuł:</strong> {listing.title}
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Sprzedawca:</strong> {listing.seller.first_name} {listing.seller.last_name}
                  </p>
                  <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#2196F3' }}>
                    <strong>Cena:</strong> {listing.price} PLN
                  </p>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder}>
                {/* Delivery Method */}
                <div className="form-group">
                  <label htmlFor="delivery">Metoda dostawy:</label>
                  <select
                    id="delivery"
                    className="select-category"
                    value={selectedDeliveryMethod}
                    onChange={(e) => setSelectedDeliveryMethod(e.target.value)}
                    required
                  >
                    <option value="">-- Wybierz metodę dostawy --</option>
                    {deliveryMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} {method.description ? `- ${method.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div className="form-group">
                  <label>Metoda płatności:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {paymentMethods.map((method) => (
                      <label
                        key={method.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          border: selectedPayment === method.value ? '2px solid #2196F3' : '1px solid #ddd9cc',
                          backgroundColor: selectedPayment === method.value ? '#E3F2FD' : 'transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={selectedPayment === method.value}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                        />
                        {method.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#FFF3E0',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#E65100',
                  }}
                >
                  <strong>ℹ️ Informacja:</strong> Po kliknięciu „Złóż zamówienie", zaraz będzie dostępna płatność metodą
                  wybraną powyżej. To jest demo aplikacji - płatność nie będzie faktycznie przetwarzana.
                </div>

                <button type="submit" className="add-btn" disabled={processing} style={{ marginTop: '2rem' }}>
                  {processing ? 'Przetwarzanie...' : 'Złóż zamówienie'}
                </button>
              </form>
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
