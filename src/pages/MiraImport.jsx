import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, Loader2, Check, AlertCircle, ChevronLeft, Activity } from 'lucide-react'
import { extractMiraData } from '../lib/analysis'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { toLocalDateString } from '../lib/dateUtils'

const today = toLocalDateString()
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

// Convert partial dates like "Feb 11" or "Mar 11, 2025" to YYYY-MM-DD.
// For year-less dates, pick the most recent past occurrence of that month/day.
function normalizeDate(raw) {
  if (!raw) return today
  // Already ISO — return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const currentYear = new Date().getFullYear()
  // Try appending current year first
  let d = new Date(`${raw} ${currentYear}`)
  if (isNaN(d.getTime())) {
    // Maybe it already has a year (e.g. "Feb 11, 2025") — try without appending
    d = new Date(raw)
  }
  if (isNaN(d.getTime())) return today  // unparseable — fall back to today

  // If the resulting date is in the future, step back one year
  if (d > new Date()) d.setFullYear(d.getFullYear() - 1)

  return toLocalDateString(d)
}

export default function MiraImport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const inputRef = useRef(null)

  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64]   = useState(null)
  const [mediaType, setMediaType]       = useState(null)

  const [extracting, setExtracting]     = useState(false)
  const [readings, setReadings]         = useState(null)   // array of data points
  const [extractError, setExtractError] = useState(null)

  const [saving, setSaving]             = useState(false)
  const [savedCount, setSavedCount]     = useState(null)
  const [saveError, setSaveError]       = useState(null)

  // ── file selection ──────────────────────────────────────────────────────────

  function handleFile(file) {
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setReadings(null)
    setExtractError(null)
    setSavedCount(null)
    setSaveError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const [header, data] = e.target.result.split(',')
      setImageBase64(data)
      setMediaType(header.match(/:(.*?);/)?.[1] ?? 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  const onInputChange = (e) => handleFile(e.target.files?.[0])
  const onDrop        = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }

  // ── extraction ──────────────────────────────────────────────────────────────

  async function handleExtract() {
    if (!imageBase64) return
    setExtracting(true)
    setExtractError(null)
    try {
      const data = await extractMiraData(imageBase64, mediaType)
      // Ensure we always have an array
      const arr = Array.isArray(data) ? data : [data]
      // Filter out rows with no useful data
      const filtered = arr.filter(r => r.lh != null || r.estrogen != null || r.progesterone != null)
      if (filtered.length === 0) throw new Error('No hormone values found. Try a clearer chart screenshot.')
      setReadings(filtered)
    } catch (err) {
      setExtractError(err.message ?? 'Could not read the screenshot. Try a clearer image.')
    } finally {
      setExtracting(false)
    }
  }

  // ── save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!readings?.length) return
    setSaving(true)
    setSaveError(null)

    const userId = user.id

    const entries = readings.map(r => ({
      user_id:        userId,
      date:           normalizeDate(r.date),
      cycle_day:      r.cycleDay ?? null,
      lh_value:       r.lh       ?? null,
      estrogen_value: r.estrogen ?? null,
    }))

    console.log('[MiraImport] saving entries:', entries)

    const { error } = await supabase
      .from('cycle_entries')
      .upsert(entries, { onConflict: 'user_id,date' })

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    setSavedCount(entries.length)
    setSaving(false)
    setTimeout(() => navigate('/'), 2000)
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/log')} className="text-stone-400 hover:text-stone-600 transition-colors shrink-0">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-serif text-3xl text-stone-800">Import from Mira</h1>
      </div>

      {/* Instructions — only shown before an image is selected */}
      {!imagePreview && (
        <div className="space-y-5 mb-8">
          <p className="text-sm text-stone-600 leading-relaxed">
            Upload your full Mira hormone chart screenshot to import your entire cycle history at once.
          </p>

          <ol className="space-y-3">
            {[
              'Open your Mira app and navigate to your hormone chart.',
              'Take a screenshot on your phone — press Side button + Volume Up on iPhone, or Power + Volume Down on Android.',
              'Upload the screenshot using the button below.',
              'Review the extracted readings and tap "Save all readings to Certa".',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          <p className="text-xs text-stone-400 leading-relaxed border-t border-cream-200 pt-4">
            Certa reads LH, estrogen (E3G), and progesterone values from your Mira chart screenshot.
          </p>
        </div>
      )}

      {/* Upload area */}
      {!imagePreview ? (
        <button
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="w-full border-2 border-dashed border-cream-200 rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-sage-300 hover:bg-sage-50 transition-colors group"
        >
          <div className="w-14 h-14 rounded-full bg-cream-200 group-hover:bg-sage-100 flex items-center justify-center transition-colors">
            <Camera size={24} className="text-stone-400 group-hover:text-sage-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700">Tap to upload screenshot</p>
            <p className="text-xs text-stone-400 mt-1">JPEG, PNG, HEIC — or drag and drop</p>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-sage-600 font-medium">
            <Upload size={12} />
            Choose file
          </div>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative rounded-2xl overflow-hidden border border-cream-200 bg-cream-50">
            <img
              src={imagePreview}
              alt="Mira chart screenshot"
              className="w-full object-contain max-h-64"
            />
            {!readings && !extracting && (
              <button
                onClick={() => { setImagePreview(null); setImageBase64(null); setReadings(null); setExtractError(null) }}
                className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 text-xs text-stone-600 shadow border border-cream-200 hover:bg-cream-50 transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {/* Analyse button */}
          {!readings && !extracting && (
            <button onClick={handleExtract} className="btn-primary w-full">
              Analyse Screenshot
            </button>
          )}

          {/* Extracting state */}
          {extracting && (
            <div className="card flex items-center gap-3 py-5 justify-center">
              <Loader2 size={18} className="text-sage-500 animate-spin" />
              <p className="text-sm text-stone-600">Reading chart data…</p>
            </div>
          )}

          {/* Extract error */}
          {extractError && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200">
              <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-800">Couldn't read screenshot</p>
                <p className="text-xs text-rose-700 mt-0.5">{extractError}</p>
                <button onClick={handleExtract} className="text-xs text-rose-700 underline mt-2">
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Readings review table */}
          {readings && savedCount === null && (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-stone-500">
                    <Activity size={15} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Extracted readings</span>
                  </div>
                  <span className="text-xs font-semibold text-sage-700 bg-sage-50 border border-sage-200 px-2.5 py-0.5 rounded-full">
                    Found {readings.length} {readings.length === 1 ? 'reading' : 'readings'}
                  </span>
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden border border-cream-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-cream-50 border-b border-cream-200">
                        <Th>Date / Day</Th>
                        <Th>LH</Th>
                        <Th>E3G</Th>
                        <Th>Prog.</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((r, i) => (
                        <tr key={i} className="border-b border-cream-100 last:border-0">
                          <Td>
                            <span className="text-stone-700 font-medium">
                              {r.date ?? (r.cycleDay != null ? `Day ${r.cycleDay}` : '—')}
                            </span>
                          </Td>
                          <Td>{r.lh != null ? <HormoneVal val={r.lh} unit="mIU/mL" /> : <Dash />}</Td>
                          <Td>{r.estrogen != null ? <HormoneVal val={r.estrogen} unit="pg/mL" /> : <Dash />}</Td>
                          <Td>{r.progesterone != null ? <HormoneVal val={r.progesterone} unit="ng/mL" /> : <Dash />}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-stone-400 mt-4 leading-relaxed">
                  Review the readings above. Existing entries for the same date will be updated with the Mira values.
                </p>
              </div>

              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700">{saveError}</p>
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving…' : 'Save all readings to Certa'}
              </button>

              <button
                onClick={() => { setImagePreview(null); setImageBase64(null); setReadings(null) }}
                className="btn-secondary w-full"
              >
                Start over
              </button>
            </div>
          )}

          {/* Success state */}
          {savedCount !== null && (
            <div className="card flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
                <Check size={22} className="text-sage-600" />
              </div>
              <div>
                <p className="font-serif text-lg text-stone-800">{savedCount} readings imported</p>
                <p className="text-xs text-stone-400 mt-1">Hormone values have been added to your log. Returning to dashboard…</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}

// Table helpers
function Th({ children }) {
  return <th className="text-left px-3 py-2 text-stone-400 font-semibold uppercase tracking-wide">{children}</th>
}
function Td({ children }) {
  return <td className="px-3 py-2.5 text-stone-600">{children}</td>
}
function Dash() {
  return <span className="text-stone-300">—</span>
}
function HormoneVal({ val, unit }) {
  return (
    <span>
      <span className="font-medium text-stone-700">{val}</span>
      <span className="text-stone-400 ml-0.5">{unit}</span>
    </span>
  )
}
