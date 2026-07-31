import React, { useState, useEffect } from 'react';
import { 
  Lock, ArrowRight, Download, Search, Check, RefreshCw, Smartphone, Mail, AlertCircle, 
  Trash2, QrCode as QrCodeIcon, KeyRound, ExternalLink, Calendar, Plus, UserCheck, 
  FileCheck, Copy, Shield, Sparkles, Filter, CheckCircle2, ChevronRight, Share2, 
  DollarSign, Table, Send, Ticket, Clock, CheckCircle, Tag, Camera, LayoutDashboard, Save,
  Receipt, BarChart3, SlidersHorizontal, ToggleLeft, ToggleRight, X, Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QrScannerComponent from '../components/admin/QrScanner';

interface Activity {
  name: string;
  price: number;
  count: number;
}

interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  activities: (string | Activity)[];
  specialRequest?: string;
  totalAmount: number;
  advancePaid: number;
  balancePaid?: number;
  remainingDue: number;
  paymentStatus: string;
  ticketStatus?: string;
  advancePaymentMode?: string;
  balancePaymentMode?: string;
  source?: string;
  createdBy?: string;
  agentName?: string;
  notes?: string;
  createdAt: string;
  isDeleted?: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBill: number;
  active: boolean;
  usageCount: number;
  createdAt: string;
}

const AVAILABLE_ACTIVITIES = [
  { name: 'Parasailing', price: 2500 },
  { name: 'Jet Ski', price: 700 },
  { name: 'Flying Fish', price: 600 },
  { name: 'Speed Boat', price: 500 },
  { name: 'Banana Boat', price: 500 },
  { name: 'Crazy Sofa', price: 500 },
  { name: 'Doughnut Boat', price: 500 },
  { name: 'ATV Beach Ride', price: 300 },
  { name: 'PACK 2500', price: 2500 },
  { name: 'OVERALL Package', price: 4500 }
];

