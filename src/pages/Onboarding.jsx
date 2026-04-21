import { useState } from 'react'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return step === 1
    ? <StepWelcome firstName={firstName} onNext={() => setStep(2)} />
    : <StepDisclaimer user={user} onComplete={refreshProfile} />
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ firstName, onNext }) {
  return (
    <div className="min-h-dvh bg-cream-100 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-8">

        <div className="flex flex-col items-center gap-3 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-14 h-14" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="#5a8a58"/>
            <text x="32" y="43" textAnchor="middle" fontSize="28" fontFamily="Georgia,serif" fill="white">C</text>
          </svg>
          <h1 className="font-serif text-3xl text-stone-800">
            Welcome to Certa, {firstName}.
          </h1>
        </div>

        <div className="card space-y-3">
          <p className="text-sm text-stone-600 leading-relaxed">
            Certa reads your cycle data and gives you data-informed guidance that goes beyond the standard rules.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">
            It learns your patterns over time — the more you log, the more precise the analysis becomes.
          </p>
        </div>

        <button onClick={onNext} className="btn-primary w-full flex items-center justify-center gap-2">
          Next
          <ArrowRight size={16} />
        </button>

      </div>
    </div>
  )
}

// ── Step 2: Disclaimer + couple setup ────────────────────────────────────────

function StepDisclaimer({ user, onComplete }) {
  const [accepted, setAccepted]     = useState(false)
  const [spouseEmail, setSpouseEmail] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  async function handleSubmit() {
    if (!accepted) return
    setSaving(true)
    setError(null)

    try {
      let coupleId = null

      if (spouseEmail.trim()) {
        const { data: couple, error: coupleErr } = await supabase
          .from('couples')
          .insert({ created_by: user.id, invite_email: spouseEmail.trim() })
          .select('id')
          .single()

        if (coupleErr) throw coupleErr
        coupleId = couple.id
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id:                      user.id,
          full_name:               user.user_metadata?.full_name ?? null,
          onboarding_complete:     true,
          disclaimer_accepted:     true,
          disclaimer_accepted_at:  new Date().toISOString(),
          couple_id:               coupleId,
        })

      if (profileErr) throw profileErr

      await onComplete()
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-cream-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xs space-y-6">

        <div className="text-center space-y-1">
          <h1 className="font-serif text-3xl text-stone-800">Before we begin</h1>
        </div>

        {/* Disclaimer */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Important</p>
          <p className="text-sm text-stone-600 leading-relaxed">
            Certa provides data-informed pattern analysis based on your observations. It is not a certified NFP teacher, medical provider, or substitute for professional guidance. The analysis you see reflects your data — not a guarantee. Use it as a tool, not a rulebook.
          </p>

          <label className="flex items-start gap-3 cursor-pointer">
            <button
              type="button"
              role="checkbox"
              aria-checked={accepted}
              onClick={() => setAccepted(v => !v)}
              className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                accepted
                  ? 'bg-sage-500 border-sage-500'
                  : 'border-cream-300 bg-white hover:border-sage-300'
              }`}
            >
              {accepted && <Check size={12} strokeWidth={3} className="text-white" />}
            </button>
            <span className="text-xs text-stone-600 leading-relaxed">
              I understand that Certa is not a medical provider and does not replace NFP instruction or professional advice.
            </span>
          </label>
        </div>

        {/* Couple setup */}
        <div className="card space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">Invite your spouse</p>
            <p className="text-xs text-stone-400 leading-relaxed">
              Your spouse will be able to view and log observations to your shared cycle data.
            </p>
          </div>

          <input
            type="email"
            placeholder="Spouse's email address"
            value={spouseEmail}
            onChange={e => setSpouseEmail(e.target.value)}
            className="input-field"
          />

          <p className="text-xs text-stone-400">
            You can also do this later in Settings.
          </p>
        </div>

        {error && (
          <p className="text-xs text-rose-600 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!accepted || saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-base transition-all duration-200 ${
            accepted && !saving
              ? 'btn-primary'
              : 'bg-cream-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Setting up…</>
          ) : (
            'Get started'
          )}
        </button>

      </div>
    </div>
  )
}
