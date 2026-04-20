import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Register from './pages/Register'
import {CookiesProvider} from 'react-cookie'
function App() {
  return (
    <CookiesProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product" element={<ProductDetail />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
    </CookiesProvider>
  )
}

export default App
