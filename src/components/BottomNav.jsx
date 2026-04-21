import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, History, Camera, SlidersHorizontal } from 'lucide-react'

const getTimeLabel = () => new Date().getHours() >= 17 ? 'Tonight' : 'Today'

export default function BottomNav() {
  const tabs = [
    { to: '/',            label: getTimeLabel(), Icon: LayoutDashboard },
    { to: '/log',         label: 'Log',          Icon: BookOpen },
    { to: '/mira-import', label: 'Import',        Icon: Camera },
    { to: '/history',     label: 'History',       Icon: History },
    { to: '/settings',    label: 'Settings',      Icon: SlidersHorizontal },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 px-4 pb-safe">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-tab ${isActive ? 'nav-tab-active' : 'nav-tab-inactive'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
