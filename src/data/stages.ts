export type StageId = 'password' | 'sessions' | 'mfa' | 'jwt' | 'oauth' | 'oidc' | 'passkeys' | 'authorization' | 'operations'

export type Stage = {
  id: StageId
  number: string
  group: string
  title: string
  short: string
  eyebrow: string
  summary: string
  problem: string
  introduced: string
  improved: string
  tradeoff: string
  hood: string[]
  security: string[]
  details: string[]
}

export const stages: Stage[] = [
  {
    id: 'password', number: '01', group: 'Foundations', title: 'Username + Password', short: 'Password', eyebrow: 'A starting point',
    summary: 'Alex proves identity with a secret known to both Alex and Boo Corp.',
    problem: 'An application needs a way to recognize a returning user.', introduced: 'An identifier and a shared secret.', improved: 'A simple, familiar sign-in experience.', tradeoff: 'Secrets can be phished, reused, guessed, or exposed in a breach.',
    hood: ['The browser sends Alex’s identifier and password over TLS. TLS protects transit; it does not make the password safe from a phishing page.', 'The server loads Alex’s stored salt, hashing parameters, and password hash. A salt is a fresh random value for this credential, stored beside its hash—not a second secret.', 'The server runs a slow password hashing function such as Argon2id on the submitted password using Alex’s stored salt and parameters, then compares the result with the stored hash. It does not decrypt a hash.', 'Even if Alex and Priya choose the same password, their different salts produce different stored hashes. This prevents identical hashes from revealing shared passwords and defeats reusable precomputed hash tables.'],
    security: ['A salt does not make a weak password strong. An attacker with the database can still guess candidate passwords against each salted hash.', 'Use unique salts, a slow password hashing function, rate limits, breach-password checks, and careful recovery design.', 'Never log or store the plaintext password. TLS protects the journey to the server, while hashing protects stored credentials.'],
    details: ['Credential type: shared secret', 'Phishing resistance: low', 'Credential reuse risk: high'],
  },
  {
    id: 'sessions', number: '02', group: 'Foundations', title: 'Server-side Sessions', short: 'Sessions', eyebrow: 'Remembering Alex',
    summary: 'An opaque browser cookie points to state held by Boo Corp’s server.',
    problem: 'Alex should not send a password on every request.', introduced: 'An opaque session ID in a cookie and state in a server-side store.', improved: 'The server can recognize and centrally revoke a signed-in browser.', tradeoff: 'The session store needs availability, expiry, and cross-site request protection.',
    hood: ['After login, the server creates session state and sets a cookie containing only an opaque ID.', 'For each request, the browser sends the cookie and the server looks up Alex’s session.', 'HttpOnly limits JavaScript access; Secure limits transmission to HTTPS; SameSite helps reduce cross-site requests.'],
    security: ['The browser has an identifier, not Alex’s password or the full session record.', 'A stolen session cookie can still be abused until expiration or revocation.', 'Session IDs need enough entropy, rotation at key moments, and server-side invalidation.'],
    details: ['Browser: opaque session ID', 'Server: user and expiry', 'Revocation: delete server record'],
  },
  {
    id: 'mfa', number: '03', group: 'Strong authentication', title: 'TOTP MFA', short: 'TOTP MFA', eyebrow: 'A second factor',
    summary: 'Alex uses a Time-based One-Time Password (TOTP) after the password.',
    problem: 'A stolen password alone can unlock an account.', introduced: 'A time-based one-time code generated from a shared enrollment secret.', improved: 'An attacker needs more than Alex’s password.', tradeoff: 'Enrollment, recovery, clock drift, and real-time phishing remain concerns.',
    hood: ['Enrollment places a shared secret in Alex’s authenticator and Boo Identity. The QR pattern in this lab is only illustrative.', 'Both sides independently compute a moving counter from the current time, often floor(Unix time / 30 seconds).', 'TOTP applies an HMAC operation to the shared secret and counter, then dynamically truncates the result to a short numeric code. The demo does not run this cryptography.', 'At sign-in, Boo Identity checks the entered code against its own calculation, usually allowing a small adjacent time window for clock drift. Only after password and code succeed is sign-in complete.'],
    security: ['A stolen password alone is insufficient, because the attacker also needs a current code from Alex’s authenticator.', 'Protect the enrollment secret and recovery codes. Anyone with the secret can generate future codes.', 'A real-time phishing proxy can relay a live TOTP code, so TOTP is not phishing-resistant.'],
    details: ['Factor: possession of a shared secret', 'Typical code: six digits', 'Recovery codes: separate fallback'],
  },
  {
    id: 'jwt', number: '04', group: 'Tokens', title: 'JWT Access Tokens', short: 'JWT', eyebrow: 'API access',
    summary: 'A signed access token lets an API validate claims without a session-store lookup on every request.',
    problem: 'Distributed APIs need a portable way to verify access.', introduced: 'A signed, structured access token; JWT is one possible format.', improved: 'APIs can validate issuer, audience, expiry, and permissions locally.', tradeoff: 'Revocation, key rotation, storage, and refresh flows become important.',
    hood: ['An access token may be opaque or structured. JWT is one structured token format, not an authentication method.', 'The header names the algorithm and key ID. The payload carries claims. Both JSON objects are base64url-encoded and joined with a dot; encoding is not encryption.', 'For RS256, the issuer signs the exact encoded header.payload bytes using its private key. The result forms the third JWT segment: the signature.', 'The API selects the issuer’s public key using the key ID and verifies the signature over the original two segments. It then checks issuer, audience, expiry, and required scope.', 'A short-lived access token goes to an API. A refresh token goes only to the authorization server to request replacement tokens and needs stronger storage and rotation controls.'],
    security: ['Never place secrets in a JWT payload: anyone holding it can decode its claims.', 'Changing a claim changes the signed input. The unchanged signature fails before the API trusts the new role.', 'A valid signature is necessary but not sufficient: issuer, audience, expiry, and permission checks must also pass.'],
    details: ['401: token invalid or absent', '403: known identity, insufficient permission', 'Short expiry limits exposure'],
  },
  {
    id: 'oauth', number: '05', group: 'Federation', title: 'OAuth 2.0', short: 'OAuth 2.0', eyebrow: 'Delegated access',
    summary: 'Follow the full browser-to-backend flow: OAuth grants API access, OIDC confirms who signed in, and Expense Portal creates its own session.',
    problem: 'Expense Portal needs to read Alex’s data from Expense API. The API needs to know which operations Alex has allowed the portal to perform.', introduced: 'A delegated authorization code flow, PKCE, and a scoped access token.', improved: 'The client gets limited API access without handling the user’s password.', tradeoff: 'Redirect, consent, client, scope, state, and token handling need care.',
    hood: ['Expense Portal sends Alex to Boo Identity with an authorization request. State links the callback to this browser; PKCE protects the one-time code; OIDC adds a nonce and asks for an ID token.', 'After Alex signs in and authorizes access, the browser returns with a code. Expense Portal checks state, then its backend exchanges the code with the PKCE verifier for separate access and ID tokens.', 'Expense Portal validates the ID token and starts its own app session. Its access token goes to the API. Optional UserInfo and refresh requests, then logout or revocation, have separate checks and lifetimes.'],
    security: ['Exact registered redirect URIs help keep authorization codes away from unintended destinations. State binds the callback to this browser transaction.', 'PKCE binds the code to the original verifier: S256 means BASE64URL(SHA256(code_verifier)). A stolen code alone is insufficient to redeem it.', 'Browser redirects carry the code; the backend exchanges it for tokens over a separate HTTPS request. Client secrets and PKCE verifiers stay off the authorization redirect.', 'An optional refresh token renews access at Boo Identity. Its lifecycle and revocation are separate from an application session.'],
    details: ['Browser: redirect and one-time code', 'Backend: state check and PKCE token exchange', 'API: access-token validation and scope check'],
  },
  {
    id: 'oidc', number: '06', group: 'Federation', title: 'OpenID Connect + SSO', short: 'OIDC / SSO', eyebrow: 'Shared identity',
    summary: 'Boo Identity authenticates Alex as the identity provider; each application relies on that result.',
    problem: 'Expense Portal and HR Portal need to know who signed in at Boo Identity. An OAuth access token is meant for an API, not as a login assertion for either app.', introduced: 'An identity layer over OAuth 2.0: an OpenID Provider, relying parties, and an ID token.', improved: 'Apps can rely on Boo Identity; its session can enable SSO.', tradeoff: 'Trust configuration, token validation, logout, and IdP availability matter.',
    hood: ['Boo Identity is the OpenID Provider (OP): it authenticates Alex. Expense Portal and HR Portal are Relying Parties (RPs) that depend on its identity result.', 'Each RP validates an ID token intended for itself, then maps the verified identity to a local user and creates its own app session. An access token instead goes to an authorized API.', 'Boo Identity’s session can let Alex open another RP without entering credentials again. That app still receives its own ID token and creates its own session.'],
    security: ['Each RP validates its own ID token; an ID token issued for Expense Portal is not a login assertion for HR Portal.', 'State, PKCE, and nonce protect different boundaries: the callback transaction, code redemption, and the ID token’s link to the sign-in request.', 'The OP session, each RP’s local session, access tokens, and optional refresh tokens expire or are revoked independently.'],
    details: ['OP / IdP: authenticates Alex and issues ID tokens', 'RP: validates its own ID token and creates a local session', 'Access token → API; ID token → RP; app cookie → app'],
  },
  {
    id: 'passkeys', number: '07', group: 'Passwordless', title: 'WebAuthn + Passkeys', short: 'Passkeys', eyebrow: 'Phishing-resistant sign-in',
    summary: 'Alex’s authenticator signs a Boo Identity challenge with an origin-bound private key.',
    problem: 'Passwords and live TOTP codes can be phished.', introduced: 'A public-key credential bound to the relying party.', improved: 'No reusable password is shared; authentication resists phishing.', tradeoff: 'Recovery, device access, platform support, and user education need design.',
    hood: ['Boo Identity creates a fresh challenge; the browser checks its origin and asks the authenticator to sign.', 'The authenticator protects the private key and may require biometric or PIN user verification.', 'Boo Identity verifies the signed response using the stored public key.'],
    security: ['The private key stays with the authenticator; the server stores a public key.', 'The credential is scoped to the legitimate relying party, which is why a lookalike origin cannot use it.', 'A passkey can authenticate Alex to Boo Identity; OIDC can then carry that identity to an application.'],
    details: ['Private key: authenticator', 'Public key: Boo Identity', 'Proof: signed challenge'],
  },
  {
    id: 'authorization', number: '08', group: 'Access control', title: 'Roles + Permissions', short: 'Authorization', eyebrow: 'Beyond sign-in',
    summary: 'After Alex is identified, policy decides which actions are allowed.',
    problem: 'A signed-in user should not automatically access every resource.', introduced: 'Roles, scopes, permissions, and policy checks.', improved: 'Access can be limited to the work a person or client needs.', tradeoff: 'Policies need clear ownership, review, and consistent enforcement.',
    hood: ['Identity claims such as sub and email describe the subject.', 'Authorization data such as roles and scopes contributes to a policy decision.', 'The API enforces a permission check for each protected operation.'],
    security: ['Authentication asks who Alex is; authorization asks what Alex may do.', 'A valid token with insufficient scope should yield 403 Forbidden.', 'Role changes may not affect already-issued tokens until expiry or a separate revocation mechanism acts.'],
    details: ['Employee: expenses:read', 'Manager: approve and report', 'Administrator: users:manage'],
  },
  {
    id: 'operations', number: '09', group: 'Operations', title: 'Audit + Recovery', short: 'Operations', eyebrow: 'Operating identity',
    summary: 'Identity systems need evidence, revocation, recovery, and lifecycle management.',
    problem: 'A successful login is only one moment in an ongoing identity lifecycle.', introduced: 'Audit events, session revocation, token rotation, and recovery paths.', improved: 'Teams can investigate changes and contain compromised access.', tradeoff: 'Logs contain sensitive context, and recovery can become an attacker’s easiest route.',
    hood: ['Record meaningful events with subject, app, result, method, and metadata.', 'Revocation removes active server session state; short-lived access tokens naturally expire.', 'Refresh-token rotation can detect suspicious reuse and revoke a token family.'],
    security: ['Audit logs need access controls, retention rules, and integrity protections.', 'A recovery process needs safeguards at least as strong as the sign-in path.', 'This lab’s audit events are local demo state and reset on refresh.'],
    details: ['Observe: audit events', 'Contain: revoke and expire', 'Recover: verified fallback'],
  },
]

export const stageById = Object.fromEntries(stages.map(stage => [stage.id, stage])) as Record<StageId, Stage>
