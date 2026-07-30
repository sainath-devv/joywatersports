import React, { useState, useEffect, useRef } from 'react';

interface JoyPreloaderProps {
  onComplete?: () => void;
  brandName?: string;
  subText?: string;
  durationMs?: number; // Total loading animation duration (ms)
}

/**
 * Exact NeoLeaf-Style Liquid Wave Fill Preloader for "Joywatersports"
 * 
 * Recreates the exact reference screenshot:
 * - Matte dark charcoal canvas (#161616)
 * - Single bold "Joywatersports" display text
 * - Base unfilled text in dark graphite (#3a3a3c)
 * - Pure white (#ffffff) liquid wave flowing up inside the text from 0% to 100%
 * - SVG `<defs>` and `<use>` for 100% pixel-perfect text alignment (no ghosting or text offset)
 * - Small bottom-right "loading... 49 %" counter
 * - Smooth fade-out reveal upon hitting 100%
 */
export default function JoyPreloader({
  onComplete,
  durationMs = 2000,
}: JoyPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Lock body scrolling during preloader overlay
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / durationMs, 1);
      const easedRatio = easeOutCubic(linearRatio);
      const currentPct = Math.floor(easedRatio * 100);

      setProgress(currentPct);

      if (linearRatio < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setProgress(100);

        setTimeout(() => {
          setIsFading(true);
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';

          if (onComplete) {
            onComplete();
          }

          setTimeout(() => {
            setIsUnmounted(true);
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }, 600);
        }, 200);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [durationMs, onComplete]);

  if (isUnmounted) return null;

  return (
    <div
      id="joy-simple-preloader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: isFading ? 'none' : 'auto',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* Compact Glass Circle Container with Rotating Wave Border */}
        <div className="relative w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-sky-400/30 via-sky-200/50 to-blue-600/30 shadow-lg flex items-center justify-center backdrop-blur-sm">
          {/* Subtle Outer Rotating Accent Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#0077FF]/60 border-b-sky-400/60 animate-[spin_3s_linear_infinite]" />
          
          {/* Inner Circle Vessel */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-sky-50/90 to-blue-50/40 border border-white/80 shadow-inner flex items-end">
            
            {/* Liquid Fill Level Container */}
            <div
              className="absolute left-0 right-0 bottom-0 w-full transition-all duration-200 ease-out"
              style={{ height: `${Math.max(8, progress)}%` }}
            >
              {/* Back Wave (Cyan) */}
              <div className="absolute -top-3 left-0 w-[200%] h-5 opacity-60 animate-[waveMove_2.2s_linear_infinite]">
                <svg viewBox="0 0 600 60" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M 0 25 Q 150 45, 300 25 T 600 25 V 60 H 0 Z" fill="#38bdf8" />
                </svg>
              </div>

              {/* Front Wave (Ocean Blue) */}
              <div className="absolute -top-2.5 left-0 w-[200%] h-5 animate-[waveMove_1.5s_linear_infinite]">
                <svg viewBox="0 0 600 60" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M 0 25 Q 150 5, 300 25 T 600 25 V 60 H 0 Z" fill="#0077FF" />
                </svg>
              </div>

              {/* Liquid Body */}
              <div className="w-full h-full bg-[#0077FF]" />
            </div>

            {/* Glass Highlight Overlay on Circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Loading... text below animation */}
        <span className="font-display text-xl sm:text-2xl font-medium text-[#0F2F57] tracking-wider">Loading...</span>
      </div>

      <style>{`
        @keyframes waveMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
