import React, { useEffect, useRef, useState } from 'react';

/**
 * HeroVectorVideo Component
 * 
 * Renders the hero background video `herovid.mp4` from the `/public` folder.
 */
export default function HeroVectorVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };
    playVideo();
  }, [hasError]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none pointer-events-none bg-slate-900">
      {!hasError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/herovid.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => setHasError(true)}
          style={{ transform: 'translateZ(0)' }}
        >
          <source src="/herovid.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#004E98] to-sky-900 flex items-center justify-center p-6 text-center text-white/80">
          <p className="text-sm font-medium">
            Background Video: Place <code className="bg-white/10 px-2 py-1 rounded text-sky-200 font-mono">herovid.mp4</code> in the <code className="bg-white/10 px-2 py-1 rounded text-sky-200 font-mono">public</code> folder.
          </p>
        </div>
      )}
      {/* Video container */}
    </div>
  );
}

