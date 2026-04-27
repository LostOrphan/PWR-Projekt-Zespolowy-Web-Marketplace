import '../styles/Login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth'

export default function Login() {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== password2) {
      setError('Hasła nie są identyczne')
      return
    }

    try {
      const result = await registerUser({
        email,
        firstName: name,
        lastName: surname,
        phone,
        password,
      })

      if (result.success) {
        navigate('/login')
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Błąd połączenia z serwerem')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-wrapper">
          <h1>Zarejestruj się</h1>
          {error && <div style={{color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '0.9rem'}}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Imię:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Twoje imię"
              />
            </div>
            <div className="form-group">
              <label htmlFor="surname">Nazwisko:</label>
              <input
                type="text"
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                placeholder="Twoje nazwisko"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Twój email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Numer telefonu:</label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Twój numer telefonu"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Hasło:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Twoje hasło"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password2">Powtórz hasło:</label>
              <input
                type="password"
                id="password2"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                placeholder="Powtórz hasło"
              />
            </div>
            <button type="submit" className="login-btn">Zarejestruj się</button>
          </form>
        </div>
      </div>
    </div>
  )
}
