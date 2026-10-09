import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Compass, MapPin, Truck, AlertCircle, FileText, Check, BarChart2, Award, Filter, ArrowUpDown, Calculator, Zap, Flame, ShieldCheck, Clock, RefreshCw, CheckCircle2, Printer, Download, Trash2, CreditCard, QrCode, Building2, Wallet, CheckCircle, Receipt, ArrowRight, DollarSign, Shield } from 'lucide-react';

const { BaseLayer } = LayersControl;

const getCategoryMarkerInfo = (category) => {
  switch (category) {
    case 'raw_organic': return { emoji: '🥦', color: '#10b981' };
    case 'cooked_food': return { emoji: '🍲', color: '#f59e0b' };
    case 'bakery': return { emoji: '🍞', color: '#d97706' };
    case 'oil_grease': return { emoji: '🛢️', color: '#8b5cf6' };
    case 'green_waste': return { emoji: '🌿', color: '#059669' };
    default: return { emoji: '🌱', color: '#10b981' };
  }
};

const MapController = ({ center, listings }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (center && (!listings || listings.length === 0)) {
      map.setView(center, 13);
    } else if (listings && listings.length > 0) {
      const validCoords = listings
        .map(l => l.location?.coordinates)
        .filter(c => Array.isArray(c) && c.length === 2 && c[0] !== 0 && c[1] !== 0)
        .map(c => [c[1], c[0]]);

      if (center) {
        validCoords.push(center);
      }

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [center, listings, map]);
  return null;
};

