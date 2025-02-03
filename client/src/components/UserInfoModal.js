// client/src/components/UserInfoModal.js
import React, { useState } from 'react';
import './UserInfoModal.css';

export default function UserInfoModal({ onClose }) {
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || !sex) return;
    onClose({ weight: Number(weight), sex });
  };

  return (
    <div className="user-info-modal-overlay">
      <div className="user-info-modal-content">
        <h2>Please complete your profile</h2>
        <p>We need your weight and sex to calculate your drink limits.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Weight (lbs):</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Sex:</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)} required>
              <option value="" disabled>Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <button type="submit" className="modal-submit-btn">Save</button>
        </form>
      </div>
    </div>
  );
}
