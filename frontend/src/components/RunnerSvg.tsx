import styles from './RunnerSvg.module.css';

interface RunnerSvgProps {
  color: string;
  width?: number;
  height?: number;
  isMoving?: boolean;
  wpm?: number;
  isFinished?: boolean;
}

export function RunnerSvg({
  color,
  width = 44,
  height = 48,
  isMoving = true,
  wpm = 60,
  isFinished = false
}: RunnerSvgProps) {
  // Dynamic animation duration based on current WPM (faster WPM = faster stride)
  const runSpeedSeconds = isMoving && wpm > 0 
    ? Math.max(0.18, 0.65 - (Math.min(wpm, 160) / 240))
    : 0.5;

  const animStyle = {
    animationDuration: `${runSpeedSeconds}s`
  };

  return (
    <div 
      className={`
        ${styles.runnerContainer} 
        ${isMoving && !isFinished ? styles.isRunning : ''} 
        ${isFinished ? styles.isFinished : ''}
      `}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 80 80"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgElement}
      >
        <defs>
          <linearGradient id={`shirtGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Speed Wind / Dust Trails when running fast */}
        {isMoving && !isFinished && (
          <g className={styles.speedTrails}>
            <line x1="2" y1="35" x2="18" y2="35" stroke={color} strokeWidth="2" strokeDasharray="4,4" opacity="0.6" />
            <line x1="6" y1="48" x2="24" y2="48" stroke={color} strokeWidth="2.5" opacity="0.8" />
            <line x1="0" y1="62" x2="14" y2="62" stroke={color} strokeWidth="1.5" opacity="0.5" />
          </g>
        )}

        {/* Main Body & Limbs Group */}
        <g className={styles.bodyGroup} style={animStyle}>

          {/* BACK LEG (Leg A) */}
          <g className={styles.backLeg} style={animStyle}>
            {/* Thigh */}
            <line x1="38" y1="42" x2="24" y2="56" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
            {/* Shin */}
            <line x1="24" y1="56" x2="15" y2="70" stroke="#334155" strokeWidth="5.5" strokeLinecap="round" />
            {/* Shoe */}
            <path d="M 12 70 L 24 71 L 22 75 L 10 74 Z" fill={color} filter="url(#glowEffect)" />
          </g>

          {/* BACK ARM (Arm A) */}
          <g className={styles.backArm} style={animStyle}>
            {/* Upper Arm */}
            <line x1="42" y1="26" x2="28" y2="34" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            {/* Forearm */}
            <line x1="28" y1="34" x2="20" y2="25" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* TORSO & ATHLETIC SHIRT */}
          <g className={styles.torso}>
            {/* Main Upper Body / Chest */}
            <path 
              d="M 34 44 L 46 22 L 56 26 L 42 46 Z" 
              fill={`url(#shirtGrad-${color.replace('#', '')})`} 
              stroke={color} 
              strokeWidth="1.5"
            />
            {/* Athletic Stripe */}
            <line x1="40" y1="24" x2="36" y2="44" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          </g>

          {/* HEAD & VISOR */}
          <g className={styles.headGroup}>
            {/* Head */}
            <circle cx="48" cy="15" r="7.5" fill="#f8fafc" />
            {/* Headband / Hair */}
            <path d="M 41 12 C 43 7, 52 7, 55 12 Z" fill={color} />
            {/* Cyber Visor */}
            <path d="M 47 14 L 56 16 L 54 19 L 46 17 Z" fill="#06b6d4" filter="drop-shadow(0 0 3px #06b6d4)" />
          </g>

          {/* FRONT LEG (Leg B) */}
          <g className={styles.frontLeg} style={animStyle}>
            {/* Thigh */}
            <line x1="38" y1="42" x2="55" y2="52" stroke="#334155" strokeWidth="7.5" strokeLinecap="round" />
            {/* Shin */}
            <line x1="55" y1="52" x2="48" y2="68" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
            {/* Shoe */}
            <path d="M 45 68 L 59 70 L 57 74 L 43 73 Z" fill={color} filter="url(#glowEffect)" />
          </g>

          {/* FRONT ARM (Arm B) */}
          <g className={styles.frontArm} style={animStyle}>
            {/* Upper Arm */}
            <line x1="42" y1="26" x2="58" y2="34" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
            {/* Forearm */}
            <line x1="58" y1="34" x2="68" y2="24" stroke="#e2e8f0" strokeWidth="4.5" strokeLinecap="round" />
            {/* Fist */}
            <circle cx="68" cy="24" r="3" fill={color} />
          </g>

        </g>
      </svg>
    </div>
  );
}
