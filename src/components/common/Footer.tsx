import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#181818] border-t border-neutral-800/80 pt-4 pb-20 md:pb-4 px-4 sm:px-8 mt-auto z-10 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
          <p className="text-xs sm:text-sm text-neutral-300 tracking-wide">
            <strong>Diseñado y Creado por: Josmar Puerta -Bnas/Vzla</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
            Control Financiero & Tasa BCV
          </span>
          <span className="text-neutral-600">·</span>
          <span>Barinas, Venezuela</span>
        </div>
      </div>
    </footer>
  );
};
