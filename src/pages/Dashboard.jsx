import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Droplets, Thermometer, Activity, Loader2 } from 'lucide-react'
import GuidanceIndicator from '../components/GuidanceIndicator'
import PatternFlag from '../components/PatternFlag'
import { supabase } from '../lib/supabase'
import { analyzeCycle } from '../lib/analysis'
import { useGoal } from '../lib/goalStore'
import { useAuth } from '../lib/auth'
import { toLocalDateString, formatDisplayDate } from '../lib/dateUtils'

const today = toLocalDateString()

const yesterday = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toLocalDateString(d)
})()

const twoYearsAgo = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 2)
  return toLocalDateString(d)
})()

const dateLabel = formatDisplayDate()

const getTimeLabel = () => new Date().getHours() >= 17 ? 'Tonight' : 'Today'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [goal] = useGoal()

  // Entry data
  const [todayEntry, setTodayEntry]       = useState(null)
  const [yesterdayEntry, setYesterdayEntry] = useState(null)

  // AI analysis
  const [analysis, setAnalysis] = useState(null)

  // Loading states — split so the quick stats render before analysis finishes
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const userId = user.id
      const cacheKey = `certa-analysis-${userId}-${today}`

      // Use cached analysis for today if available — makes tab switches instant
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setAnalysis(JSON.parse(cached))
          setAnalysisLoading(false)
        } catch { /* ignore corrupt cache */ }
      }

      // Fetch up to two years of entries so historical Mira imports are included
      const { data: entries } = await supabase
        .from('cycle_entries')
        .select('date, cycle_day, temp_f, mucus_type, lh_value, estrogen_value, symptoms')
        .eq('user_id', userId)
        .gte('date', twoYearsAgo)
        .order('date', { ascending: true })

      if (cancelled) return

      const all = entries ?? []
      setTodayEntry(all.find(e => e.date === today) ?? null)
      setYesterdayEntry(all.find(e => e.date === yesterday) ?? null)
      setEntriesLoading(false)

      // Skip AI call if we already have a cached result for today
      if (cached) return

      const result = await analyzeCycle(all, goal)
      if (cancelled) return

      setAnalysis(result)
      setAnalysisLoading(false)
      localStorage.setItem(cacheKey, JSON.stringify(result))
    }

    load()
    return () => { cancelled = true }
  }, [user])

  const hasLoggedToday = !!todayEntry

  // Map AI response to the shape GuidanceIndicator expects
  const guidanceProps = analysis
    ? {
        indicator:  analysis.guidance,
        label:      analysis.headline,
        detail:     analysis.reasoning,
        confidence: analysis.confidence,
      }
    : {
        indicator:  'yellow',
        label:      'Analysing your data…',
        detail:     'Running cycle pattern analysis. This takes a few seconds.',
        confidence: undefined,
      }

  // Map AI flags to PatternFlag shape
  const flags = analysis?.flags?.map((f, i) => ({
    id: `ai-flag-${i}`,
    type: f.type,
    title: f.message,
    body: null,
  })) ?? []

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl text-stone-800">{getTimeLabel()}</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {!analysisLoading && analysis?.cycleDay
              ? `Cycle day ${analysis.cycleDay}`
              : entriesLoading ? 'Loading…' : 'Analysis in progress'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-stone-400 font-medium">{dateLabel}</span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            goal === 'achieve'
              ? 'bg-blush-100 text-blush-500'
              : 'bg-sage-100 text-sage-600'
          }`}>
            {goal === 'achieve' ? 'Achieving' : 'Avoiding'}
          </span>
        </div>
      </div>

      {/* Guidance indicator */}
      <div className="card">
        {analysisLoading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 size={36} className="text-sage-400 animate-spin" />
            <div className="text-center">
              <p className="font-serif text-lg text-stone-700">Analysing your cycle…</p>
              <p className="text-xs text-stone-400 mt-1">Reading pattern data</p>
            </div>
          </div>
        ) : (
          <GuidanceIndicator {...guidanceProps} />
        )}
      </div>

      {/* Log today CTA */}
      {!entriesLoading && !hasLoggedToday && (
        <button
          onClick={() => navigate('/log')}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-sage-50 border border-sage-200 hover:bg-sage-100 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-sage-800">Log today's observations</p>
            <p className="text-xs text-sage-600 mt-0.5">Add temp + mucus to increase confidence</p>
          </div>
          <ChevronRight size={18} className="text-sage-400" />
        </button>
      )}

      {/* Quick stats — hormone readings */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Activity size={14} />}
          label={todayEntry?.lh_value != null ? 'LH' : 'LH (prev)'}
          value={(() => {
            const v = todayEntry?.lh_value ?? yesterdayEntry?.lh_value
            return v != null ? String(v) : '—'
          })()}
          unit={(todayEntry?.lh_value ?? yesterdayEntry?.lh_value) != null ? 'mIU/mL' : undefined}
          loading={entriesLoading}
        />
        <StatTile
          icon={<Droplets size={14} />}
          label={todayEntry?.estrogen_value != null ? 'E3G' : 'E3G (prev)'}
          value={(() => {
            const v = todayEntry?.estrogen_value ?? yesterdayEntry?.estrogen_value
            return v != null ? String(v) : '—'
          })()}
          unit={(todayEntry?.estrogen_value ?? yesterdayEntry?.estrogen_value) != null ? 'pg/mL' : undefined}
          loading={entriesLoading}
        />
        <StatTile
          icon={<Thermometer size={14} />}
          label="Post-peak day"
          value={!analysisLoading && analysis?.postPeakCount != null ? String(analysis.postPeakCount) : '—'}
          loading={entriesLoading}
        />
      </div>

      {/* Peak / post-peak pill — only when analysis has it */}
      {!analysisLoading && analysis?.peakDay && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-cream-200" />
          <span className="text-xs text-stone-400 font-medium whitespace-nowrap">
            {analysis.postPeakCount != null
              ? `Post-Peak Day ${analysis.postPeakCount}`
              : `Peak Day ${analysis.peakDay}`}
          </span>
          <div className="flex-1 h-px bg-cream-200" />
        </div>
      )}

      {/* Pattern flags from AI */}
      {!analysisLoading && flags.length > 0 && (
        <div>
          <h2 className="font-serif text-lg text-stone-700 mb-3">Pattern analysis</h2>
          <div className="space-y-3">
            {flags.map(flag => (
              <PatternFlag
                key={flag.id}
                flag={{ ...flag, body: flag.body ?? undefined }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Skeleton while analysis loads */}
      {analysisLoading && (
        <div>
          <div className="h-5 w-36 bg-cream-200 rounded-lg mb-3 animate-pulse" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="card h-16 bg-cream-50 animate-pulse" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ icon, label, value, unit, loading }) {
  return (
    <div className="card text-center py-4">
      <div className="flex justify-center text-stone-400 mb-1.5">{icon}</div>
      {loading ? (
        <div className="h-6 w-10 bg-cream-200 rounded mx-auto animate-pulse" />
      ) : (
        <>
          <p className="text-lg font-semibold text-stone-800 leading-tight">{value}</p>
          {unit && <p className="text-xs text-stone-400">{unit}</p>}
        </>
      )}
      <p className="text-xs text-stone-400 mt-1 leading-tight">{label}</p>
    </div>
  )
}
