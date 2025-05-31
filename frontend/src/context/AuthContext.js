import React, { useContext } from 'react';
import { createContext, useState, useEffect } from 'react';

import { CartContext } from "../context/CartContext";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const { clearCart } = useContext(CartContext);

  useEffect(() => {
    if (token) {
      // Optionally decode the token to get user info
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUser(decoded);
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    clearCart();
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
