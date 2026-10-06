import React from 'react';

const EcoLinkLogo = ({ 
  variant = 'medium', 
  iconType = null, // 'classic', 'shield_sprout'
  showText = null, // auto-determines based on variant if null
  showSubtitle = false, 
  animated = false, 
  textColor = null,
  style = {} 
}) => {
  // Dimensions based on variant
  const sizeMap = {
    splash: { badgeSize: 130, iconSize: 76, fontSize: '42px', subFontSize: '15px' },
    login: { badgeSize: 84, iconSize: 50, fontSize: '28px', subFontSize: '12px' },
    large: { badgeSize: 90, iconSize: 52, fontSize: '32px', subFontSize: '13px' },
    medium: { badgeSize: 64, iconSize: 38, fontSize: '24px', subFontSize: '12px' },
    header: { badgeSize: 44, iconSize: 26, fontSize: '19px', subFontSize: '10px' },
    small: { badgeSize: 36, iconSize: 22, fontSize: '16px', subFontSize: '9px' }
  };

  const { badgeSize, iconSize, fontSize, subFontSize } = sizeMap[variant] || sizeMap.medium;

  // By default, hide text on login variant unless explicitly passed true
  const shouldRenderText = showText !== null ? showText : (variant !== 'login');
  
  const isLightText = variant === 'splash' || variant === 'large' || variant === 'login';
  const primaryTextColor = textColor || (isLightText ? '#ffffff' : '#0f172a');
  
  // Determine icon type (Login gets distinct 'shield_sprout' emblem)
  const actualIconType = iconType || (variant === 'login' ? 'shield_sprout' : 'classic');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: (variant === 'splash' || variant === 'large' || variant === 'login') ? 'column' : 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: (variant === 'splash' || variant === 'large') ? '16px' : '10px', 
      ...style 
    }}>
      
      {/* Outer Glow & Glossy Badge Container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        
        {/* Soft Radial Ambient Glow */}
        {(variant === 'splash' || variant === 'large' || variant === 'login' || animated) && (
          <div style={{
            position: 'absolute',
            width: `${badgeSize + 26}px`,
            height: `${badgeSize + 26}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.45) 0%, rgba(16, 185, 129, 0.18) 55%, rgba(0,0,0,0) 80%)',
            animation: animated ? 'pulseGlow 2.4s ease-in-out infinite' : 'none',
            pointerEvents: 'none'
          }} />
        )}

        {/* Glossy Gradient Badge */}
        <div style={{
          width: `${badgeSize}px`,
          height: `${badgeSize}px`,
          borderRadius: '50%',
          background: variant === 'login'
            ? 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 65%, #047857 100%)',
          border: `${Math.max(3, Math.round(badgeSize / 18))}px solid #ffffff`,
          boxShadow: variant === 'splash' 
            ? '0 16px 40px rgba(0, 0, 0, 0.3), inset 0 3px 6px rgba(255, 255, 255, 0.4)' 
            : '0 8px 24px rgba(16, 185, 129, 0.28), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          
          {actualIconType === 'shield_sprout' ? (
            /* DIFFERENT Unique Bio-Shield Sprout Emblem for Login Page */
            <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="sproutGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="sproutMintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#6ee7b7" />
                </linearGradient>
              </defs>

              {/* Bio Security Shield Base Outline */}
              <path 
                d="M 32 8 C 44 8 52 14 52 26 C 52 40 32 54 32 54 C 32 54 12 40 12 26 C 12 14 20 8 32 8 Z" 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.4)" 
                strokeWidth="3" 
              />

              {/* Glowing Inner Shield Arc */}
              <path 
                d="M 32 12 C 41 12 47 17 47 26 C 47 37 32 48 32 48 C 32 48 17 37 17 26 C 17 17 23 12 32 12 Z" 
                fill="rgba(255, 255, 255, 0.08)" 
                stroke="url(#shieldGrad)" 
                strokeWidth="2" 
              />

              {/* Left Sprout Leaf */}
              <path 
                d="M 32 20 C 22 22 18 32 22 40 C 27 40 32 35 32 20 Z" 
                fill="url(#sproutMintGrad)" 
              />

              {/* Right Golden Sprout Leaf */}
              <path 
                d="M 32 20 C 42 22 46 32 42 40 C 37 40 32 35 32 20 Z" 
                fill="url(#sproutGoldGrad)" 
              />

              {/* Central Growing Stem */}
              <path 
                d="M 32 20 V 46" 
                stroke="#ffffff" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* Top Golden Sparkle Drop */}
              <circle cx="32" cy="15" r="3.5" fill="#fef08a" />
            </svg>
          ) : (
            /* Classic SVG Eco Emblem (Splash, Header, etc.) */
            <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ecoLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </linearGradient>
                <linearGradient id="ecoEnergySpark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Circular Bio Recycling Loops */}
              <path d="M 32 6 A 26 26 0 0 1 57 28" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" opacity="0.45" />
              <path d="M 32 58 A 26 26 0 0 1 7 36" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" opacity="0.45" />

              {/* Left Leaf Wing */}
              <path d="M 32 12 C 16 14 10 28 14 42 C 22 42 32 36 32 12 Z" fill="url(#ecoLeafGrad)" opacity="0.85" />

              {/* Right Main Leaf Wing */}
              <path d="M 32 12 C 48 14 54 28 50 42 C 42 42 32 36 32 12 Z" fill="url(#ecoLeafGrad)" />

              {/* Center Leaf Vein */}
              <path d="M 32 12 V 48 C 32 52 29 55 25 57" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />

              {/* Sun / Energy Spark Accent */}
              <circle cx="49" cy="16" r="4.5" fill="url(#ecoEnergySpark)" />
              <path d="M 49 8 V 10 M 49 22 V 24 M 41 16 H 43 M 55 16 H 57" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            </svg>
          )}

        </div>
      </div>

      {/* Brand Text */}
      {shouldRenderText && (
        <div style={{ textAlign: (variant === 'splash' || variant === 'large' || variant === 'login') ? 'center' : 'left' }}>
          <div style={{
            fontSize,
            fontWeight: '800',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            color: primaryTextColor,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            display: 'flex',
            alignItems: 'center',
            justifyContent: (variant === 'splash' || variant === 'large' || variant === 'login') ? 'center' : 'flex-start',
            gap: '1px'
          }}>
            <span style={{ color: '#10b981' }}>Eco</span>
            <span style={{ color: isLightText ? '#ffffff' : '#0f172a' }}>Link</span>
          </div>

          {showSubtitle && (
            <p style={{
              fontSize: subFontSize,
              fontWeight: '600',
              color: isLightText ? 'rgba(255, 255, 255, 0.88)' : '#64748b',
              marginTop: '4px',
              margin: '4px 0 0 0',
              letterSpacing: '0.01em'
            }}>
              Biodegradable Waste & Energy Exchange
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default EcoLinkLogo;
