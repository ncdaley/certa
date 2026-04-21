import { useState } from 'react'
import { cycleEntries, cycleHistory, MUCUS, GUIDANCE } from '../data/mockCycle'
import { ChevronDown, ChevronUp } from 'lucide-react'

const mucusColor = {
  [MUCUS.NONE]:     'bg-stone-200',
  [MUCUS.STICKY]:   'bg-warm-300',
  [MUCUS.CREAMY]:   'bg-warm-400',
  [MUCUS.WATERY]:   'bg-blue-300',
  [MUCUS.EGGWHITE]: 'bg-blue-500',
}

const mucusLabel = {
  [MUCUS.NONE]:     'Dry',
  [MUCUS.STICKY]:   'Sticky',
  [MUCUS.CREAMY]:   'Creamy',
  [MUCUS.WATERY]:   'Watery',
  [MUCUS.EGGWHITE]: 'Egg-white',
}

export default function History() {
  const [expandedCycle, setExpandedCycle] = useState(null)

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-28 space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800">History</h1>
        <p className="text-sm text-stone-400 mt-0.5">Cycle patterns & observations</p>
      </div>

      {/* Current cycle chart */}
      <div className="card">
        <h2 className="font-serif text-lg text-stone-700 mb-4">Current cycle — Day 14</h2>
        <CycleChart entries={cycleEntries} />
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <Legend color="bg-stone-200" label="Dry" />
          <Legend color="bg-warm-300" label="Sticky" />
          <Legend color="bg-warm-400" label="Creamy" />
          <Legend color="bg-blue-300" label="Watery" />
          <Legend color="bg-blue-500" label="Egg-white" />
        </div>
      </div>

      {/* Temperature chart */}
      <div className="card">
        <h2 className="font-serif text-lg text-stone-700 mb-4">Temperature</h2>
        <TempChart entries={cycleEntries} />
      </div>

      {/* Cycle history list */}
      <div>
        <h2 className="font-serif text-lg text-stone-700 mb-3">Past cycles</h2>
        <div className="space-y-2">
          {cycleHistory.map(cycle => (
            <CycleRow
              key={cycle.cycleNum}
              cycle={cycle}
              isExpanded={expandedCycle === cycle.cycleNum}
              onToggle={() =>
                setExpandedCycle(prev => prev === cycle.cycleNum ? null : cycle.cycleNum)
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CycleChart({ entries }) {
  return (
    <div className="flex gap-1 items-end">
      {entries.map((entry, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {/* Bleed dot */}
          <div className={`w-1.5 h-1.5 rounded-full ${entry.bleed ? 'bg-blush-400' : 'bg-transparent'}`} />
          {/* Mucus bar */}
          <div
            className={`w-full rounded-sm transition-all ${
              entry.isToday ? 'ring-2 ring-sage-400 ring-offset-1' : ''
            } ${entry.mucus ? mucusColor[entry.mucus] : 'bg-cream-200'}`}
            style={{ height: entry.mucus ? '32px' : '16px' }}
            title={entry.mucus ? mucusLabel[entry.mucus] : 'No data'}
          />
          {/* Day number */}
          {(entry.day % 5 === 0 || entry.day === 1) && (
            <span className="text-[10px] text-stone-400">{entry.day}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function TempChart({ entries }) {
  const temps = entries.filter(e => e.temp).map(e => e.temp)
  const min = Math.min(...temps) - 0.2
  const max = Math.max(...temps) + 0.2
  const range = max - min
  const height = 80

  const points = entries
    .filter(e => e.temp)
    .map(e => ({
      day: e.day,
      temp: e.temp,
      y: height - ((e.temp - min) / range) * height,
    }))

  const totalDays = entries.length
  const svgWidth = 320

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} ${height + 20}`} className="w-full" style={{ minWidth: '240px' }}>
        {/* Coverline — simplified at 97.6 */}
        <line
          x1="0" y1={height - ((97.6 - min) / range) * height}
          x2={svgWidth} y2={height - ((97.6 - min) / range) * height}
          stroke="#c8d9c7" strokeWidth="1" strokeDasharray="4 3"
        />

        {/* Line */}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#78a376"
            strokeWidth="1.5"
            strokeLinejoin="round"
            points={points.map(p => {
              const x = ((p.day - 1) / (totalDays - 1)) * svgWidth
              return `${x},${p.y}`
            }).join(' ')}
          />
        )}

        {/* Dots */}
        {points.map(p => {
          const x = ((p.day - 1) / (totalDays - 1)) * svgWidth
          return (
            <circle
              key={p.day}
              cx={x} cy={p.y}
              r="3"
              fill="white"
              stroke="#5a8a58"
              strokeWidth="1.5"
            />
          )
        })}

        {/* Y labels */}
        {[97.0, 97.4, 97.8].map(t => {
          if (t < min || t > max) return null
          const y = height - ((t - min) / range) * height
          return (
            <text key={t} x="2" y={y - 2} fontSize="8" fill="#a8a29e">{t.toFixed(1)}</text>
          )
        })}
      </svg>
    </div>
  )
}

function CycleRow({ cycle, isExpanded, onToggle }) {
  const start = new Date(cycle.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-stone-700">Cycle #{cycle.cycleNum}</p>
          <p className="text-xs text-stone-400 mt-0.5">{start} &middot; {cycle.length} days</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-stone-400">Ovulation</p>
            <p className="text-sm font-medium text-stone-700">Day {cycle.ovulationDay}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">Luteal</p>
            <p className={`text-sm font-medium ${cycle.lutealLength <= 10 ? 'text-amber-600' : 'text-stone-700'}`}>
              {cycle.lutealLength}d
            </p>
          </div>
          {isExpanded
            ? <ChevronUp size={16} className="text-stone-400 shrink-0" />
            : <ChevronDown size={16} className="text-stone-400 shrink-0" />
          }
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-cream-100 grid grid-cols-2 gap-3">
          <Stat label="Cycle length" value={`${cycle.length} days`} />
          <Stat label="Ovulation day" value={`Day ${cycle.ovulationDay}`} />
          <Stat label="Luteal phase" value={`${cycle.lutealLength} days`} warn={cycle.lutealLength <= 10} />
          <Stat label="Peak mucus" value={mucusLabel[cycle.peakMucus]} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, warn }) {
  return (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${warn ? 'text-amber-600' : 'text-stone-700'}`}>{value}</p>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-stone-400">{label}</span>
    </div>
  )
}
