"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, X } from "lucide-react";

export function KeepMyVoiceBadge() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sticky top-3 z-30 mx-auto flex w-fit items-center gap-2 rounded-full border border-stoun-gold/40 bg-stoun-gold/15 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-stoun-gold shadow-glow-gold backdrop-blur-md"
      >
        <Mic className="h-4 w-4" />
        Keep My Voice
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-stoun-gold/30 bg-surface p-6 text-center"
            >
              <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stoun-gold/20">
                <Mic className="h-7 w-7 text-stoun-gold" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">Your voice, always.</h3>
              <p className="text-sm text-muted">
                Every tool in the Studio shapes the production around your real
                voice — your timbre, your timing, your emotion. Stoun never
                swaps it for a synthetic one.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
