import React, { useRef, useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import jsQR from 'jsqr';

interface QrScannerProps {
  onScan: (id: string) => void;
  onClose: () => void;
}

export default function QrScannerComponent({ onScan, onClose }: QrScannerProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        if (!active) return;
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(() => {});
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error(err);
        if (active) setErrorMsg('Camera access denied or not available. Please ensure camera permissions are granted.');
      }
    }

    function tick() {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            console.log('[QR SCANNER] Raw scanned QR value:', code.data);
            onScan(code.data);
            return; // stop scanning after successful read
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    }

    setupCamera();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-sm relative flex flex-col items-center shadow-2xl border border-slate-100">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-2 border border-slate-200/60 cursor-pointer"
          title="Close scanner"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-2 mb-4 text-[#004E98]">
          <Camera size={22} />
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Scan Ticket QR</h3>
        </div>

        {errorMsg ? (
           <div className="p-4 text-center text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-semibold">{errorMsg}</div>
        ) : (
           <div className="w-full mx-auto overflow-hidden rounded-2xl border border-slate-200 shadow-inner relative bg-slate-900" style={{ minHeight: '260px' }}>
              <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-4 border-[#004E98] m-8 rounded-2xl pointer-events-none animate-pulse"></div>
           </div>
        )}
        <p className="text-xs text-slate-500 font-medium text-center mt-4">Point device camera at booking QR code</p>
      </div>
    </div>
  );
}
