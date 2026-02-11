import React from 'react'
import { Link } from 'react-router-dom'

export const Header = () => {
  return (
    <div>
      header
      <nav style={{ padding: '1rem', backgroundColor: '#333', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: 'white', marginRight: '1rem' }}>Home</Link>
        <Link to="/about" style={{ color: 'white', marginRight: '1rem' }}>About</Link>
        <Link to="/contact" style={{ color: 'white', marginRight: '1rem' }}>Contacts</Link>
        <Link to="/login" style={{ color: 'white', marginRight: '1rem' }}>Login</Link>
        <Link to="/signup" style={{ color: 'white', marginRight: '1rem' }}>Signup</Link>
      </nav>

    </div>
  )
}