export function isPackageOption(activityName: string): boolean {
  if (!activityName) return false;
  const lower = activityName.toLowerCase();
  return (
    lower.includes('package') ||
    lower.includes('pack') ||
    lower.includes('parasailing') ||
    lower === 'overall'
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [manualBookings, setManualBookings] = useState<Booking[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'standard' | 'manual'>('standard');
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'bookings' | 'manual' | 'scanner' | 'coupons'>('dashboard');
  const [loading, setLoading] = useState(true);

  // First-time setup states
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isSetupChecking, setIsSetupChecking] = useState(true);
  const [setupMobile, setSetupMobile] = useState('');
  const [setupOtp, setSetupOtp] = useState('');
  const [setupOtpRequested, setSetupOtpRequested] = useState(false);
  const [setupOtpTimeLeft, setSetupOtpTimeLeft] = useState<number>(600);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMobile, setResetMobile] = useState('');
  const [resetOtpRequested, setResetOtpRequested] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetOtpTimeLeft, setResetOtpTimeLeft] = useState<number>(600);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Management & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Manual Booking Form State
  const [manualBookingForm, setManualBookingForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    guests: 1,
    activities: [] as string[],
    advancePaid: 0,
    advancePaymentMode: 'Cash',
    agentName: 'Desk Agent 1',
    notes: '',
    customTotalAmount: ''
  });

  // Selected Booking Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingWaiver, setSelectedBookingWaiver] = useState<any>(null);
  const [loadingWaiver, setLoadingWaiver] = useState(false);
  const [settlingAmount, setSettlingAmount] = useState<number | string>('');
  const [settlingPaymentMode, setSettlingPaymentMode] = useState<string>('Cash');
  const [editAdvancePaid, setEditAdvancePaid] = useState<number>(0);
  const [editAdvanceMode, setEditAdvanceMode] = useState<string>('UPI');
  const [editBalancePaid, setEditBalancePaid] = useState<number>(0);
  const [editBalanceMode, setEditBalanceMode] = useState<string>('Cash');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('Pending');
  const [editActivities, setEditActivities] = useState<string[]>([]);
  const [isEditingActivities, setIsEditingActivities] = useState<boolean>(false);
  const [savingBooking, setSavingBooking] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const extractActivityNames = (activities: any): string[] => {
    if (!activities) return [];
    if (Array.isArray(activities)) {
      return activities.map(a => typeof a === 'object' && a !== null ? (a.name || String(a)) : String(a));
    }
    if (typeof activities === 'string') {
      if (activities.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(activities);
          if (Array.isArray(parsed)) {
            return parsed.map(a => typeof a === 'object' && a !== null ? (a.name || String(a)) : String(a));
          }
        } catch (e) {}
      }
      return activities.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    if (selectedBooking) {
      setEditAdvancePaid(selectedBooking.advancePaid || 0);
      setEditAdvanceMode(selectedBooking.advancePaymentMode || 'UPI');
      setEditBalancePaid(selectedBooking.balancePaid || 0);
      setEditBalanceMode(selectedBooking.balancePaymentMode || 'Cash');
      setEditPaymentStatus(selectedBooking.paymentStatus || 'Pending');
      setEditActivities(extractActivityNames(selectedBooking.activities));
      setIsEditingActivities(false);
      fetchWaiver(selectedBooking.id);
    } else {
      setSelectedBookingWaiver(null);
    }
  }, [selectedBooking?.id]);

  // Scanner alert banner state
  const [scanAlert, setScanAlert] = useState<{ show: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string; booking?: Booking } | null>(null);

  // Helper to switch sidebar tab and synchronize activeAdminTab cleanly
  const changeSidebarTab = (tab: 'dashboard' | 'bookings' | 'manual' | 'scanner' | 'coupons') => {
    setSidebarTab(tab);
    if (tab === 'bookings') setActiveAdminTab('standard');
    if (tab === 'manual') setActiveAdminTab('manual');
    setScanAlert(null); // Clear any banner when changing tabs
  };

  useEffect(() => {
    if (scanAlert && scanAlert.show) {
      const timer = setTimeout(() => {
        setScanAlert(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [scanAlert]);

  // Filtering & Pagination
  const [ticketFilter, setTicketFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [activityFilter, setActivityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Real-time auto sync counter
  const [secondsSinceSync, setSecondsSinceSync] = useState(0);

  // Google Sheets Modal & Webhook configuration
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsConfigUrl, setSheetsConfigUrl] = useState('');
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsTesting, setSheetsTesting] = useState(false);
  const [sheetsSyncing, setSheetsSyncing] = useState(false);
  const [sheetsRetrying, setSheetsRetrying] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<any>(null);
  const [sheetsMsg, setSheetsMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Coupon Engine states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minBill: 500,
    active: true
  });

  const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Add header row if sheet is brand new
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Booking ID", "Booked Date/Time", "Customer Name", "Phone", "Email",
        "Activity Date", "Time Slot", "Activities", "Guests", "Total Amount (₹)",
        "Advance Paid (₹)", "Balance Paid (₹)", "Remaining Due (₹)", "Payment Status",
        "Ticket Status", "Payment Mode", "Special Request", "Created At"
      ]);
      sheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#004E98").setFontColor("#FFFFFF");
    }
    
    sheet.appendRow([
      data.bookingId || data.id || "",
      data.bookedAt || new Date().toLocaleString('en-GB'),
      data.customerName || ((data.firstName || "") + " " + (data.lastName || "")).trim(),
      data.phone || "",
      data.email || "",
      data.date || "",
      data.time || "",
      Array.isArray(data.activities) ? data.activities.join(", ") : (data.activities || ""),
      data.guests || 1,
      data.totalAmount || 0,
      data.advancePaid || 0,
      data.balancePaid || 0,
      data.remainingDue || 0,
      data.paymentStatus || "",
      data.ticketStatus || "",
      data.paymentMode || data.advancePaymentMode || "",
      data.specialRequest || "",
      data.createdAt || new Date().toISOString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  // Check setup status
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setIsSetupChecking(true);
      const res = await fetch('/api/admin/check-setup');
      if (res.ok) {
        const data = await res.json();
        setIsSetup(data.isSetup);
      } else {
        setIsSetup(true);
      }
    } catch (e) {
      console.error(e);
      setIsSetup(true);
    } finally {
      setIsSetupChecking(false);
    }
  };

  const formatOtpTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup OTP 10-minute countdown timer
  useEffect(() => {
    if (!setupOtpRequested) return;
    const interval = setInterval(() => {
      setSetupOtpTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSetupError('OTP code has expired (10 minutes limit). Please click Resend OTP.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setupOtpRequested]);

  // Reset OTP 10-minute countdown timer
  useEffect(() => {
    if (!resetOtpRequested) return;
    const interval = setInterval(() => {
      setResetOtpTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setResetError('OTP code has expired (10 minutes limit). Please click Resend OTP.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resetOtpRequested]);

  // Auto increment sync timer (Only run when logged in)
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      setSecondsSinceSync(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [token]);

  // Sync background timer
  useEffect(() => {
    if (token) {
      fetchBookings();
      fetchManualBookings();
      fetchCoupons();
      const interval = setInterval(() => {
        fetchBookings();
        fetchManualBookings();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Fetch Coupons
  const fetchCoupons = async () => {
    if (!token) return;
    try {
      setLoadingCoupons(true);
      const res = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setShowCreateCoupon(false);
        setCouponForm({ code: '', discountType: 'percentage', discountValue: 10, minBill: 500, active: true });
        fetchCoupons();
      }
    } catch (err) {
      console.error('Error creating coupon:', err);
    }
  };

  const toggleCoupon = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !currentActive } : c));
      }
    } catch (err) {
      console.error('Error toggling coupon:', err);
    }
  };

  const deleteCoupon = async (id: string) => {
    setConfirmState({
      show: true,
      title: 'Delete Coupon',
      message: 'Are you sure you want to permanently delete this discount coupon?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/coupons/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setCoupons(prev => prev.filter(c => c.id !== id));
          }
        } catch (err) {
          console.error('Error deleting coupon:', err);
        }
        setConfirmState(null);
      }
    });
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const onlineOnly = Array.isArray(data) ? data.filter((b: any) => b.source !== 'manual' && !b.id?.startsWith('JMB')) : [];
        setBookings(onlineOnly);
        setSecondsSinceSync(0);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManualBookings = async () => {
    try {
      const response = await fetch('/api/manual-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const manualOnly = Array.isArray(data) ? data.filter((b: any) => b.source === 'manual' || b.id?.startsWith('JMB')) : [];
        setManualBookings(manualOnly);
      }
    } catch (error) {
      console.error("Error fetching manual bookings:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server connection error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  // Google Sheets Config handlers
  const fetchSheetsConfig = async () => {
    try {
      setSheetsLoading(true);
      const res = await fetch('/api/admin/sheets-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsConfigUrl(data.url || '');
      }
      fetchSheetsSyncStatus();
    } catch (e) {
      console.error("Failed to load Google Sheets configuration", e);
    } finally {
      setSheetsLoading(false);
    }
  };

  const fetchSheetsSyncStatus = async () => {
    try {
      const res = await fetch('/api/admin/sheets-sync-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsSyncStatus(data);
      }
    } catch (e) {}
  };

  const handleSaveSheetsUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetsMsg(null);
    try {
      setSheetsLoading(true);
      const res = await fetch('/api/admin/sheets-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ url: sheetsConfigUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetsMsg({ type: 'success', text: 'Google Sheets Webhook URL updated successfully!' });
        fetchSheetsSyncStatus();
      } else {
        setSheetsMsg({ type: 'error', text: data.error || 'Failed to update Webhook URL' });
      }
    } catch (err: any) {
      setSheetsMsg({ type: 'error', text: err.message || 'Connection failed' });
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleTestSheets = async () => {
    setSheetsMsg(null);
    setSheetsTesting(true);
    try {
      const res = await fetch('/api/admin/test-sheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSheetsMsg({ type: 'success', text: '✅ Test ping sent! Check your Google Sheet for a test row.' });
        fetchSheetsSyncStatus();
      } else {
        setSheetsMsg({ type: 'error', text: data.message || 'Failed to send test row to Google Sheet' });
      }
    } catch (err: any) {
      setSheetsMsg({ type: 'error', text: err.message || 'Failed to ping Google Sheets' });
    } finally {
      setSheetsTesting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm("⚠️ DANGER ZONE: Are you sure you want to PERMANENTLY CLEAR all test bookings, waivers, customer logs, and history from NeonDB & local storage?")) {
      return;
    }
    try {
      const res = await fetch('/api/admin/clear-all-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✨ All test data and history cleared successfully!");
        fetchBookings();
        fetchManualBookings();
      } else {
        alert("Error clearing data: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to connect to server: " + err.message);
    }
  };

  const handleSyncAllSheets = async () => {
    setSheetsMsg(null);
    setSheetsSyncing(true);
    try {
      const res = await fetch('/api/admin/sync-all-sheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSheetsMsg({ type: 'success', text: `✅ Sync complete! ${data.message}` });
        fetchSheetsSyncStatus();
      } else {
        setSheetsMsg({ type: 'error', text: data.message || 'Sync failed' });
      }
    } catch (err: any) {
      setSheetsMsg({ type: 'error', text: err.message || 'Bulk sync error' });
    } finally {
      setSheetsSyncing(false);
    }
  };

  const handleRetrySheets = async () => {
    setSheetsRetrying(true);
    try {
      const res = await fetch('/api/admin/retry-sheets-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSheetsMsg({ type: 'success', text: '✅ Retried sync queue successfully!' });
        fetchSheetsSyncStatus();
      }
    } catch (e) {
    } finally {
      setSheetsRetrying(false);
    }
  };

  const handleOpenSheetsModal = () => {
    setShowSheetsModal(true);
    fetchSheetsConfig();
  };

  // First-time setup OTP request
  const handleRequestSetupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    try {
      const res = await fetch('/api/admin/request-setup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: setupMobile })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupOtpRequested(true);
        setSetupOtpTimeLeft(600);
        setSetupSuccess('OTP sent! Valid for 10 minutes.');
      } else {
        setSetupError(data.error || 'Failed to send OTP.');
      }
    } catch (e) {
      setSetupError('Server error while requesting OTP.');
    }
  };

  // Submit First-time Setup
  const handleSetupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (password !== confirmPassword) {
      setSetupError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setSetupError('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await fetch('/api/admin/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: setupMobile,
          otp: setupOtp,
          password
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
        setIsSetup(true);
      } else {
        setSetupError(data.error || 'Failed to set password.');
      }
    } catch (e) {
      setSetupError('Server connection error.');
    }
  };

  // Password reset request OTP
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    try {
      const res = await fetch('/api/admin/request-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: resetMobile })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetOtpRequested(true);
        setResetOtpTimeLeft(600);
        setResetSuccess('OTP sent successfully! Valid for 10 minutes.');
      } else {
        setResetError(data.error || 'Failed to send reset OTP');
      }
    } catch (e) {
      setResetError('Server connection error');
    }
  };

  // Submit Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: resetMobile,
          otp: resetOtp,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccess('Password updated successfully! You can now log in.');
        setShowForgotPassword(false);
        setResetOtpRequested(false);
      } else {
        setResetError(data.error || 'Failed to reset password');
      }
    } catch (e) {
      setResetError('Server connection error');
    }
  };

  // Helper to extract clean Booking ID from raw scanned QR string, URL, or JSON
  const extractBookingId = (input: string): string => {
    if (!input) return '';
    let raw = input.trim();

    console.log('[QR SCANNER] Raw scanned input:', raw);

    // 1. Check if raw input is JSON string e.g. {"id": "JWS-101"}
    if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const candidate = parsed.id || parsed.bookingId || parsed.ticketId;
          if (candidate) return String(candidate).trim();
        }
      } catch (e) {}
    }

    // 2. Check if raw input is a URL e.g. "https://domain.app/ticket/JWS-101" or "http://localhost:3000/ticket/manual/JMB-101"
    if (raw.toLowerCase().startsWith('http://') || raw.toLowerCase().startsWith('https://') || raw.includes('/ticket/')) {
      try {
        let pathname = raw;
        if (raw.includes('://')) {
          const urlObj = new URL(raw);
          pathname = urlObj.pathname;
        }
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          const candidate = parts[parts.length - 1];
          if (candidate) {
            raw = candidate.split('?')[0].split('#')[0].trim();
          }
        }
      } catch (e) {
        const match = raw.match(/\/ticket\/(?:manual\/)?([A-Za-z0-9_-]+)/i);
        if (match && match[1]) {
          raw = match[1].trim();
        }
      }
    }

    // 3. Clean leading hashes or 'id:' prefixes
    raw = raw.replace(/^(#|id:)/i, '').trim();

    console.log('[QR SCANNER] Extracted clean booking ID:', raw);
    return raw;
  };

  // Unified Ticket Verification Handler (called by both QR Scanner and Manual Search Input)
  const handleVerifyTicket = async (scannedInput: string) => {
    if (!scannedInput || !scannedInput.trim()) {
      setScanAlert({
        show: true,
        type: 'error',
        title: 'Empty Ticket ID',
        message: 'Please enter or scan a valid Ticket ID.'
      });
      return;
    }

    const rawInput = scannedInput.trim();
    console.log('[TICKET LOOKUP] Raw input received:', rawInput);

    const cleanId = extractBookingId(rawInput);
    if (!cleanId) {
      setScanAlert({
        show: true,
        type: 'error',
        title: 'Unrecognized QR Code Format',
        message: `Unable to extract a valid Ticket ID from scanned QR data: "${rawInput}".`
      });
      return;
    }

    const isManual = cleanId.toUpperCase().startsWith('JMB');
    const endpoint = isManual ? '/api/admin/verifyManualTicket' : '/api/admin/verifyTicket';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ id: cleanId })
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = 'Server error during ticket verification.';
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error || parsed.message) errMsg = parsed.error || parsed.message;
        } catch (e) {}

        setScanAlert({
          show: true,
          type: 'error',
          title: 'Verification Server Error',
          message: `Server status ${response.status}: ${errMsg}`
        });
        return;
      }

      const data = await response.json();

      if (data.valid && data.booking) {
        const b = data.booking;
        const remaining = b.remainingDue !== undefined 
          ? b.remainingDue 
          : Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0) - (b.balancePaid || 0));
        const isCheckedIn = b.ticketStatus === 'Checked In';

        if (isCheckedIn) {
          setScanAlert({
            show: true,
            type: 'warning',
            title: 'Already Checked In',
            message: `Ticket ID ${cleanId} for ${b.firstName} ${b.lastName || ''} has ALREADY been checked in.`,
            booking: b
          });
        } else if (remaining > 0) {
          setScanAlert({
            show: true,
            type: 'warning',
            title: 'Ticket Valid - Pending Balance Due!',
            message: `Ticket ID ${cleanId} is valid for ${b.firstName} ${b.lastName || ''}. Outstanding counter due: ₹${remaining}`,
            booking: b
          });
        } else {
          setScanAlert({
            show: true,
            type: 'success',
            title: 'Ticket Validated & Ready / Checked In!',
            message: `Ticket ID ${cleanId} verified for ${b.firstName} ${b.lastName || ''}. Payment settled in full.`,
            booking: b
          });
        }

        setSelectedBooking(b);
        fetchBookings();
        fetchManualBookings();
      } else {
        setScanAlert({
          show: true,
          type: 'error',
          title: 'No Booking Found',
          message: data.message || `No active booking found matching Ticket ID "${cleanId}".`
        });
      }
    } catch (error) {
      console.error('[TICKET LOOKUP EXCEPTION]', error);
      setScanAlert({
        show: true,
        type: 'error',
        title: 'Scanner Connection Error',
        message: 'Network error or server unavailable while scanning. Please check your connection.'
      });
    }
  };

  // Search & Auto Tab Switcher
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setCurrentPage(1);
    if (scanAlert) setScanAlert(null);

    if (val.trim().toUpperCase().startsWith('JMB')) {
      setActiveAdminTab('manual');
      setSidebarTab('manual');
    } else if (val.trim().toUpperCase().startsWith('JWS')) {
      setActiveAdminTab('standard');
      setSidebarTab('bookings');
    }
  };

  // Manual Walk-in Booking Submission
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBookingForm.firstName || !manualBookingForm.phone || manualBookingForm.activities.length === 0) {
      alert('Please fill in required fields: Name, Phone, and at least one Activity.');
      return;
    }

    const selectedPackages = manualBookingForm.activities.filter(isPackageOption);
    if (selectedPackages.length > 1) {
      alert('Only one package can be selected per booking.');
      return;
    }

    try {
      const computedActivities = manualBookingForm.activities.map(actName => {
        const found = AVAILABLE_ACTIVITIES.find(a => a.name === actName);
        return {
          name: actName,
          price: found ? found.price : 500,
          count: manualBookingForm.guests
        };
      });

      const calculatedTotal = computedActivities.reduce((acc, item) => acc + (item.price * item.count), 0);
      const totalAmount = manualBookingForm.customTotalAmount !== '' ? Number(manualBookingForm.customTotalAmount) : calculatedTotal;
      const advancePaid = Number(manualBookingForm.advancePaid) || 0;

      if (advancePaid < 0 || advancePaid > totalAmount) {
        alert(`Please enter a valid advance payment amount! Advance (₹${advancePaid.toLocaleString('en-IN')}) cannot exceed total bill amount (₹${totalAmount.toLocaleString('en-IN')}).`);
        return;
      }

      const remainingDue = Math.max(0, totalAmount - advancePaid);

      const payload = {
        firstName: manualBookingForm.firstName,
        lastName: manualBookingForm.lastName,
        phone: manualBookingForm.phone,
        email: manualBookingForm.email || 'counter@joywatersports.com',
        date: manualBookingForm.date,
        time: manualBookingForm.time,
        guests: manualBookingForm.guests,
        activities: computedActivities,
        totalAmount,
        advancePaid,
        balancePaid: 0,
        remainingDue,
        paymentStatus: remainingDue === 0 ? 'Completed' : (advancePaid > 0 ? 'Partial Paid' : 'Pending'),
        ticketStatus: 'Checked In',
        advancePaymentMode: manualBookingForm.advancePaymentMode,
        agentName: manualBookingForm.agentName,
        notes: manualBookingForm.notes,
        source: 'manual'
      };

      const response = await fetch('/api/manual-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowManualBooking(false);
        setManualBookingForm({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          guests: 1,
          activities: [],
          advancePaid: 0,
          advancePaymentMode: 'Cash',
          agentName: 'Desk Agent 1',
          notes: '',
          customTotalAmount: ''
        });
        fetchManualBookings();
        setActiveAdminTab('manual');
        setSidebarTab('manual');
      } else {
        alert('Failed to save manual booking.');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating walk-in booking.');
    }
  };

  // Update Manual Booking Payment Settlement
  const handleUpdateManualPayment = async (bookingId: string) => {
    if (!selectedBooking) return;
    const addAmt = Number(settlingAmount) || 0;
    if (addAmt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const newBalancePaid = (selectedBooking.balancePaid || 0) + addAmt;
    const isJMB = bookingId.startsWith('JMB');
    const endpoint = isJMB ? `/api/manual-bookings/${bookingId}` : `/api/bookings/${bookingId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          balancePaid: newBalancePaid,
          balancePaymentMode: settlingPaymentMode,
          ticketStatus: 'Checked In'
        })
      });

      if (response.ok) {
        const updatedRes = await response.json();
        const updatedBooking = updatedRes.booking;
        setSelectedBooking(updatedBooking);
        setSettlingAmount('');
        fetchBookings();
        fetchManualBookings();
      } else {
        alert('Failed to update payment settlement.');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating payment.');
    }
  };

  // Delete Bookings
  const deleteBooking = async (id: string) => {
    setConfirmState({
      show: true,
      title: 'Delete Web Booking',
      message: `Are you sure you want to delete booking #${id}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/bookings/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setBookings(prev => prev.filter(b => b.id !== id));
            if (selectedBooking?.id === id) setSelectedBooking(null);
          }
        } catch (err) {
          console.error(err);
        }
        setConfirmState(null);
      }
    });
  };

  const deleteManualBooking = async (id: string) => {
    setConfirmState({
      show: true,
      title: 'Delete Walk-in Booking',
      message: `Are you sure you want to delete walk-in ticket #${id}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/manual-bookings/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setManualBookings(prev => prev.filter(b => b.id !== id));
            if (selectedBooking?.id === id) setSelectedBooking(null);
          }
        } catch (err) {
          console.error(err);
        }
        setConfirmState(null);
      }
    });
  };

  // Fetch Waiver Agreement Details
  const fetchWaiver = async (id: string) => {
    setLoadingWaiver(true);
    try {
      const res = await fetch(`/api/waiver/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBookingWaiver(data);
      } else {
        setSelectedBookingWaiver(null);
      }
    } catch (e) {
      setSelectedBookingWaiver(null);
    } finally {
      setLoadingWaiver(false);
    }
  };

  // Helper to cleanly format activities and fix [object Object] rendering
  const formatActivitiesText = (activities: any) => {
    if (!activities) return 'Water Sports Package';
    if (typeof activities === 'string') {
      if (activities.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(activities);
          return formatActivitiesText(parsed);
        } catch (e) {}
      }
      return activities;
    }
    if (Array.isArray(activities)) {
      if (activities.length === 0) return 'Water Sports Package';
      return activities.map(a => {
        if (typeof a === 'object' && a !== null) {
          const name = a.name || 'Activity';
          const count = a.count || 1;
          return count > 1 ? `${name} x${count}` : name;
        }
        return String(a);
      }).join(', ');
    }
    return String(activities);
  };

  // Save Modal Updates (Payment & Check In)
  const handleSaveBookingModal = async (checkIn: boolean = false) => {
    if (!selectedBooking) return;

    const selectedPackages = editActivities.filter(isPackageOption);
    if (selectedPackages.length > 1) {
      alert('Only one package can be selected per booking.');
      return;
    }

    setSavingBooking(true);
    
    let total = selectedBooking.totalAmount || 0;
    const isJMB = selectedBooking.id.startsWith('JMB');
    const endpoint = isJMB ? `/api/manual-bookings/${selectedBooking.id}` : `/api/bookings/${selectedBooking.id}`;

    let advance = Number(editAdvancePaid) || 0;
    let balance = Number(editBalancePaid) || 0;

    // If check-in is requested and remaining due exists, auto-settle balance
    if (checkIn && (total - advance - balance) > 0) {
      balance = Math.max(0, total - advance);
      setEditBalancePaid(balance);
    }

    const calculatedRem = Math.max(0, total - advance - balance);
    const newPaymentStatus = calculatedRem === 0 ? 'Completed' : (editPaymentStatus || 'Partial Paid');

    const updatePayload: any = {
      advancePaid: advance,
      advancePaymentMode: editAdvanceMode,
      balancePaid: balance,
      balancePaymentMode: editBalanceMode,
      paymentStatus: newPaymentStatus,
    };

    if (isEditingActivities || editActivities.length > 0) {
      const computedActivities = editActivities.map(actName => {
        const found = AVAILABLE_ACTIVITIES.find(a => a.name === actName);
        return {
          name: actName,
          price: found ? found.price : 500,
          count: selectedBooking.guests || 1
        };
      });
      total = computedActivities.reduce((acc, item) => acc + (item.price * item.count), 0);
      updatePayload.activities = computedActivities;
      updatePayload.totalAmount = total;
    }

    if (advance < 0 || balance < 0 || advance > total || balance > total || (advance + balance) > total) {
      alert(`Please enter a valid payment amount! Total payment cannot exceed total bill amount of ₹${total.toLocaleString('en-IN')}.`);
      setSavingBooking(false);
      return;
    }

    const rem = Math.max(0, total - advance - balance);

    if (checkIn) {
      updatePayload.ticketStatus = 'Checked In';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        const updatedRes = await response.json();
        const updatedBooking = updatedRes.booking || { ...selectedBooking, ...updatePayload, remainingDue: rem };
        setSelectedBooking(updatedBooking);
        setEditAdvancePaid(updatedBooking.advancePaid || 0);
        setEditAdvanceMode(updatedBooking.advancePaymentMode || 'UPI');
        setEditBalancePaid(updatedBooking.balancePaid || 0);
        setEditBalanceMode(updatedBooking.balancePaymentMode || 'Cash');
        setEditPaymentStatus(updatedBooking.paymentStatus || (rem === 0 ? 'Completed' : 'Partial Paid'));
        setEditActivities(extractActivityNames(updatedBooking.activities));
        setIsEditingActivities(false);
        fetchBookings();
        fetchManualBookings();
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(errJson.error || 'Failed to save booking updates.');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating booking.');
    } finally {
      setSavingBooking(false);
    }
  };

  // Export Excel
  const exportExcel = () => {
    window.open(`/api/bookings/export?token=${token}`, '_blank');
  };

  const exportManualExcel = () => {
    window.open(`/api/manual-bookings/export?token=${token}`, '_blank');
  };

  // Format Helper
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const convertSingle = (t: string) => {
        const match = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!match) return t;
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      };
      if (timeStr.includes('-')) {
        return timeStr.split('-').map(part => convertSingle(part)).join(' - ');
      }
      return convertSingle(timeStr);
    } catch (e) {
      return timeStr;
    }
  };

  // Combined Active List
  const rawList = activeAdminTab === 'standard' ? bookings : manualBookings;

  // Filter & Search Logic
  const filteredBookings = rawList.filter(b => {
    const query = searchQuery.toLowerCase().trim();
    const fullName = `${b.firstName} ${b.lastName || ''}`.toLowerCase();
    const phone = (b.phone || '').toLowerCase();
    const email = (b.email || '').toLowerCase();
    const id = (b.id || '').toLowerCase();

    const matchesSearch = !query || fullName.includes(query) || phone.includes(query) || email.includes(query) || id.includes(query);

    const matchesTicket = ticketFilter === 'All' || 
      (ticketFilter === 'Checked In' && b.ticketStatus === 'Checked In') ||
      (ticketFilter === 'Pending' && b.ticketStatus !== 'Checked In');

    const remaining = b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0) - (b.balancePaid || 0));
    const matchesPayment = paymentFilter === 'All' ||
      (paymentFilter === 'Paid' && remaining === 0) ||
      (paymentFilter === 'Due' && remaining > 0);

    const formatActStr = Array.isArray(b.activities)
      ? b.activities.map(a => typeof a === 'object' ? a.name : a).join(' ')
      : String(b.activities || '');
    const matchesActivity = activityFilter === 'All' || formatActStr.toLowerCase().includes(activityFilter.toLowerCase());

    return matchesSearch && matchesTicket && matchesPayment && matchesActivity;
  });

  // Sorting
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime();
    if (sortBy === 'amountHigh') return (b.totalAmount || 0) - (a.totalAmount || 0);
    if (sortBy === 'amountLow') return (a.totalAmount || 0) - (b.totalAmount || 0);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const activeBookingsList = sortedBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Financial Stats Calculation
  const totalStandardGross = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalManualGross = manualBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalOverallGross = totalStandardGross + totalManualGross;

  const totalStandardAdvance = bookings.reduce((sum, b) => sum + (b.advancePaid || 0), 0);
  const totalManualAdvance = manualBookings.reduce((sum, b) => sum + (b.advancePaid || 0), 0);
  
  const totalStandardBalance = bookings.reduce((sum, b) => sum + (b.balancePaid || 0), 0);
  const totalManualBalance = manualBookings.reduce((sum, b) => sum + (b.balancePaid || 0), 0);

  const totalStandardDue = bookings.reduce((sum, b) => {
    const rem = b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0) - (b.balancePaid || 0));
    return sum + rem;
  }, 0);
  const totalManualDue = manualBookings.reduce((sum, b) => {
    const rem = b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0) - (b.balancePaid || 0));
    return sum + rem;
  }, 0);
  const totalOverallDue = totalStandardDue + totalManualDue;

  const totalGuestsServed = [...bookings, ...manualBookings].reduce((sum, b) => sum + (b.guests || 1), 0);

  // Unauthenticated State (Login / First Setup / Forgot Password)
  if (!token) {
    if (isSetupChecking) {
      return (
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-100 flex items-center gap-3">
            <RefreshCw size={20} className="animate-spin text-[#004E98]" />
            <span className="text-sm font-semibold text-slate-700">Verifying security setup...</span>
          </div>
        </div>
      );
    }

    if (isSetup === false) {
      return (
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xs border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#004E98]/10 flex items-center justify-center text-[#004E98]">
                <Shield size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">First-Time Admin Setup</h2>
                <p className="text-xs text-slate-500 font-medium">Create secure admin password for Joy Water Sports</p>
              </div>
            </div>

            {setupError && (
              <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} /> {setupError}
              </div>
            )}
            {setupSuccess && (
              <div className="p-3.5 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={16} /> {setupSuccess}
              </div>
            )}

            {!setupOtpRequested ? (
              <form onSubmit={handleRequestSetupOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Admin Mobile Number</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={setupMobile}
                      onChange={e => setSetupMobile(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/10"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#004E98] hover:bg-[#003B73] text-white rounded-full font-semibold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Send Verification OTP <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSetupPasswordSubmit} className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-blue-50 border border-blue-100 px-3.5 py-2.5 rounded-2xl">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={15} className="text-[#004E98]" /> OTP Valid For:
                  </span>
                  <span className={`font-mono text-sm font-bold ${setupOtpTimeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-[#004E98]'}`}>
                    {formatOtpTime(setupOtpTimeLeft)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={handleRequestSetupOtp}
                      className="text-[11px] font-bold text-[#004E98] hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={setupOtp}
                    onChange={e => setSetupOtp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-mono tracking-widest outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Admin Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={setupOtpTimeLeft === 0}
                  className="w-full py-3 bg-[#004E98] hover:bg-[#003B73] disabled:opacity-50 text-white rounded-full font-semibold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Save Password & Access Dashboard
                </button>
              </form>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xs border border-slate-100">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#004E98]/10 flex items-center justify-center text-[#004E98] mx-auto mb-3">
              <Lock size={22} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Portal</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Joy Water Sports Varkala</p>
          </div>

          {loginError && (
            <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} /> {loginError}
            </div>
          )}

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/10 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#004E98] hover:bg-[#003B73] text-white rounded-full font-semibold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In <ArrowRight size={16} />
              </button>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-[#004E98] hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Reset Admin Password</h3>
                <p className="text-xs text-slate-500">Request OTP to reset password</p>
              </div>

              {resetError && (
                <div className="p-3 mb-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold">{resetError}</div>
              )}
              {resetSuccess && (
                <div className="p-3 mb-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold">{resetSuccess}</div>
              )}

              {!resetOtpRequested ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={resetMobile}
                      onChange={e => setResetMobile(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#004E98] text-white rounded-full font-semibold text-sm shadow-2xs"
                  >
                    Send Reset OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Clock size={14} className="text-[#004E98]" /> OTP Valid For:
                    </span>
                    <span className={`font-mono text-xs font-bold ${resetOtpTimeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-[#004E98]'}`}>
                      {formatOtpTime(resetOtpTimeLeft)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700">6-Digit OTP Code</label>
                      <button
                        type="button"
                        onClick={handleRequestResetOtp}
                        className="text-[10px] font-bold text-[#004E98] hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={resetOtp}
                      onChange={e => setResetOtp(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-mono tracking-widest outline-none focus:border-[#004E98]"
                    />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98]"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98]"
                  />
                  <button
                    type="submit"
                    disabled={resetOtpTimeLeft === 0}
                    className="w-full py-2.5 bg-[#004E98] hover:bg-[#003B73] disabled:opacity-50 text-white rounded-full font-semibold text-sm cursor-pointer transition-all"
                  >
                    Set New Password
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold mt-4 cursor-pointer"
              >
                Cancel and back to login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Authenticated Main Admin Layout (Samsung One UI Minimalist Redesign)
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 font-sans antialiased selection:bg-[#004E98]/10 selection:text-[#004E98]">
      
      {/* Top Header Navigation */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/60 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#004E98] text-white flex items-center justify-center font-black text-lg shadow-2xs">
              J
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">Joy Water Sports</h1>
                <span className="bg-[#004E98]/10 text-[#004E98] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#004E98]/20">
                  PARTNER DESK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Synced {secondsSinceSync}s ago
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Action Group 1: Primary Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualBooking(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-full font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Plus size={15} /> Walk-in Ticket
              </button>

              <button
                onClick={() => setShowScanner(true)}
                className="bg-[#004E98] hover:bg-[#003B73] text-white px-3.5 py-2 rounded-full font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <QrCodeIcon size={15} /> Scan QR
              </button>

              <button
                onClick={() => setShowRevenueModal(true)}
                className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-full font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <BarChart3 size={15} /> Stats
              </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>

            {/* Action Group 2: Sync & Export */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenSheetsModal}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-full font-semibold text-xs border border-slate-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Google Sheets Live Sync"
              >
                <Table size={14} className="text-emerald-600" /> Sync Sheets
              </button>

              <button
                onClick={exportExcel}
                className="bg-blue-50 hover:bg-blue-100 text-[#004E98] px-3 py-2 rounded-full font-semibold text-xs border border-blue-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export Online Web Bookings History to Excel"
              >
                <Download size={13} /> Export Web
              </button>

              <button
                onClick={exportManualExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-full font-semibold text-xs border border-emerald-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export Desk Walk-in Bookings History to Excel"
              >
                <Download size={13} /> Export Walk-in
              </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>

            {/* Action Group 3: User Session */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-full font-semibold text-xs border border-rose-200/80 transition-all flex items-center gap-1 cursor-pointer"
              >
                Logout
              </button>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
                title="View Public Booking Page"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Left Sidebar Navigation + Right Content Column */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Clean Left Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl p-3 shadow-xs border border-slate-200/80 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible sticky top-24">
            
            <button
              onClick={() => changeSidebarTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                sidebarTab === 'dashboard' 
                  ? 'bg-[#004E98] text-white font-bold shadow-md shadow-[#004E98]/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard & Stats
            </button>

            <button
              onClick={() => changeSidebarTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                sidebarTab === 'bookings' 
                  ? 'bg-[#004E98] text-white font-bold shadow-md shadow-[#004E98]/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <Ticket size={18} /> Online History
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                sidebarTab === 'bookings'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-50 text-[#004E98] border border-blue-200/80'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => changeSidebarTab('manual')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                sidebarTab === 'manual' 
                  ? 'bg-[#004E98] text-white font-bold shadow-md shadow-[#004E98]/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <Receipt size={18} /> Walk-in History
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                sidebarTab === 'manual'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
              }`}>
                {manualBookings.length}
              </span>
            </button>

            <button
              onClick={() => changeSidebarTab('scanner')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                sidebarTab === 'scanner' 
                  ? 'bg-[#004E98] text-white font-bold shadow-md shadow-[#004E98]/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <QrCodeIcon size={18} /> QR Ticket Scanner
            </button>

            <button
              onClick={() => changeSidebarTab('coupons')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                sidebarTab === 'coupons' 
                  ? 'bg-[#004E98] text-white font-bold shadow-md shadow-[#004E98]/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <Tag size={18} /> Coupon Engine
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                sidebarTab === 'coupons'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {coupons.length}
              </span>
            </button>

          </div>
        </aside>

        {/* Primary Content Column */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Banner Scan Result Alert */}
          {scanAlert && scanAlert.show && (
            <div className={`rounded-3xl p-6 shadow-xs border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              scanAlert.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : scanAlert.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-start gap-3">
                {scanAlert.type === 'success' ? (
                  <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={24} />
                ) : scanAlert.type === 'warning' ? (
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                ) : (
                  <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={24} />
                )}
                <div>
                  <h4 className="font-bold text-base tracking-tight">{scanAlert.title}</h4>
                  <p className="text-xs font-medium opacity-90 mt-0.5 leading-relaxed">{scanAlert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                {scanAlert.booking && (
                  <button
                    onClick={() => {
                      setSelectedBooking(scanAlert.booking!);
                      fetchWaiver(scanAlert.booking!.id);
                    }}
                    className="px-4 py-2 rounded-full bg-white text-slate-800 text-xs font-bold border border-slate-200/80 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    View Ticket Details
                  </button>
                )}
                <button
                  onClick={() => setScanAlert(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD & STATS VIEW */}
          {sidebarTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Financial High-Level Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Gross Revenue</span>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">₹{totalOverallGross.toLocaleString('en-IN')}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Web: ₹{totalStandardGross.toLocaleString('en-IN')}</span>
                    <span>Desk: ₹{totalManualGross.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Bookings</span>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{bookings.length + manualBookings.length}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{bookings.length} Web</span>
                    <span>{manualBookings.length} Walk-in</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Guests Served</span>
                  <p className="text-3xl font-extrabold text-[#004E98] tracking-tight">{totalGuestsServed}</p>
                  <p className="text-xs text-slate-500 font-medium mt-4 pt-3 border-t border-slate-100">
                    Avg party size: {((totalGuestsServed) / Math.max(1, bookings.length + manualBookings.length)).toFixed(1)} people
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Pending Due</span>
                  <p className="text-3xl font-extrabold text-amber-600 tracking-tight">₹{totalOverallDue.toLocaleString('en-IN')}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#004E98]">Online: ₹{totalStandardDue.toLocaleString('en-IN')}</span>
                    <span className="text-emerald-700">Counter: ₹{totalManualDue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

              </div>

              {/* Channel Breakdown Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/60 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Channel Revenue Share</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time performance comparison between online bookings & desk walk-ins</p>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${totalOverallGross > 0 ? (totalStandardGross / totalOverallGross) * 100 : 50}%` }}
                      className="bg-[#004E98] h-full transition-all duration-500"
                    />
                    <div 
                      style={{ width: `${totalOverallGross > 0 ? (totalManualGross / totalOverallGross) * 100 : 50}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-[#004E98]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#004E98]"></span>
                      Online Web ({totalOverallGross > 0 ? Math.round((totalStandardGross / totalOverallGross) * 100) : 0}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Desk Walk-in ({totalOverallGross > 0 ? Math.round((totalManualGross / totalOverallGross) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                        <th className="pb-3">Channel</th>
                        <th className="pb-3">Bookings</th>
                        <th className="pb-3">Advance Coll.</th>
                        <th className="pb-3">Balance Coll.</th>
                        <th className="pb-3">Counter Due</th>
                        <th className="pb-3 text-right">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      <tr>
                        <td className="py-3.5 text-slate-900 font-bold flex items-center gap-2">
                          <Ticket size={16} className="text-[#004E98]" /> Online Web Bookings
                        </td>
                        <td className="py-3.5">{bookings.length}</td>
                        <td className="py-3.5 text-[#004E98]">₹{totalStandardAdvance.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-emerald-600">₹{totalStandardBalance.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-amber-600">₹{totalStandardDue.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-right text-slate-900 font-extrabold">₹{totalStandardGross.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-900 font-bold flex items-center gap-2">
                          <Receipt size={16} className="text-emerald-600" /> Desk Walk-in Bookings
                        </td>
                        <td className="py-3.5">{manualBookings.length}</td>
                        <td className="py-3.5 text-[#004E98]">₹{totalManualAdvance.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-emerald-600">₹{totalManualBalance.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-amber-600">₹{totalManualDue.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-right text-slate-900 font-extrabold">₹{totalManualGross.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Separate Recent History Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Online Booking History Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#004E98] flex items-center justify-center">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Online Booking History</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Website customer reservations</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSidebarTab('bookings');
                        setActiveAdminTab('standard');
                      }}
                      className="text-xs font-bold text-[#004E98] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View All ({bookings.length}) <ChevronRight size={14} />
                    </button>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">No online bookings recorded yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {bookings.slice(0, 4).map(b => (
                        <div key={b.id} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/50 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{b.firstName} {b.lastName || ''}</span>
                            <span className="text-[10px] font-mono text-slate-400">#{b.id} • {b.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 text-xs block">₹{b.totalAmount}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.ticketStatus === 'Checked In' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {b.ticketStatus || 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desk Walk-in History Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/60 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Walk-in Booking History</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Counter walk-in tickets</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSidebarTab('manual');
                        setActiveAdminTab('manual');
                      }}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View All ({manualBookings.length}) <ChevronRight size={14} />
                    </button>
                  </div>

                  {manualBookings.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">No walk-in desk tickets recorded yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {manualBookings.slice(0, 4).map(b => (
                        <div key={b.id} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/50 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{b.firstName} {b.lastName || ''}</span>
                            <span className="text-[10px] font-mono text-slate-400">#{b.id} • {b.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 text-xs block">₹{b.totalAmount}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.ticketStatus === 'Checked In' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {b.ticketStatus || 'Checked In'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2 & 3: BOOKINGS TABLES (WEB or MANUAL) */}
          {(sidebarTab === 'bookings' || sidebarTab === 'manual') && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/60 space-y-6">
              
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      {activeAdminTab === 'standard' ? (
                        <>
                          <Ticket className="text-[#004E98]" size={22} />
                          <span>Online Booking History</span>
                        </>
                      ) : (
                        <>
                          <Receipt className="text-emerald-600" size={22} />
                          <span>Walk-in Booking History</span>
                        </>
                      )}
                    </h2>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      activeAdminTab === 'standard'
                        ? 'bg-blue-50 text-[#004E98] border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {filteredBookings.length} History Logs
                    </span>

                    {activeAdminTab === 'standard' ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                        <AlertCircle size={12} /> Pending Due: ₹{totalStandardDue.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                        <AlertCircle size={12} /> Counter Pending: ₹{totalManualDue.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {activeAdminTab === 'standard' 
                      ? 'Isolated audit log & complete history of online customer reservations' 
                      : 'Isolated audit log & complete history of walk-in tickets issued at physical desk'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  {activeAdminTab === 'standard' ? (
                    <button
                      onClick={exportExcel}
                      className="bg-blue-50 hover:bg-blue-100 text-[#004E98] px-4 py-2 rounded-full font-semibold text-xs border border-blue-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Export Online History
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={exportManualExcel}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-xs border border-emerald-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={14} /> Export Walk-in History
                      </button>
                      <button
                        onClick={() => setShowManualBooking(true)}
                        className="bg-[#004E98] hover:bg-[#003B73] text-white px-5 py-2 rounded-full font-semibold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={16} /> Create Walk-in Booking
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search history by name, phone, email, or ID..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/10 transition-all"
                  />
                </div>

                <select
                  value={ticketFilter}
                  onChange={e => { setTicketFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:border-[#004E98]"
                >
                  <option value="All">All Ticket Status</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Pending">Pending Check-in</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={e => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:border-[#004E98]"
                >
                  <option value="All">All Payment Status</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Due">Balance Due</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:border-[#004E98]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amountHigh">Highest Amount</option>
                  <option value="amountLow">Lowest Amount</option>
                </select>
              </div>

              {/* Bookings Table */}
              {loading ? (
                <div className="py-12 text-center text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-[#004E98]" /> Loading history logs...
                </div>
              ) : activeBookingsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium text-sm border border-dashed border-slate-200 rounded-2xl">
                  No history entries found matching current search/filter.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Customer / ID</th>
                        <th className="py-3.5 px-4">Channel</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4">Schedule</th>
                        <th className="py-3.5 px-4">Ticket Status</th>
                        <th className="py-3.5 px-4">Payment & Due</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
                      {activeBookingsList.map(b => {
                        const remaining = b.remainingDue !== undefined ? b.remainingDue : Math.max(0, (b.totalAmount || 0) - (b.advancePaid || 0) - (b.balancePaid || 0));
                        const isPaid = remaining === 0;
                        const isWalkin = b.id?.startsWith('JMB');

                        return (
                          <tr 
                            key={b.id} 
                            onClick={() => {
                              setSelectedBooking(b);
                              fetchWaiver(b.id);
                            }}
                            className="even:bg-slate-50/60 hover:bg-blue-50/40 transition-colors border-b border-slate-200/60 cursor-pointer group"
                          >
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900 text-sm tracking-tight">{b.firstName} {b.lastName || ''}</div>
                              <div className="text-[11px] font-mono text-slate-500 font-bold mt-0.5">#{b.id}</div>
                            </td>

                            <td className="py-4 px-4">
                              {isWalkin ? (
                                <span className="bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                  <Receipt size={11} className="text-emerald-700" /> Desk Walk-in
                                </span>
                              ) : (
                                <span className="bg-blue-100/80 text-[#004E98] border border-blue-300/80 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                  <Globe size={11} className="text-[#004E98]" /> Online Web
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-800">{b.phone}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{b.email || '—'}</div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-800">{b.date}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{formatTime(b.time)}</div>
                            </td>

                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                b.ticketStatus === 'Checked In'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {b.ticketStatus === 'Checked In' && <Check size={12} className="text-emerald-700" />}
                                {b.ticketStatus || 'Pending Check-in'}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-black text-slate-900 text-sm">₹{b.totalAmount?.toLocaleString('en-IN')}</div>
                              {isPaid ? (
                                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1 mt-1">
                                  <Check size={10} /> Paid in Full
                                </span>
                              ) : (
                                <span className="text-[11px] text-rose-800 font-extrabold bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 inline-flex items-center gap-1 mt-1 shadow-2xs">
                                  <AlertCircle size={10} /> Due: ₹{remaining?.toLocaleString('en-IN')}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    fetchWaiver(b.id);
                                  }}
                                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#004E98] hover:bg-[#003B73] text-white shadow-2xs transition-all cursor-pointer active:scale-95"
                                >
                                  Manage
                                </button>
                                <button
                                  onClick={() => {
                                    if (b.id?.startsWith('JMB')) deleteManualBooking(b.id);
                                    else deleteBooking(b.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 rounded-full transition-colors cursor-pointer"
                                  title="Delete Booking"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                  <span>
                    Showing <span className="font-bold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, sortedBookings.length)}</span> of <span className="font-bold text-slate-900">{sortedBookings.length}</span> entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-full font-bold transition-all cursor-pointer ${
                          currentPage === pageNum 
                            ? 'bg-[#004E98] text-white shadow-2xs' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: QR SCANNER ENGINE */}
          {sidebarTab === 'scanner' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/60 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">QR Ticket Verification Engine</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Scan physical or digital ticket QR codes for instant beach entry access validation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Live Camera Scanner Box */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#004E98]/10 text-[#004E98] flex items-center justify-center">
                    <Camera size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Live Camera Scanner</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Use mobile or webcam device to scan ticket QR code</p>
                  </div>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="bg-[#004E98] hover:bg-[#003B73] text-white px-6 py-3 rounded-full font-semibold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Camera size={16} /> Open Camera Scanner
                  </button>
                </div>

                {/* Manual Ticket ID Lookup Box */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 flex flex-col justify-center space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Manual Ticket Lookup</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Directly verify ticket code (e.g. JWS1234 or JMB5678)</p>
                  </div>
                  <form 
                    onSubmit={e => {
                      e.preventDefault();
                      const input = (e.currentTarget.elements.namedItem('ticketId') as HTMLInputElement).value;
                      if (input) handleVerifyTicket(input);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="ticketId"
                      required
                      placeholder="Enter Ticket ID..."
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#004E98]"
                    />
                    <button
                      type="submit"
                      className="bg-[#004E98] hover:bg-[#003B73] text-white px-5 py-2.5 rounded-full font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      Verify
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: COUPON ENGINE */}
          {sidebarTab === 'coupons' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/60 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Coupon & Promo Engine</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage promotional discount codes and active customer offers.</p>
                </div>
                <button
                  onClick={() => setShowCreateCoupon(true)}
                  className="bg-[#004E98] hover:bg-[#003B73] text-white px-5 py-2.5 rounded-full font-semibold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} /> Create New Coupon
                </button>
              </div>

              {loadingCoupons ? (
                <div className="py-12 text-center text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-[#004E98]" /> Loading promo coupons...
                </div>
              ) : coupons.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium text-sm border border-dashed border-slate-200 rounded-2xl">
                  No coupons created yet. Click "Create New Coupon" to start.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map(cp => (
                    <div key={cp.id} className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between gap-4">
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold font-mono text-base text-[#004E98] tracking-wider flex items-center gap-1.5">
                            <Tag size={16} /> {cp.code}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cp.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {cp.active ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <div className="pt-1">
                          <p className="text-2xl font-extrabold text-slate-900">
                            {cp.discountType === 'percentage' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} OFF`}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Min Order Bill: <span className="font-bold text-slate-700">₹{cp.minBill}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Redeemed {cp.usageCount} times
                          </p>
                        </div>
                      </div>

                      {/* One UI Classic Toggle Switch */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-600">Active State</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleCoupon(cp.id, cp.active)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer p-0.5 ${
                              cp.active ? 'bg-[#004E98]' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                              cp.active ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>

                          <button
                            onClick={() => deleteCoupon(cp.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* MODAL: CREATE WALK-IN BOOKING */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Walk-in Desk Booking</h3>
              <button 
                onClick={() => setShowManualBooking(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs font-medium text-slate-700">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={manualBookingForm.firstName}
                    onChange={e => setManualBookingForm({ ...manualBookingForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Last Name</label>
                  <input
                    type="text"
                    value={manualBookingForm.lastName}
                    onChange={e => setManualBookingForm({ ...manualBookingForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91..."
                    value={manualBookingForm.phone}
                    onChange={e => setManualBookingForm({ ...manualBookingForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="Optional..."
                    value={manualBookingForm.email}
                    onChange={e => setManualBookingForm({ ...manualBookingForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    value={manualBookingForm.date}
                    onChange={e => setManualBookingForm({ ...manualBookingForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Time Slot</label>
                  <select
                    value={manualBookingForm.time}
                    onChange={e => setManualBookingForm({ ...manualBookingForm, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold">Select Activities *</label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {AVAILABLE_ACTIVITIES.map(act => {
                    const isSelected = manualBookingForm.activities.includes(act.name);
                    const isPkg = isPackageOption(act.name);
                    const hasPackageSelected = manualBookingForm.activities.some(isPackageOption);

                    let isDisabled = false;
                    let disabledReason = '';

                    if (isPkg && hasPackageSelected && !isSelected) {
                      isDisabled = true;
                      disabledReason = 'Only one package can be selected per booking.';
                    }

                    return (
                      <label 
                        key={act.name} 
                        className={`flex flex-col p-2 rounded-xl transition-all ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed bg-slate-100/70 border border-slate-200/60' 
                            : 'cursor-pointer hover:bg-white border border-transparent'
                        }`}
                        onClick={e => {
                          if (isDisabled) e.preventDefault();
                        }}
                      >
                        <div className="flex items-center gap-2 text-xs w-full">
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isSelected}
                            onChange={e => {
                              if (isDisabled) return;
                              let newActs: string[] = [];
                              if (e.target.checked) {
                                if (isPkg) {
                                  newActs = [...manualBookingForm.activities.filter(a => !isPackageOption(a)), act.name];
                                } else {
                                  newActs = [...manualBookingForm.activities, act.name];
                                }
                              } else {
                                newActs = manualBookingForm.activities.filter(a => a !== act.name);
                              }

                              const guestsCount = manualBookingForm.guests || 1;
                              const newCalcTotal = newActs.reduce((acc, name) => {
                                const found = AVAILABLE_ACTIVITIES.find(a => a.name === name);
                                return acc + (found ? found.price : 500) * guestsCount;
                              }, 0);

                              setManualBookingForm({
                                ...manualBookingForm,
                                activities: newActs,
                                customTotalAmount: '',
                                advancePaid: Math.min(manualBookingForm.advancePaid, newCalcTotal)
                              });
                            }}
                            className="rounded text-[#004E98] focus:ring-0 disabled:cursor-not-allowed"
                          />
                          <span className="font-semibold text-slate-800">{act.name}</span>
                          <span className="text-slate-400 text-[10px] ml-auto">₹{act.price}</span>
                        </div>
                        {isDisabled && disabledReason && (
                          <span className="text-[9px] text-slate-500 font-medium italic mt-0.5 pl-5 block">
                            {disabledReason}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const calcTotalForManual = manualBookingForm.activities.reduce((acc, name) => {
                  const found = AVAILABLE_ACTIVITIES.find(a => a.name === name);
                  return acc + (found ? found.price : 500) * (manualBookingForm.guests || 1);
                }, 0);
                const effectiveManualTotal = manualBookingForm.customTotalAmount !== '' ? Number(manualBookingForm.customTotalAmount) : calcTotalForManual;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 font-semibold">Payment Collected (₹)</label>
                        <input
                          type="number"
                          value={manualBookingForm.advancePaid}
                          onChange={e => setManualBookingForm({ ...manualBookingForm, advancePaid: Number(e.target.value) })}
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-2xl outline-none focus:border-[#004E98] ${
                            manualBookingForm.advancePaid > effectiveManualTotal || manualBookingForm.advancePaid < 0
                              ? 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                              : 'border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold">Payment Mode</label>
                        <select
                          value={manualBookingForm.advancePaymentMode}
                          onChange={e => setManualBookingForm({ ...manualBookingForm, advancePaymentMode: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / GPay</option>
                          <option value="Card">Card Swipe</option>
                        </select>
                      </div>
                    </div>

                    {manualBookingForm.advancePaid > effectiveManualTotal && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-left mt-2">
                        <p className="text-red-600 text-xs font-bold flex items-center gap-1.5">
                          ⚠️ Enter valid amount! Advance (₹{manualBookingForm.advancePaid.toLocaleString('en-IN')}) cannot exceed total bill amount (₹{effectiveManualTotal.toLocaleString('en-IN')}).
                        </p>
                      </div>
                    )}

                    {manualBookingForm.advancePaid < 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-left mt-2">
                        <p className="text-red-600 text-xs font-bold flex items-center gap-1.5">
                          ⚠️ Enter valid amount! Payment amount cannot be negative.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}

              <div>
                <label className="block mb-1 font-semibold">Desk Agent Name</label>
                <input
                  type="text"
                  value={manualBookingForm.agentName}
                  onChange={e => setManualBookingForm({ ...manualBookingForm, agentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#004E98] hover:bg-[#003B73] text-white rounded-full font-semibold text-sm shadow-2xs transition-all cursor-pointer mt-4"
              >
                Issue Walk-in Ticket
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: MANAGE SELECTED BOOKING & PAYMENT SETTLEMENT (SAMSUNG ONE UI AESTHETIC) */}
      {selectedBooking && (() => {
        const computedEditTotal = editActivities.reduce((acc, actName) => {
          const found = AVAILABLE_ACTIVITIES.find(a => a.name === actName);
          return acc + (found ? found.price : 500) * (selectedBooking.guests || 1);
        }, 0);
        const totalAmt = isEditingActivities ? computedEditTotal : (selectedBooking.totalAmount || 0);
        const liveAdv = Number(editAdvancePaid) || 0;
        const liveBal = Number(editBalancePaid) || 0;
        const liveRem = Math.max(0, totalAmt - liveAdv - liveBal);
        const ticketUrl = `${window.location.origin}/ticket/${selectedBooking.id.startsWith('JMB') ? 'manual/' : ''}${selectedBooking.id}`;
        const formattedActivities = formatActivitiesText(selectedBooking.activities);
        const isCheckedIn = selectedBooking.ticketStatus === 'Checked In';

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-[28px] max-w-xl w-full shadow-2xl border border-slate-100/80 max-h-[92vh] overflow-y-auto relative text-slate-900 flex flex-col p-6 sm:p-8 space-y-6">
              
              {/* Modal Header & Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manage Booking & Settlement</h3>
                  <div className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                    <span>{selectedBooking.firstName} {selectedBooking.lastName || ''}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1. QR Code & ID Section (Centered) */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-center">
                  <QRCodeSVG 
                    value={ticketUrl}
                    size={120} 
                    level="M"
                    includeMargin={false}
                  />
                </div>
                
                {/* ID badge in Ocean Blue (#004E98) */}
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#004E98] bg-[#004E98]/10 px-3 py-1 rounded-full border border-[#004E98]/20 tracking-wider">
                    #{selectedBooking.id}
                  </span>
                  {isCheckedIn ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle size={12} /> Checked In
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 flex items-center gap-1">
                      <Clock size={12} /> Pending Check-in
                    </span>
                  )}
                </div>
              </div>

              {/* 2, 3, 4. Customer Identity Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Details</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{selectedBooking.firstName} {selectedBooking.lastName || ''}</h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><Smartphone size={13} className="text-slate-400" /> {selectedBooking.phone || 'N/A'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1"><Mail size={13} className="text-slate-400" /> {selectedBooking.email || 'N/A'}</span>
                    </p>
                  </div>
                  {selectedBooking.agentName && (
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 text-right self-start sm:self-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Desk Agent</span>
                      <span className="text-xs font-semibold text-slate-800">{selectedBooking.agentName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Activities & Guests Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked Activities</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingActivities(!isEditingActivities)}
                      className="text-[10px] font-semibold text-[#004E98] hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60"
                    >
                      {isEditingActivities ? 'Cancel' : 'Edit Activities'}
                    </button>
                  </div>
                  <span className="text-xs font-bold text-[#004E98] bg-[#004E98]/10 px-2.5 py-0.5 rounded-full">
                    {selectedBooking.guests || 1} Person(s)
                  </span>
                </div>

                {!isEditingActivities ? (
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {formattedActivities}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                    {AVAILABLE_ACTIVITIES.map(act => {
                      const isSelected = editActivities.includes(act.name);
                      const isPkg = isPackageOption(act.name);
                      const hasPackageSelected = editActivities.some(isPackageOption);

                      let isDisabled = false;
                      let disabledReason = '';

                      if (isPkg && hasPackageSelected && !isSelected) {
                        isDisabled = true;
                        disabledReason = 'Only one package can be selected per booking.';
                      }

                      return (
                        <label 
                          key={act.name} 
                          className={`flex flex-col p-1.5 rounded-xl transition-all ${
                            isDisabled 
                              ? 'opacity-50 cursor-not-allowed bg-slate-100/70 border border-slate-200/60' 
                              : 'cursor-pointer hover:bg-slate-50 border border-transparent'
                          }`}
                          onClick={e => {
                            if (isDisabled) e.preventDefault();
                          }}
                        >
                          <div className="flex items-center gap-2 text-xs w-full">
                            <input
                              type="checkbox"
                              disabled={isDisabled}
                              checked={isSelected}
                              onChange={e => {
                                if (isDisabled) return;
                                if (e.target.checked) {
                                  if (isPkg) {
                                    setEditActivities([...editActivities.filter(a => !isPackageOption(a)), act.name]);
                                  } else {
                                    setEditActivities([...editActivities, act.name]);
                                  }
                                } else {
                                  setEditActivities(editActivities.filter(a => a !== act.name));
                                }
                              }}
                              className="rounded text-[#004E98] focus:ring-0 disabled:cursor-not-allowed"
                            />
                            <span className="font-semibold text-slate-800">{act.name}</span>
                            <span className="text-slate-400 text-[10px] ml-auto">₹{act.price}</span>
                          </div>
                          {isDisabled && disabledReason && (
                            <span className="text-[9px] text-slate-500 font-medium italic mt-0.5 pl-5 block">
                              {disabledReason}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{selectedBooking.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{formatTime(selectedBooking.time)}</span>
                  </div>
                </div>
              </div>

              {/* 6, 7, 8, 9, 10. Billing Breakdown & Payment Settlement */}
              <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/60 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bill Amount</span>
                  <span className="text-lg font-extrabold text-[#004E98]">
                    ₹{totalAmt.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Advance Paid Field */}
                  <div className={`bg-white p-3 rounded-xl border space-y-1.5 shadow-2xs ${
                    Number(editAdvancePaid) > totalAmt || Number(editAdvancePaid) < 0 ? 'border-red-500 bg-red-50/30' : 'border-slate-200/70'
                  }`}>
                    <label className="text-[11px] font-semibold text-slate-500 block">Advance Paid</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={editAdvanceMode}
                        onChange={e => setEditAdvanceMode(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#004E98]"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={editAdvancePaid}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setEditAdvancePaid(val);
                            if (totalAmt > 0 && (val + Number(editBalancePaid)) >= totalAmt) {
                              setEditPaymentStatus('Completed');
                            } else if ((val + Number(editBalancePaid)) > 0 && editPaymentStatus === 'Pending') {
                              setEditPaymentStatus('Partial Paid');
                            }
                          }}
                          className={`w-full pl-6 pr-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-bold text-right outline-none focus:border-[#004E98] ${
                            Number(editAdvancePaid) > totalAmt || Number(editAdvancePaid) < 0 ? 'text-red-600 border-red-500' : 'text-slate-900 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Balance Paid Field */}
                  <div className={`bg-white p-3 rounded-xl border space-y-1.5 shadow-2xs ${
                    Number(editBalancePaid) > totalAmt || Number(editBalancePaid) < 0 ? 'border-red-500 bg-red-50/30' : 'border-slate-200/70'
                  }`}>
                    <label className="text-[11px] font-semibold text-slate-500 block">Balance Paid</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={editBalanceMode}
                        onChange={e => setEditBalanceMode(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#004E98]"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={editBalancePaid}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setEditBalancePaid(val);
                            if (totalAmt > 0 && (Number(editAdvancePaid) + val) >= totalAmt) {
                              setEditPaymentStatus('Completed');
                            } else if ((Number(editAdvancePaid) + val) > 0 && editPaymentStatus === 'Pending') {
                              setEditPaymentStatus('Partial Paid');
                            }
                          }}
                          className={`w-full pl-6 pr-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-bold text-right outline-none focus:border-[#004E98] ${
                            Number(editBalancePaid) > totalAmt || Number(editBalancePaid) < 0 ? 'text-red-600 border-red-500' : 'text-slate-900 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live validation error notices */}
                {Number(editAdvancePaid) > totalAmt && (
                  <p className="text-red-600 text-xs font-bold">
                    ⚠️ Enter valid amount! Advance (₹{Number(editAdvancePaid).toLocaleString('en-IN')}) cannot exceed total bill amount (₹{totalAmt.toLocaleString('en-IN')}).
                  </p>
                )}
                {Number(editBalancePaid) > totalAmt && (
                  <p className="text-red-600 text-xs font-bold">
                    ⚠️ Enter valid amount! Balance (₹{Number(editBalancePaid).toLocaleString('en-IN')}) cannot exceed total bill amount (₹{totalAmt.toLocaleString('en-IN')}).
                  </p>
                )}
                {(Number(editAdvancePaid) + Number(editBalancePaid)) > totalAmt && Number(editAdvancePaid) <= totalAmt && Number(editBalancePaid) <= totalAmt && (
                  <p className="text-red-600 text-xs font-bold">
                    ⚠️ Enter valid amount! Total payments (₹{(Number(editAdvancePaid) + Number(editBalancePaid)).toLocaleString('en-IN')}) exceed total bill amount (₹{totalAmt.toLocaleString('en-IN')}).
                  </p>
                )}

                {/* Remaining Due & Payment Status Row */}
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">Remaining Counter Due</span>
                    {liveRem > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full">
                          <AlertCircle size={13} /> Due ₹{liveRem.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newBal = (Number(editBalancePaid) || 0) + liveRem;
                            setEditBalancePaid(newBal);
                            setEditPaymentStatus('Completed');
                          }}
                          className="text-[10px] font-bold text-[#004E98] bg-[#004E98]/10 hover:bg-[#004E98]/20 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          + Settle ₹{liveRem}
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full transition-all">
                        <CheckCircle2 size={13} /> Paid in full (₹0)
                      </span>
                    )}
                  </div>

                  {/* Payment Status Dropdown */}
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-0.5">Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={e => setEditPaymentStatus(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#004E98] shadow-2xs"
                    >
                      <option value="Completed">Collected / Completed</option>
                      <option value="Partial Paid">Partial Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 11. Ticket Status & Confirmation Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirmation Actions</span>
                
                {liveRem > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-medium">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>Remaining due is ₹{liveRem.toLocaleString('en-IN')}. Clicking "Check-In" will auto-settle balance or you can click "Save Payment".</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Save Payment / Updates */}
                  <button
                    type="button"
                    onClick={() => handleSaveBookingModal(false)}
                    disabled={savingBooking}
                    className="w-full py-3.5 px-4 bg-[#004E98] hover:bg-[#003B73] active:scale-[0.98] text-white rounded-2xl font-bold text-xs tracking-wide transition-all shadow-md shadow-[#004E98]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingBooking ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={16} /> Save Payment
                      </>
                    )}
                  </button>

                  {/* Option 2: Confirm Check-In Ticket */}
                  <button
                    type="button"
                    disabled={savingBooking}
                    onClick={() => handleSaveBookingModal(true)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                      isCheckedIn
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {savingBooking ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : isCheckedIn ? (
                      <>
                        <CheckCircle size={16} /> Already Checked In
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} /> Confirm Check-In
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 12. Liability Waiver Release Form Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <FileCheck size={16} className="text-[#004E98]" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Liability Waiver Release Form</h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    Digitally Verified
                  </span>
                </div>

                {loadingWaiver ? (
                  <div className="flex items-center justify-center py-4 text-xs text-slate-500 gap-2">
                    <RefreshCw size={14} className="animate-spin text-[#004E98]" /> Loading waiver agreement details...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waiver Name</span>
                      <span className="font-semibold text-slate-800">
                        {selectedBookingWaiver?.guestName || selectedBookingWaiver?.guest_name || `${selectedBooking.firstName} ${selectedBooking.lastName || ''}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Signed Signature</span>
                      <span className="font-mono font-bold text-[#004E98]">
                        {selectedBookingWaiver?.signature || selectedBookingWaiver?.guestName || 'Digitally Signed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                      <span className="font-semibold text-slate-800">
                        {selectedBookingWaiver?.phone || selectedBooking.phone || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sailing Date</span>
                      <span className="font-semibold text-slate-800">
                        {selectedBookingWaiver?.dateOfSailing || selectedBookingWaiver?.date_of_sailing || selectedBooking.date || 'N/A'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 pt-1.5 border-t border-slate-200/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                      <span className="font-medium text-slate-700">
                        {selectedBookingWaiver?.communicationAddress || selectedBookingWaiver?.communication_address || 'Digitally Verified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 13. Bottom Action Bar */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Copy Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ticketUrl);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="w-full py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200/60"
                >
                  {copySuccess ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copySuccess ? 'Link Copied!' : 'Copy Link'}
                </button>

                {/* Download PDF / Voucher */}
                <a
                  href={selectedBooking.id.startsWith('JMB') ? `/api/manual-bookings/ticket/export/${selectedBooking.id}` : `/ticket/${selectedBooking.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-full bg-[#004E98] hover:bg-[#003B73] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Download size={14} /> Download PDF
                </a>

                {/* WhatsApp PDF / Link */}
                <a
                  href={`https://wa.me/${(selectedBooking.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedBooking.firstName}, here is your booking ticket from Joy Water Sports: ${ticketUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Send size={14} /> WhatsApp PDF
                </a>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL: CREATE COUPON */}
      {showCreateCoupon && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create New Discount Coupon</h3>
              <button 
                onClick={() => setShowCreateCoupon(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block mb-1 font-semibold">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20"
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl font-mono font-bold text-slate-900 outline-none focus:border-[#004E98]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Minimum Order Bill Amount (₹)</label>
                <input
                  type="number"
                  value={couponForm.minBill}
                  onChange={e => setCouponForm({ ...couponForm, minBill: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#004E98]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-800">Active Immediately</span>
                <button
                  type="button"
                  onClick={() => setCouponForm({ ...couponForm, active: !couponForm.active })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer p-0.5 ${
                    couponForm.active ? 'bg-[#004E98]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                    couponForm.active ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#004E98] hover:bg-[#003B73] text-white rounded-full font-semibold text-sm shadow-2xs transition-all cursor-pointer mt-4"
              >
                Save Coupon Code
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: COLLECTION STATS / REVENUE SUMMARY */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Financial Audit & Collection Breakdown</h3>
              <button 
                onClick={() => setShowRevenueModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex justify-between items-center">
                <span>Total Combined Revenue:</span>
                <span className="text-lg font-extrabold text-slate-900">₹{totalOverallGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex justify-between items-center">
                <span>Online Web Revenue:</span>
                <span className="text-base font-extrabold text-[#004E98]">₹{totalStandardGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex justify-between items-center">
                <span>Desk Walk-in Revenue:</span>
                <span className="text-base font-extrabold text-emerald-600">₹{totalManualGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 space-y-2 text-amber-950">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Pending Dues (Combined):</span>
                  <span className="text-base font-extrabold text-rose-700">₹{totalOverallDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-amber-200/60 flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#004E98] flex items-center gap-1.5"><Globe size={13} /> Online Pending Dues:</span>
                  <span className="font-extrabold text-slate-900">₹{totalStandardDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-emerald-800 flex items-center gap-1.5"><Receipt size={13} /> Desk / Counter Pending Dues:</span>
                  <span className="font-extrabold text-slate-900">₹{totalManualDue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: GOOGLE SHEETS WEBHOOK INTEGRATION */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Table size={20} className="text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Google Sheets Live Sync</h3>
              </div>
              <button 
                onClick={() => setShowSheetsModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {sheetsMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold ${
                sheetsMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200/80'
              }`}>
                {sheetsMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveSheetsUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Google Apps Script Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetsConfigUrl}
                  onChange={e => setSheetsConfigUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:border-[#004E98]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={sheetsLoading}
                  className="px-4 py-2 bg-[#004E98] text-white rounded-full text-xs font-semibold hover:bg-[#003B73] transition-all cursor-pointer"
                >
                  Save URL
                </button>
                <button
                  type="button"
                  onClick={handleTestSheets}
                  disabled={sheetsTesting}
                  className="px-4 py-2 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {sheetsTesting ? 'Pinging...' : 'Send Test Row'}
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllSheets}
                  disabled={sheetsSyncing}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  {sheetsSyncing ? 'Syncing...' : 'Sync All Bookings'}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Google Apps Script Snippet</h4>
              <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-40">
                <pre>{APPS_SCRIPT_CODE}</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-sans font-semibold cursor-pointer"
                >
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-rose-700 mb-1 flex items-center gap-1.5">
                <span>⚠️</span> Danger Zone — Database & History Cleanup
              </h4>
              <p className="text-[11px] text-slate-500 mb-2">
                Permanently delete all test bookings, customer logs, waivers, and sync history from NeonDB and local files.
              </p>
              <button
                type="button"
                onClick={handleClearAllData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Clear All Test Data & History
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: GENERIC CONFIRMATION DIALOG */}
      {confirmState && confirmState.show && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">{confirmState.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmState.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className={`px-4 py-2 rounded-full text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer ${
                  confirmState.title.toLowerCase().includes('delete')
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#004E98] hover:bg-[#003B73]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CAMERA SCANNER OVERLAY */}
      {showScanner && (
        <QrScannerComponent
          onScan={scannedId => {
            setShowScanner(false);
            handleVerifyTicket(scannedId);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
}
