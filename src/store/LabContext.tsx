import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { StageId } from '../data/stages'

export type Role = 'Employee' | 'Manager' | 'Administrator'
export type TokenState = 'valid' | 'expired' | 'wrong-audience' | 'tampered'
export type AuditEvent = {
  id: string
  timestamp: string
  subject: string
  type: string
  application: string
  result: 'success' | 'denied' | 'info'
  method: string
  metadata: Record<string, string | number | boolean>
}

type NewEvent = Omit<AuditEvent, 'id' | 'timestamp' | 'subject'>
type LabContextValue = {
  completed: StageId[]
  authenticated: boolean
  sessionActive: boolean
  totpEnabled: boolean
  passkeyEnabled: boolean
  idpSessionActive: boolean
  signedInApps: string[]
  role: Role
  scopes: string[]
  tokenState: TokenState
  auditEvents: AuditEvent[]
  complete: (id: StageId) => void
  log: (event: NewEvent) => void
  signIn: () => void
  createSession: () => void
  revokeSession: () => void
  enableTotp: () => void
  authenticatePasskey: () => void
  openApp: (app: string) => 'fresh' | 'sso' | 'app-session'
  setRole: (role: Role) => void
  setScopes: (scopes: string[]) => void
  setTokenState: (state: TokenState) => void
  resetDemo: () => void
}

const LabContext = createContext<LabContextValue | null>(null)

const seedEvent: AuditEvent = {
  id: 'welcome', timestamp: new Date().toISOString(), subject: 'Alex Morgan',
  type: 'LAB_STARTED', application: 'Identity Evolution Lab', result: 'info', method: 'simulation',
  metadata: { note: 'Client-side educational simulation initialized' },
}

export function LabProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<StageId[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [passkeyEnabled, setPasskeyEnabled] = useState(false)
  const [idpSessionActive, setIdpSessionActive] = useState(false)
  const [signedInApps, setSignedInApps] = useState<string[]>([])
  const [role, setRoleValue] = useState<Role>('Employee')
  const [scopes, setScopesValue] = useState<string[]>(['expenses:read'])
  const [tokenState, setTokenStateValue] = useState<TokenState>('valid')
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([seedEvent])

  const complete = (id: StageId) => setCompleted(previous => previous.includes(id) ? previous : [...previous, id])
  const log = (event: NewEvent) => setAuditEvents(previous => [{
    ...event, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date().toISOString(), subject: 'Alex Morgan',
  }, ...previous])

  const value = useMemo<LabContextValue>(() => ({
    completed, authenticated, sessionActive, totpEnabled, passkeyEnabled, idpSessionActive,
    signedInApps, role, scopes, tokenState, auditEvents, complete, log,
    signIn: () => { setAuthenticated(true); setSessionActive(true); complete('password'); log({ type: 'LOGIN_SUCCESS', application: 'Boo Corp', result: 'success', method: 'password', metadata: { user: 'alex@boocorp.demo' } }); log({ type: 'SESSION_CREATED', application: 'Boo Corp', result: 'success', method: 'password', metadata: { sessionId: 'A82F2381', cookie: 'HttpOnly; Secure; SameSite=Lax' } }) },
    createSession: () => { setSessionActive(true); complete('sessions'); log({ type: 'SESSION_CREATED', application: 'Boo Corp', result: 'success', method: 'password', metadata: { sessionId: 'A82F2381', cookie: 'HttpOnly; Secure; SameSite=Lax' } }) },
    revokeSession: () => { setSessionActive(false); log({ type: 'SESSION_REVOKED', application: 'Boo Corp', result: 'success', method: 'server session', metadata: { sessionId: 'A82F2381' } }) },
    enableTotp: () => { setTotpEnabled(true); complete('mfa'); log({ type: 'MFA_ENROLLED', application: 'Boo Identity', result: 'success', method: 'TOTP enrollment', metadata: { factor: 'authenticator app', note: 'illustrative shared secret' } }) },
    authenticatePasskey: () => { setPasskeyEnabled(true); setIdpSessionActive(true); complete('passkeys'); log({ type: 'PASSKEY_AUTH_SUCCESS', application: 'Boo Identity', result: 'success', method: 'passkey', metadata: { proof: 'simulated signed challenge', credential: 'origin-bound' } }) },
    openApp: (app: string) => {
      if (signedInApps.includes(app)) {
        log({ type: 'APP_SESSION_REUSED', application: app, result: 'success', method: 'existing application session', metadata: { provider: 'Boo Identity' } })
        return 'app-session'
      }
      const mode = idpSessionActive ? 'sso' : 'fresh'
      setIdpSessionActive(true)
      setSignedInApps(previous => previous.includes(app) ? previous : [...previous, app])
      complete('oidc')
      log({ type: mode === 'sso' ? 'SSO_REUSED_IDP_SESSION' : 'OIDC_LOGIN', application: app, result: 'success', method: mode === 'sso' ? 'existing IdP session' : 'simulated Boo Identity sign-in', metadata: { provider: 'Boo Identity', flow: 'authorization code + OIDC', idTokenAudience: app.toLowerCase().replace(/\s+/g, '-') } })
      return mode
    },
    setRole: (next: Role) => { setRoleValue(next); log({ type: 'ROLE_CHANGED', application: 'Playground', result: 'info', method: 'simulation', metadata: { from: role, to: next } }) },
    setScopes: setScopesValue,
    setTokenState: setTokenStateValue,
    resetDemo: () => { setCompleted([]); setAuthenticated(false); setSessionActive(false); setTotpEnabled(false); setPasskeyEnabled(false); setIdpSessionActive(false); setSignedInApps([]); setRoleValue('Employee'); setScopesValue(['expenses:read']); setTokenStateValue('valid'); setAuditEvents([seedEvent]) },
  }), [completed, authenticated, sessionActive, totpEnabled, passkeyEnabled, idpSessionActive, signedInApps, role, scopes, tokenState, auditEvents])

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  const context = useContext(LabContext)
  if (!context) throw new Error('useLab must be used inside LabProvider')
  return context
}
