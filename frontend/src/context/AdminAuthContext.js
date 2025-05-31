// TRIVIAL AUTH (JUST TO GET WORKING)

import React, { createContext, useState, useEffect } from 'react';
import adminApi from '../api/adminApi';

export const AdminAuthContext = createContext({
  isAdmin: false,
  setIsAdmin: () => {}
});

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // on startup, see if session is active
    adminApi.get('/ping')
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}