import { useState } from 'react'
import { ArrowRight, KeyRound, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useLab } from '../../store/LabContext'
import { Button, Insight, Status } from '../ui'
import { CodeBlock, DemoFrame, Result } from './DemoPrimitives'
import { ProtocolWalkthrough } from './ProtocolWalkthrough'
import { combinedSteps } from './protocolSteps'

type TokenScenario = 'valid' | 'expired' | 'audience' | 'signature' | 'scope'

const header = { alg: 'RS256', typ: 'JWT', kid: 'boo-key-01' }
const baseClaims = { sub: 'alex-morgan', role: 'manager', scope: 'expenses:read', iss: 'https://identity.boo.example', aud: 'expense-api' }
const signature = 'illustrative-signature-only'
const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
const refreshLabel = (generation: number) => generation < 26 ? String.fromCharCode(65 + generation) : `R${generation + 1}`

export function JwtDemo() {
  const lab = useLab()
  const [issued, setIssued] = useState(false)
  const [inspect, setInspect] = useState(false)
  const [tampered, setTampered] = useState(false)
  const [scenario, setScenario] = useState<TokenScenario>('valid')
  const [validated, setValidated] = useState(false)
  const [accessExpired, setAccessExpired] = useState(false)
  const [refreshGeneration, setRefreshGeneration] = useState(0)
  const [familyRevoked, setFamilyRevoked] = useState(false)
  const [expiresAt, setExpiresAt] = useState(() => Math.floor(Date.now() / 1000) + 300)

  const claims = { ...baseClaims, role: tampered ? 'admin' : 'manager', exp: expiresAt }
  const signatureOk = !tampered && scenario !== 'signature'
  const issuerOk = true
  const audienceOk = scenario !== 'audience'
  const expiryOk = scenario !== 'expired' && !accessExpired
  const scopeOk = scenario !== 'scope'
  const trusted = signatureOk && issuerOk && audienceOk && expiryOk
  const allowed = trusted && scopeOk
  const status = !trusted ? 401 : scopeOk ? 200 : 403
  const currentRefresh = refreshLabel(refreshGeneration)
  const previousRefresh = refreshGeneration > 0 ? refreshLabel(refreshGeneration - 1) : null

  function issue() {
    setIssued(true); setInspect(false); setTampered(false); setScenario('valid'); setValidated(false)
    setAccessExpired(false); setRefreshGeneration(0); setFamilyRevoked(false)
    setExpiresAt(Math.floor(Date.now() / 1000) + 300)
    lab.complete('jwt')
    lab.log({ type: 'ACCESS_TOKEN_ISSUED', application: 'Boo Identity', result: 'success', method: 'JWT simulation', metadata: { audience: 'expense-api', scope: 'expenses:read', signing: 'illustrative only' } })
  }

  function validate() {
    setValidated(true)
    lab.log({ type: allowed ? 'TOKEN_ACCEPTED' : 'TOKEN_REJECTED', application: 'Expense API', result: allowed ? 'success' : 'denied', method: 'JWT validation simulation', metadata: { status, signatureOk, audienceOk, expiryOk, scopeOk, tampered } })
  }

  function expireAccess() {
    setAccessExpired(true)
    setValidated(false)
    lab.log({ type: 'ACCESS_TOKEN_EXPIRED', application: 'Expense API', result: 'info', method: 'lifecycle simulation', metadata: { accessToken: refreshGeneration + 1 } })
  }

  function rotateRefresh() {
    if (!accessExpired || familyRevoked) return
    const nextGeneration = refreshGeneration + 1
    setRefreshGeneration(nextGeneration); setAccessExpired(false); setScenario('valid'); setTampered(false)
    setExpiresAt(Math.floor(Date.now() / 1000) + 300)
    setValidated(false)
    lab.log({ type: 'TOKEN_REFRESHED', application: 'Boo Identity', result: 'success', method: 'refresh-token rotation simulation', metadata: { consumed: `refresh ${currentRefresh}`, issued: `refresh ${refreshLabel(nextGeneration)}`, accessToken: nextGeneration + 1 } })
  }

  function reuseOldRefresh() {
    if (!previousRefresh || familyRevoked) return
    setFamilyRevoked(true)
    lab.log({ type: 'REFRESH_REUSE_DETECTED', application: 'Boo Identity', result: 'denied', method: 'refresh-token rotation simulation', metadata: { reused: `refresh ${previousRefresh}`, action: 'refresh family revoked' } })
  }

  const check = (label: string, pass: boolean | null) => <li key={label}><span className={pass === null ? 'jwt-check-pending' : pass ? 'jwt-check-pass' : 'jwt-check-fail'}>{pass === null ? '—' : pass ? '✓' : '✕'}</span><span>{label}</span></li>

  return <div className="demo-stack">
    <DemoFrame title="Boo Identity / Access token" subtitle="Issue, inspect, alter, and validate a simulated JWT." badge="04 / API access">
      <div className="action-row"><Button onClick={issue}>Issue access token <ArrowRight size={15} /></Button>{issued && <Button variant="secondary" onClick={() => setInspect(value => !value)}>{inspect ? 'Hide token details' : 'Inspect token'}</Button>}</div>
      {!issued && <Insight label="Try this">Issue a token, inspect its three parts, then change the role and ask the API to validate it.</Insight>}
      {issued && <>
        <div className="jwt-legend"><span><i className="jwt-header-swatch" /> Header</span><span><i className="jwt-payload-swatch" /> Payload</span><span><i className="jwt-signature-swatch" /> Signature</span></div>
        <div className="code-block jwt-encoded"><div className="code-label">Three dot-separated segments · illustrative signature</div><pre><span className="jwt-header">{encode(header)}</span><span className="jwt-dot">.</span><span className="jwt-payload">{encode(claims)}</span><span className="jwt-dot">.</span><span className="jwt-signature">{signature}</span></pre></div>
        {inspect && <div className="jwt-parts">
          <div><span>01 · HEADER</span><CodeBlock>{JSON.stringify(header, null, 2)}</CodeBlock><p>Names the algorithm and the key ID the API uses to find the issuer’s public key.</p></div>
          <div><span>02 · PAYLOAD</span><CodeBlock>{JSON.stringify(claims, null, 2)}</CodeBlock><p>Readable claims. The exp value is a Unix timestamp in seconds. Base64url encoding does not conceal these contents.</p></div>
          <div><span>03 · SIGNATURE</span><div className="signature-box">sign(private key, encoded header + “.” + encoded payload)<small>This lab displays a placeholder; no cryptographic signature is generated.</small></div><p>The API verifies these exact encoded bytes with the issuer’s public key. Changing either part breaks verification.</p></div>
        </div>}
        <div className="jwt-signing-input"><strong>What is signed?</strong><span><em>Header</em> + dot + <em>Payload</em> → signing input → <em>Signature</em></span><p>The API checks the signature first, then the issuer, audience, expiry, and required scope. Decoding the payload alone proves nothing.</p></div>
        <div className="claim-switch"><code>role: {claims.role}</code><button onClick={() => { setTampered(value => !value); setValidated(false) }}>{tampered ? 'Restore original claim' : 'Modify role to admin'}</button></div>
        {tampered && <Insight label="Why this fails" tone="amber">The role changed, but the signature stayed the same. The API must reject the modified token before trusting its claims.</Insight>}
        <div className="divider" />
        <div className="mini-heading">Ask the API to validate</div>
        <div className="scenario-row" role="group" aria-label="Validation scenario">{([
          ['valid', 'Valid token'], ['expired', 'Expired'], ['audience', 'Wrong audience'], ['signature', 'Bad signature'], ['scope', 'Missing scope'],
        ] as [TokenScenario, string][]).map(([value, label]) => <button key={value} className={`scenario-chip ${scenario === value ? 'selected' : ''}`} onClick={() => { setScenario(value); setValidated(false) }}>{label}</button>)}</div>
        <Button variant="secondary" onClick={validate}>Validate at Expense API <ShieldCheck size={15} /></Button>
        {validated && <><ul className="jwt-checklist">{[
          check('Signature matches the unchanged header and payload', signatureOk),
          check('Issuer is trusted by this API', signatureOk ? issuerOk : null),
          check('Audience is expense-api', signatureOk ? audienceOk : null),
          check('Access token has not expired', signatureOk ? expiryOk : null),
          check('Token has expenses:read scope', trusted ? scopeOk : null),
        ]}</ul><Result success={allowed} title={allowed ? 'Request allowed' : status === 401 ? 'Token rejected' : 'Permission denied'} code={status === 200 ? '200 OK' : status === 401 ? '401 Unauthorized' : '403 Forbidden'}>{status === 401 ? 'The API cannot trust this token. It stops before authorization.' : status === 403 ? 'The token is valid, but lacks the permission needed for this request.' : 'The token is trusted and carries the required scope.'}</Result></>}
      </>}
    </DemoFrame>
    <DemoFrame title="Access + refresh token cycle" subtitle="Each refresh token is used once; its replacement can refresh again later." badge="Token lifecycle">
      <div className="token-lifecycle"><div><strong>Access token {refreshGeneration + 1}</strong><Status tone={accessExpired ? 'bad' : 'good'}>{accessExpired ? 'Expired' : 'API requests'}</Status><p>Sent to the Expense API. Short lifetime limits how long a stolen token works.</p></div><ArrowRight size={18} /><div><strong>Refresh token {currentRefresh}</strong><Status tone={familyRevoked ? 'bad' : 'neutral'}>{familyRevoked ? 'Family revoked' : 'Boo Identity only'}</Status><p>Sent to the authorization server for a replacement. Never sent to the API.</p></div></div>
      <div className="action-row"><Button variant="secondary" onClick={expireAccess} disabled={!issued || accessExpired}>Expire access token</Button><Button onClick={rotateRefresh} disabled={!issued || !accessExpired || familyRevoked}>Use refresh token {currentRefresh} <RefreshCcw size={15} /></Button>{previousRefresh && <Button variant="secondary" onClick={reuseOldRefresh} disabled={familyRevoked}>Replay old token {previousRefresh}</Button>}</div>
      {!issued && <p className="fine-print">Issue an access token above to begin the cycle.</p>}
      {accessExpired && !familyRevoked && <div className="token-expired-result"><Result success={false} title="Access token no longer works" code="401 Unauthorized">This demo advances the clock past the token’s expiry. The client uses its refresh token at Boo Identity to request a replacement.</Result></div>}
      {previousRefresh && !familyRevoked && !accessExpired && <div className="token-refresh-result"><Result success title="Fresh access token issued">Boo Identity consumed refresh token {previousRefresh} and issued access token {refreshGeneration + 1} plus refresh token {currentRefresh}. Token {previousRefresh} is now invalid. You can repeat the cycle with token {currentRefresh}.</Result></div>}
      {familyRevoked && <div className="token-reuse-result"><Result success={false} title="Old refresh token reused">Reuse can signal theft. Boo Identity revokes this refresh-token family, so token {currentRefresh} cannot refresh again.</Result></div>}
      <Insight label="Practical boundary">Refresh tokens need stronger storage and rotation because they can mint new access tokens. Revoking a refresh-token family does not automatically cancel an already-issued access token at an offline-validating API; its short expiry or another revocation mechanism must handle that.</Insight>
    </DemoFrame>
  </div>
}

