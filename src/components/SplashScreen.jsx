import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish, duration = 2000 }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Stage 1: Wait for duration (2s), then trigger fade out
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, duration);

    // Stage 2: Wait for fade out animation (500ms), then unmount
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration + 500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div className={`splash-screen-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}>
      {/* Background ambient decorative eco-mesh */}
      <div className="splash-ambient-glow" />

      {/* Top right floating recycling symbol accent */}
      <div className="splash-top-recycling-icon" title="EcoLink Sustainability">
        <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 32 6 L 38 18 H 26 Z" fill="#059669" />
          <path d="M 32 16 A 16 16 0 0 1 48 32" stroke="#10b981" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 52 38 L 44 48 L 56 48 Z" fill="#059669" />
          <path d="M 48 32 A 16 16 0 0 1 20 44" stroke="#059669" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 12 26 L 20 16 L 8 16 Z" fill="#059669" />
          <path d="M 20 44 A 16 16 0 0 1 32 16" stroke="#34d399" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="splash-content">
        
        {/* Left Side: Brand Logo & Text */}
        <div className="splash-brand-section">
          
          {/* Animated Dual Green Leaves Logo Header */}
          <div className="splash-logo-wrapper">
            <div className="splash-leaves-container">
              {/* Dual Green Leaves SVG Graphic */}
              <svg width="76" height="76" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash-dual-leaves-svg">
                <defs>
                  <linearGradient id="leftLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="rightLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="stemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="100%" stopColor="#065f46" />
                  </linearGradient>
                </defs>

                {/* Left Leaf Wing */}
                <path
                  d="M 38 42 C 20 38 10 24 16 10 C 28 10 38 20 38 42 Z"
                  fill="url(#leftLeafGrad)"
                  className="splash-leaf-left"
                />
                {/* Left Leaf Center Vein */}
                <path d="M 23 20 C 30 28 35 34 38 42" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />

                {/* Right Leaf Wing (Primary) */}
                <path
                  d="M 38 42 C 56 38 68 20 60 4 C 44 6 36 20 38 42 Z"
                  fill="url(#rightLeafGrad)"
                  className="splash-leaf-right"
                />
                {/* Right Leaf Center Vein */}
                <path d="M 52 14 C 44 26 40 34 38 42" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />

                {/* Growing Main Stem */}
                <path d="M 38 42 Q 37 58 35 70" stroke="url(#stemGrad)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M 38 42 Q 39 56 42 66" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              </svg>
            </div>
          </div>

          {/* ECOLINK Title */}
          <h1 className="splash-title">
            <span className="splash-title-eco">ECO</span>
            <span className="splash-title-link">LINK</span>
          </h1>

          {/* Subtitle */}
          <p className="splash-subtitle">
            B2B BIODEGRADABLE WASTE MANAGEMENT PLATFORM
          </p>

          {/* Tagline */}
          <h3 className="splash-tagline">
            Connect Waste. Create Value.
          </h3>

          {/* Sleek 2-second Progress Bar */}
          <div className="splash-progress-container">
            <div className="splash-progress-track">
              <div 
                className="splash-progress-bar"
                style={{ animationDuration: `${duration}ms` }}
              />
            </div>
            <div className="splash-loading-status">
              <span className="splash-loading-dot" />
              Initialising Sustainable Network...
            </div>
          </div>

        </div>

        {/* Right Side: Circular Soil Sprout & Eco Badges Graphic */}
        <div className="splash-graphic-section">
          <div className="splash-circle-frame">
            <div className="splash-circle-image">
              <div className="splash-sprout-art">
                {/* Hands & Soil Sprout Visual Emblem */}
                <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="46" fill="url(#soilGlow)" opacity="0.15" />
                  <defs>
                    <radialGradient id="soilGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </radialGradient>
                  </defs>
                  
                  {/* Soil Mound */}
                  <ellipse cx="50" cy="72" rx="32" ry="14" fill="#3f2e21" />
                  <ellipse cx="50" cy="70" rx="28" ry="10" fill="#543d2b" />
                  <ellipse cx="48" cy="68" rx="22" ry="7" fill="#10b981" opacity="0.2" />

                  {/* Growing Plant Stem */}
                  <path d="M 50 70 Q 49 52 50 36" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />

                  {/* Top Twin Leaves */}
                  <path d="M 50 38 Q 32 30 36 20 Q 48 24 50 38 Z" fill="#34d399" />
                  <path d="M 50 38 Q 68 30 64 20 Q 52 24 50 38 Z" fill="#059669" />

                  {/* Energy Sparkle */}
                  <circle cx="50" cy="16" r="3" fill="#fef08a" />
                </svg>
              </div>

              {/* Orbiting Eco Badges */}
              <div className="splash-orbit-badge badge-leaf" title="Bio-Waste">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>

              <div className="splash-orbit-badge badge-recycle" title="Circular Economy">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5">
                  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.19 9.5" />
                  <path d="M11 19h8.2a1.8 1.8 0 0 0 1.637-.96 1.78 1.78 0 0 0-.083-1.815l-3.21-5.24" />
                  <path d="M15 4h-5.2l2.4 4" />
                </svg>
              </div>

              <div className="splash-orbit-badge badge-bin" title="Zero Waste">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Footer City Skyline & Clean Energy Eco Accent */}
      <div className="splash-footer-skyline">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="splash-skyline-svg">
          <path d="M 0 120 L 0 90 L 40 90 L 40 60 L 80 60 L 80 90 L 110 90 L 110 45 L 160 45 L 160 90 L 200 90 L 200 70 L 250 70 L 250 90 L 300 90 L 300 120 Z" fill="#d1fae5" opacity="0.6" />
          <path d="M 280 120 L 280 75 L 340 75 L 340 40 L 390 40 L 390 120 Z" fill="#a7f3d0" opacity="0.7" />
          <path d="M 0 120 Q 300 70 600 90 Q 900 110 1200 80 L 1200 120 Z" fill="#10b981" opacity="0.15" />
        </svg>
      </div>

    </div>
  );
};

export default SplashScreen;
