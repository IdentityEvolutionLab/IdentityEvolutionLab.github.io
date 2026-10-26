import { useState, type ComponentType } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, Layers3, Menu } from 'lucide-react'
import { stages, stageById, type StageId } from '../data/stages'
import { useLab } from '../store/LabContext'
import { Button, Eyebrow, Insight, Panel } from '../components/ui'
import { PasswordDemo, SessionDemo, MfaDemo } from '../components/journey/FoundationDemos'
import { JwtDemo, OAuthDemo, OidcDemo } from '../components/journey/TokenDemos'
import { PasskeyDemo, AuthorizationDemo, OperationsDemo } from '../components/journey/AccessDemos'

const demos: Record<StageId, ComponentType> = {
  password: PasswordDemo,
  sessions: SessionDemo,
  mfa: MfaDemo,
  jwt: JwtDemo,
  oauth: OAuthDemo,
  oidc: OidcDemo,
  passkeys: PasskeyDemo,
  authorization: AuthorizationDemo,
  operations: OperationsDemo,
}

const reference: Record<StageId, { question: string, terms: { name: string, meaning: string }[] }> = {
  password: {
    question: 'What does the server compare without storing Alex’s password?',
    terms: [
      { name: 'Salt', meaning: 'A unique random value stored beside one password hash. It is not a secret.' },
      { name: 'Password hash', meaning: 'The output of a slow, one-way password hashing algorithm.' },
      { name: 'TLS', meaning: 'The encrypted connection that protects the submitted password in transit.' },
    ],
  },
  sessions: {
    question: 'Which state lives in the browser, and which state stays on the server?',
    terms: [
      { name: 'Opaque ID', meaning: 'A random identifier whose value reveals nothing about Alex.' },
      { name: 'HttpOnly', meaning: 'A cookie attribute that blocks direct JavaScript access.' },
      { name: 'SameSite', meaning: 'A cookie attribute that limits some cross-site requests.' },
    ],
  },
  mfa: {
    question: 'What second proof is needed after the password?',
    terms: [
      { name: 'TOTP', meaning: 'Time-based One-Time Password: a short code derived from a shared secret and time.' },
      { name: 'Time step', meaning: 'The short interval, often 30 seconds, used to compute a code.' },
      { name: 'HMAC', meaning: 'A keyed cryptographic operation applied to the secret and time counter.' },
    ],
  },
  jwt: {
    question: 'Can the API prove the claims have not been changed?',
    terms: [
      { name: 'Header', meaning: 'Names the signing algorithm and key identifier.' },
      { name: 'Payload', meaning: 'Carries readable claims such as subject, audience, scope, and expiry.' },
      { name: 'Signature', meaning: 'Binds the encoded header and payload to the issuer’s signing key.' },
    ],
  },
  oauth: {
    question: 'Which check protects each part of this sign-in?',
    terms: [
      { name: 'Authorization code', meaning: 'A short-lived, single-use value returned through the browser and redeemed at the token endpoint.' },
      { name: 'State', meaning: 'Links the callback to the initiating browser’s transaction and helps reject unsolicited responses.' },
      { name: 'PKCE', meaning: 'Binds the code to a secret verifier kept by the client; the provider compares its S256 challenge during exchange.' },
      { name: 'Access token', meaning: 'A credential for an authorized resource server, not a standardized sign-in assertion for the client.' },
      { name: 'Nonce', meaning: 'Links the ID token to this OIDC sign-in request.' },
      { name: 'ID token', meaning: 'A signed identity assertion that the app validates before creating its own session.' },
    ],
  },
  oidc: {
    question: 'Who authenticates Alex, and which app relies on that result?',
    terms: [
      { name: 'OpenID Provider (OP)', meaning: 'The identity provider: Boo Identity authenticates Alex and issues ID tokens.' },
      { name: 'Relying Party (RP)', meaning: 'The OIDC client app that validates its own ID token. SAML calls a comparable app a Service Provider (SP).' },
      { name: 'ID token', meaning: 'An identity assertion intended for the client application.' },
      { name: 'Nonce', meaning: 'A client-generated value checked in the ID token to bind the response.' },
      { name: 'IdP session', meaning: 'Boo Identity’s own session that can enable SSO across apps.' },
      { name: 'App session', meaning: 'The RP’s own signed-in state, created only after it validates and maps the external identity.' },
    ],
  },
  passkeys: {
    question: 'How can Alex prove possession without sending a reusable secret?',
    terms: [
      { name: 'Challenge', meaning: 'A fresh server value that prevents replay of an old response.' },
      { name: 'Origin', meaning: 'The site identity that the browser checks for this credential.' },
      { name: 'Public key', meaning: 'The server-held key used to verify the authenticator’s signature.' },
    ],
  },
  authorization: {
    question: 'Does this identity have permission for this exact action?',
    terms: [
      { name: 'Role', meaning: 'A group of permissions attached to a person or account.' },
      { name: 'Scope', meaning: 'A limit on what an access token may request.' },
      { name: 'Policy', meaning: 'The rule the API enforces when deciding allow or deny.' },
    ],
  },
  operations: {
    question: 'How do teams detect, contain, and recover from identity incidents?',
    terms: [
      { name: 'Revocation', meaning: 'Invalidating access before normal expiry.' },
      { name: 'Rotation', meaning: 'Replacing a refresh credential after use.' },
      { name: 'Audit event', meaning: 'A structured record of an identity-relevant action.' },
    ],
  },
}

