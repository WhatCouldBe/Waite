import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';
import Navbar from '../components/Navbar';
import { createLeaderboard, joinLeaderboard, getUserLeaderboards, deleteLeaderboard } from '../api';
import AchievementRing from '../components/AchievementRing';

function CodeInput({ value, onChange }) {
  const inputsRef = useRef([]);
  const length = 5;
  
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
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').toUpperCase();
    let newVal = pasteData.split('').slice(0, length);
    while (newVal.length < length) {
      newVal.push('');
    }
    const newCode = newVal.join('');
    onChange(newCode);
    if (inputsRef.current[length - 1]) {
      inputsRef.current[length - 1].focus();
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

// Helper to get rank color.
function getRankColor(rank) {
  if (rank === 1) return '#FFD700'; // Gold
  if (rank === 2) return '#C0C0C0'; // Silver
  if (rank === 3) return '#CD7F32'; // Bronze
  return '#000'; // Black
}

// Modal component for detailed leaderboard rankings.
function LeaderboardDetailModal({ leaderboard, onClose, currentUser }) {
  const [closing, setClosing] = useState(false);
  const [rankingCriterion, setRankingCriterion] = useState('achievements'); // 'achievements' or 'daysSober'
  const [showDeleteInput, setShowDeleteInput] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  const sortedScores = () => {
    if (!leaderboard || !leaderboard.scores) return [];
    const scores = [...leaderboard.scores];
    if (rankingCriterion === 'achievements') {
      scores.sort((a, b) => b.achievements - a.achievements);
    } else if (rankingCriterion === 'daysSober') {
      scores.sort((a, b) => b.daysSober - a.daysSober);
    }
    return scores;
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const handleDelete = async () => {
    const result = await deleteLeaderboard({ leaderboardId: leaderboard._id, userId: currentUser._id, password });
    if (result.success) {
      setDeleteMessage('Leaderboard deleted successfully.');
      setTimeout(() => onClose(), 300);
    } else {
      setDeleteMessage(result.error || 'Error deleting leaderboard.');
    }
  };

  return (
    <div className={`modal-overlay ${closing ? 'fade-out' : 'fade-in'}`} onClick={handleClose}>
      <div className={`modal-content large-modal ${closing ? 'scale-out' : 'scale-in'}`} onClick={(e) => e.stopPropagation()}>
        <h2>{leaderboard.name}</h2>
        <p className="leaderboard-code">Code: {leaderboard.code}</p>
        <div className="ranking-selector">
          <label>Rank by:</label>
          <select value={rankingCriterion} onChange={(e) => setRankingCriterion(e.target.value)}>
            <option value="achievements">Achievements</option>
            <option value="daysSober">Days Sober</option>
          </select>
        </div>
        <div className="score-list">
          {sortedScores().map((score, index) => (
            <div key={index} className="score-item">
              <span className="score-rank" style={{ color: getRankColor(index + 1) }}>{index + 1}.</span>
              <span className="score-name">{score.user && score.user.name ? score.user.name : 'User'}</span>
              <span className="score-value">
                {rankingCriterion === 'achievements' ? (
                  <AchievementRing unlockedCount={score.achievements} size={40} strokeWidth={3} />
                ) : (
                  <span>{score.daysSober} days sober</span>
                )}
              </span>
            </div>
          ))}
        </div>
        {/* Delete section placed 20px below the score list */}
        {currentUser && leaderboard.createdBy && (currentUser._id === leaderboard.createdBy._id) && (
          <div className="delete-section">
            {showDeleteInput ? (
              <div className="delete-popout">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="delete-password-input"
                />
                <button className="delete-button" onClick={handleDelete}>Confirm</button>
                {deleteMessage && <p className="delete-message">{deleteMessage}</p>}
              </div>
            ) : (
              <button className="delete-button" onClick={() => setShowDeleteInput(true)}>
                Delete Leaderboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const storedUserStr = localStorage.getItem('bacshotsUser');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'join', 'create'
  const [leaderboards, setLeaderboards] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [message, setMessage] = useState('');
  const [modalLeaderboard, setModalLeaderboard] = useState(null);

  const fetchLeaderboards = async () => {
    if (!user) return;
    try {
      const res = await getUserLeaderboards(user._id);
      if (res.success) {
        setLeaderboards(res.leaderboards);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchLeaderboards();
    }
  }, [activeTab, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName || !user) return;
    const alreadyCreated = leaderboards.some(lb => lb.createdBy && lb.createdBy._id === user._id);
    if (alreadyCreated) {
      setMessage("You have already created a leaderboard.");
      return;
    }
    try {
      const res = await createLeaderboard({ name: createName, userId: user._id });
      if (res.success) {
        setMessage(`Leaderboard created! Code: ${res.leaderboard.code}`);
        fetchLeaderboards();
      } else {
        setMessage('Error creating leaderboard.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error creating leaderboard.');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (joinCode.length !== 5 || !user) return;
    try {
      const res = await joinLeaderboard({ code: joinCode, userId: user._id });
      if (res.success) {
        setMessage(`Joined leaderboard: ${res.leaderboard.name}`);
        fetchLeaderboards();
      } else {
        setMessage(res.error || 'Error joining leaderboard.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error joining leaderboard.');
    }
  };

  return (
    <div className="leaderboard-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        navigate('/signin');
      }} />
      <div className="leaderboard-content">
        <h1>Leaderboards</h1>
        <div className="tab-header">
          <button className={activeTab === 'view' ? 'active' : ''} onClick={() => { setActiveTab('view'); setMessage(''); }}>
            View
          </button>
          <button className={activeTab === 'join' ? 'active' : ''} onClick={() => { setActiveTab('join'); setMessage(''); }}>
            Join
          </button>
          <button className={activeTab === 'create' ? 'active' : ''} onClick={() => { setActiveTab('create'); setMessage(''); }}>
            Create
          </button>
        </div>
        {message && <div className="message">{message}</div>}
        {activeTab === 'view' && (
          <div className="view-section">
            {leaderboards.length === 0 ? (
              <p>No leaderboards found. Create or join one!</p>
            ) : (
              leaderboards.map(lb => (
                <div key={lb._id} className="leaderboard-item" onClick={() => setModalLeaderboard(lb)}>
                  <h3>{lb.name}</h3>
                  <p>Code: {lb.code}</p>
                  <p>Participants: {lb.participants.length}</p>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'join' && (
          <div className="join-section">
            <form onSubmit={handleJoin}>
              <label>Enter Code:</label>
              <CodeInput value={joinCode} onChange={setJoinCode} />
              <button type="submit">Join Leaderboard</button>
            </form>
          </div>
        )}
        {activeTab === 'create' && (
          <div className="create-section">
            <form onSubmit={handleCreate}>
              <label>Leaderboard Name:</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="My Leaderboard"
                required
              />
              <button type="submit" style={{ marginTop: '1rem' }}>Create Leaderboard</button>
            </form>
          </div>
        )}
      </div>
      {modalLeaderboard && (
        <LeaderboardDetailModal 
          leaderboard={modalLeaderboard} 
          onClose={() => setModalLeaderboard(null)}
          currentUser={user}
        />
      )}
    </div>
  );
}
