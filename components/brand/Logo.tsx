'use client'

export function PkeepLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
      <path d="M16 8 L16 16 Q16 20 12 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M16 16 Q16 20 20 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="8" r="2" fill="white" />
      <circle cx="12" cy="24" r="2" fill="white" />
      <circle cx="20" cy="24" r="2" fill="white" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function PkeepLogoFull({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <PkeepLogo size={size} />
      <div>
        <span className="font-bold text-sm tracking-tight text-stone-900">PKEEP</span>
        <p className="text-[10px] text-stone-400 -mt-0.5">프로젝트 내비게이션</p>
      </div>
    </div>
  )
}