type OAuthBoundary = 'valid' | 'consent' | 'state' | 'pkce' | 'audience'
const boundaryPhase: Record<OAuthBoundary, string> = {
  valid: '17b', consent: '6', state: '9', pkce: '11', audience: '14',
}

export function OAuthDemo() {
  const lab = useLab()
  const [step, setStep] = useState(0)
  const [boundary, setBoundary] = useState<OAuthBoundary | null>(null)
  const [outcome, setOutcome] = useState<'granted' | 'consent' | 'state' | 'pkce' | 'audience' | null>(null)

  function runFlow() {
    const scenario = boundary ?? 'valid'
    setOutcome(scenario === 'valid' ? 'granted' : scenario)
    if (scenario === 'valid') lab.complete('oauth')
    lab.log({
      type: scenario === 'valid' ? 'OAUTH_OIDC_FLOW_COMPLETED' : 'OAUTH_FLOW_REJECTED',
      application: scenario === 'pkce' || scenario === 'consent' ? 'Boo Identity' : 'Expense Portal',
      result: scenario === 'valid' ? 'success' : 'denied',
      method: 'authorization code + PKCE + OIDC simulation',
      metadata: { scope: 'expenses:read', resource: 'Expense API', boundary: scenario },
    })
  }

  function selectBoundary(value: OAuthBoundary) {
    setBoundary(value)
    setOutcome(value === 'valid' ? 'granted' : value)
    setStep(combinedSteps.findIndex(item => item.phase === boundaryPhase[value]))
  }

  return <div className="demo-stack">
    <DemoFrame title="The complete sign-in and access sequence" subtitle="OAuth 2.0 + PKCE, OIDC identity, and the app session in one path." badge="05 / OAuth + OIDC">
      <p className="protocol-simulation-note">Alex signs in to Expense Portal through Boo Identity, then the portal uses an access token at Expense API. This is an illustrative backend flow; the frontend-only lab sends no real redirects or tokens. The labels show which protocol or application owns each step.</p>
      <ProtocolWalkthrough steps={combinedSteps} selected={step} onSelect={setStep} label="Complete OAuth and OIDC sequence" afterDetail={<div className="action-row protocol-actions">
        <Button variant="secondary" onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0}>Previous handoff</Button>
        <Button onClick={() => { if (step < combinedSteps.length - 1) setStep(step + 1); else runFlow() }}>{step === combinedSteps.length - 1 ? 'Test the complete flow' : 'Next handoff'} <ArrowRight size={15} /></Button>
      </div>} beforeDiagram={<div className="protocol-boundary">
        <div className="mini-heading">Try a security boundary</div>
        <div className="scenario-row" role="group" aria-label="OAuth security check">{([
          ['valid', 'All checks pass'], ['consent', 'Consent denied'], ['state', 'State mismatch'], ['pkce', 'Wrong PKCE verifier'], ['audience', 'Wrong ID token audience'],
        ] as const).map(([value, label]) => <button key={value} type="button" className={`scenario-chip ${boundary === value ? 'selected' : ''}`} aria-pressed={boundary === value} onClick={() => selectBoundary(value)}>{label}</button>)}</div>
        {!outcome && <p className="protocol-boundary-hint">Select a check to see where the flow succeeds or stops.</p>}
        {outcome === 'granted' && <Result success title="Alex is signed in and API access is granted" code="200 OK">Expense Portal validated an ID token for its own sign-in, created a local app session, and used the separate scoped access token at Expense API.</Result>}
        {outcome === 'consent' && <Result success={false} title="Authorization denied">Alex did not approve the requested access. Boo Identity returns an access_denied error instead of an authorization code.</Result>}
        {outcome === 'state' && <Result success={false} title="Callback rejected">The returned state does not match this browser’s transaction. Expense Portal stops before exchanging the code.</Result>}
        {outcome === 'pkce' && <Result success={false} title="Token request rejected">Boo Identity recomputes the challenge from the submitted verifier. It does not match the one bound to the code, so no token is issued.</Result>}
        {outcome === 'audience' && <Result success={false} title="Sign-in rejected at the app">The ID token is addressed to another client. Expense Portal must reject it and must not create Alex’s local app session.</Result>}
      </div>} />
      <a className="sequence-full-link" href={`${import.meta.env.BASE_URL}oauth-oidc-sequence.svg`} target="_blank" rel="noopener noreferrer">Open the complete sequence as an image <ArrowRight size={15} aria-hidden="true" /></a>
    </DemoFrame>
    <Insight label="Two jobs in one journey">OAuth delegates limited API access. OIDC adds an ID token so Expense Portal can verify who signed in. The app then creates its own session. Access tokens, ID tokens, and the app session have different recipients.</Insight>
  </div>
}

