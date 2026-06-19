import '../styles/Login.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserProfile, updateUserProfile } from '../api/auth'
import Cookies from 'universal-cookie'
import Header from '../pages/components/Header.jsx'
import Footer from '../pages/components/Footer.jsx'

const cookies = new Cookies()

export default function EditUser() {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = cookies.get('token')
      const fetchResult = await getUserProfile(token)
      
      if (fetchResult.success) {
        setName(fetchResult.data.first_name || '')
        setSurname(fetchResult.data.last_name || '')
        setEmail(fetchResult.data.email || '')
        setPhone(fetchResult.data.phone_num || '')
      } else {
        setError(fetchResult.error || 'Nie udało się pobrać danych profilu.')
      }
      setLoading(false)
    }

    fetchProfileData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (password && password !== password2) {
      setError('Hasła nie są identyczne.')
      return
    }

    try {
      const token = cookies.get('token')
      const updateResult = await updateUserProfile({
        email,
        firstName: name,
        lastName: surname,
        phone,
        password: password || undefined,
      }, token)

      if (updateResult.success) {
        setSuccess('Profil został pomyślnie zaktualizowany!')
        setPassword('')
        setPassword2('')
      } else {
        setError(updateResult.error)
      }
    } catch (err) {
      console.error('Update profile error:', err)
      setError('Błąd połączenia z serwerem.')
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <Header />
        <div className="login-card">
          <div className="login-form-wrapper">
            <p className="login-loading-text">Ładowanie danych użytkownika...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="login-container">
      <Header />
      <div className="login-card">
        <div className="login-form-wrapper">
          <h1>Edycja profilu</h1>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Imię"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                placeholder="Nazwisko"
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-mail"
              />
            </div>
            <div className="form-group">
              <input 
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numer telefonu"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nowe hasło (opcjonalnie)"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                id="password2"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Powtórz nowe hasło"
              />
            </div>
            <button type="submit" className="login-btn">Zapisz zmiany</button>
            <p className="login-register-link">
              <Link to="/">Powrót do strony głównej</Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}