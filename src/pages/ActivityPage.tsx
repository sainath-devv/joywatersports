import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Shirt
} from 'lucide-react';
import { EXPERIENCES } from '../utils/constants';
import Footer from '../components/common/Footer';

interface ActivitySpec {
  duration: string;
  bestTime: string;
  provided: string[];
  requirements: string[];
  highlights: string[];
  preparation: string[];
}

const ACTIVITY_SPECS: Record<string, ActivitySpec> = {
  parasailing: {
    duration: "10 - 12 Minutes (Pure Airtime)",
    bestTime: "01:30 PM - 05:30 PM (Wind permitting)",
    provided: [
      "Premium Tandem Parachute & Aero Harness",
      "ISO 12402 Certified High-Buoyancy Vests",
      "Hydraulic Winch Boat with Marine Engine",
      "Certified Operator & Coached Crew"
    ],
    requirements: [
      "Weight range: Min 35kg - Max 110kg per harness",
      "Minimum age limit: Above 10 years",
      "No advanced swimming expertise required"
    ],
    highlights: [
      "Stunning birds-eye view of beautiful Varkala Red Cliffs",
      "Tandem flight configurations for couples",
      "Optional water-dip touch splash on demand"
    ],
    preparation: [
      "Dress in quick-dry athletic wear or beach shorts",
      "Apply waterproof skin protection (sunscreen)",
      "Avail secure complimentary ground lockers for dry belongings"
    ]
  },
  jetski: {
    duration: "10 - 15 Minutes (High-speed run)",
    bestTime: "09:00 AM - 05:30 PM",
    provided: [
      "Highly Responsive Yamaha Waverunner PWC",
      "Automatic Speed Lanyard Kill-Switch Safety System",
      "Professional Wave Marshal & Rider Escort",
      "Ergonomic Impact-Protection Chest Vests"
    ],
    requirements: [
      "Minimum age: Above 8 years to ride with parents",
      "Strict compliance to specified shoreline speed limit zones",
      "Perfect physical conditioning (free from heavy medical issues)"
    ],
    highlights: [
      "Accelerate dynamically with marine twin-cylinder thrust",
      "Accompanied helper guarantees security from back deck",
      "Carve crisp foam wake curves on broad open ocean tracks"
    ],
    preparation: [
      "Secure or leave sunglasses, caps, and wearable gadgets behind",
      "Commit to a brief 5-minute pre-launch controls checkup",
      "Prepare to meet refreshing splashes head-on"
    ]
  },
  flyingfish: {
    duration: "10 - 12 Minutes (Intense airtime)",
    bestTime: "10:00 AM - 04:30 PM",
    provided: [
      "Industrial Heavy-Grade Inflatable Fish Sled",
      "Padded Reinforced Multi-Grip Handling Straps",
      "Speedboat Towing Pilot and Spotter Crew",
      "Reinforced Impact Safety Helmets & Jackets"
    ],
    requirements: [
      "Minimum age: 12 Years",
      "Good upper body holding grip strength is advised",
      "Not recommended under chronic neck, back, or joint strain"
    ],
    highlights: [
      "Experience airborne hover as headwind lifts the main deck",
      "Epic hydro-planing skips across active white waves",
      "High impact action suitable for true adventure lovers"
    ],
    preparation: [
      "Ensure personal flotation strap is fully zipped by marshals",
      "Keep feet inside specified floor pockets during tow speed",
      "Wear minimal lightweight swimwear or boardshorts"
    ]
  },
  speedboat: {
    duration: "15 - 20 Minutes (Scenic round flight)",
    bestTime: "09:00 AM - 05:30 PM",
    provided: [
      "Heavy-Duty Custom Deep-V Outboard Speedboat",
      "Ergonomic Padded Group Bench Seating",
      "Licensed Offshore Captain & Navigator Team",
      "High-visibility Sea Vests for all group members"
    ],
    requirements: [
      "No minimum age limit (Infants under direct parent care)",
      "Unmatched choice for family groups and active elderly guests",
      "Strict seat adherence policy during fast ocean banking"
    ],
    highlights: [
      "Stately cruise alongside historic black and red cliff shores",
      "Exciting sweeping high speed banks and ocean turns",
      "Panoramic group photography from deep off-cliff angles"
    ],
    preparation: [
      "Smartphone camera harnesses or wrist straps are recommended",
      "Great choice for early morning scenic photo sessions",
      "Bring light jackets if sensitive to constant cool winds"
    ]
  },
  bananaboat: {
    duration: "12 - 15 Minutes (Splashing ride)",
    bestTime: "09:30 AM - 05:00 PM",
    provided: [
      "Multi-Seat High Velocity Polyurethane Inflatable Sled",
      "Multi-Point Soft Cord Steering Grip Bars",
      "Dedicated Jetboat Pilot & Wave Monitor",
      "High-Buoyancy Safety Jackets for all body frames"
    ],
    requirements: [
      "Recommended team capacity: 4 to 8 guests",
      "Age limit: Above 6 years old",
      "No previous water-sports experiences expected"
    ],
    highlights: [
      "Classic splashy fun with close family members & companions",
      "Exciting coordinated group weight shifts during sharp corners",
      "Classic water plunge drop-off that makes for unforgettable laughs"
    ],
    preparation: [
      "Wear tight swim clothing, remove watches or rings",
      "Keep hands securely on primary grab rope at all times",
      "Relax when diving into our designated warm recovery current"
    ]
  },
  crazysofa: {
    duration: "10 - 12 Minutes (Smooth hover)",
    bestTime: "10:00 AM - 05:00 PM",
    provided: [
      "Three-Chamber Heavy Cushion Hover-Sofa",
      "Reinforced High-Back Comfort Support Frame",
      "Heavy duty marine-towline with high tension",
      "Trained safety boat guide & lifesaver observer"
    ],
    requirements: [
      "Minimum age requirement: Above 8 years old",
      "Suitable for families looking for stable speeds",
      "Follow seated group weight distribution instruction"
    ],
    highlights: [
      "Extremely comfortable broad-based seating",
      "High stability on rougher water states",
      "Exciting sliding and lateral centrifugal motion"
    ],
    preparation: [
      "Lean backwards slightly to cushion any direct wave impacts",
      "Hold both vertical strap handles concurrently during curves",
      "Perfect choice if seeking thrills without deep ocean plunges"
    ]
  },
  doughnutboat: {
    duration: "10 - 12 Minutes (Centrifugal spins)",
    bestTime: "10:00 AM - 05:00 PM",
    provided: [
      "Custom Double-Chamber Reinforced Circular Tubing",
      "Nylon Outer Layer for ultimate hydro-friction mitigation",
      "Heavy duty quick-release ocean towing harness",
      "Professional lifeguard escort in backup jetboat"
    ],
    requirements: [
      "Ideal passenger layout: 2 to 3 riders",
      "Minimum age limit: 10 Years old",
      "Strong core balance capabilities recommended"
    ],
    highlights: [
      "Dynamic 360-degree rotational turns on open waterways",
      "Exciting skips over speed-boat back waves",
      "Pure gravity-defying thrill segments"
    ],
    preparation: [
      "Tuck knees inward and maintain a firm centered grip",
      "Expect spinning forces, keep gaze aligned with front ropes",
      "Wear synthetic quick-drying materials only"
    ]
  },
  atv: {
    duration: "15 Minutes (Sand track run)",
    bestTime: "06:30 AM - 09:30 AM | 04:00 PM - 07:00 PM (Optimal temperature)",
    provided: [
      "250cc Dynamic Four-Stroke ATV Beach Cruiser",
      "Approved Impact-Absorbent Off-Road Helmet",
      "Safety Goggles & Protective Sand Shields",
      "Pacing Marshal & Safe Sandy Circuit System"
    ],
    requirements: [
      "Driver Age Limit: Above 15 years old",
      "Strict compliance to pre-marked beach track boundaries",
      "Maximum speed limits as directed by terrain marshals"
    ],
    highlights: [
      "Conquer tricky, shifting soft sandbanks with fat-tire traction",
      "Enjoy premium sunset-level ocean landscapes",
      "Very easy thumb throttle controls, perfect for first-timers"
    ],
    preparation: [
      "Sturdier closed-toe footwear is highly recommended",
      "Tie up long hair securely prior to mounting engine",
      "Wear light sunglasses or utilize the pre-washed goggles provided"
    ]
  }
};

