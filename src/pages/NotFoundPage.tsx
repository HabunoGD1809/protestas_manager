import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFoundPage.css';

const NotFoundPage: React.FC = () => {
   const iconRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const animateIcon = () => {
         if (iconRef.current) {
            iconRef.current.style.transform = `translateY(${Math.sin(Date.now() / 500) * 10}px)`;
         }
      };

      const intervalId = setInterval(animateIcon, 50);

      return () => clearInterval(intervalId);
   }, []);

   return (
      <div className="not-found-page">
         <div className="not-found-container">
            <div className="not-found-icon" ref={iconRef}>🚀</div>
            <h1 className="not-found-title">404</h1>
            <p className="not-found-text">¡Ups! Parece que te has perdido en el espacio.</p>
            <Link to="/" className="not-found-btn">Volver a la Tierra</Link>
         </div>
      </div>
   );
};

export default NotFoundPage;
