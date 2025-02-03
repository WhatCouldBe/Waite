import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './DrinkDiagram.css';
import Navbar from '../components/Navbar';
import UserInfoModal from '../components/UserInfoModal';
import { getDrinks } from '../api';

function RingDiagram({ percentage }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width="150" height="150" className="ring-diagram">
      <circle
        className="ring-background"
        stroke="#eee"
        strokeWidth="12"
        fill="transparent"
        r={radius}
        cx="75"
        cy="75"
      />
      <circle
        className="ring-progress"
        stroke="#3f51b5"
        strokeWidth="12"
        fill="transparent"
        r={radius}
        cx="75"
        cy="75"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text x="75" y="80" textAnchor="middle" fontSize="20" fill="#333">
        {percentage}%
      </text>
    </svg>
  );
}

export default function DrinkDiagram() {
  const [searchParams] = useSearchParams();
  const drinksParam = searchParams.get('drinks');
  let selectedDrinks = [];
  try {
    selectedDrinks = drinksParam ? JSON.parse(decodeURIComponent(drinksParam)) : [];
  } catch (e) {
    selectedDrinks = [];
  }
  const navigate = useNavigate();
  const [userInfoModalOpen, setUserInfoModalOpen] = useState(false);
  const [allowedDetails, setAllowedDetails] = useState({});
  const [drinkData, setDrinkData] = useState([]);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanationClosing, setExplanationClosing] = useState(false);
  const [useDragContainer, setUseDragContainer] = useState(false);

  // Ref for drag scroll (always enabled if more than one card)
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragThreshold = 5;

  // Retrieve user from localStorage
  const storedUser = localStorage.getItem('bacshotsUser');
  let user = storedUser ? JSON.parse(storedUser) : null;

  // Fetch drink details from backend
  useEffect(() => {
    async function fetchDrinks() {
      const data = await getDrinks();
      if (data && data.success && Array.isArray(data.drinks)) {
        setDrinkData(data.drinks);
      } else {
        setDrinkData([]);
      }
    }
    fetchDrinks();
  }, []);

  // Decide whether to use a drag container if more than one card
  useEffect(() => {
    setUseDragContainer(selectedDrinks.length > 1);
  }, [selectedDrinks]);

  // Update allowed details when user's weight/sex or drinkData/selectedDrinks change.
  useEffect(() => {
    // To avoid infinite loops, we use only user.weight, user.sex and JSON stringified versions of the arrays.
    if (!user || !user.weight || !user.sex) {
      setUserInfoModalOpen(true);
    } else {
      calculateAllowed();
    }
  }, [user?.weight, user?.sex, JSON.stringify(selectedDrinks), JSON.stringify(drinkData)]);

  const calculateAllowed = () => {
    // Dummy formula:
    // Maximum allowed alcohol (in grams) = user.weight * 0.1
    // Alcohol in ml = allowedAlcoholGrams / 0.79
    const weightFactor = user.weight / 150;
    const sexFactor = user.sex === 'male' ? 1 : 0.8;
    const allowedAlcoholGrams = user.weight * 0.1;
    const alcoholML = allowedAlcoholGrams / 0.79;
    const newAllowed = {};
    selectedDrinks.forEach((drinkName) => {
      // Look up drink details from drinkData using name
      const drinkObj = drinkData.find(d => d.name === drinkName);
      let drinkAbv, volume;
      if (drinkObj) {
        drinkAbv = drinkObj.abv;
        volume = drinkObj.volume;
      } else {
        drinkAbv = 5;
        volume = 355;
      }
      const allowedPercentage = Math.min(100, Math.round((weightFactor * sexFactor * 50) / drinkAbv));
      const numberOfDrinks = alcoholML / volume;
      newAllowed[drinkName] = {
        percentage: allowedPercentage,
        allowedAlcoholGrams: allowedAlcoholGrams.toFixed(2),
        alcoholML: alcoholML.toFixed(2),
        numberOfDrinks: numberOfDrinks.toFixed(2),
        volume
      };
    });
    setAllowedDetails(newAllowed);
  };

  const handleUserInfoUpdate = (newUserData) => {
    user = { ...user, ...newUserData };
    localStorage.setItem('bacshotsUser', JSON.stringify(user));
    setUserInfoModalOpen(false);
    calculateAllowed();
  };

  // Drag scroll functionality for the cards container (if using drag container)
  useEffect(() => {
    if (!useDragContainer) return;
    const container = containerRef.current;
    if (!container) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const mouseDownHandler = (e) => {
      isDown = true;
      isDraggingRef.current = false;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const mouseLeaveHandler = () => {
      isDown = false;
    };

    const mouseUpHandler = () => {
      isDown = false;
    };

    const mouseMoveHandler = (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > dragThreshold) {
        isDraggingRef.current = true;
      }
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown', mouseDownHandler);
    container.addEventListener('mouseleave', mouseLeaveHandler);
    container.addEventListener('mouseup', mouseUpHandler);
    container.addEventListener('mousemove', mouseMoveHandler);

    return () => {
      container.removeEventListener('mousedown', mouseDownHandler);
      container.removeEventListener('mouseleave', mouseLeaveHandler);
      container.removeEventListener('mouseup', mouseUpHandler);
      container.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, [useDragContainer]);

  // Card click handler: only trigger if not dragging.
  const handleCardClick = () => {
    if (!isDraggingRef.current) {
      setExplanationOpen(true);
    }
    isDraggingRef.current = false;
  };

  // Handle closing the explanation popup with reverse animation.
  const closeExplanation = () => {
    setExplanationClosing(true);
    setTimeout(() => {
      setExplanationOpen(false);
      setExplanationClosing(false);
    }, 300);
  };

  return (
    <div className="drink-diagram-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className="drink-diagram-content">
        <h1>Tonight, you're drinking:</h1>
        <div
          ref={useDragContainer ? containerRef : null}
          className={useDragContainer ? "cards-container" : "cards-container static"}
        >
          {selectedDrinks.length === 0 ? (
            <p>No drink selected.</p>
          ) : (
            selectedDrinks.map((drink, idx) => {
              const details = allowedDetails[drink] || { percentage: 0, allowedAlcoholGrams: "0", alcoholML: "0", numberOfDrinks: "0", volume: 0 };
              return (
                <div key={idx} className="drink-entry" onClick={handleCardClick}>
                  <h2 className="drink-name">{drink}</h2>
                  <RingDiagram percentage={details.percentage} />
                  <div className="drink-info">
                    <p><strong>Allowed Percentage:</strong> {details.percentage}%</p>
                    <p>
                      <strong>Allowed Alcohol:</strong> {details.allowedAlcoholGrams} grams, which is {details.alcoholML} ml<br />
                      (Alcohol in ml = grams / 0.79)
                    </p>
                    <p>
                      <strong>Equivalent Drinks:</strong> {details.numberOfDrinks} drinks<br />
                      (Calculated as: alcohol ml / {details.volume} ml)
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <button className="back-btn" onClick={() => navigate('/im-drinking')}>
          Back
        </button>
      </div>
      {explanationOpen && (
        <div className={`explanation-modal-overlay ${explanationClosing ? 'closing' : ''}`} onClick={closeExplanation}>
          <div className="explanation-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Understanding Allowed Percentage</h2>
            <p>
              <strong>Allowed Percentage</strong> is a simplified metric that shows how much of your maximum allowable alcohol intake (based on your weight and sex) is allocated for this drink given its strength (ABV). A lower percentage means that a stronger drink uses more of your alcohol limit.
            </p>
            <p>Additionally:</p>
            <div>
              <p><strong>Alcohol in ml</strong> = (Allowed alcohol in grams) / 0.79</p>
              <p><strong>Equivalent Drinks</strong> = (Alcohol in ml) / (Volume of the drink in ml)</p>
            </div>
          </div>
        </div>
      )}
      {userInfoModalOpen && <UserInfoModal onClose={handleUserInfoUpdate} />}
    </div>
  );
}
