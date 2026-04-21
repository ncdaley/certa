import { useGoal } from '../lib/goalStore'
import { useAuth, signOut } from '../lib/auth'

const explanations = {
  avoid:   'Guidance indicators show when it is safe to be intimate based on your cycle data.',
  achieve: 'Guidance indicators show your most fertile days to maximise your chances of conception.',
}

export default function Settings() {
  const [goal, setGoal] = useGoal()
  const { user } = useAuth()

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-28 space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-stone-800">Settings</h1>
        <p className="text-sm text-stone-400 mt-0.5">Preferences for your Certa experience</p>
      </div>

      {/* Fertility goal */}
      <div className="card space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">My Fertility Goal</p>
          <p className="text-xs text-stone-400 mt-0.5">This shapes how guidance is interpreted and displayed.</p>
        </div>

        {/* Pill toggle */}
        <div className="flex rounded-xl overflow-hidden border border-cream-200 bg-cream-50 p-1 gap-1">
          <GoalOption
            value="avoid"
            current={goal}
            onSelect={setGoal}
            label="Avoid pregnancy"
          />
          <GoalOption
            value="achieve"
            current={goal}
            onSelect={setGoal}
            label="Achieve pregnancy"
          />
        </div>

        {/* Contextual explanation */}
        <p className="text-sm text-stone-600 leading-relaxed">
          {explanations[goal]}
        </p>
      </div>

      {/* About */}
      <div className="card space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">About Certa</p>
        <p className="text-xs text-stone-400 leading-relaxed">
          Certa provides data-informed cycle pattern analysis to help couples understand what their fertility data is showing. It is not a substitute for medical advice or a certified NFP practitioner.
        </p>
        <p className="text-xs text-stone-300 pt-1">Version 0.1.0</p>
      </div>

      {/* Account */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Account</p>
        {user?.email && (
          <p className="text-xs text-stone-400">{user.email}</p>
        )}
        <button
          onClick={signOut}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors"
        >
          Sign out
        </button>
      </div>

    </div>
  )
}

function GoalOption({ value, current, onSelect, label }) {
  const active = value === current
  return (
    <button
      onClick={() => onSelect(value)}
      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-white text-sage-700 shadow-sm border border-cream-200'
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      {label}
    </button>
  )
}
