import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router'
import { Icon, type IconName } from './components/Icon'
import { useAppState } from './lib/store'
import { AnswerSheet } from './pages/AnswerSheet'
import { Home } from './pages/Home'
import { ModulePage } from './pages/Module'
import { Practice } from './pages/Practice'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Main">
      <NavLink to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        Midwifery revision
      </NavLink>
      {NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">
          <span className="row" style={{ gap: 10 }}>
            <Icon name={item.icon} />
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}

/** Starts a page afresh on every navigation, even to the same address, so "practise again" links work. */
function Fresh({ page: Page }: { page: () => React.ReactNode }) {
  const location = useLocation()
  return <Page key={location.key} />
}

/** Applies the colour theme chosen in Settings; "system" follows the device. */
function useTheme() {
  const { theme } = useAppState().settings
  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
  }, [theme])
}

export default function App() {
  useTheme()
  return (
    // Hash routes work on static hosting such as GitHub Pages without server rewrites.
    <HashRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/m/:moduleId" element={<ModulePage />} />
            <Route path="/m/:moduleId/answers" element={<AnswerSheet />} />
            <Route path="/m/:moduleId/practice" element={<Fresh page={Practice} />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
