import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordOTP, otpLogin } from '../api';

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

export default function ForgotPassword({ setIsAuthenticated }) {
  const navigate = useNavigate();

  // step = 1 -> user enters email.
  // step = 2 -> user enters OTP.
  const [step, setStep] = useState(1);

  // For step 1:
  const [email, setEmail] = useState('');
  // For step 2 (OTP), using a string instead of an array.
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Step 1: Send OTP.
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      return setErrorMsg('Please enter your email.');
    }

    try {
      const result = await requestPasswordOTP(email);
      if (result.message && result.message.toLowerCase().includes('one-time code sent')) {
        setSuccessMsg(result.message);
        // Switch to OTP step after a short delay.
        setTimeout(() => {
          setStep(2);
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(result.message || 'Failed to send code.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server.');
    }
  };

  // Step 2: Verify OTP.
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp || otp.length < 6) {
      return setErrorMsg('Please enter the 6-digit code.');
    }

    try {
      const result = await otpLogin(email, otp);
      if (result.message && result.message.toLowerCase().includes('otp login successful')) {
        localStorage.setItem('bacshotsUser', JSON.stringify(result.user));
        setIsAuthenticated(true);
        navigate('/change-password');
      } else {
        setErrorMsg(result.message || 'OTP Login failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server.');
    }
  };

  return (
    <div className="card">
      {step === 1 && (
        <>
          <h2>Forgot Password</h2>
          <p className="subheader">
            Enter your verified email to receive a one-time login code.
          </p>
          {errorMsg && <div className="error">{errorMsg}</div>}
          {successMsg && <div className="success">{successMsg}</div>}

          <form onSubmit={handleSendOTP}>
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
            <button type="submit">Send OTP Code</button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Enter Verification Code</h2>
          <p className="subheader">
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
          </p>
          {errorMsg && <div className="error">{errorMsg}</div>}
          {successMsg && <div className="success">{successMsg}</div>}

          <form onSubmit={handleVerifyOTP}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <CodeInput value={otp} onChange={setOtp} />
            </div>
            <button type="submit" style={{ marginTop: '1rem' }}>
              Verify Code
            </button>
          </form>
        </>
      )}
    </div>
  );
}
