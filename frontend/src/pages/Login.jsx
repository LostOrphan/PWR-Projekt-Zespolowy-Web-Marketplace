import '../styles/Login.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    {/*TODO: LOGIN LOGIC VIA BACKEND API*/}
    
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-wrapper">
          <h1>Zaloguj się</h1>
          <form onSubmit={handleSubmit}>
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
            <button type="submit" className="login-btn">Zaloguj się</button>
          </form>
          <p className="register-link">
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
