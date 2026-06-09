import '../styles/Checkout.css'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { getListingById, getDeliveryMethods, createOrder } from '../api/listings'
import Footer from '../pages/components/Footer.jsx'
import Header from '../pages/components/Header.jsx'

export default function Checkout() {
  const [listing, setListing] = useState(null)
  const [deliveryMethods, setDeliveryMethods] = useState([])
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('card')
  const [deliveryDetails, setDeliveryDetails] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [cookies] = useCookies(['token'])
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
      if (listingResult.success) setListing(listingResult.data)

      const deliveryResult = await getDeliveryMethods()
      if (deliveryResult.success) setDeliveryMethods(deliveryResult.data)
      setLoading(false)
    }
    fetchData()
  }, [id])

  // Użycie useMemo zapobiega nieskończonej pętli renderowania
  const availableDeliveryMethods = useMemo(() => {
    return deliveryMethods.filter(method =>
      listing?.delivery_methods && listing.delivery_methods.includes(method.id)
    )
  }, [deliveryMethods, listing])

  // Ustawienie domyślnej metody dostawy
  useEffect(() => {
    if (availableDeliveryMethods.length > 0 && !selectedDeliveryMethod) {
      setSelectedDeliveryMethod(String(availableDeliveryMethods[0].id))
    }
  }, [availableDeliveryMethods, selectedDeliveryMethod])

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')
    setProcessing(true)

    if (!selectedDeliveryMethod) {
      setError('Wybierz metodę dostawy')
      setProcessing(false)
      return
    }

    try {
      const result = await createOrder(
        {
          listing: listing.id,
          delivery_method: parseInt(selectedDeliveryMethod, 10),
          delivery_details: deliveryDetails
        },
        cookies.token
      )

      if (result.success) {
        navigate('/purchase-history') // Przekierowanie do historii zakupów zamiast produktu
      } else {
        setError(result.error || 'Nie udało się zapisać zamówienia')
      }
    } catch (err) {
      setError('Błąd przy złożeniu zamówienia')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="checkout-loading">Wczytywanie...</div>
  if (!listing) return <div className="checkout-loading">Ogłoszenie nie znalezione</div>

  return (
    <div className="app-container">
      <Header />
      <div className="content-wrapper">
        <main className="main-content">
          <div className="checkout-card">
            <h1>Potwierdzenie zamówienia</h1>
            {error && <div className="checkout-error">{error}</div>}

            {/* Podsumowanie zamówienia */}
            <div className="order-summary-box">
              <h2>Podsumowanie zamówienia</h2>
              <div className="summary-content">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0].image}
                    alt={listing.title}
                    className="summary-image"
                  />
                ) : (
                  <div className="summary-image-placeholder" />
                )}

                <div className="summary-details">
                  <div className="summary-row">
                    <span>Artykuł:</span> <strong>{listing.title}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Sprzedawca:</span> <strong>{listing.seller.first_name} {listing.seller.last_name}</strong>
                  </div>
                  <div className="summary-row price-row">
                    <span>Do zapłaty:</span> <span className="summary-price">{listing.price} PLN</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder}>
              {/* Metody dostawy */}
              <div className="form-group">
                <label className="section-label">Metoda dostawy:</label>
                <div className="radio-list">
                  {deliveryMethods.map((method) => {
                    const isAvailable = listing?.delivery_methods?.includes(method.id)
                    const isChecked = String(selectedDeliveryMethod) === String(method.id)
                    return (
                      <label
                        key={method.id}
                        className={`radio-item ${isChecked ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={method.id}
                          checked={isChecked}
                          onChange={(e) => setSelectedDeliveryMethod(e.target.value)}
                          disabled={!isAvailable}
                        />
                        <div className="radio-text">
                          <strong>{method.name}</strong>
                          {method.description && <span className="method-desc"> - {method.description}</span>}
                          {!isAvailable && <span className="method-na"> (niedostępna)</span>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Metody płatności */}
              <div className="form-group">
                <label className="section-label">Metoda płatności:</label>
                <div className="radio-list">
                  {paymentMethods.map((method) => {
                    const isChecked = selectedPayment === method.value
                    return (
                      <label key={method.value} className={`radio-item ${isChecked ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={isChecked}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                        />
                        <div className="radio-text">
                          <strong>{method.label}</strong>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Szczegóły dostawy */}
              <div className="form-group">
                <label htmlFor="deliveryDetails" className="section-label">
                  Dane dostawy (adres, paczkomat itp.):
                </label>
                <textarea
                  id="deliveryDetails"
                  value={deliveryDetails}
                  onChange={(e) => setDeliveryDetails(e.target.value)}
                  placeholder="Np. ul. Marszałkowska 1, 00-001 Warszawa lub kod paczkomatu"
                  rows="3"
                  className="checkout-textarea"
                  required
                />
              </div>

              {/* Komunikat o wersji Demo */}
              <div className="demo-info-box">
                <strong>ℹ️ Informacja:</strong> To jest wersja demonstracyjna aplikacji. Płatność nie zostanie faktycznie pobrana z Twojego konta.
              </div>

              <button type="submit" className="checkout-submit-btn" disabled={processing}>
                {processing ? 'Przetwarzanie...' : 'Złóż zamówienie i zapłać'}
              </button>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}