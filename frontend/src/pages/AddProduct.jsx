import '../styles/AddProduct.css'
import { useState } from 'react'
import {useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'

export default function AddProduct() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [state, setState] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
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
        <div className="login-form-wrapper-reg">
          <h1>Dodaj ogłoszenie
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Tytuł ogłoszenia:</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="np. ścianka działowa"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Kategoria:</label>
              <select
                id="category"
                className = "select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option>kategoria 1</option>
                <option>kategoria 2</option>
                <option>kategoria 3</option>
              </select>
            </div>
            <div className="form-group">
              Zdjęcia:
              <div className='photos'>
                
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="state">Stan:</label>
              <select
                id="state"
                className = "select-category"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              >
                <option>używane</option>
                <option>nowe</option>
                <option>uszkodzone</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="price">Cena:</label>
              <input
                type="text"
                id="price"
                value={price}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="w złotówkach"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Opis produktu:</label>
              <textarea
                
                id="description"

                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="twój mądry opis"
                rows="7"
                cols="70"
              ></textarea>
              <div className="form-group">
              <label htmlFor="city">Lokalizacja:</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="np. Wałbrzych"
              />
            </div>
            </div>
            <button type="submit" className="add-btn">Dodaj</button>
          </form>
        </div>
      </div>
    </div>
  )
}