const createCustomMarker = (emoji, glowColor) => {
  return L.divIcon({
    html: `<div style="
      background: #ffffff;
      border: 2.5px solid ${glowColor};
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
      font-size: 22px;
    ">${emoji}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24]
  });
};

// Haversine distance calculator function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

import { getTranslation } from '../translations';

const BiomassDashboard = ({ user, token, apiBaseUrl, activeNavTab = 'map_post', language = 'English', t: propT }) => {
  const t = propT || getTranslation(language);
  const [radius, setRadius] = useState('15');
  const [listings, setListings] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // B2B Payment & Checkout System States
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'netbanking', 'card', 'escrow', 'pod'
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Breakdown, 2: Payment, 3: Processing
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Feature States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'weight', 'expiry'
  const [calculatorWeight, setCalculatorWeight] = useState(100);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all', 'active', 'completed'

  const userLat = user?.location?.coordinates?.[1] || 19.0760;
  const userLng = user?.location?.coordinates?.[0] || 72.8777;

  useEffect(() => {
    if (user?.location?.coordinates) {
      const [lng, lat] = user.location.coordinates;
      if (lat !== 0 && lng !== 0) {
        setMapCenter([lat, lng]);
      }
    }
  }, [user]);

  const [refreshToast, setRefreshToast] = useState('');

  const currentUserId = (user?._id || user?.id || '').toString();
  const currentEmail = (user?.email || '').toLowerCase().trim();

  const fetchData = async (isManual = false) => {
    setLoadingListings(true);
    try {
      let serverLists = [];
      let serverReqs = [];

      if (token && apiBaseUrl) {
        const [lng, lat] = user?.location?.coordinates || [72.8777, 19.0760];
        
        const listingsRes = await fetch(
          `${apiBaseUrl}/api/listings?lat=${lat}&lng=${lng}&radius=${radius}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).catch(() => null);

        if (listingsRes && listingsRes.ok) {
          serverLists = await listingsRes.json();
        }

        const requestsRes = await fetch(`${apiBaseUrl}/api/requests/my-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);

        if (requestsRes && requestsRes.ok) {
          serverReqs = await requestsRes.json();
        }
      }

      // Default mock fallback listings if empty
      const defaultMockListings = [
        {
          _id: 'mock_1',
          category: 'raw_organic',
          weight: 250,
          description: 'Vegetable waste & organic peelings from central kitchen',
          expiryHours: 12,
          pricingModel: 'priced',
          pricePerKg: 12,
          totalPrice: 3000,
          status: 'available',
          producer: { name: 'Green Garden Organics' },
          location: { type: 'Point', coordinates: [72.8800, 19.0800] }
        },
        {
          _id: 'mock_2',
          category: 'cooked_food',
          weight: 180,
          description: 'Bulk surplus catering grains and cooked rice batch',
          expiryHours: 6,
          pricingModel: 'priced',
          pricePerKg: 15,
          totalPrice: 2700,
          status: 'available',
          producer: { name: 'Metro Foods & Catering' },
          location: { type: 'Point', coordinates: [72.8650, 19.0700] }
        },
        {
          _id: 'mock_3',
          category: 'bakery',
          weight: 400,
          description: 'Spent brewery grains & stale bakery dough for bio-reactor',
          expiryHours: 24,
          pricingModel: 'free',
          pricePerKg: 0,
          totalPrice: 0,
          status: 'available',
          producer: { name: 'Artisan Bakery Co.' },
          location: { type: 'Point', coordinates: [72.8900, 19.0900] }
        }
      ];

      // Merge local listings from localStorage
      const localListings = JSON.parse(localStorage.getItem('ecolink_local_listings') || '[]');
      const combinedListings = [...serverLists];

      localListings.forEach(item => {
        if (!combinedListings.some(l => l._id === item._id)) {
          combinedListings.unshift(item);
        }
      });

      if (combinedListings.length === 0) {
        setListings(defaultMockListings);
      } else {
        setListings(combinedListings);
      }

      // Merge local requests submitted by THIS recycler only
      const localReqs = JSON.parse(localStorage.getItem('ecolink_local_requests') || '[]');
      const myLocalReqs = localReqs.filter(r => {
        const cId = (r.consumerId || r.consumer?._id || r.consumer?.id || r.consumer || '').toString();
        const cEmail = (r.consumerEmail || r.consumer?.email || '').toLowerCase().trim();
        return (currentUserId && cId === currentUserId) || (currentEmail && cEmail === currentEmail);
      });

      const combinedReqs = [...serverReqs];
      myLocalReqs.forEach(r => {
        if (!combinedReqs.some(cr => cr._id === r._id)) {
          combinedReqs.unshift(r);
        }
      });
      setMyRequests(combinedReqs);

    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setLoadingListings(false);
        if (isManual) {
          setRefreshToast('Listings & map data refreshed!');
          setTimeout(() => setRefreshToast(''), 2500);
        }
      }, 400);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      // Known city / area coordinates map for location centering
      const cityCoordsMap = {
        mumbai: [19.0760, 72.8777],
        pune: [18.5204, 73.8567],
        delhi: [28.6139, 77.2090],
        'new delhi': [28.6139, 77.2090],
        thane: [19.2183, 72.9781],
        bangalore: [12.9716, 77.5946],
        bengaluru: [12.9716, 77.5946],
        hyderabad: [17.3850, 78.4867],
        chennai: [13.0827, 80.2707],
        kolkata: [22.5726, 88.3639],
        ahmedabad: [23.0225, 72.5714],
        surat: [21.1702, 72.8311],
        jaipur: [26.9124, 75.7873],
        lucknow: [26.8467, 80.9462],
        'navi mumbai': [19.0330, 73.0297],
        kurla: [19.0657, 72.8783],
        andheri: [19.1136, 72.8697],
        bandra: [19.0596, 72.8295]
      };

      for (const [cityKey, coords] of Object.entries(cityCoordsMap)) {
        if (q.includes(cityKey)) {
          setMapCenter(coords);
          break;
        }
      }
    }

    fetchData(true);
    setRefreshToast(searchQuery ? `🔍 Search updated for "${searchQuery}"` : '🔍 Listings & map view updated!');
    setTimeout(() => setRefreshToast(''), 3000);
  };

  useEffect(() => {
    fetchData();
  }, [radius, token]);

  // Filter & Sort listings
  const processedListings = useMemo(() => {
    let result = [...listings];

    // Filter by Category
    if (selectedCategoryFilter !== 'all') {
      result = result.filter(item => item.category === selectedCategoryFilter);
    }

    // Filter by Search Query (producer name, description, category, address, weight)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const producerName = (item.producer?.name || item.sellerName || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const address = (item.address || item.locationName || '').toLowerCase();
        const weightStr = (item.weight || '').toString();
        return (
          producerName.includes(q) ||
          description.includes(q) ||
          category.includes(q) ||
          address.includes(q) ||
          weightStr.includes(q)
        );
      });
    }

    // Sort listings
    result.sort((a, b) => {
      if (sortBy === 'distance') {
        const distA = parseFloat(calculateDistance(userLat, userLng, a.location?.coordinates?.[1], a.location?.coordinates?.[0]));
        const distB = parseFloat(calculateDistance(userLat, userLng, b.location?.coordinates?.[1], b.location?.coordinates?.[0]));
        return distA - distB;
      } else if (sortBy === 'weight') {
        return b.weight - a.weight;
      } else if (sortBy === 'expiry') {
        return (a.expiryHours || 24) - (b.expiryHours || 24);
      }
      return 0;
    });

    return result;
  }, [listings, selectedCategoryFilter, searchQuery, sortBy, userLat, userLng]);

  const submitPickupRequest = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmittingRequest(true);

    const dist = parseFloat(calculateDistance(userLat, userLng, selectedListing.location?.coordinates?.[1], selectedListing.location?.coordinates?.[0])) || 0;
    const isPriced = selectedListing.pricingModel === 'priced' || (selectedListing.pricePerKg && selectedListing.pricePerKg > 0);
    const rate = isPriced ? (selectedListing.pricePerKg || 12) : 0;
    const subtotal = isPriced ? (selectedListing.totalPrice || Math.round(selectedListing.weight * rate)) : 0;
    const logisticsFee = isPriced ? Math.round(dist * 15) : Math.round(dist * 10);
    const tax = isPriced ? Math.round(subtotal * 0.05) : 0;
    const grandTotal = subtotal + logisticsFee + tax;
    const invNum = `INV-ECO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const txId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const pStatus = isPriced ? (paymentMethod === 'pod' ? 'pending_pod' : paymentMethod === 'escrow' ? 'escrow' : 'paid') : 'free';
    const pMethod = isPriced ? paymentMethod : 'free';

    // Simulate payment processing delay for realistic UX
    await new Promise(r => setTimeout(r, 600));

    const payload = {
      listingId: selectedListing._id,
      notes: requestNotes,
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      paymentMethod: pMethod,
      paymentStatus: pStatus,
      unitPrice: rate,
      subtotal,
      logisticsFee,
      tax,
      totalAmount: grandTotal,
      invoiceNumber: invNum,
      transactionId: txId
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      let createdOrder = null;

      if (response && response.ok) {
        createdOrder = await response.json();
        setMyRequests(prev => [createdOrder, ...prev]);
      } else {
        // Fallback local request tagged with producer identity
        const targetProducerId = (selectedListing.producer?._id || selectedListing.producerId || selectedListing.producer || '').toString();
        const targetProducerEmail = (selectedListing.producer?.email || selectedListing.producerEmail || '').toLowerCase().trim();

        createdOrder = {
          _id: 'req_' + Math.random().toString(36).substring(2, 9),
          listing: selectedListing,
          consumer: user || { _id: currentUserId, name: 'Bio-Energy Recycler', email: currentEmail },
          consumerId: currentUserId || 'local_recycler',
          consumerEmail: currentEmail,
          producer: selectedListing.producer || targetProducerId || 'local_user',
          producerId: targetProducerId,
          producerEmail: targetProducerEmail,
          scheduledTime: payload.scheduledTime,
          status: 'pending',
          notes: requestNotes,
          paymentMethod: pMethod,
          paymentStatus: pStatus,
          unitPrice: rate,
          subtotal,
          logisticsFee,
          tax,
          totalAmount: grandTotal,
          invoiceNumber: invNum,
          transactionId: txId,
          createdAt: new Date().toISOString()
        };
        const localReqs = JSON.parse(localStorage.getItem('ecolink_local_requests') || '[]');
        localReqs.unshift(createdOrder);
        localStorage.setItem('ecolink_local_requests', JSON.stringify(localReqs));

        setMyRequests(prev => [createdOrder, ...prev]);

        // Update local listing status to requested
        setListings(prev => prev.map(l => l._id === selectedListing._id ? { ...l, status: 'requested' } : l));
        const localListings = JSON.parse(localStorage.getItem('ecolink_local_listings') || '[]');
        const updatedLocal = localListings.map(l => l._id === selectedListing._id ? { ...l, status: 'requested' } : l);
        localStorage.setItem('ecolink_local_listings', JSON.stringify(updatedLocal));
      }

      setSelectedListing(null);
      setRequestNotes('');
      setCheckoutStep(1);
      
      setRefreshToast('🚚 Truck Pickup Dispatched! Waste seller notified for approval.');
      setTimeout(() => setRefreshToast(''), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleConfirmCompletion = async (requestId) => {
    // Update state locally first
    setMyRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'completed' } : r));
    const localReqs = JSON.parse(localStorage.getItem('ecolink_local_requests') || '[]');
    const updatedLocal = localReqs.map(r => r._id === requestId ? { ...r, status: 'completed' } : r);
    localStorage.setItem('ecolink_local_requests', JSON.stringify(updatedLocal));

    try {
      await fetch(`${apiBaseUrl}/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      }).catch(() => null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    setMyRequests(prev => prev.filter(r => r._id !== requestId));
    const localReqs = JSON.parse(localStorage.getItem('ecolink_local_requests') || '[]');
    const updatedLocal = localReqs.filter(r => r._id !== requestId);
    localStorage.setItem('ecolink_local_requests', JSON.stringify(updatedLocal));

    try {
      await fetch(`${apiBaseUrl}/api/requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);

      setRefreshToast('🗑️ Order removed from history!');
      setTimeout(() => setRefreshToast(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this waste batch listing?')) return;

    setListings(prev => prev.filter(l => l._id !== listingId));
    const localListings = JSON.parse(localStorage.getItem('ecolink_local_listings') || '[]');
    const updatedLocal = localListings.filter(l => l._id !== listingId);
    localStorage.setItem('ecolink_local_listings', JSON.stringify(updatedLocal));

    if (selectedListing?._id === listingId) {
      setSelectedListing(null);
    }

    try {
      await fetch(`${apiBaseUrl}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);

      setRefreshToast('🗑️ Batch deleted successfully!');
      setTimeout(() => setRefreshToast(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const categoryTotals = {
    raw_organic: 0,
    cooked_food: 0,
    bakery: 0,
    oil_grease: 0,
    green_waste: 0
  };
  myRequests.forEach(req => {
    const listing = req.listing;
    if (listing && categoryTotals[listing.category] !== undefined) {
      categoryTotals[listing.category] += listing.weight;
    }
  });
  const maxCategoryWeight = Math.max(...Object.values(categoryTotals), 1);

  const totalProcuredWeight = myRequests
    .filter(req => req.status === 'completed' || req.status === 'accepted')
    .reduce((sum, req) => sum + (req.listing?.weight || 0), 0);

  const co2Saved = totalProcuredWeight * 0.8;
  const biogasProduced = totalProcuredWeight * 0.4;
  const energyGenerated = biogasProduced * 2.0;

  // Active en-route pickups
  const activeEnRouteCount = myRequests.filter(req => req.status === 'accepted').length;

  // Plant Operational Metrics Header Bar
  const RecyclerPlantMetricBar = () => {
    const isPlantActive = activeEnRouteCount > 0 || totalProcuredWeight > 0;
    const plantEfficiency = isPlantActive ? 94 : 0;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%' }}>
        
        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.digesterStatus}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={isPlantActive ? "pulse-dot" : ""} style={!isPlantActive ? { width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' } : {}}></span>
              <span style={{ fontSize: '11px', color: isPlantActive ? '#059669' : '#64748b', fontWeight: '700' }}>
                {isPlantActive ? t.active : (t.standby || 'Standby')}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: isPlantActive ? '#0d9488' : '#64748b', marginTop: '4px' }}>
            {plantEfficiency}% <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{t.efficiency || 'efficiency'}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {isPlantActive ? (t.reactorOnline || 'Bio-methane reactor processing') : (t.reactorIdle || 'Reactor in standby mode')}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.dailyFeedstockTarget}</span>
            <span style={{ fontSize: '18px' }}>🎯</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
            {totalProcuredWeight} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>/ 1,000 kg</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((totalProcuredWeight / 1000) * 100, 100)}%`, height: '100%', background: '#059669', borderRadius: '3px' }}></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.activeFleetTrucks}</span>
            <span style={{ fontSize: '18px' }}>🚚</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: activeEnRouteCount > 0 ? '#d97706' : '#1e293b', marginTop: '4px' }}>
            {activeEnRouteCount} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>en route</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pickups scheduled</span>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.cleanPowerYield}</span>
            <span style={{ fontSize: '18px' }}>⚡</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {energyGenerated.toFixed(1)} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>kWh</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Grid feed capacity</span>
        </div>

      </div>
    );
  };

  // Analytics View
  if (activeNavTab === 'analytics') {
    return (
      <div style={{ maxWidth: '1200px', width: '100%', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', color: '#ffffff', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>⚡ Bio-Energy Recycler ESG Analytics</h2>
            <p style={{ fontSize: '13px', color: '#ffffff', marginTop: '4px', opacity: 0.95, fontWeight: '500' }}>Track bio-methane conversion, power output, and carbon reduction metrics</p>
          </div>
          <button onClick={fetchData} className="nav-icon-btn" title="Refresh Analytics">
            <RefreshCw style={{ width: '16px', height: '16px' }} className={loadingListings ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '13px', color: '#64748b' }}>☁️ Carbon Offset</span>
            <h3 style={{ fontSize: '28px', color: '#059669', marginTop: '6px' }}>{co2Saved.toFixed(1)} kg CO₂</h3>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Diverted from landfill methane decay</p>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '13px', color: '#64748b' }}>🔥 Biogas Yield</span>
            <h3 style={{ fontSize: '28px', color: '#0d9488', marginTop: '6px' }}>{biogasProduced.toFixed(1)} m³</h3>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Bio-methane fuel generated</p>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '13px', color: '#64748b' }}>⚡ Clean Energy Output</span>
            <h3 style={{ fontSize: '28px', color: '#d97706', marginTop: '6px' }}>{energyGenerated.toFixed(1)} kWh</h3>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Renewable electricity feed</p>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>Procured Biomass Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(categoryTotals).map(([cat, val]) => {
              const percentage = (val / maxCategoryWeight) * 100;
              const formattedName = cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{formattedName}</span>
                    <strong style={{ color: '#059669' }}>{val.toFixed(1)} kg</strong>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: '#059669', borderRadius: '5px', transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Official ESG Zero-Waste Sustainability Certificate Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
          border: '2px solid #a7f3d0',
          borderRadius: '24px',
          padding: '28px 32px',
          boxShadow: '0 12px 30px rgba(16, 185, 129, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Certificate Seal Watermark Background */}
          <div style={{
            position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05,
            fontSize: '180px', pointerEvents: 'none', userSelect: 'none'
          }}>
            📜
          </div>

          {/* Top Badge & Certificate No. Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#d1fae5', border: '2px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <Award style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#059669', display: 'block' }}>Official Certification</span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>ESG & Clean Energy Bio-Recycler Certificate</h3>
              </div>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '700', background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '8px', color: '#475569' }}>
              CERT-BIO-{new Date().getFullYear()}-09941
            </span>
          </div>

          {/* Certificate Content Body */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              This certificate officially recognizes <strong>Bio-Energy Recycler Facility</strong> for verified processing of organic waste streams into clean methane fuel and renewable power generation.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>Total Biomass Procured</span>
                <strong style={{ fontSize: '15px', color: '#059669', fontWeight: '800' }}>{(totalProcuredWeight / 1000).toFixed(2)} Tons</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>Carbon Offset</span>
                <strong style={{ fontSize: '15px', color: '#0d9488', fontWeight: '800' }}>{co2Saved.toFixed(1)} kg CO₂</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>Verification Status</span>
                <strong style={{ fontSize: '13px', color: '#10b981', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Verified Active
                </strong>
              </div>
            </div>
          </div>

          {/* Certificate Actions: Print & Download Certificate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              Issued by <strong>National Bio-Energy Grid</strong>
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155',
                  borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease'
                }}
              >
                <Printer style={{ width: '14px', height: '14px' }} /> Print Certificate
              </button>
              <button
                type="button"
                onClick={() => alert('📜 Downloading official ESG Bio-Recycler Certificate PDF...')}
                style={{
                  background: '#10b981', color: '#ffffff', border: 'none',
                  borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease'
                }}
              >
                <Download style={{ width: '14px', height: '14px' }} /> Download Certificate PDF
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Orders View with Logistics 4-Step Tracker
  if (activeNavTab === 'orders') {
    const filteredRequests = myRequests.filter(req => {
      if (orderStatusFilter === 'active') return req.status === 'accepted' || req.status === 'pending';
      if (orderStatusFilter === 'completed') return req.status === 'completed';
      return true;
    });

    return (
      <div style={{ maxWidth: '1200px', width: '100%', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Title & Refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', color: '#ffffff', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>🚚 Biomass Orders & Logistics Tracker</h2>
            <p style={{ fontSize: '13px', color: '#ffffff', marginTop: '4px', opacity: 0.95, fontWeight: '500' }}>Track active trucks en route and confirm completed deliveries</p>
          </div>
          <button onClick={fetchData} className="nav-icon-btn" title="Refresh Pickups">
            <RefreshCw style={{ width: '16px', height: '16px' }} className={loadingListings ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Status Filter Buttons */}
        <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Filter Orders by Status:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setOrderStatusFilter('all')}
              style={{
                padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                border: orderStatusFilter === 'all' ? '2px solid #059669' : '1px solid #cbd5e1',
                background: orderStatusFilter === 'all' ? '#ecfdf5' : '#ffffff',
                color: orderStatusFilter === 'all' ? '#059669' : '#64748b'
              }}
            >
              All ({myRequests.length})
            </button>
            <button
              onClick={() => setOrderStatusFilter('active')}
              style={{
                padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                border: orderStatusFilter === 'active' ? '2px solid #d97706' : '1px solid #cbd5e1',
                background: orderStatusFilter === 'active' ? '#fffbeb' : '#ffffff',
                color: orderStatusFilter === 'active' ? '#d97706' : '#64748b'
              }}
            >
              🚚 Active ({myRequests.filter(r => r.status === 'accepted' || r.status === 'pending').length})
            </button>
            <button
              onClick={() => setOrderStatusFilter('completed')}
              style={{
                padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                border: orderStatusFilter === 'completed' ? '2px solid #059669' : '1px solid #cbd5e1',
                background: orderStatusFilter === 'completed' ? '#ecfdf5' : '#ffffff',
                color: orderStatusFilter === 'completed' ? '#059669' : '#64748b'
              }}
            >
              ✅ Completed ({myRequests.filter(r => r.status === 'completed').length})
            </button>
          </div>
        </div>
        
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>Biomass Logistics List</h3>
          
          {filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>No biomass orders in this filter.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Use the Live Map tab to discover and request nearby waste batches.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';
                const isCompleted = req.status === 'completed';

                return (
                  <div key={req._id} className="glass-card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${req.status}`}>{req.status}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            ID: {req._id.substring(0, 8)}
                          </span>
                          {req.paymentStatus === 'paid' && (
                            <span style={{ fontSize: '11px', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', border: '1px solid #86efac' }}>
                              ✓ Paid ({req.paymentMethod?.toUpperCase() || 'ONLINE'})
                            </span>
                          )}
                          {req.paymentStatus === 'escrow' && (
                            <span style={{ fontSize: '11px', fontWeight: '800', background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '6px', border: '1px solid #99f6e4' }}>
                              🛡️ Escrow Secured
                            </span>
                          )}
                          {req.paymentStatus === 'pending_pod' && (
                            <span style={{ fontSize: '11px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                              💵 Pay on Pickup
                            </span>
                          )}
                          {(!req.paymentStatus || req.paymentStatus === 'free') && (
                            <span style={{ fontSize: '11px', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                              🎁 Free Batch
                            </span>
                          )}
                        </div>
                        <h4 style={{ color: '#1e293b', fontSize: '16px', fontWeight: '700', marginTop: '6px' }}>
                          ⚖️ {req.listing?.weight} kg of {req.listing?.category?.replace('_', ' ')}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          <strong>Seller:</strong> {req.listing?.producer?.name || 'Commercial Waste Seller'} {req.totalAmount ? `• Total Paid: ₹${req.totalAmount.toLocaleString()}` : ''}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedInvoice(req)}
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#059669',
                            borderRadius: '10px',
                            padding: '9px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Receipt style={{ width: '14px', height: '14px' }} /> Tax Invoice
                        </button>
                        {isAccepted && (
                          <button 
                            onClick={() => handleConfirmCompletion(req._id)} 
                            className="auth-submit-btn" 
                            style={{ padding: '10px 18px', fontSize: '13px', width: 'auto' }}
                          >
                            ✓ Confirm Delivered to Plant
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req._id)}
                          title="Delete Order from History"
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            borderRadius: '10px',
                            padding: '9px 14px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} /> Delete History
                        </button>
                      </div>
                    </div>

                    {/* 4-Step Interactive Logistics Timeline */}
                    <div style={{ background: '#ffffff', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                      
                      {/* Step 1 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          ✓
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Request Sent</span>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Submitted</span>
                      </div>

                      {/* Step 2 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isAccepted || isCompleted ? '#059669' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {isAccepted || isCompleted ? '✓' : '2'}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: isAccepted || isCompleted ? '#1e293b' : '#94a3b8' }}>Seller Approved</span>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>{isPending ? 'Pending' : 'Confirmed'}</span>
                      </div>

                      {/* Step 3 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isAccepted ? '#d97706' : isCompleted ? '#059669' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {isAccepted ? '🚚' : isCompleted ? '✓' : '3'}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: isAccepted || isCompleted ? '#1e293b' : '#94a3b8' }}>Truck En Route</span>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>{isAccepted ? 'In Transit' : isCompleted ? 'Done' : 'Waiting'}</span>
                      </div>

                      {/* Step 4 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isCompleted ? '#059669' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {isCompleted ? '⚡' : '4'}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: isCompleted ? '#059669' : '#94a3b8' }}>Plant Digested</span>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>{isCompleted ? 'Converted' : 'Pending'}</span>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Live Map & Discovery View with Category Filter, Sorting, Route Polyline, and Yield Calculator
  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Floating Refresh Toast */}
      {refreshToast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 2500,
          background: '#10b981', color: '#ffffff', padding: '10px 18px', borderRadius: '12px',
          fontSize: '13px', fontWeight: '700', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <CheckCircle2 style={{ width: '16px', height: '16px' }} /> {refreshToast}
        </div>
      )}

      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#ffffff', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{t.liveBiomassDiscoveryMap}</h2>
          <p style={{ fontSize: '13px', color: '#ffffff', marginTop: '4px', opacity: 0.95, fontWeight: '500' }}>{t.locateNearbyOrganicWaste}</p>
        </div>
        <button onClick={() => fetchData(true)} className="nav-icon-btn" title="Refresh Live Map">
          <RefreshCw style={{ width: '16px', height: '16px' }} className={loadingListings ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Recycler Plant Metrics Bar */}
      <RecyclerPlantMetricBar />

      <div className="dashboard-grid fade-in">
        
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Radius & Search Controls */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass style={{ color: '#059669', width: '18px', height: '18px' }} /> Search & Radius Controls
            </h3>
            
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Search Text Input Field with Clear Button */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search style={{ position: 'absolute', left: '12px', width: '16px', height: '16px', color: '#059669', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="glass-form-input"
                  placeholder="Search seller, city, area or waste type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', paddingRight: searchQuery ? '32px' : '12px', fontSize: '13px', width: '100%' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', right: '10px', background: 'none', border: 'none',
                      color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '2px'
                    }}
                    title="Clear Search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Radius Select & Search Submit Button */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="glass-form-input"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  <option value="5" style={{ background: '#ffffff', color: '#1e293b' }}>Within 5 km</option>
                  <option value="15" style={{ background: '#ffffff', color: '#1e293b' }}>Within 15 km</option>
                  <option value="25" style={{ background: '#ffffff', color: '#1e293b' }}>Within 25 km</option>
                  <option value="50" style={{ background: '#ffffff', color: '#1e293b' }}>Within 50 km</option>
                  <option value="100" style={{ background: '#ffffff', color: '#1e293b' }}>Within 100 km</option>
                </select>
                <button 
                  type="submit"
                  className="auth-submit-btn" 
                  style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                  title="Click to Search & Filter Map"
                >
                  <Search style={{ width: '16px', height: '16px' }} /> Search
                </button>
              </div>

              {/* Sort By dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#64748b' }} />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-form-input"
                  style={{ padding: '6px 10px', fontSize: '12px', flex: 1 }}
                >
                  <option value="distance" style={{ background: '#ffffff', color: '#1e293b' }}>📍 Distance (Nearest First)</option>
                  <option value="weight" style={{ background: '#ffffff', color: '#1e293b' }}>⚖️ Weight (Largest First)</option>
                  <option value="expiry" style={{ background: '#ffffff', color: '#1e293b' }}>⏳ Expiry (Expiring Soonest)</option>
                </select>
              </div>

            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ color: '#059669', width: '18px', height: '18px' }} /> Filter Category
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'raw_organic', label: '🥦 Raw Organic' },
                { id: 'cooked_food', label: '🍲 Cooked' },
                { id: 'bakery', label: '🍞 Bakery' },
                { id: 'oil_grease', label: '🛢️ Oil/Grease' },
                { id: 'green_waste', label: '🌿 Garden' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: selectedCategoryFilter === cat.id ? '1px solid #059669' : '1px solid #e2e8f0',
                    background: selectedCategoryFilter === cat.id ? '#ecfdf5' : '#f8fafc',
                    color: selectedCategoryFilter === cat.id ? '#059669' : '#64748b'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nearby Batches List */}
          <div className="glass-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin style={{ color: '#059669', width: '18px', height: '18px' }} /> Batches Found ({processedListings.length})
            </h3>
            {processedListings.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '16px' }}>
                No active waste listings match your filters.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {processedListings.map(item => {
                  const coords = item.location?.coordinates;
                  const dist = coords ? calculateDistance(userLat, userLng, coords[1], coords[0]) : '0';
                  const isPriced = item.pricingModel === 'priced' || (item.pricePerKg && item.pricePerKg > 0);
                  const itemRate = isPriced ? (item.pricePerKg || 12) : 0;
                  const itemTotal = isPriced ? (item.totalPrice || Math.round(item.weight * itemRate)) : 0;

                  return (
                    <div 
                      key={item._id} 
                      style={{ 
                        padding: '12px', borderRadius: '12px', 
                        background: selectedListing?._id === item._id ? '#ecfdf5' : '#ffffff', 
                        border: selectedListing?._id === item._id ? '2px solid #059669' : '1px solid #cbd5e1',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                            {item.weight} kg {item.category.replace('_', ' ')}
                          </span>
                          {isPriced ? (
                            <span style={{ fontSize: '10px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                              💰 ₹{itemRate}/kg (₹{itemTotal})
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '6px', border: '1px solid #86efac' }}>
                              🎁 FREE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span>🏬 {item.producer?.name || 'Seller'}</span>
                          <span>📍 {dist} km away</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            if (coords) setMapCenter([coords[1], coords[0]]);
                            setSelectedListing(item);
                            setCheckoutStep(1);
                          }}
                          className="auth-submit-btn"
                          style={{ padding: '7px 12px', fontSize: '11px', width: 'auto', height: 'auto', background: isPriced ? '#d97706' : '#10b981' }}
                        >
                          {isPriced ? '🛒 Buy / Procure' : '🚚 Select & Route'}
                        </button>
                        <button
                          onClick={() => handleDeleteListing(item._id)}
                          title="Delete Waste Batch Listing"
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Biomass Yield Calculator Widget */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac' }}>
            <h3 style={{ fontSize: '14px', color: '#166534', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator style={{ width: '16px', height: '16px', color: '#059669' }} /> Biomass Yield Calculator
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ color: '#374151', fontWeight: '600' }}>Batch Weight (kg):</label>
                <input
                  type="number"
                  value={calculatorWeight}
                  onChange={(e) => setCalculatorWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                  style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>🔥 Biogas</span>
                  <strong style={{ fontSize: '12px', color: '#0d9488' }}>{(calculatorWeight * 0.4).toFixed(1)} m³</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>⚡ Power</span>
                  <strong style={{ fontSize: '12px', color: '#d97706' }}>{(calculatorWeight * 0.8).toFixed(1)} kWh</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>💰 Value</span>
                  <strong style={{ fontSize: '12px', color: '#059669' }}>₹{(calculatorWeight * 0.8 * 8.5).toFixed(0)}</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Content Area: Leaflet Map & Selected Listing Route Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#1e293b' }}>📍 Live Interactive Biomass Map</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedListing ? `Visualizing route to ${selectedListing.producer?.name || 'Seller'}` : 'Select any pin to view route & distance.'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot"></span>
                <span style={{ fontSize: '12px', color: '#059669' }}>Real-time Feed</span>
              </div>
            </div>

            <div className="map-container">
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                minZoom={10}
                scrollWheelZoom={false}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <LayersControl position="topright">
                  <BaseLayer checked name="🗺️ Street View">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </BaseLayer>
                  <BaseLayer name="🛰️ Satellite Imagery">
                    <TileLayer
                      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </BaseLayer>
                  <BaseLayer name="🌙 Dark Eco View">
                    <TileLayer
                      attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                  </BaseLayer>
                </LayersControl>
                
                <MapController center={mapCenter} listings={processedListings} />

                {/* Pickup Radius Circle (5km / 15km / 25km / 50km) */}
                {userLat && userLng && (
                  <Circle
                    center={[userLat, userLng]}
                    radius={parseFloat(radius) * 1000}
                    pathOptions={{
                      color: '#059669',
                      fillColor: '#10b981',
                      fillOpacity: 0.08,
                      weight: 2,
                      dashArray: '6, 6'
                    }}
                  />
                )}

                {/* Biomass plant (Self) marker */}
                {user?.location?.coordinates && (
                  <Marker 
                    position={[user.location.coordinates[1], user.location.coordinates[0]]} 
                    icon={createCustomMarker('⚡', '#0d9488')}
                  >
                    <Popup>
                      <div style={{ minWidth: '160px' }}>
                        <strong style={{ color: '#0d9488', fontSize: '13px' }}>⚡ Your Bio-Energy Plant</strong>
                        <p style={{ fontSize: '11px', color: '#1e293b', margin: '4px 0 0', fontWeight: '600' }}>{user.name}</p>
                        <span style={{ fontSize: '10px', color: '#059669', display: 'block', marginTop: '2px' }}>
                          🎯 Target Radius Zone: {radius} km
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Connection Line when a listing is selected */}
                {selectedListing?.location?.coordinates && user?.location?.coordinates && (
                  <Polyline
                    positions={[
                      [user.location.coordinates[1], user.location.coordinates[0]],
                      [selectedListing.location.coordinates[1], selectedListing.location.coordinates[0]]
                    ]}
                    color="#059669"
                    weight={4}
                    dashArray="8, 8"
                  />
                )}

                {/* Listings Markers */}
                {processedListings.map((item) => {
                  if (!item.location?.coordinates) return null;
                  const [lng, lat] = item.location.coordinates;
                  const dist = calculateDistance(userLat, userLng, lat, lng);
                  const { emoji, color } = getCategoryMarkerInfo(item.category);

                  const isPriced = item.pricingModel === 'priced' || (item.pricePerKg && item.pricePerKg > 0);
                  const itemRate = isPriced ? (item.pricePerKg || 12) : 0;
                  const itemTotal = isPriced ? (item.totalPrice || Math.round(item.weight * itemRate)) : 0;

                  return (
                    <Marker 
                      key={item._id} 
                      position={[lat, lng]} 
                      icon={createCustomMarker(emoji, color)}
                    >
                      <Popup>
                        <div style={{ minWidth: '240px', padding: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            {isPriced ? (
                              <span style={{ fontSize: '11px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                                💰 ₹{itemRate}/kg
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', border: '1px solid #86efac' }}>
                                🎁 Free Batch
                              </span>
                            )}
                            <strong style={{ color: '#059669', fontSize: '15px', fontWeight: '800' }}>{item.weight} kg</strong>
                          </div>
                          <h4 style={{ color: '#1e293b', fontSize: '14px', margin: '0 0 4px', fontWeight: '800' }}>
                            {emoji} {item.category.replace('_', ' ').toUpperCase()}
                          </h4>
                          <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 6px' }}>
                            <strong>Seller:</strong> {item.producer?.name || 'Commercial Waste Seller'}
                          </p>
                          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '6px 0', fontSize: '11px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div>📍 Distance: <strong>{dist} km</strong></div>
                            <div>🔥 Biogas Yield: <strong>{(item.weight * 0.4).toFixed(1)} m³</strong></div>
                            {isPriced && <div>💵 Est. Batch Cost: <strong style={{ color: '#d97706' }}>₹{itemTotal}</strong></div>}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedListing(item);
                              setCheckoutStep(1);
                            }}
                            className="auth-submit-btn"
                            style={{ width: '100%', padding: '10px 12px', fontSize: '12px', marginTop: '6px', background: isPriced ? '#d97706' : '#10b981' }}
                          >
                            {isPriced ? '🛒 Procure & Checkout' : '🚚 Request Free Pickup'}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Selected Listing B2B Pickup Dispatch Card */}
          {selectedListing && (() => {
            const distVal = parseFloat(calculateDistance(userLat, userLng, selectedListing.location?.coordinates?.[1], selectedListing.location?.coordinates?.[0])) || 0;
            const isPriced = selectedListing.pricingModel === 'priced' || (selectedListing.pricePerKg && selectedListing.pricePerKg > 0);
            const rate = isPriced ? (selectedListing.pricePerKg || 12) : 0;
            const batchVal = isPriced ? (selectedListing.totalPrice || Math.round(selectedListing.weight * rate)) : 0;

            return (
              <div className="glass-card fade-in" style={{ border: '2px solid #059669', background: '#ffffff', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)', borderRadius: '24px', padding: '24px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck style={{ color: '#059669', width: '22px', height: '22px' }} /> 
                      Dispatch Truck & Request Biomass Pickup
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                      Seller: <strong>{selectedListing.producer?.name || 'Commercial Waste Seller'}</strong> • Location: 📍 {distVal} km away
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedListing(null)} 
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Logistics & Yield Metrics Cards */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>RESOURCE BATCH</span>
                    <strong style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{selectedListing.weight} kg {selectedListing.category.replace('_', ' ').toUpperCase()}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>FREIGHT DISTANCE</span>
                    <strong style={{ fontSize: '14px', color: '#059669', fontWeight: '800' }}>📍 {distVal} km</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block' }}>EST. BIOGAS YIELD</span>
                    <strong style={{ fontSize: '14px', color: '#0d9488', fontWeight: '800' }}>🔥 {(selectedListing.weight * 0.4).toFixed(1)} m³</strong>
                  </div>
                </div>

                {/* Batch Commercial Metadata Badge */}
                <div style={{ background: isPriced ? '#fffbeb' : '#f0fdf4', border: isPriced ? '1px solid #fde68a' : '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{isPriced ? '💰' : '🎁'}</span>
                    <div>
                      <strong style={{ fontSize: '13px', color: isPriced ? '#b45309' : '#15803d', display: 'block' }}>
                        {isPriced ? `Priced Batch: ₹${rate}/kg` : 'Free Organic Waste Donation'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {isPriced ? `Est. Batch Value: ₹${batchVal.toLocaleString()}` : 'Zero cost feedstock pickup'}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: isPriced ? '#b45309' : '#15803d', background: '#ffffff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {isPriced ? `Total ₹${batchVal.toLocaleString()}` : 'Free'}
                  </span>
                </div>

                {/* Pickup Dispatch Form */}
                <form onSubmit={submitPickupRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Fleet Truck & Driver Pickup Notes (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Truck MH-04-AB-1234 arriving at 3:30 PM for collection" 
                      className="glass-form-input" 
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      style={{ fontSize: '13px', padding: '12px 14px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedListing(null)} 
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '12px 20px', borderRadius: '14px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="auth-submit-btn" 
                      style={{ width: 'auto', padding: '12px 24px', fontSize: '14px', fontWeight: '800', background: '#10b981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }} 
                      disabled={submittingRequest}
                    >
                      {submittingRequest ? 'Dispatching Truck...' : '🚚 Confirm Pickup Dispatch'}
                    </button>
                  </div>
                </form>

              </div>
            );
          })()}

        </div>

      </div>

      {/* Official Tax Invoice & Purchase Receipt Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, padding: '20px'
        }}>
          <div className="fade-in" style={{
            background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '720px',
            maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            position: 'relative', border: '1px solid #cbd5e1'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedInvoice(null)}
              style={{
                position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9',
                border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                cursor: 'pointer', fontSize: '18px', color: '#64748b', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {/* Invoice Top Brand Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #059669', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🌱</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
                    <span style={{ color: '#10b981' }}>Eco</span>Link
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginTop: '2px' }}>
                  B2B Biodegradable Waste & Bio-Energy Exchange
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#059669', display: 'block' }}>TAX INVOICE</span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '700', color: '#475569' }}>
                  {selectedInvoice.invoiceNumber || `INV-ECO-2026-${selectedInvoice._id.substring(0, 6).toUpperCase()}`}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                  Date: {new Date(selectedInvoice.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Seller & Buyer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  SELLER (WASTE PRODUCER)
                </span>
                <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block' }}>
                  {selectedInvoice.listing?.producer?.name || selectedInvoice.producer?.name || 'Green Earth Organics'}
                </strong>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>
                  Commercial Food Business Facility<br />
                  GSTIN: 27AAACE1234F1Z8<br />
                  Contact: {selectedInvoice.listing?.producer?.contact?.phone || '9876543210'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  BUYER (BIO-ENERGY RECYCLER)
                </span>
                <strong style={{ fontSize: '14px', color: '#059669', display: 'block' }}>
                  {selectedInvoice.consumer?.name || user?.name || 'BioPower Energy Solutions'}
                </strong>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>
                  Biomethane & Bio-Energy Processing Plant<br />
                  GSTIN: 27BBBPE5678G1Z2<br />
                  Txn Ref: {selectedInvoice.transactionId || `TXN-${selectedInvoice._id.substring(0, 8).toUpperCase()}`}
                </p>
              </div>
            </div>

            {/* Itemized Invoice Table */}
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#059669', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', borderRadius: '8px 0 0 8px' }}>Description / Feedstock</th>
                    <th style={{ padding: '10px 12px' }}>Weight (kg)</th>
                    <th style={{ padding: '10px 12px' }}>Rate (₹/kg)</th>
                    <th style={{ padding: '10px 12px' }}>Freight Fee (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>
                      {selectedInvoice.listing?.category?.replace('_', ' ').toUpperCase() || 'ORGANIC WASTE BATCH'}
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>{selectedInvoice.listing?.weight || 0} kg</td>
                    <td style={{ padding: '12px', color: '#475569' }}>₹{selectedInvoice.unitPrice || 0}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>₹{(selectedInvoice.logisticsFee || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>
                      ₹{((selectedInvoice.subtotal || 0) + (selectedInvoice.logisticsFee || 0)).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 18px', borderRadius: '14px', maxWidth: '340px' }}>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  PAYMENT & VERIFICATION STATUS
                </span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  {selectedInvoice.paymentStatus === 'paid' && `VERIFIED PAID (${selectedInvoice.paymentMethod?.toUpperCase() || 'UPI'})`}
                  {selectedInvoice.paymentStatus === 'escrow' && 'VERIFIED ESCROW SECURED'}
                  {selectedInvoice.paymentStatus === 'pending_pod' && 'PAYMENT PENDING ON PICKUP'}
                  {(!selectedInvoice.paymentStatus || selectedInvoice.paymentStatus === 'free') && 'VERIFIED FREE DONATION ($0)'}
                </div>
                <span style={{ fontSize: '10px', color: '#059669', display: 'block', marginTop: '2px' }}>
                  Digitally signed & verified by EcoLink Smart Escrow Gateway
                </span>
              </div>

              <div style={{ minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Base Feedstock Subtotal:</span>
                  <strong>₹{(selectedInvoice.subtotal || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Logistics Transport:</span>
                  <strong>₹{(selectedInvoice.logisticsFee || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>GST Feedstock Tax (5%):</span>
                  <strong>₹{(selectedInvoice.tax || 0).toLocaleString()}</strong>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <span style={{ fontWeight: '800', color: '#0f172a' }}>Grand Total:</span>
                  <strong style={{ fontWeight: '900', color: '#059669', fontSize: '18px' }}>
                    ₹{(selectedInvoice.totalAmount || (selectedInvoice.subtotal || 0) + (selectedInvoice.logisticsFee || 0)).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Invoice Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Thank you for powering sustainable zero-waste bio-energy!
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155',
                    borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Printer style={{ width: '15px', height: '15px' }} /> Print Invoice
                </button>
                <button
                  type="button"
                  onClick={() => alert(`📜 Downloading B2B Tax Invoice ${selectedInvoice.invoiceNumber || 'INV-ECO'} PDF...`)}
                  style={{
                    background: '#10b981', color: '#ffffff', border: 'none',
                    borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Download style={{ width: '15px', height: '15px' }} /> Download PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BiomassDashboard;
