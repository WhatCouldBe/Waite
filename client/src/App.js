import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Signin from './pages/Signin';
import Home from './pages/Home';
import FunActivitiesLanding from './pages/FunActivitiesLanding';
import FunActivitiesResults from './pages/FunActivitiesResults';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import SpeechTest from './pages/SpeechTest';
import ProtectedRoute from './ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import ImDrinking from './pages/ImDrinking';
import DrinkDiagram from './pages/DrinkDiagram';
import Mixes from './pages/Mixes';
import BackgroundBlobs from './components/BackgroundBlobs';

export default function App() {
  const [userSignupData, setUserSignupData] = useState({ email: '' });
  const [globalError, setGlobalError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('bacshotsUser'));

  return (
    <BrowserRouter>
      <BackgroundBlobs /> 
      <div className="app">
        <div className="container" style={{ overflow: 'visible' }}>
          {globalError && <div className="error">{globalError}</div>}
          <Routes>
            <Route path="/" element={<Navigate to="/signup" />} />
            <Route path="/signup" element={<Signup setUserSignupData={setUserSignupData} setGlobalError={setGlobalError} />} />
            <Route path="/verify" element={<Verify userSignupData={userSignupData} />} />
            <Route path="/signin" element={<Signin setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/forgot-password" element={<ForgotPassword setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/fun-activities" element={<ProtectedRoute><FunActivitiesLanding /></ProtectedRoute>} />
            <Route path="/fun-activities/results" element={<ProtectedRoute><FunActivitiesResults /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/speech-test" element={<ProtectedRoute><SpeechTest /></ProtectedRoute>} />
            {/* Drinking Section Routes */}
            <Route path="/im-drinking" element={<ProtectedRoute><ImDrinking /></ProtectedRoute>} />
            <Route path="/drink-diagram" element={<ProtectedRoute><DrinkDiagram /></ProtectedRoute>} />
            <Route path="/mixes" element={<ProtectedRoute><Mixes /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}