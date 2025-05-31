// frontend/src/components/Navbar.jsx
import React, { useState, useContext } from 'react';
import { Navbar, Container, Nav, Form, FormControl, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';

export default function AppNavbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user , logout } = useContext(AuthContext);
  const [showConfirmSignout, setShowConfirm] = useState(false);

  const onSearch = e => {
    e.preventDefault();
    navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-4">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>OldPhoneDeals</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle />
        <Navbar.Collapse>
          {/* Search bar */}
          <Form className="d-flex me-auto" onSubmit={onSearch}>
            <FormControl
              type="search"
              placeholder="Search phones…"
              className="me-2"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Button type="submit" variant="outline-success">Search</Button>
          </Form>

          <Nav className="ms-auto align-items-center">
            <LinkContainer to="/checkout"><Nav.Link>Checkout</Nav.Link></LinkContainer>

            {user ? (
              <>
                <LinkContainer to="/wishlist"><Nav.Link>Wishlist</Nav.Link></LinkContainer>
                <LinkContainer to="/profile"><Nav.Link>Profile</Nav.Link></LinkContainer>
                {!showConfirmSignout ? (
                  <Nav.Link onClick={() => setShowConfirm(true)}>Sign Out</Nav.Link>
                ) : (
                  <div className="d-flex align-items-center bg-white p-2 border rounded">
                    <span className="me-2">Confirm?</span>
                    <Button variant="danger" size="sm" onClick={logout} className="me-1">Yes</Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowConfirm(false)}>No</Button>
                  </div>
                )}
              </>
            ) : (
              <LinkContainer to="/auth"><Nav.Link>Sign In</Nav.Link></LinkContainer>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}