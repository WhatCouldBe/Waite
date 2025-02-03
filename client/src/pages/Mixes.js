// client/src/pages/Mixes.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mixes.css';
import Navbar from '../components/Navbar';
import UserInfoModal from '../components/UserInfoModal';
import { getDrinks } from '../api';

export default function Mixes() {
  const navigate = useNavigate();
  const [drinkOptions, setDrinkOptions] = useState([]);
  const [rows, setRows] = useState([{ drink: '', percentage: '' }]);
  const [results, setResults] = useState([]);
  const [userInfoModalOpen, setUserInfoModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch available drinks from API
  useEffect(() => {
    async function fetchDrinks() {
      const data = await getDrinks();
      if (data && data.success && data.drinks) {
        setDrinkOptions(data.drinks);
      } else {
        setDrinkOptions([]);
      }
    }
    fetchDrinks();
  }, []);

  // Load user from localStorage.
  useEffect(() => {
    const storedUser = localStorage.getItem('bacshotsUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Prompt for missing user info.
  useEffect(() => {
    if (user && (!user.weight || !user.sex)) {
      setUserInfoModalOpen(true);
    }
  }, [user]);

  // Calculation example:
  // allowedAlcoholGrams = user.weight * 0.1
  // alcoholML = allowedAlcoholGrams / 0.79
  // For each row: portionML = alcoholML * (percentage/100)
  // numberOfDrinks = portionML / selected drink volume
  const calculateMixes = () => {
    if (!user || !user.weight) return;
    const allowedAlcoholGrams = user.weight * 0.1;
    const alcoholML = allowedAlcoholGrams / 0.79;
    const newResults = rows.map(row => {
      const selected = drinkOptions.find(d => d.name === row.drink);
      if (!selected || !row.percentage) return null;
      const perc = parseFloat(row.percentage);
      if (isNaN(perc)) return null;
      const portionML = alcoholML * (perc / 100);
      const numDrinks = portionML / selected.volume;
      return {
        drink: row.drink,
        percentage: perc,
        alcoholML: portionML.toFixed(2),
        numDrinks: numDrinks.toFixed(2),
        volume: selected.volume
      };
    }).filter(r => r !== null);
    setResults(newResults);
  };

  const addRow = () => {
    setRows([...rows, { drink: '', percentage: '' }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateMixes();
  };

  const handleUserInfoUpdate = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    localStorage.setItem('bacshotsUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setUserInfoModalOpen(false);
  };

  return (
    <div className="mixes-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className="mixes-content">
        <h1>Mixes</h1>
        <p>Design your drink mix below:</p>
        <form onSubmit={handleSubmit}>
          {rows.map((row, index) => (
            <div key={index} className="mix-row">
              <select 
                value={row.drink} 
                onChange={(e) => handleRowChange(index, 'drink', e.target.value)}
                className="mix-dropdown"
              >
                <option value="" disabled>Select a drink</option>
                {drinkOptions.map((drink) => (
                  <option key={drink._id} value={drink.name}>{drink.name}</option>
                ))}
              </select>
              <input 
                type="number" 
                placeholder="Percentage"
                value={row.percentage} 
                onChange={(e) => handleRowChange(index, 'percentage', e.target.value)}
                className="mix-percentage"
                min="0"
                max="100"
              />
              <div className="row-buttons">
                {index === rows.length - 1 && (
                  <button type="button" className="add-btn" onClick={addRow}>+</button>
                )}
                {rows.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeRow(index)}>-</button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" className="calculate-btn">Calculate Mix</button>
        </form>
        {results.length > 0 && (
          <div className="mix-results">
            <h2>Mix Results</h2>
            {results.map((res, idx) => (
              <div key={idx} className="mix-result">
                <p><strong>{res.drink}</strong> ({res.percentage}%):</p>
                <p>Alcohol in ml: {res.alcoholML} ml</p>
                <p>Equivalent to: {res.numDrinks} drinks (based on a {res.volume} ml serving)</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {userInfoModalOpen && <UserInfoModal onClose={handleUserInfoUpdate} />}
    </div>
  );
}
