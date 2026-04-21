import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Thermometer, Droplets, Activity, Smile, StickyNote, AlertCircle, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { toLocalDateString } from '../lib/dateUtils'

const mucusOptions = [
  { value: 'none',      label: 'Dry / None',  desc: 'No sensation, nothing visible' },
  { value: 'sticky',    label: 'Sticky',       desc: 'Tacky, breaks easily' },
  { value: 'creamy',    label: 'Creamy',       desc: 'Lotion-like, white or yellow' },
  { value: 'watery',    label: 'Watery',       desc: 'Thin, clear, lubricative' },
  { value: 'egg-white', label: 'Egg-white',    desc: 'Clear, stretchy, slippery' },
]

const symptomOptions = [
  'Mild cramps', 'Tender breasts', 'Bloating', 'Spotting', 'Headache', 'Low energy', 'High energy', 'Mood shift',
]

const today = toLocalDateString()

export default function Log() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [temp, setTemp] = useState('')
  const [mucus, setMucus] = useState('')
  const [lh, setLh] = useState('')
  const [estrogen, setEstrogen] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [showMucusPicker, setShowMucusPicker] = useState(false)

  const toggleSymptom = (s) =>
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const userId = user.id

    const entry = {
      user_id:        userId,
      date:           today,
      temp_f:         temp     ? parseFloat(temp)     : null,
      mucus_type:     mucus    || null,
      lh_value:       lh       ? parseFloat(lh)       : null,
      estrogen_value: estrogen ? parseFloat(estrogen) : null,
      symptoms:       symptoms.length ? symptoms : [],
      notes:          notes.trim() || null,
    }

    const { error: upsertError } = await supabase
      .from('cycle_entries')
      .upsert(entry, { onConflict: 'user_id,date' })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setTimeout(() => navigate('/'), 1200)
  }

  const canSave = temp || mucus || lh || estrogen

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-28">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-stone-800">Daily Log</h1>
        <p className="text-sm text-stone-400 mt-0.5">{dateLabel}</p>
      </div>

      <div className="space-y-5">
        {/* Temperature */}
        <Section icon={<Thermometer size={16} />} label="Basal body temperature">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="96"
              max="99.9"
              placeholder="97.4"
              value={temp}
              onChange={e => setTemp(e.target.value)}
              className="input-field w-32 text-center text-lg font-medium"
            />
            <span className="text-stone-500 text-sm">°F</span>
          </div>
          <p className="text-xs text-stone-400 mt-1.5">Take before getting out of bed, after 3+ hrs sleep</p>
        </Section>

        {/* Mucus */}
        <Section icon={<Droplets size={16} />} label="Cervical mucus">
          <div className="relative">
            <button
              onClick={() => setShowMucusPicker(v => !v)}
              className="w-full flex items-center justify-between input-field"
            >
              <span className={mucus ? 'text-stone-800' : 'text-stone-400'}>
                {mucus ? mucusOptions.find(o => o.value === mucus)?.label : 'Select observation…'}
              </span>
              <ChevronDown size={16} className="text-stone-400 shrink-0" />
            </button>

            {showMucusPicker && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-cream-200 rounded-xl shadow-lg overflow-hidden">
                {mucusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setMucus(opt.value); setShowMucusPicker(false) }}
                    className={`w-full text-left px-4 py-3 hover:bg-cream-50 transition-colors border-b border-cream-100 last:border-0 ${
                      mucus === opt.value ? 'bg-sage-50' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-stone-800">{opt.label}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Mira readings */}
        <Section icon={<Activity size={16} />} label="Mira readings (optional)">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 block mb-1.5">LH (mIU/mL)</label>
              <input
                type="number"
                step="0.1"
                placeholder="—"
                value={lh}
                onChange={e => setLh(e.target.value)}
                className="input-field text-center"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 block mb-1.5">Estrogen (pg/mL)</label>
              <input
                type="number"
                step="0.1"
                placeholder="—"
                value={estrogen}
                onChange={e => setEstrogen(e.target.value)}
                className="input-field text-center"
              />
            </div>
          </div>
        </Section>

        {/* Symptoms */}
        <Section icon={<Smile size={16} />} label="Symptoms & sensations">
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  symptoms.includes(s)
                    ? 'bg-sage-100 border-sage-300 text-sage-800'
                    : 'bg-cream-50 border-cream-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        {/* Notes */}
        <Section icon={<StickyNote size={16} />} label="Notes">
          <textarea
            rows={3}
            placeholder="Anything else worth noting…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input-field resize-none"
          />
        </Section>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
          <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      {/* Import from Mira shortcut */}
      <button
        onClick={() => navigate('/mira-import')}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-sage-700 bg-sage-50 border border-sage-200 hover:bg-sage-100 transition-colors"
      >
        <Camera size={15} />
        Import from Mira screenshot
      </button>

      {/* Save button */}
      <div className="mt-3">
        <button
          onClick={handleSave}
          disabled={!canSave || saving || saved}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-base transition-all duration-200 ${
            saved
              ? 'bg-sage-500 text-white'
              : canSave
              ? 'btn-primary'
              : 'bg-cream-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {saved ? (
            <><Check size={18} /> Saved — updating guidance…</>
          ) : saving ? (
            'Saving…'
          ) : (
            "Save today's log"
          )}
        </button>
        {!canSave && (
          <p className="text-xs text-stone-400 text-center mt-2">Enter at least one observation to save</p>
        )}
      </div>
    </div>
  )
}

function Section({ icon, label, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-stone-500 mb-3">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  )
}
