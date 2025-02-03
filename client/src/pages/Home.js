import React, { useEffect, useState, useMemo } from 'react';
import './Home.css';
import {
  getAllUserLogs,
  getUserAchievements,
  updateDrinkingLog
} from '../api';
import Navbar from '../components/Navbar';

function formatLocalDate(date) {
  const d = new Date(date.getTime());
  d.setHours(12, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Count how many "sober" or "medium" days in the last 7 days.
function computeWeeklySoberDays(allLogs) {
  const now = new Date();
  const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  let count = 0;
  allLogs.forEach((log) => {
    const d = new Date(log.date);
    d.setHours(12, 0, 0, 0);
    if (d >= start && d <= now && (log.status === 'sober' || log.status === 'medium')) {
      count++;
    }
  });
  return count;
}

// Helper: Count how many months (in the last 12) had no "heavy" logs.
function computeMonthsNoCrash(allLogs) {
  const map = {};
  const now = new Date();
  const last12 = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate(), 0);
  allLogs.forEach((log) => {
    const d = new Date(log.date);
    d.setHours(12, 0, 0, 0);
    if (d >= last12 && d <= now) {
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[ym]) map[ym] = false;
      if (log.status === 'heavy') {
        map[ym] = true;
      }
    }
  });
  let count = 0;
  Object.values(map).forEach((val) => {
    if (val === false) count++;
  });
  return count;
}

/**
 * Reusable Modal component for smooth transitions.
 * When the overlay is clicked, it triggers a fade-out/scale-out animation,
 * then calls onClose() after 300ms.
 */
