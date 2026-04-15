import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch: _onSearch }) => {
  void _onSearch;
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        📚 RwandaLib <span>Academic Library</span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {token && <Link to="/upload" className="nav-link">My Uploads</Link>}
        {user?.role === 'ADMIN' && <Link to="/admin" className="nav-link">Admin</Link>}
        
        <button 
          onClick={themeContext?.toggleTheme} 
          className="nav-link"
          title="Toggle Dark Mode"
          style={{ fontSize: '18px', padding: '4px 8px' }}
        >
          {themeContext?.theme === 'light' ? '🌙' : '☀️'}
        </button>

        <Link to="/upload">
          <button className="upload-btn">+ Upload</button>
        </Link>

        {token ? (
          <button onClick={handleLogout} className="nav-btn">Logout</button>
        ) : (
          <Link to="/login">
            <button className="nav-btn">Log in / Register</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
