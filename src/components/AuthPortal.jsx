import React, { useState } from 'react';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, Loader } from 'lucide-react';
import { getTranslation } from '../translations';
import EcoLinkLogo from './EcoLinkLogo';

const AuthPortal = ({ onAuthSuccess, apiBaseUrl, language = 'English', t: propT, isSignedOut = false }) => {
  const t = propT || getTranslation(language);
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'verify'
  const isLogin = mode === 'login';
  const [role, setRole] = useState('food_business'); // 'food_business' (Seller) or 'biomass_company' (Recycler)

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null); // [lng, lat]

  // Password reset fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoCodeAlert, setDemoCodeAlert] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Detect Geolocation
  const detectLocation = () => {
    setLocationLoading(true);
    setErrorMsg('');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates([longitude, latitude]);
        setLocationLoading(false);
        setSuccessMsg('📍 Geolocation captured successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      },
      (err) => {
        console.error(err);
        setCoordinates([72.8777, 19.0760]); // Mumbai default
        setErrorMsg('Failed to detect exact coordinates. Using default location.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanEmail || !password) {
      setErrorMsg('Please provide email address and password.');
      setIsLoading(false);
      return;
    }

    // Strict Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      setIsLoading(false);
      return;
    }

    // Phone Number 10-Digit Validation for Registration
    if (!isLogin) {
      if (!cleanPhone || cleanPhone.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
        setIsLoading(false);
        return;
      }
    }

    const defaultName = role === 'food_business' ? 'Commercial Waste Seller' : 'Bio-Energy Recycler';
    const payload = isLogin
      ? { email: cleanEmail, password }
      : {
        name: cleanName || defaultName,
        email: cleanEmail,
        password,
        role,
        phone: cleanPhone,
        address: address.trim(),
        coordinates: coordinates || [72.8777, 19.0760]
      };

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || (isLogin ? 'Login failed' : 'Registration failed'));
      }

      // Save to local registry backup if registering
      if (!isLogin) {
        const localUsers = JSON.parse(localStorage.getItem('ecolink_local_users') || '[]');
        if (!localUsers.some(u => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
          localUsers.push({ ...data.user, password });
          localStorage.setItem('ecolink_local_users', JSON.stringify(localUsers));
        }
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      console.warn('Authentication API request warning:', err);

      // Handle offline or unreachable backend gracefully
      const isNetworkError = err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch');

      if (isNetworkError) {
        if (!isLogin) {
          // Offline registration logic
          const localUsers = JSON.parse(localStorage.getItem('ecolink_local_users') || '[]');
          const existing = localUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
          if (existing) {
            setErrorMsg('Email already registered. Please sign in with your credentials.');
            setIsLoading(false);
            return;
          }

          const newUser = {
            _id: 'user_' + Math.random().toString(36).substring(2, 9),
            name: cleanName || defaultName,
            email: cleanEmail,
            password: password,
            role: role,
            contact: { phone: phone.trim(), address: address.trim() },
            location: { type: 'Point', coordinates: coordinates || [72.8777, 19.0760] }
          };

          localUsers.push(newUser);
          localStorage.setItem('ecolink_local_users', JSON.stringify(localUsers));
          onAuthSuccess('local_token_' + newUser._id, newUser);
          return;
        } else {
          // Offline login check against locally registered users or create demo user on the fly
          const localUsers = JSON.parse(localStorage.getItem('ecolink_local_users') || '[]');
          let foundUser = localUsers.find(
            u => u.email.toLowerCase() === cleanEmail.toLowerCase()
          );

          if (!foundUser) {
            foundUser = {
              _id: 'user_' + Math.random().toString(36).substring(2, 9),
              name: cleanEmail.toLowerCase().includes('recycler') ? 'Bio-Energy Recycler' : 'priya',
              email: cleanEmail,
              password: password,
              role: cleanEmail.toLowerCase().includes('recycler') ? 'biomass_company' : 'food_business',
              contact: { phone: '9876543210', address: 'Mumbai Commercial Hub' },
              location: { type: 'Point', coordinates: [72.8777, 19.0760] }
            };
            localUsers.push(foundUser);
            localStorage.setItem('ecolink_local_users', JSON.stringify(localUsers));
          }

          onAuthSuccess('local_token_' + foundUser._id, foundUser);
          return;
        }
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your input.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setDemoCodeAlert(data.demoCode);
      setSuccessMsg('Verification Code Generated!');
      setMode('verify');
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMsg(err.message || 'Failed to generate verification code. Please check your email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setSuccessMsg('🎉 Password reset successfully! Please login.');
      setMode('login');
      setResetCode('');
      setNewPassword('');
      setDemoCodeAlert('');
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMsg(err.message || 'Failed to reset password. Please verify your reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0d5a3e 0%, #0a6c48 50%, #07472f 100%)' }}>

      {/* Distinct Top Bio-Shield Sprout Badge Header (NO EcoLink text on Login page) */}
      <EcoLinkLogo variant="login" showText={false} showSubtitle={false} style={{ marginBottom: '16px' }} />

      {/* Header Heading & Subtitle */}
      <h2 style={{ fontSize: '28px', color: '#ffffff', fontWeight: '800', textAlign: 'center', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        {mode === 'login' && 'Welcome Back'}
        {mode === 'register' && 'Create Account'}
        {mode === 'forgot' && 'Reset Password'}
        {mode === 'verify' && 'Set New Password'}
      </h2>
      <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', textAlign: 'center', marginBottom: '28px' }}>
        Sign in to access verified biomass marketplace
      </p>

      {/* Auth White Card Container */}
      <div className="auth-white-card fade-in" style={{ borderRadius: '32px', padding: '32px' }}>

        {/* Tab Switcher for Register Mode */}
        {mode === 'register' && (
          <div className="auth-tab-container" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              Register
            </button>
          </div>
        )}

        {/* Error / Success Banners */}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px' }}>
            {successMsg}
          </div>
        )}

        {/* Form Controls */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Account Role Selector for Register Mode */}
            {mode === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700' }}>
                  Registering As:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('food_business')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '14px',
                      border: role === 'food_business' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: role === 'food_business' ? '#ecfdf5' : '#f8fafc',
                      color: role === 'food_business' ? '#059669' : '#64748b',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: role === 'food_business' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'none'
                    }}
                  >
                    <span>🏭</span> Waste Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('biomass_company')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '14px',
                      border: role === 'biomass_company' ? '2px solid #d97706' : '1px solid #e2e8f0',
                      background: role === 'biomass_company' ? '#fffbeb' : '#f8fafc',
                      color: role === 'biomass_company' ? '#d97706' : '#64748b',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: role === 'biomass_company' ? '0 4px 12px rgba(217, 119, 6, 0.15)' : 'none'
                    }}
                  >
                    <span>⚡</span> Recycler
                  </button>
                </div>
              </div>
            )}

            {/* Name input for Register */}
            {mode === 'register' && (
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder={role === 'food_business' ? "Restaurant / Business Name" : "Biomass Company Name"}
                  className="auth-light-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* User ID or Email input */}
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '16px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="email"
                placeholder="Email Address (e.g. name@example.com)"
                className="auth-light-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password input */}
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '16px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="auth-light-input"
                style={{ paddingRight: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '16px', top: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye style={{ width: '18px', height: '18px' }} /> : <EyeOff style={{ width: '18px', height: '18px' }} />}
              </button>
            </div>

            {/* Forgot Password link for Sign In */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '-4px', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Additional details for Register */}
            {mode === 'register' && (
              <>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '16px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    placeholder="10-Digit Mobile Number"
                    className="auth-light-input"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <MapPin style={{ position: 'absolute', left: '16px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Physical Address"
                    className="auth-light-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locationLoading}
                  style={{
                    background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155',
                    borderRadius: '12px', padding: '10px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  {locationLoading ? <Loader style={{ width: '16px', height: '16px' }} className="animate-spin" /> : '📍 Detect My Geolocation'}
                </button>
              </>
            )}

            {/* Action Buttons for Login / Register Mode */}
            {mode === 'login' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '15px',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isLoading ? <Loader style={{ width: '20px', height: '20px' }} className="animate-spin" /> : 'Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    New user?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                      style={{ background: 'none', border: 'none', color: '#047857', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                    >
                      Register here
                    </button>
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: role === 'food_business' ? '#059669' : '#d97706',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: role === 'food_business' ? '0 4px 14px rgba(5, 150, 105, 0.3)' : '0 4px 14px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <Loader style={{ width: '20px', height: '20px' }} className="animate-spin" />
                  ) : (
                    role === 'food_business' ? '🏭 Register as Waste Seller' : '⚡ Register as Bio-Energy Recycler'
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      style={{ background: 'none', border: 'none', color: '#047857', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                    >
                      Sign In here
                    </button>
                  </span>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Forgot Password Mode */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Enter your registered email address to receive a verification code for resetting your password.
            </p>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="email"
                placeholder="Registered Email"
                className="auth-light-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Get Verification Code'}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginTop: '8px' }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Verify Code Mode */}
        {mode === 'verify' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="6-Digit Reset Code"
                className="auth-light-input"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                className="auth-light-input"
                style={{ paddingRight: '44px' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password & Login'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthPortal;