function Modal({ children, onClose }) {
  const [closing, setClosing] = useState(false);
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  return (
    <div className={`modal-overlay ${closing ? 'fade-out' : 'fade-in'}`} onClick={handleClose}>
      <div className={`modal-content large-modal ${closing ? 'scale-out' : 'scale-in'}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const cachedLogs = localStorage.getItem('cachedLogs');
  const cachedAch = localStorage.getItem('cachedAchievements');
  const storedUserStr = localStorage.getItem('bacshotsUser');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;
  
  const initials = user && user.name 
    ? user.name.split(' ').reduce((acc, cur, idx, arr) => {
        if (idx === 0 || idx === arr.length - 1) return acc + cur[0];
        return acc;
      }, '').toUpperCase()
    : 'N';
  const profileUrl = user?.profilePicture;
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  const [allLogs, setAllLogs] = useState(cachedLogs ? JSON.parse(cachedLogs) : []);
  const [achievements, setAchievements] = useState(cachedAch ? JSON.parse(cachedAch) : []);
  const nowDate = new Date();
  const [currentYear, setCurrentYear] = useState(nowDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(nowDate.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  // Fetch logs and achievements only once on mount
  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const resLogs = await getAllUserLogs(user._id);
        if (resLogs && resLogs.success) {
          setAllLogs(resLogs.logs);
          localStorage.setItem('cachedLogs', JSON.stringify(resLogs.logs));
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
      try {
        const resAch = await getUserAchievements(user._id);
        if (resAch && resAch.success) {
          setAchievements(resAch.achievements || []);
          localStorage.setItem('cachedAchievements', JSON.stringify(resAch.achievements || []));
        }
      } catch (err) {
        console.error("Error fetching achievements:", err);
      }
    })();
  }, []); // empty dependency array

  // Filter logs for the current month.
  const monthLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const d = new Date(log.date);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    });
  }, [allLogs, currentYear, currentMonth]);

  // Build logsMap using normalized local date strings.
  const logsMap = useMemo(() => {
    const map = {};
    monthLogs.forEach((log) => {
      const d = new Date(log.date);
      d.setHours(12, 0, 0, 0);
      const key = formatLocalDate(d);
      map[key] = log.status;
    });
    return map;
  }, [monthLogs]);

  // getDayClass uses the normalized date string.
  const getDayClass = (dateObj) => {
    if (!dateObj) return 'day-cell day-outside';
    const d = new Date(dateObj);
    d.setHours(12, 0, 0, 0);
    const key = formatLocalDate(d);
    let statusClass = '';
    if (logsMap[key] === 'sober') statusClass = 'day-sober';
    if (logsMap[key] === 'medium') statusClass = 'day-medium';
    if (logsMap[key] === 'heavy') statusClass = 'day-heavy';
    
    // Disable future dates by adding a disabled class.
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (d > today) {
      return 'day-cell day-future';
    }
    
    if (selectedDate) {
      const sel = new Date(selectedDate);
      sel.setHours(12, 0, 0, 0);
      if (formatLocalDate(sel) === key) {
        return `day-cell ${statusClass} day-selected`;
      }
    }
    return `day-cell ${statusClass}`;
  };

  const weeklySoberDays = useMemo(() => computeWeeklySoberDays(allLogs), [allLogs]);
  const monthsCrashoutFree = useMemo(() => computeMonthsNoCrash(allLogs), [allLogs]);

  const totalAchievements = 9;
  const unlockedCount = achievements.reduce((acc, a) => (a.unlocked ? acc + 1 : acc), 0);
  const fraction = Math.min(unlockedCount / totalAchievements, 1);

  // Build an array of dates for the current month.
  const getDaysArray = (year, month) => {
    const firstDow = new Date(year, month - 1, 1, 12).getDay();
    const lastDay = new Date(year, month, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDow; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= lastDay; d++) {
      arr.push(new Date(year, month - 1, d, 12));
    }
    return arr;
  };
  const daysArray = getDaysArray(currentYear, currentMonth);

  const handleDayClick = (dateObj) => {
    if (!dateObj) return;
    // Normalize the clicked date to noon for comparison.
    const clicked = new Date(dateObj);
    clicked.setHours(12, 0, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    // Do not allow selecting future dates.
    if (clicked > today) return;
    
    // If the same day is clicked...
    if (selectedDate && formatLocalDate(selectedDate) === formatLocalDate(clicked)) {
      // For current date, always allow update (keep panel open)
      if (clicked.getTime() === today.getTime()) {
        setSelectedDate(clicked);
        setIsDayPanelOpen(true);
      } else {
        setIsDayPanelOpen(false);
        setTimeout(() => setSelectedDate(null), 300);
      }
    } else {
      setSelectedDate(clicked);
      setIsDayPanelOpen(true);
    }
  };

  // When updating a day's status, normalize the date before storing.
  const handleUpdateStatus = async (status) => {
    if (!selectedDate || !user?._id) return;
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(12, 0, 0, 0);
    const key = formatLocalDate(normalizedDate);
    try {
      const res = await updateDrinkingLog(user._id, key, status);
      if (res && res.success) {
        setAllLogs((prev) => {
          const idx = prev.findIndex((lg) => {
            const dd = new Date(lg.date);
            dd.setHours(12, 0, 0, 0);
            return formatLocalDate(dd) === key;
          });
          if (idx >= 0) {
            const newArr = [...prev];
            newArr[idx].status = status;
            return newArr;
          } else {
            return [
              ...prev,
              { user: user._id, date: normalizedDate, status }
            ];
          }
        });
        const resAch = await getUserAchievements(user._id);
        if (resAch && resAch.success) {
          setAchievements(resAch.achievements || []);
          localStorage.setItem('cachedAchievements', JSON.stringify(resAch.achievements || []));
        }
      }
    } catch (err) {
      console.error("Error updating day log:", err);
    }
  };

  const handlePrevMonth = () => {
    let mo = currentMonth - 1;
    let yr = currentYear;
    if (mo < 1) {
      mo = 12;
      yr--;
    }
    setCurrentMonth(mo);
    setCurrentYear(yr);
    setIsDayPanelOpen(false);
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    const realY = nowDate.getFullYear();
    const realM = nowDate.getMonth() + 1;
    let mo = currentMonth + 1;
    let yr = currentYear;
    if (mo > 12) {
      mo = 1;
      yr++;
    }
    if (yr > realY || (yr === realY && mo > realM)) return;
    setCurrentMonth(mo);
    setCurrentYear(yr);
    setIsDayPanelOpen(false);
    setSelectedDate(null);
  };

  const isCurrentMonth = () => {
    const realY = nowDate.getFullYear();
    const realM = nowDate.getMonth() + 1;
    return currentYear === realY && currentMonth === realM;
  };

  return (
    <div className="home-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className="home-main">
        <div className="big-profile-container">
          {profileUrl ? (
            <img src={profileUrl} alt="Profile" />
          ) : (
            <div className="big-profile-initials">{initials || 'N'}</div>
          )}
        </div>
        <div className="greeting dm-sans-semibold">Hello {firstName}!</div>
        <div className="stats-container">
          <div className="stats-box dm-sans-semibold" onClick={() => setWeeklyModalOpen(true)}>
            <p>Your Weekly <br/> Stats</p>
            <p className="stats-subtext">{weeklySoberDays} days sober this week</p>
          </div>
          <div className="stats-box dm-sans-semibold" onClick={() => setMonthlyModalOpen(true)}>
            <p>Your Monthly Stats</p>
            <p className="stats-subtext">{monthsCrashoutFree} crashout‑free months</p>
          </div>
          <div className="stats-box dm-sans-semibold achievements-box" onClick={() => setAchievementsModalOpen(true)}>
            <div className="achievements-ring">
              <svg className="progress-ring" width="120" height="120">
                <circle stroke="#ccc" strokeWidth="10" fill="transparent" r={50} cx="60" cy="60" />
                <circle
                  stroke="#4caf50"
                  strokeWidth="10"
                  fill="transparent"
                  r={50}
                  cx="60"
                  cy="60"
                  strokeDasharray={`${2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                  strokeDashoffset={2 * Math.PI * 50 - fraction * (2 * Math.PI * 50)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text x="60" y="66" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">
                  {unlockedCount}/{totalAchievements}
                </text>
              </svg>
            </div>
            <p>Achievements</p>
          </div>
        </div>
        <div className="calendar-wrapper">
          <div className="calendar-header">
            <button className="cal-nav-btn" onClick={handlePrevMonth}>‹</button>
            <div className="calendar-month-year dm-sans-semibold">
              {currentMonth}/{currentYear}
            </div>
            {!isCurrentMonth() && (
              <button className="cal-nav-btn" onClick={handleNextMonth}>›</button>
            )}
          </div>
          <div className="calendar-grid day-labels">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="day-label">{d}</div>
            ))}
          </div>
          <div className="calendar-grid day-cells">
            {daysArray.map((dt, i) => (
              <div key={i} className={getDayClass(dt)} onClick={() => handleDayClick(dt)}>
                {dt ? dt.getDate() : ''}
              </div>
            ))}
          </div>
        </div>
        <div className={`day-status-panel ${selectedDate && isDayPanelOpen ? 'open' : selectedDate ? 'opening' : 'closing'}`}>
          {selectedDate && (
            <div className="day-status-buttons">
              <button className="btn-sober" onClick={() => handleUpdateStatus('sober')}>I did not drink</button>
              <button className="btn-medium" onClick={() => handleUpdateStatus('medium')}>I drank a bit</button>
              <button className="btn-heavy" onClick={() => handleUpdateStatus('heavy')}>I crashed out</button>
            </div>
          )}
        </div>
      </div>
      {weeklyModalOpen && (
        <Modal onClose={() => setWeeklyModalOpen(false)}>
          <h2 className="dm-sans-semibold">Weekly Stats</h2>
          <p>You have been sober {weeklySoberDays} days this week!</p>
          <p>Additional charts can be shown here.</p>
        </Modal>
      )}
      {monthlyModalOpen && (
        <Modal onClose={() => setMonthlyModalOpen(false)}>
          <h2 className="dm-sans-semibold">Monthly Stats</h2>
          <p>You have {monthsCrashoutFree} crashout‑free months in the last 12 months.</p>
          <p>Additional monthly details can be shown here.</p>
        </Modal>
      )}
      {achievementsModalOpen && (
        <Modal onClose={() => setAchievementsModalOpen(false)}>
          <h2 className="dm-sans-semibold">Achievements</h2>
          <p>
            Below are your achievements. A <span className="achievement-status unlocked">✓</span> indicates you’ve accomplished it, while a <span className="achievement-status locked">✕</span> indicates you haven’t.
          </p>
          <ul className="achievement-list">
            {achievements.map((ach) => (
              <li key={ach.key} className="achievement-item">
                <div>
                  <strong>{ach.name}</strong> – {ach.description}
                </div>
                <div className={`achievement-status ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                  {ach.unlocked ? '✓' : '✕'}
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
