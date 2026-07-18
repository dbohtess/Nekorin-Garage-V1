import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, User, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PhoneFrameProps {
  children: React.ReactNode;
  dynamicIslandMessage?: string | null;
  onResetDemo: () => void;
  currentUserEmail?: string;
}

export default function PhoneFrame({
  children,
  dynamicIslandMessage,
  onResetDemo,
  currentUserEmail,
}: PhoneFrameProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-8 lg:gap-12 overflow-x-hidden font-sans select-none selection:bg-red-500 selection:text-white relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Desktop Dashboard Controls - Left Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-6 z-10 text-center lg:text-left">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE FLUTTER SIMULATOR
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
            Nekorin Garage <span className="text-red-500 font-mono text-xl">V1</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">
            A premium dark-gray and red-accent automotive garage mobile dashboard. Designed with an elegant RTL layout, local Firestore synchronization, and standard UAE Dirham currency mappings.
          </p>
        </div>

        {/* Console / Simulator Status Info */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-left font-mono text-xs space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-white/40">SIMULATOR ENGINES</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 text-[10px]">ONLINE</span>
            </div>
          </div>
          
          <div className="space-y-1.5 text-white/60">
            <div className="flex justify-between">
              <span className="text-white/40">Platform:</span>
              <span>iOS 17.5 (iPhone 15 Pro)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Renderer:</span>
              <span>Skia / Impeller (Flutter Web)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Auth state:</span>
              <span className="text-red-400">{currentUserEmail ? 'Authenticated' : 'Guest Mode'}</span>
            </div>
            {currentUserEmail && (
              <div className="flex justify-between truncate">
                <span className="text-white/40">Active User:</span>
                <span className="text-neutral-200 truncate max-w-[160px]">{currentUserEmail}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/40">Firestore:</span>
              <span className="text-red-500">Connected (Persisted)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Storage:</span>
              <span className="text-red-500">Active (Base64 Binary)</span>
            </div>
          </div>

          <button
            onClick={onResetDemo}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 transition-all font-sans font-semibold text-xs border border-white/10 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin-slow" />
            Reset Application Database
          </button>
        </div>
      </div>

      {/* iPhone 15 Pro Frame */}
      <div className="relative z-10 flex-shrink-0">
        {/* Phone outer border/glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-neutral-900 rounded-[55px] blur-xl opacity-40 pointer-events-none" />

        {/* Physical Phone Container */}
        <div className="relative w-[385px] h-[812px] bg-[#141416] rounded-[52px] p-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border-[5px] border-[#252528] flex flex-col overflow-hidden">
          {/* Inner glass overlay for reflection effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/[0.01] to-white/[0.04] rounded-[42px] pointer-events-none z-50" />

          {/* Speaker / Sensor Notch Bar at very top rim */}
          <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-28 h-[4px] bg-neutral-900 rounded-full z-50" />

          {/* Dynamic Island System */}
          <div className="absolute top-[12px] left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out flex items-center justify-center">
            <AnimatePresence mode="wait">
              {dynamicIslandMessage ? (
                <motion.div
                  key="active-island"
                  initial={{ width: 100, height: 26, borderRadius: 20 }}
                  animate={{ width: 240, height: 32, borderRadius: 20 }}
                  exit={{ width: 100, height: 26, borderRadius: 20 }}
                  className="bg-black/90 backdrop-blur-md border border-white/10 flex items-center justify-between px-3.5 shadow-2xl overflow-hidden"
                >
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider animate-pulse">SYSTEM LOG</span>
                  <span className="text-[10px] text-neutral-300 font-medium truncate max-w-[150px]">{dynamicIslandMessage}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle-island"
                  className="bg-black w-[100px] h-[26px] rounded-full flex items-center justify-center shadow-lg"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-[#1c1c1e] flex items-center justify-center ml-auto mr-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-900/80" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* iOS Status Bar Area */}
          <div className="h-11 flex items-end justify-between px-6 pb-1 bg-transparent select-none z-40">
            {/* Time display */}
            <span className="text-[12px] font-semibold text-white/80 font-sans tracking-wide">
              {currentTime || '9:41 AM'}
            </span>
            
            {/* Battery / Connection Info */}
            <div className="flex items-center gap-1.5 text-white/80">
              <Signal className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="text-[10px] font-mono font-bold tracking-tight">5G</span>
              <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4 rotate-180 -mr-1" strokeWidth={2} />
                <span className="text-[9px] font-semibold">100%</span>
              </div>
            </div>
          </div>

          {/* Phone Application Screen Content Window */}
          <div className="flex-1 bg-[#0e0e10] rounded-[34px] overflow-hidden flex flex-col relative z-20 border border-white/5">
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-6 flex items-center justify-center bg-[#0e0e10] z-40">
            <div className="w-[110px] h-[4px] bg-white/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Perspective Branding Side Piece */}
      <div className="hidden lg:flex flex-col ml-4 gap-8 pointer-events-none z-10">
        <div className="border-l-4 border-red-600 pl-6">
          <h2 className="text-5xl font-black italic tracking-tighter opacity-20 uppercase mb-2">Nekorin</h2>
          <p className="text-white/40 max-w-[240px] text-sm uppercase tracking-[0.2em] leading-relaxed">
            Automotive Infrastructure Framework v1.0.4 - Firebase Backend Integrated
          </p>
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-[2px] bg-white/20"></div>
          <div className="w-12 h-[2px] bg-red-500"></div>
          <div className="w-12 h-[2px] bg-white/20"></div>
        </div>
      </div>
    </div>
  );
}
