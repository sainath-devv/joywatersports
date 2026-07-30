import React, { useRef, useEffect, useState } from 'react';
import { Film, Volume2, VolumeX } from 'lucide-react';

interface VideoCardProps {
  videoSrc: string;
  title?: string;
  fileName?: string;
}

export default function VideoCard({ videoSrc, title, fileName }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;
    
    // Explicitly set muted on DOM element for browser autoplay compliance
    video.muted = isMuted;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If autoplay failed, force muted and retry
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      }
    };

    // Attempt play immediately on mount
    playVideo();

    const observer = new IntersectionObserver(([entry]) => { 
      if (entry.isIntersecting) { 
        playVideo();
      } else { 
        video.pause(); 
      } 
    }, { 
      threshold: 0.1 
    });

    observer.observe(video);
    
    return () => {
      observer.disconnect();
    };
  }, [hasError, isMuted]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const baseName = videoSrc.substring(0, videoSrc.lastIndexOf('.')) || videoSrc;

  return (
    <div className="w-[85vw] sm:w-[340px] md:w-full shrink-0 snap-center aspect-[4/5] relative overflow-hidden group rounded-2xl shadow-xl border border-gray-100/50 bg-gray-900 animate-fade-in" style={{ transform: 'translateZ(0)' }}>
      {!hasError ? (
        <>
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            muted 
            loop 
            autoPlay
            playsInline 
            preload="auto"
            onError={() => setHasError(true)}
            style={{ transform: 'translateZ(0)' }}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={`${baseName}.webm`} type="video/webm" />
            <source src={`${baseName}.mov`} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>

          {/* Sound Mute/Unmute Toggle Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all cursor-pointer border border-white/20 shadow-md"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-300 gap-3">
          <div className="p-4 rounded-full bg-slate-800/80 text-sky-400 border border-slate-700">
            <Film size={32} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-white text-sm">{title || "Video Reel"}</p>
            <p className="text-xs text-sky-400/90 font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700/50 inline-block">
              {fileName || videoSrc.replace('/', '')}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
            Add <span className="text-slate-200 font-semibold">{fileName || videoSrc}</span> into your project&apos;s <span className="text-slate-200 font-semibold">/public</span> folder in VS Code to play automatically.
          </p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
    </div>
  );
}

