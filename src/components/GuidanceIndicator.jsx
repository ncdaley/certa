import { GUIDANCE } from '../data/mockCycle'

const config = {
  [GUIDANCE.GREEN]: {
    ring: 'ring-sage-400',
    bg: 'bg-sage-500',
    glow: 'shadow-[0_0_40px_8px_rgba(90,138,88,0.25)]',
    label: 'Green',
    emoji: '●',
  },
  [GUIDANCE.YELLOW]: {
    ring: 'ring-amber-400',
    bg: 'bg-amber-400',
    glow: 'shadow-[0_0_40px_8px_rgba(251,191,36,0.25)]',
    label: 'Yellow',
    emoji: '●',
  },
  [GUIDANCE.RED]: {
    ring: 'ring-rose-400',
    bg: 'bg-rose-400',
    glow: 'shadow-[0_0_40px_8px_rgba(251,113,133,0.25)]',
    label: 'Red',
    emoji: '●',
  },
}

export default function GuidanceIndicator({ indicator, label, detail, confidence }) {
  const c = config[indicator]

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Circle indicator */}
      <div className={`w-36 h-36 rounded-full ${c.bg} ${c.glow} ring-4 ring-offset-4 ring-offset-cream-50 ${c.ring} flex items-center justify-center`}>
        <span className="text-white text-5xl font-serif select-none">
          {indicator === GUIDANCE.GREEN ? '✓' : indicator === GUIDANCE.RED ? '×' : '~'}
        </span>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="font-serif text-2xl font-semibold text-stone-800">{label}</p>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed max-w-xs">{detail}</p>
      </div>

      {/* Confidence bar */}
      {confidence !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-stone-400 mb-1.5">
            <span>Data confidence</span>
            <span className="font-medium text-stone-600">{confidence}%</span>
          </div>
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                indicator === GUIDANCE.GREEN ? 'bg-sage-400' :
                indicator === GUIDANCE.YELLOW ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5 text-center">
            Log today's observations to increase confidence
          </p>
        </div>
      )}
    </div>
  )
}
