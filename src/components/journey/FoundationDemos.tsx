import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, CircleHelp, Cookie, KeyRound, RotateCcw, ShieldCheck } from 'lucide-react'
import { useLab } from '../../store/LabContext'
import { Button, Flow, Insight, Status } from '../ui'
import { CodeBlock, DemoFrame, Result } from './DemoPrimitives'

export function PasswordDemo() {
  const lab = useLab()
  const [email, setEmail] = useState('alex@boocorp.demo')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<'success' | 'failure' | null>(null)
  const [showSalted, setShowSalted] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valid = email.trim().toLowerCase() === 'alex@boocorp.demo' && password === 'BooCorp123!'
    setResult(valid ? 'success' : 'failure')
    if (valid) lab.signIn()
    else lab.log({ type: 'LOGIN_FAILED', application: 'Boo Corp', result: 'denied', method: 'password', metadata: { reason: 'demo credential mismatch' } })
  }

  return <div className="demo-stack">
    <DemoFrame title="Boo Corp / Sign in" subtitle="Submit the demo credentials, then inspect how verification works." badge="01 / Foundation">
      <div className="login-layout">
        <form onSubmit={submit} className="login-card">
          <div className="login-symbol">B<span>·</span></div>
          <h3>Welcome back, Alex</h3>
          <p>Sign in to your Boo Corp workspace</p>
          <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter demo password" required /></label>
          <Button type="submit" className="w-full">Sign in <ArrowDown size={15} /></Button>
          <span className="form-hint">Demo credentials: alex@boocorp.demo / BooCorp123!</span>
        </form>
        <div className="demo-side-note"><KeyRound size={22} /><strong>A shared secret</strong><p>Alex submits a password. Boo Corp verifies it against a stored salted hash, never by decrypting a password.</p><Status tone="warn">Phishing resistance: low</Status></div>
      </div>
      {result && <Result success={result === 'success'} title={result === 'success' ? 'Authentication successful' : 'Credentials did not match'} code={result === 'success' ? '200 OK' : '401 Unauthorized'}>
        {result === 'success' ? 'The browser-only demo checked the entered value. A real server would recompute a password hash using Alex’s stored salt.' : 'Use the demo credentials shown below the form.'}
      </Result>}
    </DemoFrame>

    {result && <DemoFrame title="What the server would do" subtitle="A conceptual verification sequence; no real password server runs here." badge="After sign-in">
      <Flow steps={[
        'Receive identifier + password over TLS',
        'Load Alex’s unique salt, hashing parameters, and stored hash',
        'Run Argon2id on the entered password using that salt',
        'Compare the newly calculated hash with the stored hash',
        result === 'success' ? 'Match → authenticate Alex' : 'No match → deny sign-in',
      ]} active={4} />
      <CodeBlock label="Illustrative stored record — not a real credential">salt = random-per-credential-value<br />hash = $argon2id$v=19$m=65536,t=3,p=1$...$illustrative-hash</CodeBlock>
      <p className="fine-print mt-3">The server stores the salt, parameters, and resulting hash. It does not store the plaintext password, and a hash is not something it can decrypt.</p>
    </DemoFrame>}

    <DemoFrame title="Salt lab / Same password, two accounts" subtitle="Compare what an attacker would see in a stolen password table." badge="Try the difference">
      <p className="salt-intro">A <strong>salt</strong> is a random value generated for each password record. It is stored beside the hash and does not need to be secret.</p>
      <div className="salt-equation"><span>password</span><span>+</span><span>unique salt</span><ArrowRight size={16} /><strong>slow password hash</strong></div>
      <div className="hash-comparison">
        <div className="hash-row"><strong>Alex</strong><code>same-demo-password</code><span>salt: {showSalted ? 'A7C2...' : 'none'}</span><code>hash: {showSalted ? '8df2...a19c' : '7c8e...4b21'}</code></div>
        <div className="hash-row"><strong>Priya</strong><code>same-demo-password</code><span>salt: {showSalted ? 'F91B...' : 'none'}</span><code>hash: {showSalted ? '3aa5...e904' : '7c8e...4b21'}</code></div>
      </div>
      <div className="salt-action"><Button variant="secondary" onClick={() => setShowSalted(value => !value)}>{showSalted ? 'Compare without salts' : 'Add unique salts'} <ArrowRight size={15} /></Button></div>
      <Insight label={showSalted ? 'Different stored hashes' : 'Same stored hash'}>
        {showSalted ? 'The same password now yields different stored hashes. Attackers cannot reuse one precomputed lookup across every account, and matching hashes no longer reveal shared passwords.' : 'Without salts, identical passwords produce identical hashes. A precomputed table can be reused across many records.'}
      </Insight>
      <p className="fine-print salt-caveat">Illustrative values only. Salts do not stop targeted guessing of weak passwords; a slow password hashing function such as Argon2id makes each guess more expensive.</p>
    </DemoFrame>
  </div>
}

