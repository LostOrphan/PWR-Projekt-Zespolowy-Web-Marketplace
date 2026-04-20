import '../styles/Login.css'
import { useState } from 'react'
import {useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [cookies, setCookie] = useCookies(["username"])
  const navigate = useNavigate()
  const handleSubmit = (e) => {
    e.preventDefault()
    setCookie("username", email, {path: "/"});
    {/*TODO: REGISTER LOGIC VIA BACKEND API*/}
    navigate('/')
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-wrapper">
          <h1>Zarejestruj się
          </h1>
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
                required
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
              <label htmlFor="password">Powtórz hasło:</label>
              <input
                type="password"
                id="password"
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
