import React from 'react';
import { Button, Container, Nav } from 'react-bootstrap';
import { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import ReviewCard from '../views/ReviewCard';
import PhoneCard from '../views/PhoneCard';

export default function Profile() {
  const [view, setView] = React.useState('edit');
  const [ userInfo, setUserInfo ] = useState({
    firstname: '',
    lastname: '',
    email: ''
  });
  const { user , logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) return;

    api.get(`/users/${user.id}`)
    .then(res => {
      setUserInfo({
        firstname: res.data.firstname,
        lastname: res.data.lastname,
        email: res.data.email
      });
    }
    )
    .catch(err => console.error(err));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Container className="py-4">
      <Button variant="link" onClick={() => navigate(-1)}>← Back</Button>
      { user ? 
        <div>
          <h1 className="mt-4 mb-3">Hi, {userInfo.firstname}!</h1>
          {/* tabs */}
          <Nav variant="tabs" activeKey={view} onSelect={(selectedKey) => setView(selectedKey)}>
            <Nav.Item>
              <Nav.Link eventKey="edit">Edit</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="password">Password</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="listings">Listings</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="comments">Comments</Nav.Link>
            </Nav.Item>
          </Nav>
          <div className="mb-5">
            {/* actual content to display */}
            {view === "edit" && <Edit user={user} setUser={setUser} userInfo={userInfo} />}
            {view === "password" && <Password user={user} />}
            {view === "listings" && <Listings user={user} />}
            {view === "comments" && <Comments user={user} />}
          </div>
          <hr></hr>
          {/* sign out on every page */}
          <Button variant="danger" size="lg" onClick={handleLogout} className="me-1">Sign Out</Button>
        </div>
      :
        <div>
          <h1 className="mt-4 mb-3">Profile</h1>
          <em><Link to="/auth">Sign in</Link> to view your profile.</em>
        </div>
      }
    </Container>
  );
}

function Edit({ user, setUser, userInfo }) {
  const[form, setForm] = useState({
    firstname: '', 
    lastname: '', 
    email: ''
  });
  const [showPasswordConfirmation, showPassword] = useState(false);

  useEffect(() => {
    setForm({
      firstname: userInfo.firstname,
      lastname: userInfo.lastname,
      email: userInfo.email
    });    
  }, [userInfo]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/login', {
        email: userInfo.email,                  // use current/previous email
        password: form.password
      })
    } catch (err) {
      console.error(err);
      toast.error('Invalid password');
      return;
    }
    
    // update user info
    api.post('/users/update-info', {
      id: user.id,
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email
    })
    .then(res => {
      if (res.status === 200) {
        toast.success('Profile updated successfully');
        const prev = ({ ...user, email: res.data.email });
        setUser(prev);
      } else {
        toast.error('Failed to update profile');
      }
    })
    .catch(err => {
      console.error(err);
      toast.error('Failed to update profile');
    });

    // reset page
    showPassword(false);
  }

  return (
    <div>
      <h3 className="mt-4 mb-3">Edit Profile</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>First Name</label>
          <input name="firstname" className="form-control" value={form.firstname}
            onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label>Last Name</label>
          <input
            name="lastname" className="form-control" value={form.lastname}
            onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label>Email</label>
          <input
            name="email" className="form-control" value={form.email}
            onChange={handleChange} required
          />
        </div>
        {showPasswordConfirmation ? (
          <div className="p-3 rounded border border-primary bg-primary-subtle">
            <div className="mb-3">
              <label>Please enter password to confirm changes:</label>
              <input
                name="password" type="password" className="form-control"
                onChange={handleChange} required
              />
            </div>
            <Button variant="primary" type="submit" className="me-1">Save</Button>
          </div>
        ) : (
          <Button variant="primary" type="button" className="me-1" onClick={() => showPassword(true)}>Save</Button>
        )}
      </form>
    </div>
  );
}

