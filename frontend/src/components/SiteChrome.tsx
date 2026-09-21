import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function SiteChrome() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full liquid-glass px-6 py-2.5 flex items-center justify-between gap-8 w-[95%] max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="font-bold tracking-tight">SIGNAL HORIZON</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white">
          <a href="#overview" className="hover:text-white transition-colors">Overview</a>
          <a href="#visual-hub" className="hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Visual Analytics
          </a>
          <a href="#funnel" className="hover:text-white transition-colors">Parliament Funnel</a>
          <a href="#screener" className="hover:text-white transition-colors">Screener</a>
          <a href="#calamity" className="hover:text-white transition-colors">Calamity Radar</a>
        </div>

        <a href="#visual-hub" className="hidden md:block px-4 py-1.5 rounded-full liquid-glass-strong text-sm font-bold hover:scale-105 transition-transform text-emerald-400 border border-emerald-500/30">
          Charts Hub
        </a>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm rounded-2xl liquid-glass-strong p-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm text-white">
            <a href="#overview" onClick={() => setOpen(false)}>Overview</a>
            <a href="#visual-hub" onClick={() => setOpen(false)} className="text-emerald-400 font-bold">Visual Analytics (Charts)</a>
            <a href="#funnel" onClick={() => setOpen(false)}>Parliament Funnel</a>
            <a href="#screener" onClick={() => setOpen(false)}>Screener</a>
            <a href="#calamity" onClick={() => setOpen(false)}>Calamity Radar</a>
          </div>
        </div>
      )}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-indigo-900/50 to-transparent z-40" />
    </>
  );
}
