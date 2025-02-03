import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FunActivitiesLanding.css';
import Navbar from '../components/Navbar';

const options = [
  { value: 'outdoor', label: 'Outdoor Activities' },
  { value: 'indoor', label: 'Indoor Activities' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'entertainment', label: 'Entertainment' },
];

export default function FunActivitiesLanding() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState('');
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    let currentIndex = 0;
    // Cycle through the options every 100ms
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % options.length;
      setSelectedOption(options[currentIndex].label);
    }, 100);

    // Stop after 2 seconds and choose a random option
    setTimeout(() => {
      clearInterval(interval);
      const randomIndex = Math.floor(Math.random() * options.length);
      setSelectedOption(options[randomIndex].label);
      setSpinning(false);
      // After a short delay, navigate to the results page with the selected option
      setTimeout(() => {
        navigate(`/fun-activities/results?category=${options[randomIndex].value}`);
      }, 500);
    }, 2000);
  };

  return (
    <div className="landing-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        navigate('/signin');
      }} />
      <div className="landing-content">
        <h1>What are you interested in?</h1>
        <div className={`slot-machine ${spinning ? 'spinning' : ''}`} onClick={handleSpin}>
          <span className="slot-text">{selectedOption || 'Click to Spin'}</span>
        </div>
      </div>
    </div>
  );
}
