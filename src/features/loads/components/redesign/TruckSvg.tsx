import React from "react";

export const TruckSvg: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 540 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: "100%", height: "auto", maxHeight: "200px" }}
    >
      <defs>
        <linearGradient id="cabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="trailerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <filter id="truckShadow" x="-5%" y="-5%" width="110%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Shadow under truck */}
      <ellipse cx="270" cy="192" rx="240" ry="14" fill="#0F172A" fillOpacity="0.12" />

      {/* Group Truck Body */}
      <g filter="url(#truckShadow)">
        {/* === TRAILER === */}
        {/* Main box trailer */}
        <rect x="180" y="35" width="340" height="125" rx="6" fill="url(#trailerGrad)" stroke="#CBD5E1" strokeWidth="2" />
        
        {/* Trailer structural grooves / lines */}
        <line x1="220" y1="36" x2="220" y2="159" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="280" y1="36" x2="280" y2="159" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="340" y1="36" x2="340" y2="159" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="400" y1="36" x2="400" y2="159" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="460" y1="36" x2="460" y2="159" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Trailer rear doors frame & hinges */}
        <line x1="518" y1="36" x2="518" y2="159" stroke="#94A3B8" strokeWidth="2" />
        <rect x="515" y="55" width="4" height="12" rx="1" fill="#64748B" />
        <rect x="515" y="95" width="4" height="12" rx="1" fill="#64748B" />
        <rect x="515" y="135" width="4" height="12" rx="1" fill="#64748B" />

        {/* Reefer Unit on front of trailer */}
        <rect x="168" y="45" width="14" height="60" rx="3" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        <circle cx="175" cy="65" r="4" fill="#475569" />
        <circle cx="175" cy="85" r="4" fill="#475569" />

        {/* Side safety skirting under trailer */}
        <rect x="230" y="160" width="130" height="14" rx="2" fill="#334155" />

        {/* Chassis frame */}
        <rect x="150" y="156" width="370" height="8" rx="2" fill="url(#chassisGrad)" />

        {/* === TRACTOR / CAB === */}
        {/* Cab Main Body */}
        <path
          d="M 50 162 L 50 100 Q 52 75 72 65 L 140 50 Q 155 48 158 60 L 168 162 Z"
          fill="url(#cabGrad)"
          stroke="#CBD5E1"
          strokeWidth="2"
        />

        {/* Windshield & Side Windows */}
        <path
          d="M 58 100 L 72 72 Q 80 65 95 62 L 135 55 Q 142 55 145 62 L 148 100 Z"
          fill="url(#glassGrad)"
        />
        {/* Window pillar */}
        <line x1="98" y1="62" x2="98" y2="100" stroke="#CBD5E1" strokeWidth="3" />

        {/* Front bumper & Grille */}
        <path d="M 46 125 L 46 168 Q 46 174 54 174 L 85 174 L 85 125 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="48" y="132" width="32" height="4" rx="1" fill="#94A3B8" />
        <rect x="48" y="140" width="32" height="4" rx="1" fill="#94A3B8" />
        <rect x="48" y="148" width="32" height="4" rx="1" fill="#94A3B8" />
        <rect x="48" y="156" width="32" height="4" rx="1" fill="#94A3B8" />

        {/* Headlight */}
        <rect x="48" y="163" width="12" height="6" rx="2" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />

        {/* Side Mirror */}
        <rect x="70" y="70" width="5" height="22" rx="2" fill="#0F172A" />
        <line x1="75" y1="78" x2="82" y2="78" stroke="#0F172A" strokeWidth="2" />
        <line x1="75" y1="88" x2="82" y2="88" stroke="#0F172A" strokeWidth="2" />

        {/* Door handle & Step */}
        <rect x="120" y="112" width="10" height="3" rx="1" fill="#64748B" />
        <rect x="110" y="162" width="35" height="5" rx="1" fill="#475569" />
        <rect x="115" y="169" width="25" height="4" rx="1" fill="#475569" />

        {/* Fuel Tank */}
        <rect x="160" y="162" width="45" height="14" rx="4" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />

        {/* === WHEELS === */}
        {/* Steer Axle Wheel */}
        <circle cx="92" cy="176" r="18" fill="#0F172A" />
        <circle cx="92" cy="176" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="92" cy="176" r="4" fill="#475569" />

        {/* Drive Axles (Tractor Rear Wheels) */}
        <circle cx="180" cy="176" r="18" fill="#0F172A" />
        <circle cx="180" cy="176" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="180" cy="176" r="4" fill="#475569" />

        {/* Trailer Axles (Tandem / Triple) */}
        <circle cx="415" cy="176" r="18" fill="#0F172A" />
        <circle cx="415" cy="176" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="415" cy="176" r="4" fill="#475569" />

        <circle cx="455" cy="176" r="18" fill="#0F172A" />
        <circle cx="455" cy="176" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="455" cy="176" r="4" fill="#475569" />

        <circle cx="495" cy="176" r="18" fill="#0F172A" />
        <circle cx="495" cy="176" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="495" cy="176" r="4" fill="#475569" />
      </g>
    </svg>
  );
};
