import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Bell, LogOut, ShieldAlert, Award, Globe, Settings, MapPin, Truck, BarChart2, CheckCircle } from 'lucide-react';
import AuthPortal from './components/AuthPortal';
import FoodBusinessDashboard from './components/FoodBusinessDashboard';
import BiomassDashboard from './components/BiomassDashboard';
import ProfileModal from './components/ProfileModal';
import EcoLinkLogo from './components/EcoLinkLogo';
import SplashScreen from './components/SplashScreen';
import { getTranslation } from './translations';

const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('ecolink_token') || '');
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSignedOut, setIsSignedOut] = useState(false);
  
  // Nav Tab state: 'map_post', 'orders', 'analytics'
  const [activeNavTab, setActiveNavTab] = useState('map_post');

  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [loginToast, setLoginToast] = useState(null);
  const [shakeBell, setShakeBell] = useState(false);
  const [socket, setSocket] = useState(null);
  const notifRef = useRef(null);

  // Language state
  const [language, setLanguage] = useState('English');
  const t = getTranslation(language);

  // Toggle notification dropdown & clear badge instantly
  const toggleNotification = (e) => {
    if (e) e.stopPropagation();
    setShowNotifDropdown(prev => !prev);
    // Direct functional state update so red badge count disappears instantly!
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllNotificationsRead();
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Authenticate user profile using saved token
  const fetchUserProfile = async (authToken) => {
    // Check for cached local user first
    const cachedUser = localStorage.getItem('ecolink_cached_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('ecolink_cached_user', JSON.stringify(data));
      } else if (response && response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Fetch past notifications
  const fetchNotifications = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
      fetchNotifications(token);
    }
  }, [token]);

  // Connect WebSockets when authenticated
  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', token);
    });

    newSocket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setActiveAlert(newNotif);
      setShakeBell(true);
      
      setTimeout(() => setShakeBell(false), 800);
      setTimeout(() => setActiveAlert(null), 5000);
    });

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  const handleAuthSuccess = (newToken, authUser) => {
    localStorage.setItem('ecolink_token', newToken);
    localStorage.setItem('ecolink_cached_user', JSON.stringify(authUser));
    setToken(newToken);
    setUser(authUser);
    setIsSignedOut(false);

    // Show temporary login toast notification (auto disappears after 4 seconds)
    const roleTitle = authUser?.role === 'biomass_company' ? 'Bio-Energy Recycler' : 'Commercial Waste Seller';
    setLoginToast({
      title: 'Login Successful',
      message: `Welcome back, ${authUser?.name || 'User'}! (${roleTitle})`
    });

    setTimeout(() => {
      setLoginToast(null);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('ecolink_token');
    localStorage.removeItem('ecolink_cached_user');
    setToken('');
    setUser(null);
    setLoginToast(null);
    setIsSignedOut(true);
    if (socket) {
      socket.disconnect();
    }
  };

  const markNotificationRead = async (notifId) => {
    // Immediately mark read in React state
    setNotifications(prev =>
      prev.map(n => (!notifId || n._id === notifId || String(n._id) === String(notifId)) ? { ...n, read: true } : n)
    );

    try {
      if (notifId && token) {
        await fetch(`${API_BASE_URL}/api/notifications/${notifId}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    // Immediately mark all read in React state
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      if (token) {
        const unreadList = notifications.filter(n => !n.read);
        await Promise.all(
          unreadList.map(n =>
            fetch(`${API_BASE_URL}/api/notifications/${n._id}/read`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null)
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* EcoLink Animated Splash Screen / Preloader */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={2000} />}

      {/* Short-lived Login Notification Toast (Only when logged in) */}
      {user && loginToast && (
        <div className="login-toast-notification">
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', background: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0
          }}>
            🌱
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700', margin: 0 }}>
              {loginToast.title}
            </h4>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px', margin: 0 }}>
              {loginToast.message}
            </p>
          </div>
          <button 
            onClick={() => setLoginToast(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation Bar Pill (Only when logged in) */}
      {user && (
        <div className="navbar-container">
          <header className="navbar-pill">
            
            {/* Left: User Profile & Role Info */}
            <div className="nav-profile-badge" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }} title="Click to view My Account Profile">
              <div className="avatar-circle">
                {user.photo ? (
                  <img src={user.photo} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  userInitial
                )}
              </div>
              <div className="user-info-text">
                <span className="user-name-title">
                  {user.name}
                </span>
                <span className="user-role-subtitle">
                  {user.role === 'biomass_company' ? (
                    <>{t.recyclerRole}</>
                  ) : (
                    <>{t.sellerRole}</>
                  )}
                </span>
              </div>
            </div>

            {/* Center Navigation Tabs */}
            <div className="nav-center-tabs">
              <button 
                className={`nav-tab-btn ${activeNavTab === 'map_post' ? 'active' : ''}`}
                onClick={() => setActiveNavTab('map_post')}
              >
                {user.role === 'food_business' ? t.logManageWaste : t.liveBiomassMap}
              </button>
              <button 
                className={`nav-tab-btn ${activeNavTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveNavTab('orders')}
              >
                {user.role === 'food_business' ? t.pickupRequests : t.ordersPickups}
              </button>
              <button 
                className={`nav-tab-btn ${activeNavTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveNavTab('analytics')}
              >
                {user.role === 'food_business' ? t.sustainabilityImpact : t.esgCleanEnergy}
              </button>
            </div>

            {/* Right: Quick Tools & Sign Out */}
            <div className="nav-right-actions">
              
              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button 
                  onClick={toggleNotification}
                  className={`nav-icon-btn ${shakeBell ? 'animated-shake' : ''}`}
                  title="Notifications"
                >
                  <Bell style={{ width: '18px', height: '18px', color: unreadCount > 0 ? '#d97706' : '#475569' }} />
                  {unreadCount > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444',
                      color: '#ffffff', fontSize: '9px', fontWeight: 'bold', 
                      borderRadius: '50%', width: '16px', height: '16px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifDropdown && (
                  <div style={{ 
                    position: 'absolute', right: 0, top: '48px', width: '320px', maxHeight: '380px',
                    overflowY: 'auto', zIndex: 1100, padding: '16px', borderRadius: '16px',
                    background: '#ffffff', border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <h4 style={{ fontSize: '14px', color: '#1e293b', margin: 0, fontWeight: '700' }}>
                        Notifications
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle style={{ width: '13px', height: '13px' }} /> Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '12px' }}>
                        No new notifications.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notifications.map(n => (
                          <div 
                            key={n._id} 
                            onClick={() => {
                              markNotificationRead(n._id);
                              if (n.type === 'pickup_request' || n.type === 'status_change') {
                                setActiveNavTab('orders');
                              }
                            }}
                            style={{ 
                              padding: '10px', borderRadius: '10px', cursor: 'pointer',
                              background: n.read ? '#f8fafc' : '#ecfdf5',
                              borderLeft: n.read ? '3px solid #cbd5e1' : '3px solid #10b981',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h5 style={{ fontSize: '12px', color: '#1e293b', fontWeight: n.read ? '600' : '700', margin: 0 }}>{n.title}</h5>
                              {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>}
                            </div>
                            <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px', margin: 0 }}>{n.message}</p>
                            <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                              {new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="lang-select-btn"
              >
                <option value="English" style={{ background: '#ffffff', color: '#1e293b' }}>🌐 English</option>
                <option value="Hindi" style={{ background: '#ffffff', color: '#1e293b' }}>🌐 हिन्दी (Hindi)</option>
                <option value="Marathi" style={{ background: '#ffffff', color: '#1e293b' }}>🌐 मराठी (Marathi)</option>
              </select>

              {/* Sign Out Button */}
              <button onClick={handleLogout} className="signout-btn">
                <span>[→</span> {t.signOut}
              </button>

            </div>

          </header>
        </div>
      )}

      {/* Profile Modal (My Account Profile) */}
      <ProfileModal
        user={user}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdateProfile={(updated) => setUser(updated)}
        onLogout={handleLogout}
        apiBaseUrl={API_BASE_URL}
        token={token}
      />

      {/* Real-time Alert Banner (Only when logged in) */}
      {user && activeAlert && (
        <div style={{ 
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, 
          maxWidth: '360px', borderRadius: '16px', padding: '16px',
          background: '#ffffff', border: '1px solid #f59e0b',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldAlert style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '14px', color: '#1e293b' }}>{activeAlert.title}</h4>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{activeAlert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justify: user ? 'flex-start' : 'center',
        padding: user ? '12px 16px 32px 16px' : '20px 16px'
      }}>
        {user ? (
          user.role === 'food_business' ? (
            <FoodBusinessDashboard user={user} token={token} apiBaseUrl={API_BASE_URL} activeNavTab={activeNavTab} language={language} t={t} />
          ) : (
            <BiomassDashboard user={user} token={token} apiBaseUrl={API_BASE_URL} activeNavTab={activeNavTab} language={language} t={t} />
          )
        ) : (
          <AuthPortal onAuthSuccess={handleAuthSuccess} apiBaseUrl={API_BASE_URL} language={language} t={t} isSignedOut={isSignedOut} />
        )}
      </main>

    </div>
  );
}

export default App;
