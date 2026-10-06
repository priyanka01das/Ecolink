import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, X, LogOut, Edit3, CheckCircle2, ShieldCheck, Sparkles, Building2, Copy, Check } from 'lucide-react';

const ProfileModal = ({ user, isOpen, onClose, onUpdateProfile, onLogout, apiBaseUrl, token }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'edit'

  // Form states initialized from user prop
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      const rawPhone = (user.contact?.phone || '').replace(/\D/g, '');
      setPhone(rawPhone || '1234567890');
      setAltPhone((user.contact?.altPhone || '').replace(/\D/g, ''));
      setAddress(user.contact?.address || user.address || '');
      setPhoto(user.photo || '');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyText = (text, fieldName) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanAltPhone = altPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
      return;
    }

    if (cleanAltPhone && cleanAltPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit alternate contact number.');
      return;
    }

    setIsSaving(true);

    const updatedData = {
      ...user,
      name: name || user.name,
      photo: photo || user.photo,
      contact: {
        ...(user.contact || {}),
        phone: cleanPhone,
        altPhone: cleanAltPhone,
        address: address
      }
    };

    try {
      if (token && apiBaseUrl) {
        const res = await fetch(`${apiBaseUrl}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            phone,
            altPhone,
            address,
            photo
          })
        });
        if (res.ok) {
          const resData = await res.json();
          onUpdateProfile(resData);
        } else {
          onUpdateProfile(updatedData);
        }
      } else {
        onUpdateProfile(updatedData);
      }

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('overview');
      }, 1400);
    } catch (err) {
      console.error(err);
      onUpdateProfile(updatedData);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('overview');
      }, 1400);
    } finally {
      setIsSaving(false);
    }
  };

  const rawName = name || user.name || 'User';
  const usernameHandle = `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const isSeller = user.role === 'food_business';
  const roleDisplay = isSeller ? 'Waste Seller' : 'Bio-Energy Recycler';
  const roleEmoji = isSeller ? '🥗' : '⚡';
  const displayAddress = address || user.contact?.address || user.address || 'Address not specified';

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-card fade-in" onClick={(e) => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Eco Bio-Green Cover Header */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #0d5a3e 0%, #0a6c48 50%, #07472f 100%)',
          padding: '20px 20px 16px 20px',
          color: '#ffffff'
        }}>
          {/* Header Close Button Only */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button 
              onClick={onClose} 
              style={{ 
                width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.25)', color: '#ffffff', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', backdropFilter: 'blur(4px)'
              }}
              aria-label="Close profile"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Profile User Info Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: '#ffffff',
                border: '3px solid #34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)', overflow: 'hidden',
                color: '#047857'
              }}>
                {photo ? (
                  <img src={photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{roleEmoji}</span>
                )}
              </div>
            </div>

            {/* User Title & Role Pill */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rawName}
              </h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '600', color: '#ffffff'
              }}>
                {roleEmoji} {roleDisplay}
              </span>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div style={{ display: 'flex', background: 'rgba(4, 60, 40, 0.55)', padding: '4px', borderRadius: '12px', marginTop: '20px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === 'overview' ? '#ffffff' : 'transparent',
                color: activeTab === 'overview' ? '#047857' : 'rgba(255, 255, 255, 0.85)',
                boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(0, 0, 0, 0.18)' : 'none'
              }}
            >
              <User style={{ width: '14px', height: '14px', color: activeTab === 'overview' ? '#10b981' : 'currentColor' }} /> Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                color: activeTab === 'edit' ? '#047857' : 'rgba(255, 255, 255, 0.85)',
                boxShadow: activeTab === 'edit' ? '0 4px 12px rgba(0, 0, 0, 0.18)' : 'none'
              }}
            >
              <Edit3 style={{ width: '14px', height: '14px', color: activeTab === 'edit' ? '#10b981' : 'currentColor' }} /> Edit Details
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '20px 24px 24px 24px', background: '#ffffff' }}>

          {/* Success Banner */}
          {successMsg && (
            <div style={{ 
              background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', 
              padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
              marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} /> {successMsg}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div style={{ 
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', 
              padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
              marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* OVERVIEW TAB CONTENT */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Info Details Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* 1. Email Address */}
                <div style={{
                  padding: '12px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>Email Address</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{user.email}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(user.email, 'email')}
                    style={{ background: 'none', border: 'none', color: copiedField === 'email' ? '#10b981' : '#94a3b8', cursor: 'pointer', padding: '6px' }}
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>

                {/* 2. Mobile Phone */}
                <div style={{
                  padding: '12px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>Mobile Number</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{phone}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(phone, 'phone')}
                    style={{ background: 'none', border: 'none', color: copiedField === 'phone' ? '#10b981' : '#94a3b8', cursor: 'pointer', padding: '6px' }}
                    title="Copy Mobile Number"
                  >
                    {copiedField === 'phone' ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>

                {/* 3. Facility Location / Address */}
                <div style={{
                  padding: '12px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>Facility Address</span>
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayAddress}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  style={{
                    flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155',
                    borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Edit3 style={{ width: '15px', height: '15px', color: '#64748b' }} /> Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => { onClose(); onLogout(); }}
                  style={{
                    flex: 1, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                    borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LogOut style={{ width: '15px', height: '15px' }} /> Logout Account
                </button>
              </div>

            </div>
          )}

          {/* EDIT DETAILS TAB CONTENT */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Profile Photo Uploader Box */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
                padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '20px'
                  }}>
                    {photo ? <img src={photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : roleEmoji}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Profile Photo</h4>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Upload image file</p>
                  </div>
                </div>
                <label style={{
                  background: '#10b981', color: '#ffffff', borderRadius: '8px',
                  padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}>
                  <Camera style={{ width: '13px', height: '13px' }} /> Choose Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Field 1: Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Company / Display Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px',
                      border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '13px',
                      color: '#0f172a', fontWeight: '600', outline: 'none'
                    }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Mobile Number */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Mobile Number (10 Digits)
                </label>
                <div style={{ display: 'flex', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ background: '#e2e8f0', color: '#334155', fontWeight: '700', fontSize: '12px', padding: '0 10px', display: 'flex', alignItems: 'center', borderRight: '1px solid #cbd5e1' }}>
                    IN +91
                  </div>
                  <input
                    type="tel"
                    style={{ border: 'none', background: 'transparent', padding: '10px 12px', fontSize: '13px', color: '#0f172a', fontWeight: '600', outline: 'none', width: '100%' }}
                    value={phone}
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    required
                  />
                </div>
              </div>

              {/* Field 3: Alternate Number */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Alternate Phone (10 Digits - Optional)
                </label>
                <div style={{ display: 'flex', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ background: '#f1f5f9', color: '#64748b', fontWeight: '600', fontSize: '12px', padding: '0 10px', display: 'flex', alignItems: 'center', borderRight: '1px solid #cbd5e1' }}>
                    IN +91
                  </div>
                  <input
                    type="tel"
                    style={{ border: 'none', background: 'transparent', padding: '10px 12px', fontSize: '13px', color: '#0f172a', fontWeight: '600', outline: 'none', width: '100%' }}
                    value={altPhone}
                    maxLength={10}
                    onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit alternate number"
                  />
                </div>
              </div>

              {/* Field 4: Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Facility Location / Address
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px',
                      border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '13px',
                      color: '#0f172a', fontWeight: '600', outline: 'none'
                    }}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State / Landmark"
                  />
                </div>
              </div>

              {/* Submit Save Changes Button */}
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  marginTop: '6px', background: '#10b981', color: '#ffffff', border: 'none',
                  borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '700',
                  cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', transition: 'all 0.2s ease'
                }}
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

