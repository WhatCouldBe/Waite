import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { verifyEmail, resend } from '../api';

function CodeInput({ value, onChange }) {
  const inputsRef = useRef([]);
  const length = 6;
  
  const handleChange = (e, index) => {
    const char = e.target.value.toUpperCase();
    let newVal = value.split('');
    newVal[index] = char;
    while (newVal.length < length) {
      newVal.push('');
    }
    const newCode = newVal.slice(0, length).join('');
    onChange(newCode);
    if (char && index < length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      let newVal = value.split('');
      if (newVal[index]) {
        newVal[index] = '';
        onChange(newVal.join(''));
      } else if (index > 0) {
        inputsRef.current[index - 1].focus();
        let prevVal = value.split('');
        prevVal[index - 1] = '';
        onChange(prevVal.join(''));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/\s/g, '');
    let pasteChars = pasteData.split('').slice(0, length);
    while (pasteChars.length < length) {
      pasteChars.push('');
    }
    const newCode = pasteChars.join('');
    onChange(newCode);
    const lastIndex = Math.min(pasteChars.length, length) - 1;
    if (inputsRef.current[lastIndex]) {
      inputsRef.current[lastIndex].focus();
    }
  };

  const codeArray = [];
  for (let i = 0; i < length; i++) {
    codeArray.push(value[i] || '');
  }

  return (
    <div className="code-input-container">
      {codeArray.map((char, index) => (
        <input
          key={index}
          type="text"
          maxLength="1"
          value={char}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(el) => (inputsRef.current[index] = el)}
          className="code-input-bubble"
        />
      ))}
    </div>
  );
}

export default function Verify({ userSignupData }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const email = userSignupData.email;
    if (!email) {
      return setErrorMsg('No email to verify. Please sign up first.');
    }

    try {
      const result = await verifyEmail(email, code);
      if (result.message && result.message.includes('successfully')) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          navigate('/signin');
        }, 1500);
      } else {
        setErrorMsg(result.message || 'Verification failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server. Please try again later.');
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = userSignupData.email;
    if (!email) {
      return setErrorMsg('No email to resend. Please sign up first.');
    }

    try {
      const result = await resend(email);
      if (result.message && result.message.toLowerCase().includes('resent')) {
        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.message || 'Resend failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server. Please try again later.');
    }
  };

  return (
    <div className="card">
      <h2>Verify Your Email</h2>
      <p className="subheader">
        We’ve emailed you a 6-digit code. Enter it below to verify your account.
      </p>

      {errorMsg && <div className="error">{errorMsg}</div>}
      {successMsg && <div className="success">{successMsg}</div>}

      <form onSubmit={handleVerify} style={{ marginTop: '1rem' }}>
        <div>
          <CodeInput value={code} onChange={setCode} />
        </div>

        <button type="submit" style={{ marginTop: '1rem' }}>
          Verify
        </button>
      </form>

      <button
        className="btn-secondary"
        onClick={handleResend}
        style={{ marginTop: '0.75rem' }}
      >
        Resend Code
      </button>

      <div
        className="form-links"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '1rem',
        }}
      >
        <Link to="/signin">Sign In</Link>
      </div>
    </div>
  );
}
