import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import api from '../api/api';
import { AuthContext } from '../context/AuthContext';

//http://localhost:5001/api/auth/...

export default function AuthPage() {
  const [view, setView] = useState("generic"); // 'signup', 'reset', 'verify'
  const [searchParams] = useSearchParams();

  // EMAIL VALIDATION: check if emailToken exists in the URL
  useEffect(() => {
    const emailToken = searchParams.get('emailToken');
    if (emailToken) {
      api.post('auth/verify-email', { emailToken })
        .then(() => {
          setView('verify-success');
        })
        .catch(() => {
          setView('verify-failed');
        });
    }
  }, [searchParams]);

  // PASSWORD RESET: check if resetToken exists in the URL
  useEffect(() => {
    const resetToken = searchParams.get('resetToken');
    if (resetToken) {
      setView('reset');
    }
  }, [searchParams]);

  return (
    // send emailToken if verify fails to delete the user
    // send resetToken if reset succeeds to reset the password
    <div className="container mt-5">
      {view === "generic" && <GenericChoice switchTo={setView} />}
      {view === "login" && <LoginForm switchTo={setView}/>}
      {view === "signup" && <SignupForm switchTo={setView} />}
      {view === "verify-success" && <EmailVerified switchTo={setView} />}
      {view === "verify-failed" && <EmailVerifyFailed switchTo={setView} emailToken={searchParams.get('emailToken')} />}
      {view === "reset-req" && <ResetReq switchTo={setView} />}
      {view === "reset" && <Reset switchTo={setView} resetToken={searchParams.get('resetToken')} />}
    </div>
  );
};


function GenericChoice ({ switchTo }) {
  const { user } = useContext(AuthContext);

  // IF ALREADY LOGGED IN (ie. user exists), immediately redirect to home  
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  return (
    <div>
      <h2>Welcome to OldPhoneDeals</h2>
      <p>Please choose an option:</p>
      <button className="btn btn-primary me-2" onClick={() => switchTo("login")}>Login</button>
      <button className="btn btn-primary me-2" onClick={() => switchTo("signup")}>Sign Up</button>
    </div>
  );
}

