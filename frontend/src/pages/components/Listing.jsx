
import React, { useState } from 'react';
import '../../styles/Home.css'; 
import { useNavigate } from 'react-router-dom'
import userAvatar from '../../assets/user.png'

export default function Listing({id, images, title, price, city, date}){
const navigate = useNavigate()

  return (
    <div 
                    key={id} 
                    className="product-card" 
                    onClick={() => navigate(`/product/${id}`)}
                  >
                    {images && images.length > 0 ? (
                      <img 
                        src={images[0].image} 
                        alt={title} 
                        className="product-image"
                        onError={(e) => {
                          e.target.src = userAvatar
                        }}
                      />
                    ) : (
                      <img 
                        src={userAvatar} 
                        alt="No image" 
                        className="product-image"
                      />
                    )}
                    <p className="product-name">{title}</p>
                    <p className="product-city-date">{city}</p>
                    <p className="product-city-date">{date}</p>
                    <p className="product-price">{price} zł</p>
                  </div>
  );

}