type Tab = 'experience' | 'mechanics'

export function JourneyPage() {
  const { stageId } = useParams()
  const navigate = useNavigate()
  const lab = useLab()
  const [tab, setTab] = useState<Tab>('experience')
  const [menuOpen, setMenuOpen] = useState(false)

  if (!stageId || !(stageId in stageById)) return <Navigate to="/journey/password" replace />
  const stage = stageById[stageId as StageId]
  const position = stages.findIndex(item => item.id === stage.id)
  const Demo = demos[stage.id]
  const groups = [...new Set(stages.map(item => item.group))]

  function go(id: StageId) {
    setTab('experience')
    setMenuOpen(false)
    navigate(`/journey/${id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="journey-shell">
    <div className="journey-topbar">
      <div><span className="page-kicker">INTERACTIVE JOURNEY</span><h1>Explore the evolution of identity.</h1><p>One person. One organization. Nine architectural decisions.</p></div>
      <div className="progress-box"><div className="progress-label"><span>Your exploration</span><strong>{lab.completed.length} / {stages.length}</strong></div><div className="progress-track"><div style={{ width: `${lab.completed.length / stages.length * 100}%` }} /></div></div>
    </div>
    <div className="journey-layout">
      <aside className={`stage-sidebar ${menuOpen ? 'stage-sidebar-open' : ''}`} aria-label="Journey stages">
        <button className="stage-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}><Menu size={17} /> Stages <ChevronDown size={16} /></button>
        <div className="stage-list"><div className="sidebar-heading">THE EVOLUTION</div>
          {groups.map(group => <div className="stage-group" key={group}>
            <div className="stage-group-name">{group}</div>
            {stages.filter(item => item.group === group).map(item => <button key={item.id} className={`stage-nav-item ${stage.id === item.id ? 'stage-nav-active' : ''}`} onClick={() => go(item.id)} aria-current={stage.id === item.id ? 'step' : undefined}>
              <span className="stage-number">{lab.completed.includes(item.id) ? <Check size={13} /> : item.number}</span><span>{item.short}</span>{stage.id === item.id && <ChevronRight size={15} className="stage-current-arrow" />}
            </button>)}
          </div>)}
        </div>
        <div className="sidebar-note"><strong>Not a straight line.</strong><p>Modern identity combines these layers. See the complete architecture.</p><Link to="/architecture">View architecture <ArrowRight size={14} /></Link></div>
      </aside>

      <section className="journey-center">
        <div className="stage-heading"><div className="stage-heading-top"><Eyebrow>{stage.eyebrow}</Eyebrow><span className="stage-count">STAGE {stage.number} / 09</span></div><h2>{stage.title}</h2><p>{stage.summary}</p></div>
        <div className="stage-tabs" role="tablist" aria-label="Stage views">
          <button role="tab" aria-selected={tab === 'experience'} className={tab === 'experience' ? 'active' : ''} onClick={() => setTab('experience')}><Layers3 size={16} /> Try it</button>
          <button role="tab" aria-selected={tab === 'mechanics'} className={tab === 'mechanics' ? 'active' : ''} onClick={() => setTab('mechanics')}><BookOpen size={16} /> How it works</button>
        </div>
        <div role="tabpanel" className="stage-tab-content" key={`${stage.id}-${tab}`}>
          {tab === 'experience' ? <Demo /> : <div className="content-stack">
            <Panel className="mechanics-panel">
              <div className="content-heading"><BookOpen size={20} /><div><h3>Follow the mechanism</h3><p>The important steps behind the action you just tried</p></div></div>
              <ol className="explain-list">{stage.hood.map((point, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span><p>{point}</p></li>)}</ol>
            </Panel>
            <div className="mechanics-change">
              <div><small>BEFORE</small><p>{stage.problem}</p></div>
              <div><small>WHAT CHANGED</small><p>{stage.introduced} {stage.improved}</p></div>
            </div>
            <Insight label="New design work" tone="amber">{stage.tradeoff}</Insight>
            <details className="security-disclosure"><summary>Security details worth checking</summary><ul>{stage.security.map(point => <li key={point}>{point}</li>)}</ul></details>
          </div>}
        </div>
        <div className="journey-bottom-nav"><button disabled={position === 0} onClick={() => go(stages[position - 1].id)}><ArrowLeft size={16} /> Previous stage</button>{position < stages.length - 1 ? <Button onClick={() => go(stages[position + 1].id)}>Next: {stages[position + 1].short} <ArrowRight size={16} /></Button> : <Link className="btn btn-primary" to="/architecture">See full architecture <ArrowRight size={16} /></Link>}</div>
      </section>

      <aside className="insight-sidebar"><div className="insight-sticky">
        <div className="right-title"><span className="right-title-icon">✳</span> CONCEPT GLOSSARY</div>
        <p className="reference-question">{reference[stage.id].question}</p>
        <dl className="reference-list">{reference[stage.id].terms.map(term => <div key={term.name}><dt>{term.name}</dt><dd>{term.meaning}</dd></div>)}</dl>
        <Link to="/architecture" className="right-playground">See how it fits together <ArrowRight size={15} /></Link>
      </div></aside>
    </div>
  </div>
}
