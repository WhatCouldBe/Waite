// client/src/pages/Signin.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signin } from '../api';

export default function Signin({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const result = await signin(email, password);
      if (result.message && result.message.toLowerCase().includes('signed in')) {
        localStorage.setItem('bacshotsUser', JSON.stringify(result.user));
        setIsAuthenticated(true);
        navigate('/home');
      } else {
        setErrorMsg(result.message || 'Signin failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server. Please try again later.');
    }
  };

  return (
    <div className="card">
      <h2>Sign In</h2>
      {errorMsg && <div className="error">{errorMsg}</div>}
      <form onSubmit={handleSignin}>
        <div>
          <label>Email</label>
          <input 
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div>
          <label>Password</label>
          <input 
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit">Sign In</button>
      </form>

      <div className="form-links">
        {/* Forgot password link */}
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/signup">Don’t have an account? Sign Up</Link>
      </div>
    </div>
  );
}
