import '../styles/PurchaseHistory.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { getCategories, getUserOrders, getListingById, getDeliveryMethods } from '../api/listings'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'

export default function PurchaseHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [cookies] = useCookies(['token'])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      if (!cookies.token) {
        navigate('/login')
        return
      }

      const ordersResult = await getUserOrders(cookies.token)
      if (ordersResult.success) {
        const rawOrders = ordersResult.data

        // Pobierz słownik metod dostawy 
        const delResult = await getDeliveryMethods()
        const deliveryMap = delResult.success 
          ? Object.fromEntries(delResult.data.map(d => [d.id, d.name]))
          : {}

        // 2. Pobierz szczegóły ogłoszeń
        const enrichedOrders = await Promise.all(
          rawOrders.map(async (order) => {
            const listingResult = await getListingById(order.listing)
            if (listingResult.success) {
              const listing = listingResult.data
              // Zdjęcie podglądu
              const primaryImg = listing.images?.find(img => img.is_primary) || listing.images?.[0]

              return {
                ...order,
                listing_title: listing.title,
                listing_image: primaryImg ? primaryImg.image : null,
                delivery_method_name: deliveryMap[order.delivery_method] || `Metoda #${order.delivery_method}`
              }
            }
            return order
          })
        )

        setOrders(enrichedOrders)
      }

      setLoading(false)
    }
    fetchData()
  }, [cookies.token, navigate])

  if (loading) {
    return <div className="loading-state">Wczytywanie...</div>
  }

  return (
    <div className="app-container">
      <Header />
      <div className="content-wrapper">
        <main className="main-content">
          <h1 className="page-title">Historia zakupów</h1>

          {orders.length > 0 ? (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div 
                    className="order-image-wrapper" 
                    onClick={() => navigate(`/product/${order.listing}`)}
                  >
                    <img
                      src={order.listing_image || '/placeholder-product.png'}
                      alt={order.listing_title || 'Produkt'}
                      className="order-image"
                    />
                  </div>

                  <div className="order-info">
                    <h3 
                      className="order-title" 
                      onClick={() => navigate(`/product/${order.listing}`)}
                    >
                      {order.listing_title || `Ogłoszenie #${order.listing}`}
                    </h3>
                    <p className="order-date">
                      Zakupiono: <span>{new Date(order.created_at).toLocaleDateString('pl-PL')}</span>
                    </p>
                    <p className="order-delivery">
                      Dostawa: <span>{order.delivery_method_name}</span>
                    </p>
                  </div>

                  <div className="order-badge-price">
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status === 'NEW' && 'Nowe'}
                      {order.status === 'PAID' && 'Opłacone'}
                      {order.status === 'SHIPPED' && 'Wysłane'}
                      {order.status === 'COMPLETED' && 'Zakończone'}
                      {order.status === 'CANCELLED' && 'Anulowane'}
                    </span>
                    <div className="order-price">
                      {parseFloat(order.purchase_price).toFixed(2)} PLN
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-orders">
              <p>Nie masz jeszcze żadnych zamówień.</p>
              <button onClick={() => navigate('/')} className="browse-btn">
                Zacznij przeglądać oferty
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}