const apps = ['Expense Portal', 'HR Portal', 'Admin Console']
const clientIds: Record<string, string> = { 'Expense Portal': 'expense-portal', 'HR Portal': 'hr-portal', 'Admin Console': 'admin-console' }

export function OidcDemo() {
  const lab = useLab()
  const [lastOpened, setLastOpened] = useState<{ app: string, mode: 'fresh' | 'sso' | 'app-session' } | null>(null)
  const nextApp = apps.find(app => !lab.signedInApps.includes(app))

  function openApp(app: string) {
    setLastOpened({ app, mode: lab.openApp(app) })
  }

  return <div className="demo-stack">
    <div className="two-col-cards">
      <div className="mini-card"><KeyRound size={20} /><h3>OpenID Provider (OP)</h3><p>Boo Identity authenticates Alex, keeps the IdP session, and issues an ID token for the requesting app.</p></div>
      <div className="mini-card accent-card"><ShieldCheck size={20} /><h3>Relying party (RP)</h3><p>Expense Portal, HR Portal, and Admin Console each validate their own ID token and create a local session. In SAML, a comparable app is called a Service Provider (SP).</p></div>
    </div>
    <DemoFrame title="Try single sign-on" subtitle="Open one app, then another. Boo Identity’s session can be reused." badge="06 / OIDC + SSO">
      <div className="oidc-session-state"><Status tone={lab.idpSessionActive ? 'good' : 'neutral'}>Boo Identity session: {lab.idpSessionActive ? 'active' : 'not started'}</Status><Status>{lab.signedInApps.length} app{lab.signedInApps.length === 1 ? '' : 's'} signed in</Status></div>
      <p className="oidc-interaction-note">{lab.signedInApps.length === 0 ? lab.idpSessionActive ? 'Alex already has a Boo Identity session. Open an application to see it reused.' : 'Open an application to see the first sign-in.' : nextApp ? `Now open ${nextApp} to see single sign-on reuse Boo Identity’s session.` : 'All three apps have their own sessions. Open one again to reuse its app session.'}</p>
      <div className="app-cards">{apps.map((app, index) => <button key={app} className={`app-card ${lab.signedInApps.includes(app) ? 'app-signed-in' : ''}`} onClick={() => openApp(app)}><span className="app-icon">{['E', 'H', 'A'][index]}</span><strong>{app}</strong><small>{lab.signedInApps.includes(app) ? 'Signed in · open again' : 'Open application'}</small></button>)}</div>
      {lastOpened && lab.signedInApps.includes(lastOpened.app) && <div className="oidc-handoff" aria-live="polite">
        <div className="mini-heading">What happened when {lastOpened.app} opened</div>
        {lastOpened.mode === 'app-session' ? <p className="oidc-returning-note">{lastOpened.app} reused its existing local session. Boo Identity did not need to issue another ID token.</p> : <div className="oidc-handoff-grid">
          <div className="oidc-handoff-step"><span>01 · OPENID PROVIDER</span><strong>Boo Identity</strong><p>{lastOpened.mode === 'fresh' ? 'Alex signs in. Boo Identity starts a provider session.' : 'Alex’s provider session is already active. No new credential prompt.'}</p></div>
          <div className="oidc-handoff-step oidc-token-step"><span>02 · IDENTITY PROOF</span><strong>ID token for {lastOpened.app}</strong><code>sub: alex-morgan<br />aud: {clientIds[lastOpened.app]}</code><p>Illustrative claims: the audience is this app’s registered client ID.</p></div>
          <div className="oidc-handoff-step"><span>03 · RELYING PARTY</span><strong>{lastOpened.app}</strong><p>The app checks signature, issuer, audience, expiry, and nonce; then maps Alex and starts its own session.</p></div>
        </div>}
      </div>}
    </DemoFrame>
    <Insight label="Do not mix tokens">An ID token tells one relying party who signed in. It is not an API credential. An API checks a separate access token for allowed operations.</Insight>
  </div>
}
