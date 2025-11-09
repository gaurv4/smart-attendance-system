import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './Login';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchRecords();
    }
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/attendance/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const present = data.filter(r => r.status === 'present').length;
    const absent = total - present;
    setStats({ total, present, absent });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    fetchRecords();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setRecords([]);
    setStats({ total: 0, present: 0, absent: 0 });
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <h1>Supervisor Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      <div className="stats">
        <p>Total Records: {stats.total}</p>
        <p>Present: {stats.present}</p>
        <p>Absent: {stats.absent}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Method</th>
            <th>Timestamp</th>
            <th>Status</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record._id}>
              <td>{record.userId.name} ({record.userId.email})</td>
              <td>{record.method}</td>
              <td>{new Date(record.timestamp).toLocaleString()}</td>
              <td>{record.status}</td>
              <td>{record.location || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