export function SessionDemo() {
  const lab = useLab()
  const [request, setRequest] = useState<'none' | 'ok' | 'denied'>('none')
  const [inspect, setInspect] = useState(false)

  function call() {
    const ok = lab.sessionActive
    setRequest(ok ? 'ok' : 'denied')
    lab.log({ type: ok ? 'SESSION_REQUEST_SUCCESS' : 'SESSION_REQUEST_DENIED', application: 'Boo Corp / Profile', result: ok ? 'success' : 'denied', method: 'server session', metadata: { endpoint: 'GET /profile', status: ok ? 200 : 401 } })
  }

  return <div className="demo-stack">
    <DemoFrame title="Boo Corp / Session store" subtitle="The browser keeps an opaque ID; the server keeps Alex’s session." badge="02 / Foundation">
      <div className="session-layout">
        <div className="session-browser"><div className="mini-heading"><Cookie size={16} /> Browser cookie</div><code>session_id=A82F2381...</code><span className="muted-small">Only an identifier is sent</span></div>
        <ArrowDown className="session-arrow" size={22} />
        <div className={`session-store ${lab.sessionActive ? 'store-active' : ''}`}><div className="mini-heading"><ShieldCheck size={16} /> Server session store</div>{lab.sessionActive ? <dl><div><dt>Session ID</dt><dd>A82F2381</dd></div><div><dt>User</dt><dd>Alex Morgan</dd></div><div><dt>Role</dt><dd>Employee</dd></div><div><dt>Expires</dt><dd>2:30 PM (illustrative)</dd></div></dl> : <div className="empty-store">No active session record</div>}</div>
      </div>
      <div className="action-row"><Button onClick={() => { lab.createSession(); setRequest('none') }}>{lab.sessionActive ? 'Renew session' : 'Create demo session'}</Button><Button variant="secondary" onClick={call}>Make authenticated request</Button><Button variant="ghost" onClick={() => setInspect(!inspect)}>{inspect ? 'Hide' : 'Inspect'} browser state</Button></div>
      {inspect && <CodeBlock label="Simulated Set-Cookie attributes">session_id=A82F2381...<br />HttpOnly: true<br />Secure: true<br />SameSite: Lax</CodeBlock>}
      {request !== 'none' && <Result success={request === 'ok'} title={request === 'ok' ? 'Alex found in session store' : 'Session not found'} code={request === 'ok' ? '200 OK' : '401 Unauthorized'}>{request === 'ok' ? 'GET /profile carried the opaque cookie. The server resolved it to Alex.' : 'The server cannot resolve this cookie to an active session.'}</Result>}
      {lab.sessionActive && <button className="text-button danger" onClick={() => { lab.revokeSession(); setRequest('none') }}>Revoke session <RotateCcw size={14} /></button>}
    </DemoFrame>
    <Insight label="Key idea">Server-side sessions remain useful. Revocation is straightforward because the application controls the session record.</Insight>
  </div>
}

