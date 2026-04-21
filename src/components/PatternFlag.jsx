import { AlertTriangle, Info } from 'lucide-react'

export default function PatternFlag({ flag }) {
  const isWarning = flag.type === 'warning'

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${
      isWarning
        ? 'bg-amber-50 border-amber-200'
        : 'bg-sage-50 border-sage-200'
    }`}>
      <div className={`shrink-0 mt-0.5 ${isWarning ? 'text-amber-500' : 'text-sage-500'}`}>
        {isWarning ? <AlertTriangle size={16} /> : <Info size={16} />}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isWarning ? 'text-amber-800' : 'text-sage-800'}`}>
          {flag.title}
        </p>
        {flag.body && (
          <p className={`text-xs mt-0.5 leading-relaxed ${isWarning ? 'text-amber-700' : 'text-sage-700'}`}>
            {flag.body}
          </p>
        )}
      </div>
    </div>
  )
}
