// client/src/pages/ImDrinking.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ImDrinking.css';
import Navbar from '../components/Navbar';
import { getDrinks } from '../api';

export default function ImDrinking() {
  const navigate = useNavigate();
  const [drinks, setDrinks] = useState([]);
  const [selections, setSelections] = useState(['']);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    async function fetchDrinks() {
      try {
        const data = await getDrinks();
        console.log("Fetched drinks:", data);
        if (data && data.success && Array.isArray(data.drinks)) {
          setDrinks(data.drinks);
        } else {
          setDrinks([]);
        }
      } catch (e) {
        console.error("Error fetching drinks:", e);
        setDrinks([]);
      }
    }
    fetchDrinks();
  }, []);

  const handleChange = (index, value) => {
    const newSelections = [...selections];
    newSelections[index] = value;
    setSelections(newSelections);
  };

  const addRow = () => {
    if (selections.length < 5) {
      setSelections([...selections, '']);
    }
  };

  const removeRow = (index) => {
    if (selections.length > 1) {
      setSelections(selections.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedDrinks = selections.filter(s => s.trim() !== '');
    if (selectedDrinks.length === 0) return;
    // Apply fade-out effect before navigation
    setTransitioning(true);
    setTimeout(() => {
      navigate(`/drink-diagram?drinks=${encodeURIComponent(JSON.stringify(selectedDrinks))}`);
    }, 300);
  };

  // Decide whether to apply the "expanded" class based on number of rows.
  // (You can adjust this logic as needed.)
  const containerClass = selections.length > 1 ? "im-drinking-content expanded" : "im-drinking-content";

  return (
    <div className={`im-drinking-container ${transitioning ? 'fade-out' : ''}`}>
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className={containerClass}>
        <h1>I'm drinking</h1>
        <form onSubmit={handleSubmit}>
          {selections.map((sel, index) => (
            <div key={index} className="drink-row">
              <select 
                value={sel} 
                onChange={(e) => handleChange(index, e.target.value)}
                className="drink-dropdown"
              >
                <option value="" disabled>Select a drink</option>
                {drinks.map((drink) => (
                  <option key={drink._id} value={drink.name}>
                    {drink.name}
                  </option>
                ))}
              </select>
              <div className="row-buttons">
                {index === selections.length - 1 && selections.length < 5 && (
                  <button type="button" className="add-btn" onClick={addRow}>+</button>
                )}
                {selections.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeRow(index)}>-</button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" className="submit-btn">Tonight</button>
        </form>
      </div>
    </div>
  );
}
