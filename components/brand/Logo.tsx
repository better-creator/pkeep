'use client'

/**
 * PKEEP Logo — Crop marks + Decision diamond
 * Contained mark: violet rounded square + white symbol
 */
export function PkeepLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="pk-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B4FC4" />
          <stop offset="1" stopColor="#5C35A3" />
        </linearGradient>
      </defs>

      {/* Background — rounded square */}
      <rect width="120" height="120" rx="26" fill="url(#pk-bg)" />

      {/* Crop marks — white, thick, confident */}
      {/* Top-left */}
      <path d="M24 50 V33 C24 28 28 24 33 24 H50"
        stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Top-right */}
      <path d="M70 24 H87 C92 24 96 28 96 33 V50"
        stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Bottom-left */}
      <path d="M24 70 V87 C24 92 28 96 33 96 H50"
        stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Bottom-right */}
      <path d="M96 70 V87 C96 92 92 96 87 96 H70"
        stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Diamond — decision node, solid white, slightly tall */}
      <path d="M60 32 L78 60 L60 88 L42 60 Z" fill="white" />
    </svg>
  )
}

/** Monochrome version for dark backgrounds (white mark, no container) */
export function PkeepLogoMono({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M24 50 V33 C24 28 28 24 33 24 H50"
        stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M70 24 H87 C92 24 96 28 96 33 V50"
        stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 70 V87 C24 92 28 96 33 96 H50"
        stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M96 70 V87 C96 92 92 96 87 96 H70"
        stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M60 32 L78 60 L60 88 L42 60 Z" fill="currentColor" />
    </svg>
  )
}

/** Logotype wordmark — custom SVG lettering */
function PkeepWordmark({ height = 16, className = '' }: { height?: number; className?: string }) {
  // Aspect ratio based on 80x16 viewBox
  const width = (height / 16) * 80
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* P */}
      <path d="M0 14V2h4.8c1.3 0 2.3.35 3 1.05.7.7 1.05 1.55 1.05 2.55 0 1-.35 1.85-1.05 2.55-.7.7-1.7 1.05-3 1.05H2.5V14H0zm2.5 3.7h2.1c.55 0 .97-.15 1.28-.46.3-.3.46-.7.46-1.17 0-.47-.16-.87-.46-1.17-.3-.3-.73-.46-1.28-.46H2.5v3.26z" transform="translate(0,0)" />
      {/* K */}
      <path d="M11 14V2h2.5v5.1L18.3 2h3.1l-5.4 5.8L21.6 14h-3.1l-3.7-4.7-1.3 1.4V14H11z" />
      {/* E */}
      <path d="M23 14V2h8.2v2.2h-5.7v3h5v2.1h-5v2.5h5.9V14H23z" />
      {/* E */}
      <path d="M34 14V2h8.2v2.2h-5.7v3h5v2.1h-5v2.5h5.9V14H34z" />
      {/* P */}
      <path d="M45 14V2h4.8c1.3 0 2.3.35 3 1.05.7.7 1.05 1.55 1.05 2.55 0 1-.35 1.85-1.05 2.55-.7.7-1.7 1.05-3 1.05H47.5V14H45zm2.5 3.7h2.1c.55 0 .97-.15 1.28-.46.3-.3.46-.7.46-1.17 0-.47-.16-.87-.46-1.17-.3-.3-.73-.46-1.28-.46H47.5v3.26z" transform="translate(0,0)" />
    </svg>
  )
}

export function PkeepLogoFull({ size = 32, className = '' }: { size?: number; className?: string }) {
  const wordmarkH = size * 0.42
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <PkeepLogo size={size} />
      <PkeepWordmark height={wordmarkH} className="text-foreground" />
    </div>
  )
}
