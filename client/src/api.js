async function fetchWithTimeout(url, options = {}) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    console.error("Fetch failed for URL:", url, err);
    return null;
  }
}

export async function signup(data) {
  try {
    const res = await fetchWithTimeout('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res) return { success: false };
    return res.json();  
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function signin(email, password) {
  try {
    const res = await fetchWithTimeout('/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function verifyEmail(email, code) {
  try {
    const res = await fetchWithTimeout('/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function resend(email) {
  try {
    const res = await fetchWithTimeout('/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function requestPasswordOTP(email) {
  try {
    const res = await fetchWithTimeout('/auth/request-password-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function otpLogin(email, code) {
  try {
    const res = await fetchWithTimeout('/auth/otp-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function changePassword(newPassword) {
  try {
    const res = await fetchWithTimeout('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function getDrinkingLogs(userId, year, month) {
  try {
    const res = await fetchWithTimeout(`/drinkingLogs/${year}/${month}?userId=${userId}`, {
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function updateDrinkingLog(userId, date, status) {
  try {
    const res = await fetchWithTimeout('/drinkingLogs/day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, date, status })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function getUserAchievements(userId) {
  try {
    const res = await fetchWithTimeout(`/achievements?userId=${userId}`, {
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function getAllUserLogs(userId) {
  try {
    const res = await fetchWithTimeout(`/drinkingLogs/all?userId=${userId}`, {
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function updateUserSettings(userId, settings) {
  try {
    const res = await fetchWithTimeout('/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, ...settings })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function createLeaderboard({ name, userId }) {
  try {
    const res = await fetchWithTimeout('/leaderboard/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userId })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function joinLeaderboard({ code, userId }) {
  try {
    const res = await fetchWithTimeout('/leaderboard/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function getUserLeaderboards(userId) {
  try {
    const res = await fetchWithTimeout(`/leaderboard/user/${userId}`, {
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function deleteLeaderboard({ leaderboardId, userId, password }) {
  try {
    const res = await fetchWithTimeout('/leaderboard/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaderboardId, userId, password })
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

// NEW: Fetch drinks from the database using your Drink model
export async function getDrinks() {
  try {
    const res = await fetchWithTimeout('/drinks', {
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

export async function getPlaces(category, lat, lng) {
  try {
    const res = await fetchWithTimeout(`/api/places?category=${category}&lat=${lat}&lng=${lng}`, {
      credentials: 'include'
    });
    if (!res) return { success: false };
    return res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}
