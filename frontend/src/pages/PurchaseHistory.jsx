import '../styles/Home.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { logoutUser } from '../api/auth'
import { getCategories, getUserOrders } from '../api/listings'
import userAvatar from '../assets/user.png'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'

export default function PurchaseHistory() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
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

      const ordersResult = await getUserOrders(cookies.token)
      if (ordersResult.success) {
        setOrders(ordersResult.data)
      }

      setLoading(false)
    }
    fetchData()
  }, [cookies.token, navigate])

  const handleLogout = () => {
    logoutUser(removeCookie)
    navigate('/login')
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Wczytywanie...</div>
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header/>

      {/* Main content */}
      <div className="content-wrapper">
        <main className="main-content">
        

          <h1 style={{ marginBottom: '2rem' }}>Historia zakupów</h1>

          {orders.length > 0 ? (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #ddd9cc',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#e8e4d1', borderBottom: '2px solid #ddd9cc' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                      Produkt
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                      Cena
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                      Metoda dostawy
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #ddd9cc',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f1e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          color: '#007bff',
                          textDecoration: 'underline',
                        }}
                        onClick={() => navigate(`/product/${order.listing}`)}
                      >
                        {order.listing_title || `Ogłoszenie #${order.listing}`}
                      </td>
                      <td style={{ padding: '1rem', color: '#333' }}>
                        {parseFloat(order.purchase_price).toFixed(2)} PLN
                      </td>
                      <td style={{ padding: '1rem', color: '#333' }}>
                        {order.delivery_method_name || `Metoda #${order.delivery_method}`}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            backgroundColor:
                              order.status === 'NEW'
                                ? '#FFF3CD'
                                : order.status === 'PAID'
                                  ? '#CCE5FF'
                                  : order.status === 'SHIPPED'
                                    ? '#D1ECF1'
                                    : order.status === 'COMPLETED'
                                      ? '#D4EDDA'
                                      : '#F8D7DA',
                            color:
                              order.status === 'NEW'
                                ? '#856404'
                                : order.status === 'PAID'
                                  ? '#004085'
                                  : order.status === 'SHIPPED'
                                    ? '#0C5460'
                                    : order.status === 'COMPLETED'
                                      ? '#155724'
                                      : '#721C24',
                          }}
                        >
                          {order.status === 'NEW'
                            ? 'Nowe'
                            : order.status === 'PAID'
                              ? 'Opłacone'
                              : order.status === 'SHIPPED'
                                ? 'Wysłane'
                                : order.status === 'COMPLETED'
                                  ? 'Zakończone'
                                  : 'Anulowane'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
                        {new Date(order.created_at).toLocaleDateString('pl-PL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>
              Nie masz żadnych zamówień. Zacznij od{' '}
              <button
                onClick={() => navigate('/')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                przeglądania ofert
              </button>
            </p>
          )}
        </main>

        {/* Footer */}
        <Footer/>
      </div>
    </div>
  )
}
