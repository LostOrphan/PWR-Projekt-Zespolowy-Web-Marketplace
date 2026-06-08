import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Register from './pages/Register'
import AddProduct from './pages/AddProduct'
import MyListings from './pages/MyListings'
import EditListing from './pages/EditListing'
import Checkout from './pages/Checkout'
import PurchaseHistory from './pages/PurchaseHistory'
import {CookiesProvider} from 'react-cookie'
function App() {
  return (
    <CookiesProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/product/:id/edit" element={<EditListing />} />
        <Route path="/product/:id/checkout" element={<Checkout />} />
        <Route path="/register" element={<Register />} />
        <Route path="/addproduct" element={<AddProduct />} />
        <Route path="/mylistings" element={<MyListings />} />
        <Route path="/purchase-history" element={<PurchaseHistory />} />
      </Routes>
    </BrowserRouter>
    </CookiesProvider>
  )
}

export default App