/// SIGN UP VIEWS
function SignupForm({ switchTo }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // field validation first
    if (form.password.length < 8) {
      setError('Enter a password with 8+ characters.');
      setLoading(false);
      return;
    } else if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter.');
      setLoading(false);
      return;
    } else if (!/[a-z]/.test(form.password)) {
      setError('Password must contain at least one lowercase letter.');
      setLoading(false);
      return;
    } else if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number.');
      setLoading(false);
      return;
    } else if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must contain at least one symbol.');
      setLoading(false);
      return;
    } else if (!form.email.includes('@')) {
      setError('Enter a valid email.');
      setLoading(false);
      return;
    } else if (form.password !== form.confirmPassword) {
      setError(`Passwords do not match. ${form.password} !== ${form.confirmPassword}`);
      setLoading(false);
      return;
    }

    // call backend route
    try {
      await api.post('auth/signup', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // signup success, show verification message
  if (success) {
    return (
      <div>
      <h4>Check your email</h4>
      <p>A verification email has been sent to <strong>{form.email}</strong>. 
      Please check your inbox and follow the instructions to verify your account.</p>
      <button className="btn btn-primary me-2" onClick={() => window.location.href = '/'}>Back to Home</button>
      </div>
    );
  }

  // render base signup form
  return (
    <div>
      <h2>Sign Up</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-secondary">Loading...</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>First Name</label>
          <input name="firstName" className="form-control" value={form.firstName}
            onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label>Last Name</label>
          <input
            name="lastName" className="form-control" value={form.lastName}
            onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email" name="email" className="form-control" value={form.email}
            onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password" name="password" className="form-control" value={form.password}
            onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label>Confirm Password</label>
          <input
            type="password" name="confirmPassword" className="form-control" value={form.confirmPassword} 
            onChange={handleChange} required
          />
        </div>

        <button type="submit" className="btn btn-primary">Create Account</button>
        <button type="button" className="btn btn-link" onClick={() => switchTo('login')}>
          Already have an account?
        </button>
      </form>
    </div>
  );
}
const EmailVerified = ({ switchTo }) => {
  return (
    <div>
      <p>Success! Your email has been verified. Log into OldPhoneDeals here:</p>
      <button className="btn btn-primary me-2" onClick={() => switchTo("login")}>Login</button>
    </div>
  );
};
const EmailVerifyFailed = ({ switchTo, emailToken }) => {
  // remove the user from the database
  api.post('auth/email-verify-fail', { emailToken })

  return (
    <div>
      <p>Verification failed or email verification token is expired (more than one day old). Please try creating your account again.</p>
      <button className="btn btn-primary me-2" onClick={() => switchTo("signup")}>Sign Up</button>
    </div>
  );
}

/// LOGIN VIEWS
const LoginForm = ({ switchTo }) => {
  const { login } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const res = await api.post('/auth/login', form);
      setSuccess(true);

      // Save the login token to local storage via AuthContext, redirect back to home
      login(res.data.token);
      await new Promise(resolve => setTimeout(resolve, 500));
      const redirectPath = searchParams.get('redirect') || '/';
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed'); // ERROR: when we disable a user, it auto responds like this instead of saying "user disabled...contact support"
    }
  };

  return (
    <div className="container">
      <h3>Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">Login successful!</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email</label>
          <input
            name="email"
            type="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            name="password"
            type="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Log In</button>
      </form>

      <p className="mt-3">
        Don’t have an account? <button onClick={() => switchTo('signup')} className="btn btn-link p-0">Sign up</button>
      </p>
      <p className="mt-3">
        Forgot your password? <button onClick={() => switchTo('reset-req')} className="btn btn-link p-0">Reset Password</button>
      </p>
    </div>
  );
};

/// RESET PASSWORD VIEWS
const ResetReq = ({ switchTo }) => {
  const [form, setForm] = useState({ email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await api.post('auth/req-password', form);
      setSuccess('Password reset link sent to your email.');
      setLoading(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      switchTo('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending password reset link. Is your email registered?');
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Forgot your Password?</h2>
      <p>Enter your email address to receive a password reset link.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <div className="alert alert-secondary">Loading...</div>}
      <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email" name="email" className="form-control mb-3" value={form.email}
            onChange={handleChange} required
          />
          <button type="submit" className="btn btn-primary mb-3">Reset Password</button>
      </form>
      <button className="btn btn-secondary me-2" onClick={() => switchTo("login")}>Back to Login</button>
    </div>
  );
}
const Reset = ({ switchTo, resetToken }) => {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError(`Passwords do not match. ${form.password} !== ${form.confirmPassword}`);
      return;
    }
    if (form.password.length < 8) {
      setError('Enter a password with 8+ characters.');
      return;
    } else if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    } else if (!/[a-z]/.test(form.password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    } else if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number.');
      return;
    } else if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must contain at least one symbol.');
      return;
    }

    try {
      console.log('posting to reset-password');
      await api.post('/auth/reset-password', { password: form.password, resetToken });
      setSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      switchTo('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <p>Enter your new password below:</p>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">Reset successful!</div>}
        <div className="mb-3">
            <label>New Password</label>
            <input
              type="password" name="password" className="form-control mb-3" value={form.password}
              onChange={handleChange} required
            />
        </div>
        <div className="mb-3">
            <label>Confirm New Password</label>
            <input
              type="password" name="confirmPassword" className="form-control mb-3" value={form.confirmPassword}
              onChange={handleChange} required
            />
        </div>
        <button type="submit" className="btn btn-primary mb-3">Submit</button>
      </form>
      <button className="btn btn-secondary me-2" onClick={() => switchTo("login")}>Back to Login</button>
    </div>
  );
};
