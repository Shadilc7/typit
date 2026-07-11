

interface CarSvgProps {
  color: string;
  width?: number;
  height?: number;
}

export function CarSvg({ color, width = 60, height = 24 }: CarSvgProps) {
  return (
    <svg 
      viewBox="0 0 120 48" 
      width={width} 
      height={height} 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Cyber/Sports Car Body */}
      <path 
        d="M 4 36 
           L 2 24
           L 15 18
           L 38 10
           L 60 10
           L 85 20
           L 116 28
           L 118 34
           L 118 36
           L 106 36
           A 14 14 0 0 0 78 36
           L 42 36
           A 14 14 0 0 0 14 36
           Z" 
        fill={color} 
      />

      {/* Cyber details / accents */}
      <path 
        d="M 15 24 L 40 18 L 80 24" 
        fill="none" 
        stroke="rgba(0,0,0,0.3)" 
        strokeWidth="1.5" 
      />

      {/* Modern Windows */}
      <path 
        d="M 42 12
           L 58 12
           L 78 20
           L 45 20
           Z" 
        fill="#0f172a" 
        stroke="#334155" 
        strokeWidth="1"
      />

      {/* Sleek Headlight */}
      <path 
        d="M 102 26 L 115 28 L 116 30 L 100 28 Z" 
        fill="#06b6d4" 
        filter="drop-shadow(0 0 4px #06b6d4)"
      />
      
      {/* Sleek Taillight */}
      <path 
        d="M 2 26 L 8 24 L 8 26 L 3 28 Z" 
        fill="#ef4444" 
        filter="drop-shadow(0 0 4px #ef4444)"
      />

      {/* Modern Alloy Wheels */}
      <circle cx="28" cy="36" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
      <circle cx="28" cy="36" r="3" fill="#cbd5e1" />
      <path d="M 28 26 L 28 46 M 18 36 L 38 36 M 21 29 L 35 43 M 21 43 L 35 29" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
      
      <circle cx="92" cy="36" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
      <circle cx="92" cy="36" r="3" fill="#cbd5e1" />
      <path d="M 92 26 L 92 46 M 82 36 L 102 36 M 85 29 L 99 43 M 85 43 L 99 29" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
