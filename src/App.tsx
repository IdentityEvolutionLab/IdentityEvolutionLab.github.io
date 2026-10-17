import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowUpRight, Boxes, Fingerprint, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { goatCounterEvent, simpleAnalyticsEvent } from './telemetry'
import { LandingPage } from './pages/LandingPage'
import { JourneyPage } from './pages/JourneyPage'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { ArchitecturePage } from './pages/ArchitecturePage'
import { AuditPage } from './pages/AuditPage'
import { AboutPage } from './pages/AboutPage'

const links = [
  ['Journey', '/journey/password'], ['Playground', '/playground'], ['Architecture', '/architecture'], ['Audit', '/audit'], ['About', '/about'],
]

function PageTelemetry() {
  const { pathname } = useLocation()

  useEffect(() => {
    goatCounterEvent(pathname)
    simpleAnalyticsEvent('page_change', { path: pathname })

    // The GoatCounter script is async; count the route once it finishes loading.
    if (!(window as any).goatcounter?.count) {
      document.querySelector('script[data-goatcounter]')?.addEventListener('load', () => goatCounterEvent(pathname), { once: true })
    }
  }, [pathname])

  return null
}

function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  return <header className="site-header">
    <div className="header-inner">
      <Link to="/" className="brand" aria-label="Identity Evolution Lab home" onClick={() => setOpen(false)}>
        <span className="brand-mark"><Fingerprint size={22} strokeWidth={1.9} /></span>
        <span className="brand-text">identity<span className="brand-light">evolution</span><span className="brand-dot">.</span><small>LAB</small></span>
      </Link>
      <nav className={`main-nav ${open ? 'nav-open' : ''}`} aria-label="Main navigation">
        {links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive || (path.startsWith('/journey') && location.pathname.startsWith('/journey')) ? 'nav-active' : ''}`}>{label}</NavLink>)}
      </nav>
      <div className="header-right"><span className="header-demo"><span className="live-dot" /> Interactive simulation</span><Link className="header-action" to="/journey/password">Open lab <ArrowUpRight size={15} /></Link></div>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
  </header>
}

function Footer() { return <footer className="site-footer"><div><span className="footer-brand"><Boxes size={17} /> Identity Evolution Lab</span><span> An exploratory IAM simulation. No real authentication or backend.</span></div><span>Built to make identity architecture understandable.</span></footer> }

export default function App() {
  return <div className="app-shell"><PageTelemetry /><Header /><main id="main"><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/journey" element={<JourneyPage />} />
    <Route path="/journey/:stageId" element={<JourneyPage />} />
    <Route path="/playground" element={<PlaygroundPage />} />
    <Route path="/architecture" element={<ArchitecturePage />} />
    <Route path="/audit" element={<AuditPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="*" element={<LandingPage />} />
  </Routes></main><Footer /></div>
}
