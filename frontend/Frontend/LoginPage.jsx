import React, { useState } from 'react';
import { loginUser } from './apiClient';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await loginUser(email.trim(), password);
      if (data && data.user) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage('Failed to sign in. Please check your credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4a77e5 0%, #305fb7 50%, #1a3f8b 100%)',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '410px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22)',
          padding: '38px 32px 32px',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        {/* SKF Brand Header */}
        <div style={{ marginBottom: '14px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '900',
              color: '#002b49',
              letterSpacing: '1px',
              fontFamily: 'Arial Black, Arial, sans-serif'
            }}
          >
            SKF
          </h1>
        </div>

        {/* Title Box Badge */}
        <div
          style={{
            display: 'inline-block',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '5px 14px',
            backgroundColor: '#ffffff',
            marginBottom: '16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#1e293b',
              letterSpacing: '0.2px'
            }}
          >
            First Off Inspection Management System
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '22px',
            textAlign: 'left'
          }}
        >
          Sign in to continue
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '12.5px',
              padding: '9px 12px',
              borderRadius: '6px',
              marginBottom: '18px',
              textAlign: 'left',
              lineHeight: '1.4'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@skf.com"
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: '#ffffff',
                color: '#0f172a'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#005a9c')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: '#ffffff',
                color: '#0f172a'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#005a9c')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: '#0a3271',
              color: '#ffffff',
              border: 'none',
              padding: '11px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.75 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#00204d';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#0a3271';
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  );
}
