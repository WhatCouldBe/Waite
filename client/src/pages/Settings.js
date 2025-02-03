import React, { useState } from 'react';
import './Settings.css';
import { updateUserSettings } from '../api';
import Navbar from '../components/Navbar';

export default function Settings() {
  const storedUserStr = localStorage.getItem('bacshotsUser');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  const initials = user && user.name 
    ? user.name.split(' ').reduce((acc, cur, idx, arr) => {
        if (idx === 0 || idx === arr.length - 1) return acc + cur[0];
        return acc;
      }, '').toUpperCase()
    : 'N';

  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [preview, setPreview] = useState(user?.profilePicture || '');
  const [weight, setWeight] = useState(user?.weight || '');
  
  // Height is stored in inches; split into feet and inches.
  const initialFeet = user?.height ? Math.floor(user.height / 12) : '';
  const initialInches = user?.height ? user.height % 12 : '';
  const [feet, setFeet] = useState(initialFeet);
  const [inches, setInches] = useState(initialInches);
  
  // If user.dateOfBirth exists convert it to YYYY-MM-DD format.
  const initialDOB = user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '';
  const [dateOfBirth, setDateOfBirth] = useState(initialDOB);
  
  const [sex, setSex] = useState(user?.sex || '');
  const [message, setMessage] = useState('');

  // Handle file upload.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input on profile area click.
  const handleProfileClick = () => {
    document.getElementById('file-upload').click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert feet/inches to total inches.
    const totalHeight = (parseInt(feet) || 0) * 12 + (parseInt(inches) || 0);
    const res = await updateUserSettings(user._id, { 
      profilePicture, 
      weight, 
      height: totalHeight, 
      dateOfBirth, 
      sex 
    });
    if (res.success) {
      setMessage('Settings updated successfully.');
      const updatedUser = { ...user, profilePicture, weight, height: totalHeight, dateOfBirth, sex };
      localStorage.setItem('bacshotsUser', JSON.stringify(updatedUser));
    } else {
      setMessage('Error updating settings.');
    }
  };

  return (
    <div className="settings-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className="settings-content">
        <h2>Settings</h2>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="profile-picture-section" onClick={handleProfileClick}>
            {preview ? (
              <img src={preview} alt="Profile" className="profile-picture-preview" />
            ) : (
              <div className="profile-placeholder">{initials}</div>
            )}
            <div className="overlay">
              <i className="camera-icon">📷</i>
            </div>
            <input id="file-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
          </div>
          <div className="form-group">
            <label>Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="" disabled>Select Sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label>Weight (lbs)</label>
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              min="10" 
              max="500"
              placeholder="Enter weight in lbs" 
            />
          </div>
          <div className="form-group">
            <label>Height</label>
            <div className="height-input">
              <input 
                type="number" 
                value={feet} 
                onChange={(e) => setFeet(e.target.value)} 
                placeholder="ft"
                min="1"
                max="10"
              />
              <input 
                type="number" 
                value={inches} 
                onChange={(e) => setInches(e.target.value)} 
                placeholder="in" 
                min="0" 
                max="11"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input 
              type="date" 
              value={dateOfBirth} 
              onChange={(e) => setDateOfBirth(e.target.value)} 
            />
          </div>
          <button type="submit" className="update-btn">Update Settings</button>
        </form>
      </div>
    </div>
  );
}
