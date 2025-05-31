// src/App.js
import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AdminAuthContext } from './context/AdminAuthContext';
import AdminListings   from './pages/AdminListings';
import AdminReviews from './pages/AdminReviews';
import AdminSales from './pages/AdminSales';


import AppNavbar    from './views/Navbar';
import Home         from './pages/Home';
import Search       from './pages/Home';         // reuse
import PhoneDetail  from './pages/PhoneDetail';
import Auth         from './pages/Auth';
import Cart         from './pages/Cart';
import Profile      from './pages/Profile';
import Wishlist     from './pages/Wishlist';
import AdminUsers from './pages/AdminUsers';

import AdminLogin      from './pages/AdminLogin';
import AdminDashboard  from './pages/AdminDashboard';


function RequireAdmin({ children }) {
  const { isAdmin } = React.useContext(AdminAuthContext);
  return isAdmin ? children : <Navigate to="/admin" replace />;
  
}

function Layout() {
  const { pathname } = useLocation();
  // hide navbar on login/checkout/profile/admin pages
  const hideNav = [
    '/auth', '/checkout', '/profile', '/admin', '/admin/dashboard', '/wishlist',
  ].includes(pathname);

  return (
    <>
      {!hideNav && <AppNavbar />}
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/search"     element={<Search />} />
        <Route path="/phones/:id" element={<PhoneDetail />} />
        <Route path="/auth"       element={<Auth />} />
        <Route path="/checkout"   element={<Cart />} />
        <Route path="/wishlist"   element={<Wishlist />} />
        <Route path="/profile"    element={<Profile />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (

    <Routes>
      <Route
        path="/admin"
        element={
          <AdminAuthContext.Consumer>
            {({ isAdmin }) =>
              isAdmin
                ? <Navigate to="/admin/dashboard" replace />
                : <AdminLogin />
            }
          </AdminAuthContext.Consumer>
        }
      />
      <Route
        path="/admin/dashboard"
        element={<RequireAdmin><AdminDashboard/></RequireAdmin>}
      />
      <Route path="/admin/listings" element={<RequireAdmin><AdminListings/></RequireAdmin>} />
      <Route path="/admin/reviews" element={<RequireAdmin><AdminReviews/></RequireAdmin>}/>
      <Route path="/admin/users" element={<RequireAdmin><AdminUsers/></RequireAdmin>}/>
        <Route path="/admin/sales" element={
          <RequireAdmin>
            <AdminSales/>
          </RequireAdmin>
        }/>
      <Route path="/*" element={<Layout/>}/>
    </Routes>
  );
}