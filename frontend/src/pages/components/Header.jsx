import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie'
import { useState, useEffect } from 'react'
import '../../styles/Home.css';
import userAvatar from "../../assets/user.png"
export default function Header(){
    // Inicjalizacja nawigacji wewnątrz komponentu Header
    const [cookies, setCookie, removeCookie] = useCookies(["username", "token", 'email','currentSearch'])
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const navigate = useNavigate();
    const handleLogout = async (e) => {
      removeCookie("username")
      removeCookie("token")
      removeCookie("email")
      removeCookie('currentSearch')
      navigate('/login')
    }
    return (
      <header className="app-header">
        <div className="header-bottom">
          <div className='header-logo-item left-side'>
          <h1 onClick={() => navigate('/')}>🛒 BestMarket</h1>
          </div>
          <div className='header-item center-side'></div>

          <div className='header-item right-side'>

            {cookies.username &&(<div><button onClick={() => navigate('/addproduct')} className="search-button" style={{width: '150px'}}>Dodaj ogłoszenie</button></div>)}
            {!cookies.username &&(<div><button onClick={() => navigate('/login')} className="search-button" style={{width: '150px'}}>Dodaj ogłoszenie</button></div>)}
            <div>
          {/*TODO FUNCTIONALITY FOR USER DISPLAY*/}
          {/*ADDITIONAL: SITES/BUTTONS FOR FOLLOWED OFFERS/FOR SALE, SOLD ITEMS, BOUGHT ITEMS*/}
          {!cookies.username && (
            <div className="user-section">
              <button
                onClick={() => navigate('/login')}
                className="dropdown-btn"
                >Zaloguj się</button>
          </div>
          
          )}
          {cookies.username && (
            <div className="user-section">
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="user-menu"
            >
              <div><img src={userAvatar} alt="user-avatar-img"/></div> <div>{cookies.username}</div>
            </div>
            {userDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={() => navigate('/mylistings')} className="dropdown-link">Moje ogłoszenia</button>
                <button onClick={() => navigate('/purchase-history')} className="dropdown-link">Historia zakupów</button>
                <button onClick={() => navigate('/edituser')} className="dropdown-link">Edytuj profil</button>
                <button onClick={handleLogout} className="dropdown-link">Wyloguj się</button>
              </div>
            )}
          </div>
          )}
          </div>
          </div>
          </div>
      </header>
    );
};