function Password({ user }) {
  const[form, setForm] = useState({
    oldPassword: '', newPassword: '', 
  });
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/users/update-password', {
      id: user.id,
      email: user.email,
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })
    .then(res => {
      if (res.status === 200) {
        toast.success('Password updated successfully');
      } else {
        toast.error('Failed to update password');
      }
    })
    .catch(err => {
      console.error(err);
      toast.error('Failed to update password');
    });
    setConfirm(false);
    setLoading(false);
    setForm({ oldPassword: '', newPassword: '' });
  }
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h3 className="mt-4">Change Password</h3>
      {loading && <div className="alert alert-secondary">Loading...</div>}
      <form id="password-form" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Old Password</label>
          <input name="oldPassword" type="password" className="form-control" value={form.oldPassword}
            onChange={handleChange} required
          />
        </div>
        <div className="mb-3">
          <label>New Password</label>
          <input
            name="newPassword" type="password" className="form-control" value={form.newPassword}
            onChange={handleChange} required
          />
        </div>
      </form>
      { confirm ? (
        <div className="p-3 rounded border border-primary bg-primary-subtle">
          <label className="mb-2">Confirm password change:</label>
          <br></br>
          <Button variant="primary" type="submit" form="password-form" className="me-1">Confirm</Button>
          <Button variant="secondary" onClick={() => {
            setConfirm(false); 
            setForm({ oldPassword: '', newPassword: '' })}}
          >
            Cancel
          </Button>
        </div>
      )
      :
        (<Button variant="primary" type="button" onClick={() => {
          if (form.oldPassword && form.newPassword) {
            setConfirm(true);
          } else {
            toast.error('Please fill in both password fields');
          }
        }} 
        className="me-1">Save</Button>)
      }
    </div>
  );
}

function Listings({ user }) {
  const [listings, setListings] = useState([]);
  const [ createNewMode, setCreateNewMode ] = useState(false);

  const [form, setForm] = useState({
    title: '',
    brand: '',
    image: null,
    stock: 0,
    price: '',
  });

  const brands = ['Samsung','Apple','HTC','Huawei','Nokia','LG','Motorola','Sony','BlackBerry'];

  useEffect(() => {
    api.get(`/phones`)
      .then(res => {
        const userListings = res.data.filter(p =>
          p.seller === user.id
        );
        setListings(userListings);
        console.log(userListings);
      })
      .catch(console.error)
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm({ ...form, image: files[0] }); // Store the file object
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post('/phones/create', {
        title: form.title,
        brand: form.brand,
        image: form.image,
        stock: form.stock,
        price: form.price,
        seller: user?.id
      }, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(res => {
        toast.success('Listing created successfully');
        setCreateNewMode(false);
        setForm({
          title: '',
          brand: '',
          image: null,
          stock: 0,
          price: '',
          seller: user?._id || '',
        });
        setListings(prev => [...prev, res.data]);
      })
    } catch (err) {
      console.error(err);
      toast.error('Failed to create listing');
    }
  }

  return (
    <div>
      <h3 className="mt-4 mb-3">Add New Listing</h3>
      { createNewMode ?
        (
        // Create new listing
          <div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
              <label>Title</label>
              <input
                className='form-control'
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
              </div>

              <div className="mb-3">
                <label>Brand</label>
                <select className='form-control' name="brand" value={form.brand} onChange={handleChange} required>
                  <option value="">Select brand...</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label>Image Upload</label>
                <input className = 'form-control' type="file" name="image" onChange={handleChange} accept="image/*" required />
              </div>

              <div className="mb-3">
                <label>Stock</label>
                <input
                  className='form-control'
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="mb-3">
                <label>Price ($)</label>
                <input
                  className='form-control'
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              <Button variant="primary" type="submit" className="me-3">Create</Button>
              <Button variant="secondary" onClick={() => setCreateNewMode(false)}>Cancel</Button>
            </form>
          </div>

        ) : (
        // Listings
        <div>
          <Button variant="primary" onClick={() => setCreateNewMode(true)}>Create</Button>
          <h3 className="mt-5">Your Listings</h3>
          {listings.length === 0 ? (
            <p>You have not created any listings yet.</p>
            ) : (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {listings.map((p, i) => (
                    <PhoneCard
                      phone={p} showRating={false} showHideButton={true} key={i} setListings={setListings} hiddenNow={p.disabled}
                    ></PhoneCard>
                  )
              )}
            </div>
          )}
        </div>
        )
      }
    </div>
  );
}

function Comments({ user }) {
  const [ phones, setPhones ] = useState([]);
  const [ reviews, setReviews ] = useState([]);

  useEffect(() => {
    api.get(`/phones`)
      .then(res => {
        const commentedPhones = res.data.filter(p =>
          p.reviews.some(r => r.reviewer === user.id)
        );
        setPhones(commentedPhones);
      })
      .catch(console.error)
  }, [reviews, user]);

  return (
    <div>
      <h3 className="mt-4">Your Comments</h3>
      {phones.length === 0 ? (
        <p>You have not commented on any phones yet.</p>
      ) : (
        <ul>
          {phones.map(p => (
            <li key={p._id}>
              <Link to={`/phones/${p._id}`}>{p.title}</Link>
              {p.reviews.map(r => (
                r.reviewer === user.id && (
                  <ReviewCard
                    r={r}
                    isSeller={false}
                    user={user}
                    setReviews={setReviews}
                    pid={p._id}
                  ></ReviewCard>
                )
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