export function MfaDemo() {
  const lab = useLab()
  const [enrolling, setEnrolling] = useState(false)
  const [enrollCode, setEnrollCode] = useState('')
  const [enrollError, setEnrollError] = useState(false)
  const [loginStep, setLoginStep] = useState<'idle' | 'password' | 'totp' | 'done'>('idle')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loginError, setLoginError] = useState('')

  function verifyEnrollment() {
    if (enrollCode === '314159') {
      lab.enableTotp()
      setEnrollError(false)
    } else {
      setEnrollError(true)
      lab.log({ type: 'MFA_ENROLLMENT_FAILED', application: 'Boo Identity', result: 'denied', method: 'TOTP', metadata: { reason: 'demo enrollment code mismatch' } })
    }
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loginPassword === 'BooCorp123!') {
      setLoginError('')
      setLoginStep('totp')
    } else {
      setLoginError('Password did not match. Use BooCorp123!.')
      lab.log({ type: 'LOGIN_FAILED', application: 'Boo Identity', result: 'denied', method: 'password', metadata: { stage: 'MFA sign-in' } })
    }
  }

  function submitTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loginCode === '271828') {
      setLoginError('')
      setLoginStep('done')
      lab.log({ type: 'MFA_CHALLENGE_SUCCESS', application: 'Boo Identity', result: 'success', method: 'password + TOTP', metadata: { step: 'two-step sign-in', note: 'illustrative later time window' } })
    } else {
      setLoginError('Code did not match. Use the displayed demo code 271828.')
      lab.log({ type: 'MFA_CHALLENGE_FAILED', application: 'Boo Identity', result: 'denied', method: 'TOTP', metadata: { reason: 'demo sign-in code mismatch' } })
    }
  }

  return <div className="demo-stack">
    <DemoFrame title="Boo Corp / Security settings" subtitle="Enroll a Time-based One-Time Password authenticator." badge="03 / Strong auth">
      <div className="settings-list">
        <div><KeyRound size={18} /><span>Password</span><Status tone="good">Enabled</Status></div>
        <div><ShieldCheck size={18} /><span>Authenticator app</span><Status tone={lab.totpEnabled ? 'good' : 'neutral'}>{lab.totpEnabled ? 'Enabled' : 'Not configured'}</Status></div>
        <div><CircleHelp size={18} /><span>Passkey</span><Status tone="neutral">Not configured</Status></div>
      </div>
      {!enrolling && !lab.totpEnabled && <Button className="mt-6" onClick={() => setEnrolling(true)}>Enable authenticator app</Button>}
      {enrolling && !lab.totpEnabled && <div className="enrollment">
        <div className="qr-mock" aria-label="Decorative simulated QR code">{Array.from({ length: 81 }, (_, index) => <i key={index} className={(index * 11 + Math.floor(index / 9) * 7) % 5 < 2 ? 'filled' : ''} />)}</div>
        <div><h3>Connect your authenticator</h3><p>The QR-like pattern represents a shared secret stored by the authenticator and Boo Identity. This lab does not create a real secret or QR code. Enter <strong>314159</strong> to confirm the demo enrollment.</p><label className="code-input-label">Enrollment code<input value={enrollCode} onChange={event => setEnrollCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" placeholder="000000" aria-label="Six-digit demo enrollment code" /></label><Button onClick={verifyEnrollment} disabled={enrollCode.length !== 6}>Verify enrollment</Button>{enrollError && <p className="form-error" role="alert">Code does not match. Use 314159.</p>}</div>
      </div>}
      {lab.totpEnabled && <Result success title="Authenticator enrolled">The shared secret is now conceptually set up. Next, try an actual two-step sign-in below.</Result>}
    </DemoFrame>

    <div className="mini-card totp-mechanism">
      <div className="mini-heading">How a Time-based One-Time Password is calculated</div>
      <div className="totp-formula"><span>Shared secret</span><span>+</span><span>30-second time counter</span><ArrowRight size={16} /><span>HMAC + truncation</span><ArrowRight size={16} /><strong>6-digit code</strong></div>
      <CodeBlock label="Conceptual calculation, not executed by this lab">counter = floor(Unix time / 30)<br />digest = HMAC(secret, counter)<br />code = dynamicTruncate(digest) mod 1,000,000</CodeBlock>
      <p>Alex’s authenticator and Boo Identity compute this independently using the same secret and time window. The server compares the entered code with its own result.</p>
    </div>

    {lab.totpEnabled && <DemoFrame title="Try a two-step sign-in" subtitle="Enrollment is finished; now prove both factors during login." badge="Password → TOTP">
      <Flow steps={['Enter password', 'Enter current TOTP code', 'Authenticated']} active={loginStep === 'idle' || loginStep === 'password' ? 0 : loginStep === 'totp' ? 1 : 2} direction="horizontal" />
      {loginStep === 'idle' && <Button className="mt-5" onClick={() => setLoginStep('password')}>Start sign-in <ArrowRight size={15} /></Button>}
      {loginStep === 'password' && <form className="mfa-login-form" onSubmit={submitPassword}><label>Password<input type="password" value={loginPassword} onChange={event => setLoginPassword(event.target.value)} placeholder="BooCorp123!" required /></label><Button type="submit">Continue to TOTP <ArrowRight size={15} /></Button></form>}
      {loginStep === 'totp' && <form className="mfa-login-form" onSubmit={submitTotp}><p>Password accepted. A password alone has not completed sign-in.</p><label>Current TOTP code<input value={loginCode} onChange={event => setLoginCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" placeholder="000000" required /></label><span className="form-hint">Illustrative later time window: demo code 271828</span><Button type="submit">Verify second factor <ArrowRight size={15} /></Button></form>}
      {loginError && <p className="form-error" role="alert">{loginError}</p>}
      {loginStep === 'done' && <><Result success title="Two-step sign-in complete">Password ✓ · Time-based one-time code ✓. Both factors were checked before access.</Result><Button variant="secondary" className="mt-5" onClick={() => { setLoginPassword(''); setLoginCode(''); setLoginStep('password') }}>Try again</Button></>}
    </DemoFrame>}

    <div className="two-col-cards"><div className="mini-card"><div className="mini-heading">What improved?</div><p>A stolen password by itself is no longer sufficient. The attacker would also need a current code from Alex’s authenticator.</p></div><div className="mini-card"><div className="mini-heading">Recovery path</div><p>One-time recovery codes help if Alex loses the authenticator. They must be protected like credentials.</p><div className="recovery-code">BOO-8K2P-41QX <span>illustrative</span></div></div></div>
    <Insight label="What remains?" tone="amber">A real-time phishing site may capture and relay a live TOTP code. Passkeys address this by binding credentials to the legitimate origin.</Insight>
  </div>
}
