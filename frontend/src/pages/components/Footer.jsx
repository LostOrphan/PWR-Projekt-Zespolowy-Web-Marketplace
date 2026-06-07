import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Home.css'; 

const Footer = () => {

    const navigate = useNavigate();

    return (
        <footer className="app-footer">
                <p>&copy; 2026 BestMarket</p>
            </footer>
    );
};

export default Footer;