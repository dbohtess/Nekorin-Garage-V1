import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface PhoneFrameProps {
  children: ReactNode;
  dynamicIslandMessage?: string | null;
  currentUserEmail?: string;
}

export default function PhoneFrame({
  children,
  dynamicIslandMessage,
}: PhoneFrameProps) {
  return (
    <div className="h-[100svh] w-full overflow-hidden bg-[#070708] text-white font-sans selection:bg-red-500 selection:text-white">
      <main className="relative mx-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-[#0e0e10] sm:border-x sm:border-white/5 sm:shadow-[0_0_60px_rgba(0,0,0,0.65)]">
        <AnimatePresence>
          {dynamicIslandMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="pointer-events-none absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full border border-red-500/20 bg-black/90 px-4 py-2 text-center text-[11px] font-bold text-neutral-200 shadow-xl backdrop-blur-md"
              role="status"
            >
              {dynamicIslandMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
