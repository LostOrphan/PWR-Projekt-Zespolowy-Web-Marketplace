import '../styles/Login.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cookies, setCookie] = useCookies(["username", "token", "refresh_token"])
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const result = await loginUser({ email, password })

      if (result.success) {
        setCookie("username", email, { path: "/" })
        setCookie("token", result.data.access, { path: "/" })
        if (result.data.refresh) {
          setCookie("refresh_token", result.data.refresh, { path: "/" })
        }
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Błąd połączenia z serwerem')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-wrapper">
          <h1>Zaloguj się</h1>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
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
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Twoje hasło"
              />
            </div>
            <button type="submit" className="login-btn">Zaloguj się</button>
          </form>
          <p className="login-register-link">
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
