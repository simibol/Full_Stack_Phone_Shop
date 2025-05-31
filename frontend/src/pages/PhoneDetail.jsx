import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, Button, Form, ListGroup, Container, Row, Col, Image, Badge, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Heart, HeartFill } from 'react-bootstrap-icons';

import api from '../api/api';
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

import ReviewCard from '../views/ReviewCard';

export default function PhoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, token } = useContext(AuthContext);
  const { addToCart, getQuantity } = useContext(CartContext);
  
  const [phone, setPhone] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3); // how many reviews to show
  const [newComment, setNewComment] = useState('');
  const [newRating,  setNewRating]  = useState(5);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [quantityInput, setQuantityInput] = useState(1);
  const [quantitySelected, setQuantitySelected] = useState(null);

  const [wishlist, setWishlist] = useState({});
  const [isInWishlist, setIsInWishlist] = useState(false);

  // 1. fetch info. reviews are an attribute of phone
  useEffect(() => {
    setLoading(true);
    api.get(`/phones/${id}`)
      .then(res => {
        setPhone(res.data);
        setReviews(res.data.reviews);
        setQuantitySelected(getQuantity(id));
        console.log(id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, getQuantity]);

  // 2. load wishlist from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('wishlist')) || {};
    setWishlist(stored);
    setIsInWishlist(!!stored[id]);
  }, [id]);

  if (loading) return <Container className="py-5"><p>Loading…</p></Container>;
  if (!phone)  return <Container className="py-5"><p>Phone not found</p></Container>;
  if (phone.disabled && phone.seller !== user?.id) {
    return (
      <Container className="py-5">
        <h2>Phone not available</h2>
        <p>This phone is no longer available for sale.</p>
        <Button variant="link" onClick={() => navigate(-1)}>← Back</Button>
      </Container>
    );
  }

  const {
    title, brand, image, stock,
    price, sellerName, seller: sellerId
  } = phone;

  // 2. figure out which reviews this user can see:
  const isSeller = user?.id === sellerId;
  const visibleReviews = reviews.filter(r =>
    !r.hidden ||
    r.reviewer === user?.id ||
    isSeller
  );
  const shownReviews = visibleReviews.slice(0, visibleCount);

  // POSTING A NEW REVIEW
  const postReview = async e => {
    e.preventDefault();
    try {
      await api.post(
        `/phones/${id}/post-review`, 
        {rating: newRating, comment: newComment, user: user},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Review posted successfully!');

      api.get(`/phones/${id}`)
      .then(res => {
        setReviews(res.data.reviews);
      })
      .catch(console.error)

      // reset the add comment form
      // setVisibleCount(c => c + 1);
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      console.error(err);
      toast.error('Failed to post review');
    }
  };

  // CART LOGIC
  const handleAddToCart = () => {
    if (!user) {
      // prompt them to sign in and redirect back here after
      const redirectPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth?redirect=${redirectPath}`);
      return;
    }
    else {
      // add to cart
      try {
        if (getQuantity(id) + quantityInput > stock) {
          toast.error('Not enough stock available');
          return;
        }

        addToCart(id, quantityInput);
    
        // reset add to cart form
        toast.success('Added to cart');
        setShowQuantityInput(false);
        setQuantityInput(1);

        // set quantity
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        const quantity = cart[id] || 999;
        setQuantitySelected(quantity);

      } catch (err) {
        console.error(err);
        toast.error('Failed to add to cart');
      }
    }
  };

  // WISHLIST LOGIC
  const toggleWishlist = () => {
    if (!user) {
      // prompt them to sign in and redirect back here after
      const redirectPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth?redirect=${redirectPath}`);
      return;
    }
    
    const updated = { ...wishlist };
    console.log('fetch updated', updated);
    if (updated[id]) {
      delete updated[id];
    } else {
      updated[id] = true;
    }
    console.log('setting this as updteed local: ', updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlist(updated);
    setIsInWishlist(!isInWishlist);
  };

  return (
    <Container className="py-4" style={(isSeller && phone.disabled) ? { backgroundColor: '#f2f2f2' } : {}}>
      <Button variant="link" onClick={() => navigate(-1)}>← Back</Button>
      {isSeller && phone.disabled && <Alert variant="warning" className="text-center">
        <strong>This listing is hidden.</strong></Alert>}
      <Row className="mt-3">
        <Col md={6}>
          <Image src={`http://localhost:5001${image}`} fluid rounded />
        </Col>
        <Col md={6}>
          <h2>{title}</h2>
          <p className="text-muted">{brand}</p>
          <ListGroup className="mb-3">
            <ListGroup.Item>Price: <strong>${price.toFixed(2)}</strong></ListGroup.Item>
            <ListGroup.Item>
              {stock>0
                ? <>In stock: <Badge bg="success">{stock}</Badge></>
                : <>Out of stock: <Badge bg="danger">0</Badge></>}
            </ListGroup.Item>
            <ListGroup.Item>Seller: <em>{sellerName}</em></ListGroup.Item>
          </ListGroup>

          {/* ADD TO CART */}
          {showQuantityInput ? (
            <div>
            <h5>Quantity</h5>
              <div className="d-flex align-items-center mb-2" style={{ maxWidth: '300px' }}>
                <Form.Control
                  type="number"
                  min="1"
                  max={stock}
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Math.max(1, Math.min(stock, +e.target.value)))}
                  className="me-2"
                />
                <Button onClick={handleAddToCart} disabled={quantityInput > stock}>
                  Confirm
                </Button>
                <Button variant="danger" onClick={() => setShowQuantityInput(false)} className="ms-2">
                ✕
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="me-2"
              disabled={stock === 0}
              onClick={() => setShowQuantityInput(true)}
            >
              Add to Cart
            </Button>
          )}
          {/* ALREADY IN CART */}
          {quantitySelected !== null && (
            <div className="mt-4">
              <Card className="shadow-sm p-2 bg-white rounded">
                <Card.Body>
                  <h5 className="card-title">Currently in Cart</h5>
                  <p className="card-text">
                    Quantity: <strong>{quantitySelected}</strong>
                  </p>
                </Card.Body>
              </Card>
            </div>
          )}
          {/* WISHLIST */}
          <br></br>
          <div className="d-flex align-items-center mt-1">
          {isInWishlist ? (
            <div>
            <span className="me-2">Added to Wishlist!</span>
            <Button variant="outline-danger" onClick={toggleWishlist}>
              <HeartFill />
            </Button>
            </div>
          ) : (
            <div>
            <span className="me-2">Add to Wishlist</span>
            <Button variant="outline-secondary" onClick={toggleWishlist}>
              <Heart />
            </Button>
            </div>
          )
          }
        </div>
        </Col>
      </Row>

      <hr />
      <h4>Reviews</h4>
      {visibleReviews.length===0 && <p>No reviews to show.</p>}
      {shownReviews.map(r => (
        <ReviewCard
          key={r._id}
          r={r}
          isSeller={isSeller}
          user={user}
          setReviews={setReviews}
          pid={id}
        />
      ))}

      {visibleCount < visibleReviews.length && (
        <Button variant="link" onClick={()=>setVisibleCount(c=>c+3)}>
          Show more reviews
        </Button>
      )}

      {user ? (
        <div>
          <hr />
          <h4>Write a Review</h4>
          <Form onSubmit={postReview} className="mt-4">
            <Form.Group controlId="rating">
              <Form.Label>Rating</Form.Label>
              <Form.Select
                value={newRating}
                onChange={e=>setNewRating(+e.target.value)}
              >
                {[5,4,3,2,1].map(n=>(
                  <option key={n} value={n}>{n}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="comment" className="mt-2">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea" rows={3}
                value={newComment}
                onChange={e=>setNewComment(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" className="mt-2">Post Review</Button>
          </Form>
        </div>
      ) : (
        <p className="mt-4">
          <em><Link to="/auth">Sign in</Link> to write a review.</em>
        </p>
      )}
    </Container>
  );
}