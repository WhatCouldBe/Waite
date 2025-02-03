// client/src/pages/Signup.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';

export default function Signup({ setUserSignupData, setGlobalError }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [terms, setTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const passwordMeetsRules = (pwd) => {
    // Example: at least 8 chars, 1 uppercase, 1 digit
    const lengthOk = pwd.length >= 8;
    const upperOk = /[A-Z]/.test(pwd);
    const digitOk = /\d/.test(pwd);
    return lengthOk && upperOk && digitOk;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setGlobalError(null);

    if (!passwordMeetsRules(password)) {
      return setErrorMsg('Password must be at least 8 characters, include an uppercase letter and a digit.');
    }
    if (password !== confirmPass) {
      return setErrorMsg('Passwords do not match.');
    }
    if (!terms) {
      return setErrorMsg('You must agree to the terms and conditions.');
    }

    try {
      const result = await signup({ name, email, password });
      if (result.message && result.message.toLowerCase().includes('successful')) {
        // Save user info for verify step
        setUserSignupData({ email });
        navigate('/verify');
      } else {
        setErrorMsg(result.message || 'Signup failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server. Please try again later.');
    }
  };

  return (
    <div className="card">
      <h2>Create Your Account</h2>
      {errorMsg && <div className="error">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input 
            type="text" 
            placeholder="Your Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
        </div>

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          {/* Added a bit of top margin to move text further from the input */}
          <div className="password-rules" style={{ marginTop: '0.5rem' }}>
            At least 8 characters, 1 uppercase, 1 digit
          </div>
        </div>

        <div>
          <label>Confirm Password</label>
          <input 
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required 
          />
        </div>

        <div className="terms-container">
          <input
            type="checkbox"
            id="terms"
            checked={terms}
            onChange={() => setTerms(!terms)}
          />
          <label htmlFor="terms">I agree to the Terms & Conditions</label>
        </div>

        <button type="submit">Sign Up</button>
      </form>

      <div className="form-links">
        <Link to="/signin">Already have an account? Sign In</Link>
      </div>
    </div>
  );
}
