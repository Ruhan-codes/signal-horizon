import { useState, useEffect } from 'react';

export default function IntroTelemetry({ isLoaded }: { isLoaded?: boolean }) {
  const [progress, setProgress] = useState(15);
  const [phase, setPhase] = useState("Auditing eSAKSHI Allocation Registers");
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      // Progress simulation up to 90% while awaiting real backend response
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 8;
          if (next >= 90) {
            clearInterval(interval);
            return 90;
          }
          if (next > 60) setPhase("Parsing Parliamentary Calamity & Works Telemetry");
          else if (next > 35) setPhase("Computing Data-Derived Constituency Risk Bands");
          return next;
        });
      }, 120);
      return () => clearInterval(interval);
    } else {
      // Once real data finishes loading, smoothly finish to 100%
      setPhase("Telemetry Stream Synchronized");
      setProgress(100);

      // Add a slight delay before triggering the fade-out, then wait for fade to unmount
      const fadeTimeout = setTimeout(() => setIsFadingOut(true), 400);
      const unmountTimeout = setTimeout(() => setIsVisible(false), 900);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(unmountTimeout);
      };
    }
  }, [isLoaded]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian text-white transition-opacity duration-500 ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute top-8 left-8 text-xs tracking-[0.25em] text-burgundy-500 font-mono">
        SIGNAL HORIZON // NATIONAL MPLADS RADAR
      </div>
      <div className="text-6xl font-mono tabular-nums mb-4 font-black">
        {Math.floor(progress).toString().padStart(3, '0')}
      </div>
      <div className="text-sm tracking-widest text-indigo-400 font-semibold animate-pulse">
        {phase}...
      </div>
      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-obsidian">
        <div
          className="h-full bg-gradient-to-r from-burgundy-700 via-purple-600 to-emerald-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
