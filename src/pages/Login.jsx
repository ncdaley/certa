import { signInWithGoogle } from '../lib/auth'

export default function Login() {
  return (
    <div className="min-h-dvh bg-cream-100 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-10 text-center">

        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-16 h-16" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="#5a8a58"/>
            <text x="32" y="43" textAnchor="middle" fontSize="28" fontFamily="Georgia,serif" fill="white">C</text>
          </svg>
          <div className="space-y-1.5">
            <h1 className="font-serif text-4xl text-stone-800 tracking-tight">Certa</h1>
            <p className="text-sm text-stone-500 leading-snug font-light italic">
              Confidence at the moment of decision.
            </p>
          </div>
        </div>

        {/* Sign in */}
        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-white border border-cream-200 shadow-sm text-sm font-medium text-stone-700 hover:bg-cream-50 hover:border-stone-200 transition-all duration-150"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <p className="text-xs text-stone-400 leading-relaxed">
            For Catholic couples using Natural Family Planning
          </p>
        </div>

      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}
