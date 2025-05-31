import React, { useEffect, useState, useContext } from 'react';
import { Button, Container, Row, Col, ListGroup, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import api from '../api/api';
import { CartContext } from "../context/CartContext";
import { AuthContext } from '../context/AuthContext';

export default function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const {cart, updateQuantity, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  // Load cart and fetch phone details
  useEffect(() => {
    const ids = Object.keys(cart);
    if (ids.length === 0) {
        setProducts([]); // rerender page with without that phone
        return;
      }    
    Promise.all(ids.map(id => api.get(`/phones/${id}`)))
      .then(responses => {
        const phones = responses.map(res => res.data);
        setProducts(phones);
      })
      .catch(console.error);
  }, [cart]);

  const totalPrice = products.reduce((sum, product) => {
    const qty = cart[product._id] || 0;
    return sum + product.price * qty;
  }, 0);

  const handleQuantityChange = (phoneId, quantity) => {
    if (quantity < 0) return;
    updateQuantity(phoneId, quantity);
  };

  const confirmTransaction = async () => {
    try {
      // Update stock for each product
      for (let product of products) {
        const qty = cart[product._id];
        if (qty > 0) {
          await api.post('/cart/checkout', {cart: cart, user: user});
          await api.patch(`/phones/${product._id}/decrease-stock`, { quantity: qty });
        }
      }
      clearCart();
      toast.success('Transaction complete! Your order has been delivered.');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Transaction failed.');
      clearCart();
    }
  };

  return (
    <Container className="py-4">
      <Button variant="link" onClick={() => navigate(-1)}>← Back</Button>
      <h2 className="mt-3">Your Cart</h2>

      {products.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ListGroup className="mt-4">
          {products.map(product => {
            const qty = cart[product._id] || 0;
            return (
              <ListGroup.Item key={product._id}>
                <Row className="align-items-center">
                  <Col md={4}><strong>{product.title}</strong></Col>
                  <Col md={2}>${product.price.toFixed(2)}</Col>
                  <Col md={3}>
                    <Form.Control
                      type="number"
                      value={qty}
                      onChange={e => handleQuantityChange(product._id, parseInt(e.target.value))}
                      min={0}
                    />
                  </Col>
                  <Col md={1}>
                    <Button variant="outline-danger" onClick={() => handleQuantityChange(product._id, 0)}>✕</Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}

      {products.length > 0 && (
        <>
          <h4 className="mt-4">Total: ${totalPrice.toFixed(2)}</h4>
          <Button className="mt-3" onClick={confirmTransaction}>Confirm Transaction</Button>
        </>
      )}
    </Container>
  );
}
