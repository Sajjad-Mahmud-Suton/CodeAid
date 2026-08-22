import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

function App() {
  const [user, setUser] = useState<{username: string, token: string} | null>(null);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <h2>CodeAid</h2>
        <div className="header-user">
          <span>Logged in as <strong>{user.username}</strong></span>
          <button className="btn-outline" onClick={() => setUser(null)}>Logout</button>
        </div>
      </header>
      <Dashboard token={user.token} username={user.username} />
    </div>
  );
}

export default App;
