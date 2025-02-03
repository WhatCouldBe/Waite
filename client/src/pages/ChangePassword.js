import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPass !== confirmPass) {
      return setErrorMsg('Passwords do not match.');
    }
    if (newPass.length < 8) {
      return setErrorMsg('Password must be at least 8 characters.');
    }

    try {
      const result = await changePassword(newPass);
      if (result.message && result.message.toLowerCase().includes('successfully')) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        setErrorMsg(result.message || 'Failed to change password.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to reach server.');
    }
  };

  return (
    <div className="card">
      <h2>Change Your Password</h2>
      {errorMsg && <div className="error">{errorMsg}</div>}
      {successMsg && <div className="success">{successMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />
        </div>
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}
