import '../styles/Login.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
      setError('Hasła nie są identyczne.')
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
      setError('Błąd połączenia z serwerem.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-wrapper">
          <h1>Zarejestruj się</h1>
          {error && <div className="error-message">{error}</div>}
          {/* Input field width as inline because it does not want to function otherwise */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input style = {{width: '100%'}}
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Imię"
              />
            </div>
            <div className="form-group">
              <input style = {{width: '100%'}}
                type="text"
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                placeholder="Nazwisko"
              />
            </div>
            <div className="form-group">
              <input style = {{width: '100%'}}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-mail"
              />
            </div>
            <div className="form-group">
              <input style = {{width: '100%'}}
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numer telefonu"
              />
            </div>
            <div className="form-group">
              <input style = {{width: '100%'}}
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Hasło"
              />
            </div>
            <div className="form-group">
              <input style = {{width: '100%'}}
                type="password"
                id="password2"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                placeholder="Powtórz Hasło"
              />
            </div>
            <button type="submit" className="login-btn">Zarejestruj się</button>
            <p className="login-register-link">
            <Link to="/login">Powróć do logowania</Link>
          </p>
          </form>
        </div>
      </div>
    </div>
  )
}
