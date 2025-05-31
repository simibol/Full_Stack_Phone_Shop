import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});

  // load cart from localStorage on mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || {};
    setCart(savedCart);
  }, []);

  const syncCart = () => {
    const updatedCart = JSON.parse(localStorage.getItem('cart')) || {};
    setCart(updatedCart);
  };  

    const addToCart = (phoneId, quantityInput) => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || {};
    if (storedCart[phoneId]) {
        storedCart[phoneId] += quantityInput;
    } else {
        storedCart[phoneId] = quantityInput;
    }
    localStorage.setItem('cart', JSON.stringify(storedCart));
    syncCart()
    };


  const updateQuantity = (phoneId, quantityInput) => {
    const newCart = { ...cart };
    if (quantityInput <= 0) {
      delete newCart[phoneId];
    } else {
      newCart[phoneId] = quantityInput;
    }
    localStorage.setItem('cart', JSON.stringify(newCart));
    syncCart()
  };
  
  const getQuantity = (phoneId) => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || {};
    return storedCart[phoneId] || 0;
  };

  const clearCart = () => {
    setCart({});
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, clearCart, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
};
