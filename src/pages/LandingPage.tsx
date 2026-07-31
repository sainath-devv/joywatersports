import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Plane, ArrowRight, Check, Camera, Video, 
  Aperture, LogOut, User, Menu, X, ShieldCheck, Award, Heart, Search, FileText, ExternalLink,
  Ticket, Clock, CheckCircle, AlertCircle, Calendar, Users
} from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';
import { ACTIVITY_PRICES, EXPERIENCES, formatTime } from '../utils/constants';
import Footer from '../components/common/Footer';
import VideoGallerySection from '../components/common/VideoGallerySection';
import UserLogin from '../components/user/UserLogin';
import LazySection from '../components/common/LazySection';
import HeroVectorVideo from '../components/common/HeroVectorVideo';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "1",
    activities: [] as string[],
    specialRequest: ""
  });
  const [bookingStep, setBookingStep] = useState(1);
  const [waiverData, setWaiverData] = useState({
    guestName: "",
    communicationAddress: "",
    phone: "",
    email: "",
    signature: "",
    agreementDate: "",
    hasMinor: false,
    guardianName: "",
    guardianAddress: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianSignature: "",
    guardianAgreementDate: "",
    dateOfSailing: "",
    invoiceNo: "",
    boardingPassNo: "",
    trip1Time: "",
    trip2Time: "",
    trip3Time: "",
    trip4Time: "",
    boatG1: false
  });

  useEffect(() => {
    if (bookingStep === 2) {
      setWaiverData(prev => ({
        ...prev,
        guestName: prev.guestName || `${formData.firstName} ${formData.lastName}`.trim(),
        phone: prev.phone || formData.phone,
        email: prev.email || formData.email,
        dateOfSailing: prev.dateOfSailing || formData.date,
        agreementDate: prev.agreementDate || formData.date || new Date().toISOString().split('T')[0],
        guardianAgreementDate: prev.guardianAgreementDate || formData.date || new Date().toISOString().split('T')[0],
      }));
    }
  }, [bookingStep, formData]);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<any>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreedToWaiver, setAgreedToWaiver] = useState(false);

  // Centralized Authentication State
  const { user, isLoggedIn, logout: authLogout } = useAuth();
  const userName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || 'User';
  const userEmail = user?.email || user?.phone || '';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Sync user details into form data automatically when logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // Customer Booking Lookup State
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [lookupResults, setLookupResults] = useState<any[] | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const executeLookupSearch = async (queryStr: string) => {
    if (!queryStr || !queryStr.trim()) return;
    setLookupError('');
    setLookupLoading(true);
    setLookupResults(null);

    try {
      const res = await fetch('/api/customer/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrId: queryStr.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No active bookings found matching your details.');
      }
      setLookupResults(data.bookings || []);
    } catch (err: any) {
      setLookupError(err.message || 'Failed to search booking details.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupInput || !lookupInput.trim()) {
      setLookupError('Please enter your Phone Number or Booking ID.');
      return;
    }
    executeLookupSearch(lookupInput.trim());
  };

  const handleOpenAccountModal = (queryOverride?: string) => {
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    setIsLookupOpen(true);

    const savedPhone = user?.phone || localStorage.getItem('userPhone') || formData.phone || '';
    const savedEmail = user?.email || localStorage.getItem('userEmail') || userEmail || '';
    const initialQuery = queryOverride || savedPhone || savedEmail || lookupInput || '';

    if (initialQuery && initialQuery.trim()) {
      setLookupInput(initialQuery.trim());
      executeLookupSearch(initialQuery.trim());
    } else {
      setLookupResults(null);
      setLookupError('');
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
  };

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setIsLoginOpen(true);
      setSearchParams(prev => {
        if (!prev.has('login')) return prev;
        const next = new URLSearchParams(prev);
        next.delete('login');
        return next;
      }, { replace: true });
    }
  }, [searchParams.get('login')]);

  useEffect(() => {
    document.title = "Joy Water Sports | Premium Adventures in Varkala";
  }, []);

  const handleLogout = async () => {
    await authLogout();
    setShowUserMenu(false);
  };

  useEffect(() => {
    const rawBook = searchParams.get('book');
    if (!rawBook) return;

    const bookUpper = decodeURIComponent(rawBook).toUpperCase();
    if (ACTIVITY_PRICES[bookUpper]) {
      setFormData(prev => {
        if (prev.activities.includes(bookUpper) && prev.activities.length === 1) return prev;
        return { ...prev, activities: [bookUpper] };
      });

      // Allow DOM layout to complete before scrolling smoothly to the booking section
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById("booking-section");
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Clean up search param after smooth scroll finishes
      const cleanupTimer = setTimeout(() => {
        setSearchParams(prev => {
          if (!prev.has('book')) return prev;
          const next = new URLSearchParams(prev);
          next.delete('book');
          return next;
        }, { replace: true });
      }, 900);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [searchParams.get('book')]);

  const totalAmount = useMemo(() => {
    const guests = parseInt(formData.guests) || 0;
    const perPersonPrice = formData.activities.reduce((sum, activity) => sum + (ACTIVITY_PRICES[activity] || 0), 0);
    return guests * perPersonPrice;
  }, [formData.guests, formData.activities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isPackageOption = (act: string) => {
    if (!act) return false;
    return act === 'PACKAGE 2500' || act === 'OVERALL';
  };

  const handleActivityToggle = (activity: string) => {
    setFormData(prev => {
      const active = prev.activities.includes(activity);
      const isPkg = isPackageOption(activity);
      
      if (active) {
        return {
          ...prev,
          activities: prev.activities.filter(a => a !== activity)
        };
      } else {
        if (isPkg) {
          // Selecting a package replaces any current selection with just this package
          return {
            ...prev,
            activities: [activity]
          };
        } else {
          // Selecting an individual activity removes any package and adds this activity
          return {
            ...prev,
            activities: [...prev.activities.filter(a => !isPackageOption(a)), activity]
          };
        }
      }
    });
  };

  const handleWaiverChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setWaiverData(prev => ({ ...prev, [name]: checked }));
    } else {
      setWaiverData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleWaiverScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 60;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  const validateStep1 = () => {
    if (formData.activities.length === 0) {
      setErrorMessage("Please select at least one activity/package.");
      return false;
    }

    if (!formData.firstName.trim()) {
      setErrorMessage("Please enter your first name.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    const digitsOnly = (formData.phone || '').replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setErrorMessage("Please enter a valid 10-digit mobile phone number.");
      return false;
    }

    if (!formData.date) {
      setErrorMessage("Please choose a date.");
      return false;
    }

    if (!formData.time) {
      setErrorMessage("Please choose a time slot.");
      return false;
    }

    if (formData.time) {
      const [hours, minutes] = formData.time.split(':').map(Number);
      if (hours < 9 || (hours >= 17 && minutes > 0) || hours > 17) {
        setErrorMessage("Please select a time between 09:00 AM and 05:00 PM.");
        return false;
      }
    }

    setErrorMessage("");
    return true;
  };

  const validateStep2 = () => {
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setErrorMessage("Please log in or register to make a booking reservation.");
      setIsLoginOpen(true);
      return;
    }

    if (bookingStep === 1) {
      if (validateStep1()) {
        setBookingStep(2);
        // Scroll to the booking form top smoothly
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // We are on step 2 (Waiver Signing)
    if (!validateStep2()) {
      return;
    }

    if (!agreedToWaiver) {
      setErrorMessage("Please check the box confirming you read and agree to the Liability Waiver.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    let parsedPhone = formData.phone;
    try {
      const phoneNumber = parsePhoneNumber(formData.phone, 'IN');
      if (phoneNumber && phoneNumber.isValid()) {
        parsedPhone = phoneNumber.format('E.164');
      }
    } catch (error) {}

    try {
      // 1. Submit the main booking
      const bResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: parsedPhone, totalAmount })
      });

      if (!bResponse.ok) {
        const errorData = await bResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to make reservation");
      }

      const bResult = await bResponse.json();
      const bookingId = bResult.booking.id;

      // 2. Submit the associated waiver agreement connected via bookingId
      // Auto-populate waiver fields using Step 1 booking details to remove manual filling fields
      const wResponse = await fetch('/api/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId, 
          guestName: `${formData.firstName} ${formData.lastName || ""}`.trim(),
          communicationAddress: "Accepted Digitally",
          phone: parsedPhone,
          email: formData.email,
          signature: `${formData.firstName} ${formData.lastName || ""}`.trim(),
          agreementDate: new Date().toISOString().split('T')[0],
          hasMinor: false,
          guardianName: "",
          guardianAddress: "",
          guardianPhone: "",
          guardianSignature: "",
          dateOfSailing: formData.date
        })
      });

      if (!wResponse.ok) {
        console.warn("Waiver submission failed, booking completed.");
      }

      const message = `🌊 *NEW BOOKING ENQUIRY* 🌊\n\n` +
                      `🆔 *Booking ID:* ${bookingId}\n` +
                      `👤 *Name:* ${formData.firstName} ${formData.lastName}\n` +
                      `📧 *Email:* ${formData.email}\n` +
                      `📞 *Phone:* ${parsedPhone}\n` +
                      `📅 *Date:* ${formData.date}\n` +
                      `⏰ *Time:* ${formatTime(formData.time)}\n` +
                      `👥 *Members:* ${formData.guests}\n` +
                      `🏄 *Activities:* ${formData.activities.join(", ")}\n` +
                      `💰 *Total Amount:* ₹${totalAmount}\n` +
                      `✍️ *Signed Waiver:* AGREED & CERTIFIED ✓\n` +
                      `📝 *Special Request:* ${formData.specialRequest || "None"}\n`;

      const whatsappUrl = `https://wa.me/919025286044?text=${encodeURIComponent(message)}`;
      
      const confirmedData = {
        bookingId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: parsedPhone,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        activities: [...formData.activities],
        totalAmount,
        whatsappUrl
      };

      setLastConfirmedBooking(confirmedData);
      setStatus("success");
      setBookingStep(1); // Reset back to step 1 for subsequent runs
      setAgreedToWaiver(false);
      setScrolledToBottom(false);

      // Scroll smoothly to booking section
      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });

      // Reset forms
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: "1",
        activities: [],
        specialRequest: ""
      });

      setWaiverData({
        guestName: "",
        communicationAddress: "",
        phone: "",
        email: "",
        signature: "",
        agreementDate: "",
        hasMinor: false,
        guardianName: "",
        guardianAddress: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianSignature: "",
        guardianAgreementDate: "",
        dateOfSailing: "",
        invoiceNo: "",
        boardingPassNo: "",
        trip1Time: "",
        trip2Time: "",
        trip3Time: "",
        trip4Time: "",
        boatG1: false
      });

    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to save booking");
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  const packages = [
    { name: "Package 2500", price: "₹2500", period: "/person", description: "Special offer this month! Includes 3 amazing activities.", features: ["Parasailing", "Jet Ski", "1 Complementary Activity"], isPopular: true },
    { name: "Overall Package", price: "₹4500", period: "/person", description: "The ultimate experience including all water sports activities.", features: ["Parasailing", "Jet Ski", "Flying Fish", "Speed Boat", "Banana Boat", "Crazy Sofa", "Doughnut Boat", "ATV"], isPopular: false }
  ];

  const testimonials = [
    { quote: "We had been here to experience the speed boat ride. The cost was rupees five hundred each. Life jacket was provided. The experience was amazing and definitely worth it. You can spot dolphins if you are lucky. There is an option to dive in middle of the sea for two hundred rupees per person. The water was blue. Overall would recommend this to others.", name: "Verified Explorer" },
    { quote: "Wonderful experience with Joy water sports. Our family tried their Parasailing, doughnut ride, crazy sofa and it was really worth it and completely safe. They ensured we had the maximum fun and also suggested the right rides. Would highly recommend them !!", name: "HARRISH SREEDHAR" },
    { quote: "I recently visited Varkala and met Joy water sports. JWS provides great service in water activities.If anyone wants great experience you should contact JWS. Thank you Joy water sports for helping me to accomplish one of my bucket list....☺️", name: "Keerthana K" },
    { quote: "Amazing experience with Joy Water Sports! Very professional team and safety was well maintained. The ride was thrilling and unforgettable. Highly recommended! 🥳", name: "Rameshwaran Saravanan" },
    { quote: "Had a fantastic time with Joy Water Sports in Varkala. The staff explained everything clearly and made sure safety was the top priority. The parasailing view was breathtaking, and the overall experience was smooth and enjoyable. Definitely worth trying!", name: "Swathi Amutha" },
    { quote: "I have no words to explain our experiences.... We had all the adventure rides with them.... Like paragliding, banana ride, jetski, speed boat so bcoz of combo pack they gave us donut ride for free...thank u so much...I would recommend who r visiting varkala must try these adventures there with them...the boys working there are too good and polite nd friendly...thank u guys...", name: "Divya Mohan" }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-deep-blue overflow-x-hidden relative bg-foam-white">
      {/* Hero Vector Animated Video Background */}
      <div className="absolute top-0 left-0 w-full h-[85vh] sm:h-[65vh] lg:h-[65vh] z-0 overflow-hidden rounded-b-[40px] shadow-sm bg-[#f8f9fc]">
        <HeroVectorVideo />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6 lg:px-8 text-deep-blue mx-auto w-full max-w-4xl transition-all duration-300">
        <div className="rounded-full px-6 py-4 flex items-center justify-between relative" style={{ background: '#FFFFFF', backdropFilter: 'blur(12px)', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.06)' }}>
          <div className="flex items-center cursor-pointer group" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
            <img src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            <button onClick={() => document.getElementById('activities-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 px-2 py-2 text-[15px] font-bold text-deep-blue hover:text-sky-blue transition-colors">Activities</button>
            <button onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 px-2 py-2 text-[15px] font-bold text-deep-blue hover:text-sky-blue transition-colors">Pricing & Offers</button>
            <button onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 px-2 py-2 text-[15px] font-bold text-deep-blue hover:text-sky-blue transition-colors">Reviews</button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-[15px] font-bold text-deep-blue hover:text-[#004E98] transition-colors px-3 py-1.5 rounded-full bg-sky-50/80 hover:bg-sky-100/90 border border-sky-100 cursor-pointer shadow-2xs"
                  title="Click to view Account & Tickets"
                >
                  <div className="w-7 h-7 rounded-full bg-[#004E98] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    {userName ? userName.charAt(0).toUpperCase() : <User size={14} />}
                  </div>
                  <span>{userName}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-900">{userName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); handleOpenAccountModal(); }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-[#004E98] hover:bg-sky-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Ticket size={16} className="text-[#004E98]" />
                      <span>My Account &amp; Ticket Status</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleLogout(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100 cursor-pointer"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="text-[15px] font-bold text-deep-blue hover:text-sky-blue transition-colors px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
              >
                <User size={18} />
                <span>Login</span>
              </button>
            )}
            <button onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-to-r from-sky-blue to-deep-blue hover:from-sky-blue hover:to-ocean-blue text-white px-5 sm:px-7 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-sky-blue/20 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer">Book Now</button>
          </div>

          {/* Mobile Navigation controls */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={() => {
                document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                setMobileMenuOpen(false);
              }} 
              className="bg-gradient-to-r from-sky-blue to-deep-blue text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md shadow-sky-blue/10 transition-all active:scale-95 cursor-pointer"
            >
              Book Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-deep-blue hover:text-sky-blue focus:outline-none transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={22} className="transition-transform duration-200 rotate-90" /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown Panel */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-3 bg-white rounded-[24px] p-5 shadow-2xl border border-gray-100 flex flex-col gap-4 z-40 text-left md:hidden"
            >
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
                <button 
                  onClick={() => {
                    document.getElementById('activities-section')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all"
                >
                  Catalog Activities
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all"
                >
                  Pricing &amp; Special Offers
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all"
                >
                  Customer Reviews
                </button>
              </div>

              {/* Mobile Auth & Account Access Container */}
              <div className="pt-1">
                {isLoggedIn ? (
                  <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-100 space-y-3">
                    <button
                      type="button"
                      onClick={() => handleOpenAccountModal()}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#004E98] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          {userName ? userName.charAt(0).toUpperCase() : <User size={18} />}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-xs text-slate-900 leading-tight truncate group-hover:text-[#004E98] transition-colors">{userName}</h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#004E98] text-white font-extrabold px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
                        View Tickets
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAccountModal()}
                      className="w-full bg-[#004E98] hover:bg-[#003B73] text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Ticket size={15} /> My Account &amp; Ticket Status
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl text-center text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAccountModal()}
                      className="w-full bg-sky-50 border border-sky-200 text-[#004E98] font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Ticket size={15} /> Check Ticket Status by Phone / ID
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-deep-blue hover:bg-sky-blue text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Access Login / Signup
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[65vh] lg:min-h-[65vh] pt-32 pb-16 w-full overflow-hidden">
        <div className="relative z-20 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 md:px-12 w-full text-center">
          <h1 style={{ color: '#004E98' }} className="text-[10vw] sm:text-[8vw] md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] tracking-tight drop-shadow-xs">Life's an adventure,<br className="sm:hidden" /> live it!</h1>
          <p className="text-sm sm:text-lg md:text-xl text-slate-800 font-bold leading-relaxed max-w-2xl mt-4 sm:mt-6 px-4">Premium water sports and coastal adventures in Varkala. Experience jet skiing, parasailing, and more with Joy Water Sports.</p>
        </div>
      </main>

      {/* About Section */}
      <section className="relative w-full flex flex-col items-center py-12 md:py-16 bg-surf-4 z-20">
        <div className="w-full max-w-4xl px-4 sm:px-6 flex flex-col items-center text-center pb-8 sm:pb-12">
          <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-4 underline underline-offset-4 decoration-deep-blue decoration-2">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-display text-deep-blue leading-tight mb-6 font-semibold">A wonderful place <br/>for a <span className="text-sky-blue">family vacation</span></h2>
          <p className="text-deep-blue/70 max-w-[650px] text-sm md:text-base leading-relaxed font-semibold">Feel the harmony, enjoy the comfort, admire the beautiful views and interiors. Our resort is one of the most suitable places for relaxation and unforgettable memories.</p>
        </div>
        <div className="w-full max-w-7xl mx-auto flex h-[280px] sm:h-[340px] md:h-[420px] lg:h-[520px] gap-1 px-3 md:px-6 justify-center">
          <div className="w-[18%] sm:w-[20%] md:w-[22%] h-full overflow-hidden border border-gray-100 shadow-sm rounded-l-2xl"><img loading="lazy" decoding="async" src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jws1.png" alt="Resort" className="w-full h-full object-cover" /></div>
          <div className="w-[50%] sm:w-[52%] md:w-[54%] h-full overflow-hidden border border-gray-100 shadow-sm"><img loading="lazy" decoding="async" src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png" alt="Adventure" className="w-full h-full object-cover" /></div>
          <div className="w-[18%] sm:w-[20%] md:w-[22%] h-full overflow-hidden border border-gray-100 shadow-sm rounded-r-2xl"><img loading="lazy" decoding="async" src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jws3.png" alt="Pool" className="w-full h-full object-cover" /></div>
        </div>
      </section>

      {/* Activities Section */}
      <section id="activities-section" className="relative w-full flex flex-col px-6 sm:px-12 lg:pl-20 xl:pl-32 lg:pr-12 xl:pr-20 py-16 lg:py-24 bg-surf-1">
        <div className="flex flex-col mb-12 w-full max-w-[1550px]">
          <span className="self-start text-sky-blue text-xs font-bold uppercase tracking-widest mb-6 underline underline-offset-4 decoration-deep-blue decoration-2">
            Activities
          </span>
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-display text-deep-blue leading-tight font-semibold">Our catalog of <br />best <span className="text-sky-blue">activities</span> for 2026</h2>
            <p className="text-deep-blue/60 text-base font-medium max-w-[320px] leading-[1.6] text-left">Premium coastal experiences <br/>and water sport activities <br/>at the peak of popularity</p>
          </div>
        </div>
        <div ref={scrollContainerRef} className="flex overflow-x-auto overflow-y-hidden gap-4 sm:gap-6 w-full max-w-[1550px] pb-4 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {EXPERIENCES.map((exp, index) => (
            <Link to={`/activity/${exp.id}`} key={index} className="relative w-[320px] sm:w-[350px] lg:w-[380px] shrink-0 aspect-[4/5] overflow-hidden group cursor-pointer shadow-sm snap-start block rounded-2xl" style={{ contentVisibility: 'auto', containIntrinsicSize: '320px 400px' }}>
              <img src={exp.image} alt={exp.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none animate-fade-in" />
              <div className="absolute bottom-0 left-0 w-full p-5 flex justify-between items-end gap-2">
                <div className="flex flex-col items-start">
                  <h3 className="text-white font-medium text-lg mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{exp.title}</h3>
                  <div className="bg-sky-blue text-white text-[15px] font-bold px-3 py-1 inline-block shadow-md shadow-black/30 rounded-md">
                    Price: ₹{exp.price}/-
                  </div>
                </div>
                <button type="button" className="text-sm font-semibold text-white transition-all duration-300 flex items-center gap-1 hover:text-sky-blue whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <span>View Details</span> <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center items-center mt-8 sm:mt-12 w-full max-w-[1550px]">
          <div className="flex gap-4">
            <button type="button" aria-label="Scroll left" onClick={scrollLeft} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-deep-blue flex items-center justify-center text-white hover:bg-sky-blue transition-transform active:scale-95 shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <button type="button" aria-label="Scroll right" onClick={scrollRight} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-deep-blue flex items-center justify-center text-white hover:bg-sky-blue transition-transform active:scale-95 shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Media Partner Section */}
      <section className="relative w-full py-24 bg-white overflow-hidden border-t border-b border-gray-100">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center gap-16">
           {/* Text Content */}
           <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-blue mb-8 underline underline-offset-4 decoration-deep-blue decoration-2">
                <Camera size={14} className="text-sky-blue" />
                <span>Onsite Media Partner</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-display text-deep-blue leading-tight mb-6 font-semibold">
                Capture the <br className="hidden lg:block" />
                <span className="text-sky-blue">adrenaline.</span>
              </h2>

              <p className="text-gray-600 text-base sm:text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Immortalize your water sports adventure in breathtaking detail with our onsite action cameras. Professional-grade memories captured effortlessly.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto lg:mx-0 text-left">
                 <div className="flex flex-col gap-3">
                    <div className="w-10 h-10 bg-sky-blue/10 rounded-full flex items-center justify-center text-sky-blue border border-sky-blue/20">
                       <Video size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-deep-blue text-base mb-1">Cinematic Action Video</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Unmatched clarity and fluid stabilization for every moment.</p>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <div className="w-10 h-10 bg-sky-blue/10 rounded-full flex items-center justify-center text-sky-blue border border-sky-blue/20">
                       <Aperture size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-deep-blue text-base mb-1">Ultra HD Photos</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Perfectly timed shots to capture the exact moment of splash.</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Minimalist Image Layout */}
           <div className="w-full lg:w-[45%] relative mx-auto h-[400px] sm:h-[500px]">
               {/* Main image */}
               <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                  <img 
                    src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/360cam.png" 
                    alt="Action Camera" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
               </div>

               {/* Simple Floating Badge */}
               <div className="hidden">
                  <p className="text-gray-900 font-semibold text-lg tracking-tight mb-1">GoPro Pro</p>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                     <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Official Gear</span>
                  </div>
               </div>
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="relative w-full flex flex-col items-center px-4 sm:px-12 py-16 lg:py-24 bg-surf-2">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-surf-2 via-surf-2/85 to-surf-2 z-0"></div>
        <div className="relative z-10 flex flex-col items-center w-full">
          <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-4 underline underline-offset-4 decoration-deep-blue decoration-2">Exclusive Packages</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-deep-blue leading-tight text-center mb-5 font-semibold">Unbeatable <span className="text-sky-blue">Adventures</span></h2>
          <p className="text-deep-blue/60 text-center max-w-[500px] text-sm md:text-base leading-relaxed mb-12 sm:mb-16 px-2 font-medium">Choose an adventure package that suits you best. Get more activities for a better price.</p>
          
          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 sm:gap-8 w-full max-w-[850px] px-4 lg:px-0">
            {packages.map((pkg, index) => (
              <div key={index} className={`w-full lg:w-1/2 flex flex-col p-8 sm:p-10 rounded-[32px] transition-all duration-300 hover:-translate-y-2 ${pkg.isPopular ? 'bg-deep-blue text-white shadow-2xl relative lg:-mt-4 lg:-mb-4 z-10 border border-white/10' : 'bg-white text-deep-blue shadow-xl border border-gray-100 hover:shadow-2xl z-0'}`}>
                {pkg.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sky-blue text-white text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full shadow-lg">
                    Best Value
                  </div>
                )}
                <h3 className={`font-serif mb-2 ${pkg.isPopular ? 'text-[28px] sm:text-[32px]' : 'text-[24px] sm:text-[28px]'}`}>{pkg.name}</h3>
                <p className={`leading-relaxed mb-6 font-medium ${pkg.isPopular ? 'text-white/80' : 'text-deep-blue/70'}`}>{pkg.description}</p>
                
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-opacity-20 border-current">
                  <span className={`font-medium tracking-tight leading-none ${pkg.isPopular ? 'text-[52px] sm:text-[64px] text-sky-blue' : 'text-[44px] sm:text-[52px] text-deep-blue'}`}>{pkg.price}</span>
                  <span className={`text-[14px] sm:text-[15px] ${pkg.isPopular ? 'text-white/70' : 'text-deep-blue/60'}`}>{pkg.period}</span>
                </div>
                
                <div className="mb-8 flex-1">
                  <p className={`font-bold tracking-wider uppercase mb-5 ${pkg.isPopular ? 'text-[14px] text-white/90' : 'text-[13px] text-deep-blue/90'}`}>What's Included:</p>
                  <ul className={`flex flex-col ${pkg.isPopular ? 'gap-4' : 'gap-3.5'}`}>
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={pkg.isPopular ? 20 : 18} strokeWidth={3} className={`shrink-0 ${pkg.isPopular ? 'mt-1 text-sky-blue' : 'mt-0.5 text-sky-blue'}`} />
                        <span className={`leading-snug font-medium ${pkg.isPopular ? 'text-[16px] sm:text-[18px] text-white' : 'text-[15px] text-deep-blue/80'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const activityName = pkg.name === "Overall Package" ? "OVERALL" : "PACKAGE 2500";
                    setFormData(prev => ({ ...prev, activities: [activityName] }));
                    const el = document.getElementById("booking-section");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 shadow-md hover:shadow-xl ${pkg.isPopular ? 'bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-sky-blue hover:to-deep-blue text-white' : 'bg-gradient-to-r from-deep-blue to-ocean-blue hover:from-ocean-blue hover:to-sky-blue text-white'}`}>
                  Book This Package
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <LazySection>
        <VideoGallerySection />
      </LazySection>

      {/* Testimonials Section */}
      <section id="reviews-section" className="relative w-full flex flex-col items-center px-6 sm:px-12 py-16 lg:py-24 bg-surf-3">
        <div className="w-full max-w-4xl flex flex-col items-center text-center pb-8">
          <h2 className="text-3xl md:text-4xl lg:text-[56px] font-display text-deep-blue leading-tight mb-4 font-semibold">What Our Clients Are Saying</h2>
          <p className="text-deep-blue/70 max-w-[650px] text-sm md:text-base leading-relaxed font-semibold">Our users love how our platform simplifies their adventures</p>
        </div>
        <div className="w-full relative overflow-hidden flex max-w-[1400px] [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="flex w-max animate-marquee md:hover:[animation-play-state:paused] will-change-transform">
            <div className="flex gap-4 sm:gap-6 pr-4 sm:pr-6 w-max">
              {testimonials.map((testi, index) => (
                <div key={`orig-${index}`} className="w-[300px] sm:w-[320px] lg:w-[370px] shrink-0 bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-2 text-amber-400">
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                    </div>
                    <p className="text-[14px] leading-[1.6] font-medium text-deep-blue/80 mb-2 underline underline-offset-4 decoration-gray-300">"{testi.quote}"</p>
                  </div>
                  <p className="text-[13px] font-bold text-deep-blue/60 mt-1">- {testi.name}</p>
                </div>
              ))}
              {testimonials.map((testi, index) => (
                <div key={`dup-${index}`} className="w-[300px] sm:w-[320px] lg:w-[370px] shrink-0 bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-2 text-amber-400">
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                    </div>
                    <p className="text-[14px] leading-[1.6] font-medium text-deep-blue/80 mb-2 underline underline-offset-4 decoration-gray-300">"{testi.quote}"</p>
                  </div>
                  <p className="text-[13px] font-bold text-deep-blue/60 mt-1">- {testi.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Staff Section */}
      <section className="relative w-full py-16 lg:py-24 bg-white border-t border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-16">
            <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2 underline underline-offset-4 decoration-deep-blue decoration-2">
              <ShieldCheck size={14} className="text-sky-blue" />
              <span>Uncompromised Safety Standards</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-deep-blue leading-tight mb-6 font-semibold sm:whitespace-nowrap">
              Our Safety commitment & <span className="text-sky-blue">Licensed Team</span>
            </h2>
            <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed">
              At Joy Water Sports Varkala, your adventure is backed by top-tier physical security guidelines, industry-inspected equipment, and highly skilled master trainers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 flex flex-col items-start shadow-sm hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 border border-gray-200 mb-6">
                <Award size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif text-deep-blue text-xl font-bold mb-3 subheader-styled">Licensed & Certified Staff</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-semibold">
                Our entire operations crew holds verified life-saving licenses and international water sports credentials. Every coach is fully trained in marine navigation, sea safety protocols, and emergency first response rescue.
              </p>
            </div>

            <div className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 flex flex-col items-start shadow-sm hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 border border-gray-200 mb-6">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif text-deep-blue text-xl font-bold mb-3 subheader-styled">Certified & Audited Gear</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-semibold">
                We utilize only premium brand, high-buoyancy life vests, helmets, secure safety harnesses, and marine impact shields. All boats, jet skis, and equipment undergo safety audits twice daily to ensure zero failure risks.
              </p>
            </div>

            <div className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 flex flex-col items-start shadow-sm hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 border border-gray-200 mb-6">
                <Heart size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif text-deep-blue text-xl font-bold mb-3 subheader-styled">Compulsory Briefing & Guidance</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-semibold">
                No participant goes raw. Every single activity starts with a compulsory, high-clarity safety orientation, sea-current signals briefing, and hands-on control instruction from a dedicated individual coach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking-section" className="relative w-full flex justify-center px-4 sm:px-6 py-12 sm:py-16 bg-slate-100">
        <div className="w-full max-w-3xl">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-10 animate-fade-in flex flex-col items-center">
            <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-3">
              Book Your Adventure
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-3xl font-display text-deep-blue leading-tight mt-1 mb-2 font-semibold">
              Ready for the <span className="text-sky-blue">Experience?</span>
            </h2>
            <p className="text-deep-blue/50 text-sm max-w-md mx-auto">
              Fill in your details and we will secure your slot within 24 hours
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Minimalist Horizontal Quick Info Ribbon (No Emojis) */}
            <div className="grid grid-cols-3 gap-1 text-center bg-slate-950 border-b border-slate-900 py-5 px-4 sm:px-8">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Best Season</p>
                <p className="text-white text-[11px] sm:text-xs font-bold">October - March</p>
              </div>
              <div className="border-x border-slate-800/80">
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Group Size</p>
                <p className="text-white text-[11px] sm:text-xs font-bold">1 - 20 Guests</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Service Score</p>
                <p className="text-white text-[11px] sm:text-xs font-bold">4.9/5 Rating</p>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              {status === "success" ? (
                <div className="flex flex-col items-center py-10 text-center bg-white rounded-2xl p-6 sm:p-8 border border-white shadow-sm animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20">
                    <Check size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Booked Successfully!
                  </h3>
                  <p className="text-[#004E98] text-sm sm:text-base font-bold mb-3 max-w-md">
                    Our team will contact you soon!
                  </p>
                  <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
                    We have saved your reservation details. You can view your ticket and status anytime from your account!
                  </p>
                  <button type="button" onClick={() => setStatus("idle")} className="px-6 py-2.5 bg-deep-blue hover:bg-ocean-blue text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer">
                    Book Another Activity
                  </button>
                </div>
              ) : !isLoggedIn ? (
                <div className="flex flex-col items-center py-12 px-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-deep-blue/10 text-deep-blue rounded-full flex items-center justify-center mb-4">
                    <User size={24} className="text-deep-blue" />
                  </div>
                  <h3 className="text-lg font-display text-deep-blue mb-2 font-bold">Login Required</h3>
                  <p className="text-deep-blue/60 text-sm mb-6 max-w-md">
                    Please log in or register to complete your adventure booking. An account lets you access your tickets, sign the waiver agreement, and get real-time status updates!
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setIsLoginOpen(true)} 
                    className="px-8 py-3 bg-deep-blue hover:bg-ocean-blue text-white rounded-xl text-sm font-bold transition hover:shadow-md cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
                  >
                    Log In / Register Now
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${bookingStep === 1 ? 'bg-deep-blue text-white' : 'bg-gray-100 text-gray-500'}`}>1. Reservation</span>
                    <div className="w-8 h-0.5 bg-gray-200"></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${bookingStep === 2 ? 'bg-deep-blue text-white' : 'bg-gray-100 text-gray-400'}`}>2. Liability Waiver</span>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {bookingStep === 1 ? (
                      <>
                        {/* Step 1: Reservation Form Fields */}
                        {/* Row 1 - Name */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="firstName" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 text-left">First Name</label>
                            <input id="firstName" required name="firstName" value={formData.firstName} onChange={handleChange} autoComplete="given-name" type="text" placeholder="John" className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition text-left" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="lastName" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 text-left">Last Name</label>
                            <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} autoComplete="family-name" type="text" placeholder="Doe" className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition text-left" />
                          </div>
                        </div>

                        {/* Row 2 - Email & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="email" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 text-left">Email Address</label>
                            <input id="email" required name="email" value={formData.email} onChange={handleChange} autoComplete="email" type="email" placeholder="john@example.com" className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition text-left" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="phone" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 flex justify-between">
                              <span>Phone Number (with WhatsApp)</span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Required</span>
                            </label>
                            <input id="phone" required name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" type="tel" placeholder="+91 98765 43210" className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition text-left" />
                          </div>
                        </div>

                        {/* Row 3 - Date, Time & Guests */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                            <label htmlFor="date" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 text-left">Date</label>
                            <input id="date" required name="date" value={formData.date} onChange={handleChange} type="date" className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition cursor-pointer text-left" />
                          </div>
                          <div className="flex flex-col gap-1 flex-1 relative">
                            <label htmlFor="time" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 flex justify-between items-center">
                              <span>Time Slot</span>
                              {formData.time && (
                                ['09:00', '10:00', '16:00', '17:00'].includes(formData.time) ? (
                                  <span className="text-[8px] sm:text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Fast Filling</span>
                                ) : ['11:00', '12:00', '13:00'].includes(formData.time) ? (
                                  <span className="text-[8px] sm:text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">Moderate</span>
                                ) : (
                                  <span className="text-[8px] sm:text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">Available</span>
                                )
                              )}
                            </label>
                            <select id="time" required name="time" value={formData.time} onChange={handleChange} className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none appearance-none cursor-pointer text-left">
                              <option value="" disabled>Select Time</option>
                              <option value="09:00">09:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="13:00">01:00 PM</option>
                              <option value="14:00">02:00 PM</option>
                              <option value="15:00">03:00 PM</option>
                              <option value="16:00">04:00 PM</option>
                              <option value="17:00">05:00 PM</option>
                            </select>
                            <div className="absolute top-[34px] sm:top-[38px] right-3 sm:right-4 flex items-center pointer-events-none text-gray-400">
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-1 relative">
                            <label htmlFor="guests" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1 text-left">Guests</label>
                            <select id="guests" name="guests" value={formData.guests} onChange={handleChange} className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none appearance-none cursor-pointer text-left">
                              {[1,2,3,4,5,6,7,8,9,10,15,20].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                            </select>
                            <div className="absolute top-[34px] sm:top-[38px] right-3 sm:right-4 flex items-center pointer-events-none text-gray-400">
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Activities - Dropdown Selector */}
                        <div className="flex flex-col gap-1 relative text-left">
                          <label className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1">Select Activities or Packages</label>
                          <button
                            type="button"
                            onClick={() => setIsActivityOpen(!isActivityOpen)}
                            className="w-full bg-slate-50/50 px-3.5 py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition flex justify-between items-center text-left"
                          >
                            <span className={`truncate ${formData.activities.length === 0 ? 'text-gray-400' : 'text-deep-blue font-semibold'}`}>
                              {formData.activities.length === 0 
                                ? "Click to choose items..." 
                                : formData.activities.join(", ")
                              }
                            </span>
                            <div className={`transition-transform duration-200 shrink-0 ml-2 text-gray-400 ${isActivityOpen ? 'rotate-180' : ''}`}>
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </button>
                          
                          {isActivityOpen && (
                            <div className="absolute top-[100%] left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 sm:p-2 max-h-[220px] overflow-y-auto w-full animate-fade-in">
                              <div className="flex flex-col gap-0.5">
                                {Object.keys(ACTIVITY_PRICES).map(activity => {
                                  const isPkg = isPackageOption(activity);
                                  const selectedPkg = formData.activities.find(isPackageOption);
                                  const hasIndividualSelected = formData.activities.some(a => !isPackageOption(a));
                                  const active = formData.activities.includes(activity);

                                  let isDisabled = false;
                                  let disabledReason = '';

                                  if (selectedPkg) {
                                    // If a package is selected
                                    if (activity !== selectedPkg) {
                                      isDisabled = true;
                                      if (selectedPkg === 'PACKAGE 2500') {
                                        disabledReason = 'Package 2500 selected. Other options disabled.';
                                      } else if (selectedPkg === 'OVERALL') {
                                        disabledReason = 'Overall Package (₹4500) selected. Other options disabled.';
                                      } else {
                                        disabledReason = 'Package selected. Other options disabled.';
                                      }
                                    }
                                  } else if (hasIndividualSelected) {
                                    // If individual activities are selected
                                    if (isPkg) {
                                      isDisabled = true;
                                      disabledReason = 'Deselect individual activities to select a package.';
                                    }
                                  }

                                  return (
                                    <label 
                                      key={activity}
                                      className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
                                        isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
                                      }`}
                                      onClick={(e) => {
                                        if (isDisabled) {
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      <input 
                                        type="checkbox"
                                        disabled={isDisabled}
                                        checked={active}
                                        onChange={() => handleActivityToggle(activity)}
                                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ocean-blue border-gray-300 rounded focus:ring-ocean-blue"
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-[11px] sm:text-xs font-semibold text-deep-blue">
                                          {activity === 'PACKAGE 2500' ? 'Package 2500 (Combo Offer)' : activity === 'OVERALL' ? 'Overall Package (All Activities)' : activity}
                                        </span>
                                        {isDisabled && disabledReason && (
                                          <span className="text-[9px] text-amber-600 font-medium italic">
                                            {disabledReason}
                                          </span>
                                        )}
                                      </div>
                                      <span className="ml-auto text-[10px] sm:text-xs font-bold text-ocean-blue bg-ocean-blue/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">₹{ACTIVITY_PRICES[activity]}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Total Bill Amount Display */}
                        <div className="flex flex-col gap-1 text-left">
                          <p className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1">Total Calculated Amount</p>
                          <div className="bg-ocean-blue/5 border border-ocean-blue/15 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">Total Bill for {formData.guests || 1} guest(s)</span>
                            <span className="text-base sm:text-lg font-black text-ocean-blue">₹{totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-left">
                          <label htmlFor="notes" className="text-[10px] sm:text-xs font-semibold text-deep-blue/70 px-1">Special Request (Optional)</label>
                          <input id="notes" name="specialRequest" value={formData.specialRequest} onChange={handleChange} type="text" placeholder="assistance, etc." className="w-full bg-slate-50/50 px-3.5 py-2.5 sm:py-3 rounded-xl text-sm border border-gray-200 focus:border-ocean-blue outline-none transition" />
                        </div>

                        {errorMessage && <p className="text-red-500 text-xs font-bold text-left">{errorMessage}</p>}

                        {/* Step 1 Button */}
                        <button type="submit" className="w-full py-3.5 bg-deep-blue hover:bg-ocean-blue text-white rounded-xl font-bold text-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mt-4 transform cursor-pointer">
                          Continue to Safety Waiver <ArrowRight size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Step 2: Safety & Liability Waiver Agreement */}
                        <div className="space-y-4">
                          {/* Rich scrolling waiver panel */}
                          <div className="bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden shadow-inner">
                            {/* Paper mockup title block */}
                            <div className="bg-slate-950 border-b border-slate-800 p-4 text-center">
                              <h4 className="text-slate-100 font-extrabold tracking-wider text-sm sm:text-base font-display">JOY WATER SPORTS</h4>
                              <p className="text-sky-blue font-bold text-[10px] sm:text-[11px] tracking-widest uppercase mt-0.5">WATER SPORTS LIABILITY WAIVER AGREEMENT</p>
                            </div>

                            <div 
                              onScroll={handleWaiverScroll} 
                              className="max-h-[224px] overflow-y-auto p-4 text-[11px] sm:text-xs text-slate-300 space-y-3.5 leading-relaxed text-left font-sans select-none scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600"
                            >
                              <p className="text-slate-400 font-semibold mb-2 italic">Please read carefully and scroll to the bottom of the agreement to acknowledge:</p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I certify that I am fully aware of the risks involved in the activity and I have been briefed about the safety procedures.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I'm aware about the DO's and Don'ts, medical restrictions and local govt. regulations.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I state that I am physically fit to undertake the activity and not suffering from any heart problem, blood pressure, asthma or any other serious medical problem.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I further state that I am lawfully age and legally competent to sign this liability release agreement or that I have obtained the written consent of my parent or guardian.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I understand and agree that neither JOY WATER SPORTS or its affiliates or subsidiary corporations, nor the owners, employees, agent's contractors may be held liable or responsible in anyway for any injury, death or other damages to me.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I understand that terms herein are contractual and not mere recital and that I have signed this agreement of my own free act with the knowledge that hereby I agree to waive my legal rights.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>I expressly agree and promise to accept and assume all of the risks existing in this activity. My participation in this activity is purely voluntary, and I elect to participate in spite of the risks.</span>
                              </p>
                              
                              <p className="flex items-start gap-2.5">
                                <span className="text-sky-blue shrink-0 font-bold mt-0.5">➢</span>
                                <span>Indemnity: I (or my representative) agree to protect and compensate the company against any costs or damages resulting from my negligence or misrepresentation.</span>
                              </p>

                              <div className="pt-4 text-center text-slate-500 font-bold text-[9px] uppercase tracking-wider border-t border-slate-800">
                                ✓ VERIFICATION RECORD: JOY WATER SPORTS WAIVER V1.0
                              </div>
                            </div>
                          </div>

                          {/* Scroll Warning / Tick Option */}
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <label className={`flex items-start gap-3 select-none ${scrolledToBottom ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
                              <input 
                                type="checkbox"
                                disabled={!scrolledToBottom}
                                checked={agreedToWaiver}
                                onChange={(e) => setAgreedToWaiver(e.target.checked)}
                                className={`w-4 h-4 text-ocean-blue border-slate-300 rounded mt-0.5 focus:ring-ocean-blue ${scrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                              />
                              <div className="text-left">
                                <p className="font-bold text-xs sm:text-sm text-deep-blue">I have read & fully agree to the liability waiver terms</p>
                                {!scrolledToBottom ? (
                                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">⚠️ Please scroll down the safety waiver box above to enable this checkmark.</p>
                                ) : (
                                  <p className="text-[10px] text-green-600 font-semibold mt-0.5">✓ Terms unlocked! Click to accept and sign.</p>
                                )}
                              </div>
                            </label>
                          </div>
                        </div>

                        {errorMessage && <p className="text-red-500 text-xs font-bold text-left">{errorMessage}</p>}

                        {/* Step 2 Buttons */}
                        <div className="flex gap-3 mt-4">
                          <button 
                            type="button" 
                            onClick={() => {
                              setBookingStep(1);
                              setErrorMessage("");
                            }} 
                            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            Back To Details
                          </button>

                          <button 
                            type="submit" 
                            disabled={status === "loading" || !agreedToWaiver} 
                            className={`flex-1 py-3.5 text-white rounded-xl font-bold text-sm hover:shadow-md transition-all flex items-center justify-center gap-2 transform cursor-pointer ${
                              status === "loading" || !agreedToWaiver 
                                ? 'bg-deep-blue/60 cursor-not-allowed opacity-85' 
                                : 'bg-gradient-to-r from-sky-blue to-deep-blue hover:shadow-sky-blue/10'
                            }`}
                          >
                            {status === "loading" ? "Completing Reservation..." : <>Agree & Confirm Booking <Check size={16} /></>}
                          </button>
                        </div>
                      </>
                    )}

                    <p className="text-center text-[10px] text-deep-blue/50 mt-3 font-semibold">Your private details are encrypted and securely stored for registration.</p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Booking Confirmation Success Modal Popup */}
      {status === "success" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in-backdrop">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative p-6 sm:p-8 space-y-5 flex flex-col text-center">
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>

            {/* Glowing Success Badge */}
            <div className="mx-auto w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Check size={32} strokeWidth={3} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                Booking Confirmed! 🎉
              </h3>
              <p className="text-emerald-600 font-bold text-sm mt-1">
                Your water sports slot has been reserved successfully.
              </p>
            </div>

            {/* Booking Details Card */}
            {lastConfirmedBooking && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Booking ID</span>
                  <span className="font-extrabold text-[#004E98] font-mono text-sm">{lastConfirmedBooking.bookingId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Guest Name</span>
                  <span className="font-bold text-slate-900">{lastConfirmedBooking.firstName} {lastConfirmedBooking.lastName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Date &amp; Time</span>
                  <span className="font-bold text-slate-900">{lastConfirmedBooking.date} ({formatTime(lastConfirmedBooking.time)})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Activities ({lastConfirmedBooking.guests} Guest{lastConfirmedBooking.guests > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{lastConfirmedBooking.activities?.join(', ')}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Total Amount</span>
                  <span className="font-black text-[#004E98] text-sm">₹{lastConfirmedBooking.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <p className="text-slate-500 text-xs leading-relaxed">
              Our team will review your booking details and contact you shortly. You can also view your live ticket &amp; boarding pass.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {lastConfirmedBooking?.whatsappUrl && (
                <a
                  href={lastConfirmedBooking.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>WhatsApp Confirmation</span> <ExternalLink size={14} />
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  const refId = lastConfirmedBooking?.bookingId || lastConfirmedBooking?.phone || '';
                  setStatus("idle");
                  handleOpenAccountModal(refId);
                }}
                className="flex-1 py-3 bg-[#004E98] hover:bg-[#003B73] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ticket size={14} /> View My Ticket
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors pt-1 cursor-pointer"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* Login / Registration Modal with backdrop blur */}
      {isLoginOpen && (
        <UserLogin 
          isModal={true}
          onSuccess={handleLoginSuccess}
          onCancel={() => setIsLoginOpen(false)}
        />
      )}

      {/* Customer Account & Ticket Status Modal */}
      {isLookupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-backdrop">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative p-6 sm:p-8 space-y-5 max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setIsLookupOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 bg-sky-100 text-[#004E98] rounded-2xl shadow-xs">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">My Account &amp; Ticket Status</h3>
                <p className="text-xs text-slate-500 font-medium">View active tickets, check payment status &amp; boarding passes</p>
              </div>
            </div>

            {/* Account Info Bar (if logged in) */}
            {isLoggedIn && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-[#004E98] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const savedPhone = localStorage.getItem('userPhone') || formData.phone || userEmail;
                    if (savedPhone) {
                      setLookupInput(savedPhone);
                      executeLookupSearch(savedPhone);
                    }
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-[#004E98] transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  Auto-load My Bookings
                </button>
              </div>
            )}

            {/* Search Input Bar */}
            <form onSubmit={handleLookupSubmit} className="space-y-2 shrink-0">
              <label className="text-xs font-bold text-slate-700 block">Search Ticket by Phone Number or Ticket ID</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    placeholder="Enter Phone e.g. 9876543210 or Ticket ID (JWS-1002)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98] focus:ring-4 focus:ring-[#004E98]/10 transition-all font-medium text-slate-900"
                  />
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="bg-[#004E98] hover:bg-[#003B73] text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {lookupLoading ? 'Searching...' : <>Search</>}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {lookupError && (
              <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-700 text-xs font-semibold shrink-0">
                {lookupError}
              </div>
            )}

            {/* Lookup Results */}
            {lookupResults && (
              <div className="space-y-3.5 pt-1 overflow-y-auto pr-1 flex-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Found {lookupResults.length} Ticket(s)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Updated live
                  </span>
                </div>

                {lookupResults.map((b: any) => {
                  const isVerified = b.ticketStatus === 'VERIFIED' || b.ticketStatus === 'CONFIRMED';
                  const isCancelled = b.ticketStatus === 'CANCELLED';

                  return (
                    <div key={b.id} className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-3 hover:border-slate-300 transition-all shadow-2xs">
                      {/* Top Bar: ID + Status Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono bg-[#004E98]/10 text-[#004E98] px-2.5 py-1 rounded-lg">
                            #{b.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                            b.remainingDue === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {b.remainingDue === 0 ? 'PAID IN FULL' : `DUE ₹${b.remainingDue}`}
                          </span>
                        </div>

                        {/* Ticket Check-in Status */}
                        <div>
                          {isVerified ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <CheckCircle size={12} /> CONFIRMED &amp; READY
                            </span>
                          ) : isCancelled ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <AlertCircle size={12} /> CANCELLED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <Clock size={12} /> PENDING CHECK-IN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Info & Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer</p>
                          <p className="font-bold text-slate-900">{b.firstName} {b.lastName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Date &amp; Slot</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} className="text-[#004E98]" /> {b.date} @ {formatTime(b.time)}
                          </p>
                        </div>
                      </div>

                      {/* Activities & Guests */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Booked Activities</span>
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Users size={12} className="text-[#004E98]" /> {b.guests} Person(s)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(b.activities) && b.activities.length > 0 ? (
                            b.activities.map((act: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-sky-50 text-[#004E98] border border-sky-100 rounded-md text-[11px] font-bold">
                                {act}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-600 font-medium">Standard Water Sports Package</span>
                          )}
                        </div>
                      </div>

                      {/* Payment Breakdown & Action Button */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-xs">
                          <span className="text-[10px] text-slate-400 block font-semibold">Total Price</span>
                          <span className="font-extrabold text-slate-900">₹{b.totalAmount}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">(Adv: ₹{b.advancePaid})</span>
                        </div>

                        <Link
                          to={`/ticket/${b.id}`}
                          onClick={() => setIsLookupOpen(false)}
                          className="bg-[#004E98] hover:bg-[#003B73] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          View Ticket Pass <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
