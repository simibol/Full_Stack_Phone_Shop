import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { HeartFill, Heart } from 'react-bootstrap-icons';

import api from '../api/api';


export default function WishlistPage() {
  const [wishItems, setWishItems] = useState([]);
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist and fetch phone details
  useEffect(() => {
    const wishlist = localStorage.getItem('wishlist') ? JSON.parse(localStorage.getItem('wishlist')) : [];
    setWishlist(wishlist);
  }, []);

  useEffect(() => {
    const ids = Object.keys(wishlist);
    Promise.all(ids.map(id => api.get(`/phones/${id}`)))
      .then(responses => {
        const phones = responses.map(res => res.data);
        setWishItems(phones);
      })
      .catch(console.error);
  }, [wishlist]);

  return (
    <Container className="py-4">
      <Button variant="link" onClick={() => navigate(-1)}>← Back</Button>
      <h2 className="mt-3">Your Wishlist</h2>

      {wishItems.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <ListGroup className="mt-4">
          {wishItems.map(product => {
            return (
              <ListGroup.Item key={product._id}>
                <Row className="align-items-center">
                  <Col md={8}><strong>{product.title}</strong></Col>
                  <Col md={3}>${product.price.toFixed(2)}</Col>
                  <Col md={1}>
                    <WishlistButton productId={product._id} setWishlist={setWishlist} wishlist={wishlist}/>
                  </Col>
                </Row>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}

    </Container>
  );
}


function WishlistButton({ productId, setWishlist, wishlist }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || {};
    setIsWishlisted(!!wishlist[productId]);
  }, [productId]);

  const toggleWishlist = () => {
    const updatedWishlist = {...wishlist };

    if (updatedWishlist[productId]) {
      delete updatedWishlist[productId];
      setIsWishlisted(false);
    } else {
      updatedWishlist[productId] = true;
      setIsWishlisted(true);
    }

    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    setWishlist(updatedWishlist);
  };

  return (
    <Button variant="light" onClick={toggleWishlist}>
      {isWishlisted ? <HeartFill color="red" /> : <Heart />}
    </Button>
  );
}

