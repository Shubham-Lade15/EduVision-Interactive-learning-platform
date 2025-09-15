import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, handleLogout }) {
    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#333', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Home</Link>
                <Link to="/courses" style={{ color: 'white', textDecoration: 'none' }}>Courses</Link>
            </div>
            <div>
                {user ? (
                    <>
                        <span style={{ marginRight: '10px' }}>Welcome, {user.username} ({user.role})</span>
                        <button onClick={handleLogout} style={{ backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px' }}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ color: 'white', textDecoration: 'none', marginRight: '10px' }}>Login</Link>
                        <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;