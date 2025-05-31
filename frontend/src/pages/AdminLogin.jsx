import React, { useState, useContext } from 'react';
import adminApi from '../api/adminApi';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container } from 'react-bootstrap';
import { AdminAuthContext } from '../context/AdminAuthContext';


export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const { setIsAdmin } = useContext(AdminAuthContext);
  const navigate                = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await adminApi.post('/login', { email, password });
      localStorage.setItem('token_admin', data.token);
      setIsAdmin(true);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <Container style={{ maxWidth: 400, padding: '2rem' }}>
      <h2>Admin Login</h2>
      {error && <p className="text-danger">{error}</p>}
      <Form onSubmit={submit}>
        <Form.Group className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email" value={email}
            onChange={e => setEmail(e.target.value)} required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password" value={password}
            onChange={e => setPassword(e.target.value)} required
          />
        </Form.Group>
        <Button type="submit">Log In</Button>
      </Form>
    </Container>
  );
}