export default function ActivityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const experience = EXPERIENCES.find(e => e.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (experience) {
      document.title = `${experience.title} | Premium Coastal Excursions – Joy Water Sports Varkala`;
    }
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, experience]);

  if (!experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-slate-800">
        <h1 className="text-2xl font-serif mb-4">Activity not available</h1>
        <button 
          type="button" 
          onClick={() => navigate("/")} 
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-transform active:scale-95"
        >
          Return Home
        </button>
      </div>
    );
  }

  const spec = ACTIVITY_SPECS[experience.id] || ACTIVITY_SPECS['parasailing'];

  const handleBookNow = () => {
    navigate(`/?book=${encodeURIComponent(experience.title.toUpperCase())}`);
  };

  // Split title to dynamically apply sky-blue highlighting to the last word
  const titleWords = experience.title.split(' ');
  const firstPart = titleWords.slice(0, -1).join(' ');
  const lastWord = titleWords[titleWords.length - 1];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] sm:h-[70vh] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 bg-slate-900">
          <img 
            src={experience.images[activeImage] || experience.image} 
            alt={experience.title} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-80" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20"></div>
        </div>


        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pb-12 sm:pb-20">
          <div className="max-w-3xl">
            {/* Elegant Activity Title unique design */}
            <div className="relative mb-6">
              <span className="text-[10px] font-bold tracking-[0.4em] text-white/50 block mb-2 uppercase">VARKALA EXCURSION</span>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-extrabold tracking-tight text-white leading-none uppercase drop-shadow-md">
                {firstPart ? `${firstPart} ` : ''}
                <span className="text-sky-blue">{lastWord}</span>
              </h1>
              <div className="w-16 h-[3px] bg-sky-blue mt-4 opacity-75" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full bg-white relative z-20 py-12 sm:py-20 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left Column (Pristine Overview Content) */}
          <div className="lg:col-span-8 flex flex-col">
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-serif text-deep-blue font-bold mb-3">
                  The Adventure <span className="text-sky-blue">Experience</span>
                </h3>
                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  {experience.description} Our trained shoreline team handles each aspect of launch, steering/flying mechanics, and soft touch-downs. We prioritize raw thrill with complete mental and physical peace of mind.
                </p>
              </div>
              
              {/* Simple Activity Details */}
              <div className="space-y-6 pt-4">
                <h4 className="text-sm font-bold text-deep-blue uppercase tracking-widest pb-2 border-b border-gray-100">
                  Activity Details
                </h4>
                
                {/* Duration & Best Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
                    <span className="text-sm font-semibold text-slate-800">{spec.duration}</span>
                  </div>
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Best Time to Visit</span>
                    <span className="text-sm font-semibold text-slate-800">{spec.bestTime}</span>
                  </div>
                </div>

                {/* Consolidated clean list of details */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Information</span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...spec.provided.slice(0, 2), ...spec.requirements.slice(0, 2)].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-slate-50/40 p-3.5 rounded-xl border border-slate-100">
                        <CheckCircle2 size={16} className="text-sky-blue shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Minimal Card Booking layout) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-md sticky top-28 flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold text-sky-blue uppercase tracking-widest block mb-1">Standard Excursion Rate</span>
                <p className="text-3xl font-bold tracking-tight text-deep-blue">
                  ₹{experience.price}/- <span className="text-xs text-slate-400 font-medium tracking-normal">person</span>
                </p>
              </div>

              <div className="border-t border-gray-50 pt-5 space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span className="text-slate-400">Optimal Operating Window</span>
                  <span className="text-deep-blue font-bold">{spec.bestTime.split('(')[0]}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span className="text-slate-400">Primary Guidance</span>
                  <span className="text-deep-blue font-bold">Included</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span className="text-slate-400">Operator Status</span>
                  <span className="text-emerald-600 font-bold">Active Slots</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookNow}
                className="w-full bg-gradient-to-r from-sky-blue to-deep-blue hover:from-sky-blue hover:to-ocean-blue text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-lg shadow-sky-blue/20 active:scale-[0.98] transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group mt-2 cursor-pointer animate-none"
              >
                Book This Ride 
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </button>

              <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
                Receive prompt booking tickets via WhatsApp. Coordinate with on-field captains directly at the beach when you arrive.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

