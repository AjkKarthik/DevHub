import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'OAuth 2.0',         type: 'keyword', desc: 'Authorization framework — grants third-party apps limited access to a resource without sharing credentials.' },
  { name: 'OIDC',              type: 'keyword', desc: 'OpenID Connect — identity layer on top of OAuth 2.0; adds ID token with user claims.' },
  { name: 'Auth Code + PKCE',  type: 'keyword', desc: 'The correct flow for SPAs and mobile apps — replaces implicit flow, prevents code interception.' },
  { name: 'Access Token',      type: 'keyword', desc: 'Short-lived credential (15 min) for accessing APIs — sent in Authorization Bearer header.' },
  { name: 'Refresh Token',     type: 'keyword', desc: 'Long-lived token used to obtain new access tokens without re-authenticating.' },
  { name: 'PKCE',              type: 'keyword', desc: 'Proof Key for Code Exchange — code verifier/challenge pair that binds the auth code to the client.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'OAuth 2.0 — What It Is and Is Not',
    points: [
      'OAuth 2.0 is an authorisation framework — it grants third-party applications limited access to a user\'s resources without the user sharing their password.',
      'OAuth 2.0 is NOT an authentication protocol — it does not define how to verify user identity. That is OIDC\'s job.',
      'Classic use case: "Sign in with Google" — your app never sees the Google password; Google issues a token scoped to what your app needs.',
      'Key parties: Resource Owner (user), Client (your app), Authorization Server (Google/Azure/Okta), Resource Server (the API serving protected data).',
    ],
  },
  {
    heading: 'Authorization Code Flow with PKCE',
    points: [
      'PKCE (Proof Key for Code Exchange) is the recommended flow for all public clients (SPAs, mobile apps, CLIs).',
      'Step 1: Client generates a random `code_verifier`, hashes it to get `code_challenge`, redirects user to AS with `code_challenge`.',
      'Step 2: User authenticates and authorises; AS redirects back with an `authorization_code`.',
      'Step 3: Client exchanges code + original `code_verifier` (not hashed) for tokens — AS verifies the hash matches.',
      'PKCE prevents code interception attacks: even if the code is stolen, it is useless without the `code_verifier` the client never sends until the token exchange.',
    ],
  },
  {
    heading: 'OpenID Connect (OIDC)',
    points: [
      'OIDC = OAuth 2.0 + an ID token. The ID token is a JWT containing claims about the authenticated user (sub, email, name).',
      'ID token is for the client to know who the user is. Access token is for calling APIs. Do not use the access token for identity.',
      'OIDC adds a UserInfo endpoint and standardised claims (sub, email, phone, address).',
      'The `sub` (subject) claim is the stable unique identifier for the user — use this as the user\'s ID, not email (emails change).',
    ],
  },
  {
    heading: 'Tokens — Access, Refresh, ID',
    points: [
      'Access token: short-lived (5–15 min), sent with every API request in `Authorization: Bearer <token>`. Compromise is time-limited.',
      'Refresh token: longer-lived (days/weeks), used only to obtain a new access token. Rotate on every use (refresh token rotation).',
      'ID token: contains user identity claims; only for the client to read — never sent to APIs.',
      'Store access tokens in memory (not localStorage); store refresh tokens in httpOnly cookies to prevent XSS theft.',
    ],
  },
  {
    heading: 'Security Considerations',
    points: [
      'Never use the implicit flow (token in URL fragment) for new applications — it leaks tokens to browser history and referrer headers.',
      'Validate the ID token: check `iss` (issuer), `aud` (audience), `exp` (expiry), and signature before trusting any claims.',
      'State parameter: include a random `state` value in the auth request; verify it on redirect to prevent CSRF attacks on the OAuth flow.',
      'Nonce: include a random `nonce` in the auth request; verify it in the ID token to prevent replay attacks.',
      'Scope minimisation: request only the scopes your app needs — `openid profile email`, not `openid profile email phone address admin`.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Auth Code + PKCE Flow',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── Step 1: Generate PKCE pair and redirect to authorization server ──────────
function generatePkce() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

function buildAuthUrl(config: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  state: string;
}) {
  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             config.clientId,
    redirect_uri:          config.redirectUri,
    scope:                 config.scope,
    code_challenge:        config.codeChallenge,
    code_challenge_method: 'S256',
    state:                 config.state,  // CSRF protection
    nonce:                 crypto.randomBytes(16).toString('hex'), // replay protection
  });
  return \`\${config.authorizationEndpoint}?\${params}\`;
}

// ── Step 2: Handle redirect callback ────────────────────────────────────────
async function handleCallback(code: string, state: string, storedState: string, codeVerifier: string) {
  // Verify state matches to prevent CSRF
  if (state !== storedState) throw new Error('State mismatch — possible CSRF');

  // Exchange code for tokens
  const tokenRes = await fetch('https://auth.example.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  'https://app.example.com/callback',
      client_id:     'my-client-id',
      code_verifier: codeVerifier, // proves we made the original request
    }),
  });

  const { access_token, refresh_token, id_token } = await tokenRes.json();
  return { access_token, refresh_token, id_token };
}`,
  },
  {
    label: 'Token Validation (OIDC)',
    language: 'typescript',
    code: `import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// ── Validate ID token from OIDC provider ────────────────────────────────────
const client = jwksClient({
  jwksUri: 'https://auth.example.com/.well-known/jwks.json',
});

async function validateIdToken(idToken: string, expectedNonce: string): Promise<Record<string, unknown>> {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded) throw new Error('Invalid token format');

  const key = await client.getSigningKey(decoded.header.kid);
  const publicKey = key.getPublicKey();

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    issuer: 'https://auth.example.com',    // must match iss claim
    audience: 'my-client-id',              // must match aud claim
  }) as Record<string, unknown>;

  // Additional OIDC checks
  if (payload['nonce'] !== expectedNonce) throw new Error('Nonce mismatch — replay attack');
  if (typeof payload['sub'] !== 'string') throw new Error('Missing sub claim');

  return payload; // { sub, email, name, iat, exp, ... }
}

// ── Use sub as user identifier — not email ──────────────────────────────────
const user = await validateIdToken(idToken, sessionNonce);
const userId = user['sub'] as string; // stable, unique — email could change`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using the implicit flow for SPAs',
    wrong: `// response_type=token — access token returned directly in URL fragment
// https://app.com/callback#access_token=eyJ...`,
    right: `// Use Authorization Code + PKCE — token never appears in URL
// response_type=code&code_challenge=...&code_challenge_method=S256`,
    explanation: 'The implicit flow returns the access token in the URL fragment, which ends up in browser history, referrer headers, and server logs. Auth Code + PKCE delivers tokens only via a secure back-channel token endpoint response.',
  },
  {
    title: 'Using the access token for identity (treating it as an ID token)',
    wrong: `// Decode access token to get user info
const user = jwt.decode(accessToken); // DO NOT do this`,
    right: `// Use the ID token for identity; call UserInfo endpoint if more claims needed
const userInfo = await validateIdToken(idToken, nonce);
const userId = userInfo.sub;`,
    explanation: 'The access token\'s format and contents are implementation details of the authorization server — not guaranteed to be a JWT or to contain user claims. The ID token is specifically defined by OIDC to carry user identity claims.',
  },
  {
    title: 'Not validating the state parameter on callback',
    wrong: `// Accept any callback without checking state
app.get('/callback', async (req, res) => {
  const { code } = req.query; // skip state validation
});`,
    right: `app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (state !== session.oauthState) return res.status(400).send('State mismatch');
  // proceed with code exchange
});`,
    explanation: 'The state parameter prevents CSRF on the OAuth callback. Without it, an attacker can trick a user\'s browser into completing an auth flow that logs them into the attacker\'s account (account binding attack).',
  },
  {
    title: 'Storing tokens in localStorage',
    wrong: `localStorage.setItem('access_token', token); // accessible to any JS on the page`,
    right: `// Access token: in-memory variable (lost on page refresh — use refresh token)
// Refresh token: httpOnly cookie (inaccessible to JS)`,
    explanation: 'localStorage is accessible to any JavaScript on the page — XSS vulnerabilities can steal all tokens. Store access tokens in memory; use httpOnly Secure SameSite=Strict cookies for refresh tokens.',
  },
];

const challenge: Challenge = {
  title: 'PKCE Code Verifier Generator',
  language: 'typescript',
  description: `Implement generatePkce(): { codeVerifier: string; codeChallenge: string } that:
1. Generates a random 32-byte base64url-encoded codeVerifier
2. SHA-256 hashes the codeVerifier and base64url-encodes it as codeChallenge
3. base64url encoding uses A-Za-z0-9-_ with no padding (replace +→-, /→_, strip =)`,
  hints: [
    'Use Math.random() to simulate random bytes for this exercise',
    'For SHA-256, iterate the string chars and sum char codes (simplified)',
    'base64url: no + / = characters',
  ],
  starterCode: `function base64url(input: string): string {
  return btoa(input).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  // Generate 32 random bytes as base64url string
  const bytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
  const codeVerifier = base64url(String.fromCharCode(...bytes));

  // TODO: create codeChallenge (simplified SHA-256 simulation for this exercise:
  // sum all char codes, convert to hex string, then base64url encode)
  return { codeVerifier, codeChallenge: '' };
}`,
  solution: `function base64url(input: string): string {
  return btoa(input).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
}

function simpleSha256(input: string): string {
  // Simplified simulation (real code uses crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').repeat(8); // 64 hex chars
}

function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const bytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
  const codeVerifier = base64url(String.fromCharCode(...bytes));
  const hashHex = simpleSha256(codeVerifier);
  const codeChallenge = base64url(hashHex);
  return { codeVerifier, codeChallenge };
}

const { codeVerifier, codeChallenge } = generatePkce();
console.log('verifier:', codeVerifier);
console.log('challenge:', codeChallenge);
console.log('no padding:', !codeChallenge.includes('='));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does PKCE protect against in the Authorization Code flow?',
    options: [
      'Token theft via XSS',
      'Authorization code interception — attacker who intercepts the code cannot exchange it without the code_verifier',
      'CSRF on the OAuth callback',
      'Brute force on the client secret',
    ],
    answer: 1,
    explanation: 'PKCE binds the authorization code to the client that initiated the flow via a code_verifier/code_challenge pair. An attacker who intercepts the authorization code cannot exchange it for tokens because they do not have the original code_verifier.',
  },
  {
    q: 'What is the key difference between OAuth 2.0 and OIDC?',
    options: [
      'OAuth 2.0 is newer; OIDC is the legacy version',
      'OAuth 2.0 handles authorisation (access to resources); OIDC adds authentication (identity) via an ID token',
      'OIDC uses JWT; OAuth 2.0 uses opaque tokens',
      'OAuth 2.0 is for mobile apps; OIDC is for web apps',
    ],
    answer: 1,
    explanation: 'OAuth 2.0 is an authorisation protocol — it defines how to delegate access to resources. OIDC is an identity layer built on top — it adds the ID token (a JWT with user identity claims) and the UserInfo endpoint. Together they handle both "what can this app access?" and "who is the user?"',
  },
  { q: 'What is the OAuth 2.0 state parameter and what attack does it prevent?', options: ['A server-side cache key for storing authorization request details', 'A random nonce sent in the authorization request and verified in the callback, preventing CSRF attacks against the OAuth flow', 'A parameter indicating the desired resource server for multi-tenant OAuth', 'A session identifier that links the authorization code to the user session'], answer: 1, explanation: 'OAuth state parameter: a random value the client includes in the authorization request URL. After authentication, the IdP appends the same state value to the callback URL. The client verifies the returned state matches what was sent. Prevents CSRF against OAuth: without state, an attacker could initiate an OAuth flow, capture the authorization code callback URL, and trick a victim browser into completing the flow by clicking a crafted link. With state validation, the victim state does not match the attacker state, so the callback is rejected. Implementation: generate state = secureRandom().hex(16). Store state in the user session. On callback: if returned state != session state, reject the callback.' },
  { q: 'What is the PKCE (Proof Key for Code Exchange) extension and why is it required for public clients?', options: ['A signature scheme that proves the client credentials are valid', 'A challenge-verifier pair sent with the authorization request; the code verifier is sent at token exchange, proving that the party redeeming the code is the same party that initiated the flow', 'A rate limiting mechanism for public OAuth clients to prevent code replay attacks', 'A key exchange used to derive the client secret for public clients dynamically'], answer: 1, explanation: 'PKCE prevents authorization code interception attacks for public clients (mobile apps, SPAs) that cannot securely store a client secret. Flow: generate code_verifier = secureRandom(). code_challenge = BASE64URL(SHA256(code_verifier)). Send code_challenge and code_challenge_method=S256 in the authorization request. At code exchange: send code_verifier. The server computes SHA256(code_verifier) and verifies it matches code_challenge. Prevents attack: if an attacker intercepts the authorization code, they cannot exchange it without the code_verifier (only the legitimate client knows it). PKCE is mandatory for all public clients (OAuth 2.1 spec) and recommended even for confidential clients.' },
  { q: 'If an application only requests OAuth 2.0 scopes (no "openid" scope) and receives only an access token, can it safely treat successful token issuance as proof of "who the user is"?', options: ['Yes — receiving any valid access token proves the user\'s identity', 'No — a plain OAuth 2.0 access token proves the app was GRANTED some permission on the user\'s behalf, but says nothing verifiable about identity; without the "openid" scope and the resulting signed ID token, the app has no cryptographically verifiable claim about who the user actually is', 'Only if the access token is a JWT, regardless of scopes requested', 'Access tokens and ID tokens are functionally identical in all OAuth 2.0 flows'], answer: 1, explanation: 'This is a classic OAuth-used-for-authentication anti-pattern: successfully obtaining an access token only proves the authorization server granted SOME permission — it was never designed to assert identity, and treating "I got a token back" as "I know who this user is" opens the door to token substitution attacks (a token meant for a different API/audience being replayed as if it proved identity). OIDC\'s ID token exists specifically to close this gap: it is a signed JWT with an "aud" (audience) claim your app can verify was issued specifically for it, plus standardized identity claims (sub, email) — this is why authentication should always use OIDC\'s ID token, never inferred from OAuth access token possession alone.' },
  { q: 'What is the OAuth 2.0 implicit flow and why is it deprecated?', options: ['A flow for server-side applications without a redirect URI requirement', 'A flow that returned access tokens directly in the URL fragment, exposing tokens in browser history, referrer headers, and server logs; replaced by the authorization code flow with PKCE', 'A simplified token exchange for trusted first-party applications', 'A flow for mobile applications that cannot handle server-side redirects'], answer: 1, explanation: 'OAuth 2.0 implicit flow: the access token is returned directly in the redirect URL fragment (#access_token=...) instead of via a code exchange. Designed for JavaScript SPAs that could not do server-side code exchange. Security problems: the access token appears in the browser URL, which is stored in browser history, logged by servers, and sent in Referer headers to third-party resources. No code binding: tokens could be replayed from browser history or logs. No refresh tokens (unsafe to store long-lived tokens in browser). Deprecated in OAuth 2.1: use the authorization code flow + PKCE for SPAs and mobile apps. All modern auth libraries support PKCE for public clients.' },
];

const qna: QnaItem[] = [
  {
    q: 'Why should access tokens be short-lived and refresh tokens long-lived?',
    a: 'Access tokens travel with every API request and can be stolen (via log files, XSS, network interception). Short expiry (5–15 min) limits the window of exploitation. Refresh tokens are used only once at the token endpoint over TLS — less exposure. Refresh token rotation (issue a new refresh token on each use) further limits theft: if a stolen refresh token is used, the legitimate client\'s next refresh fails, signalling a breach.',
  },
  {
    q: 'What is the difference between the scope and the claims in OIDC?',
    a: '<strong>Scope</strong> controls what information the authorization server may include in tokens and what endpoints the app can access. Common OIDC scopes: <code>openid</code> (required — enables OIDC), <code>profile</code> (name, picture), <code>email</code>. <strong>Claims</strong> are the actual key-value pairs inside the ID token or returned from the UserInfo endpoint: <code>sub</code>, <code>email</code>, <code>name</code>, <code>phone_number</code>. Requesting a scope grants access to the corresponding claims.',
  },
  { q: 'What is token introspection and how does it differ from JWT validation?', a: 'JWT validation: the resource server validates the token locally by verifying the signature with the IdP public key and checking standard claims. No network call needed per request. Fast but the server cannot know if the token was revoked since issuance. Token introspection (RFC 7662): the resource server calls the IdP introspection endpoint: POST /introspect with the token. The IdP responds with active: true/false plus current claims. The IdP can indicate revoked tokens as active: false. Network call per request adds latency but provides real-time revocation status. Hybrid approach: validate JWT locally (fast). Periodically introspect or check a local revocation list (handle revocation without per-request latency). Short token lifetime (15 min) reduces the window during which a revoked token is still locally valid.' },
  { q: 'What is the OAuth 2.0 device authorization grant and when is it used?', a: 'Device authorization grant (RFC 8628): for devices with limited input (smart TVs, CLI tools, IoT devices) that cannot easily open a browser or enter a complex URL. Flow: device requests a device code from the authorization server. The authorization server returns: device_code (device polls with this). user_code (human-readable code, e.g., XKCD-1234). verification_uri (where the user goes on another device). Device displays: go to example.com/device and enter XKCD-1234. User opens the URL on their phone or computer, signs in, and enters the code. Device polls the token endpoint until the user approves. Once approved, the device receives an access token. Security: device codes expire (5-10 minutes). Brute-force protection on user_code entry. The user sees what device and scope they are approving.' },
  { q: 'How should you implement OAuth 2.0 scopes for fine-grained API authorization?', a: 'Scopes define the specific access being requested. Scope design principles: use resource:action format: orders:read, orders:write, users:admin. Request the minimum scope needed for the current operation (least privilege). Separate high-risk scopes: admin scope should be separate from user scope and require explicit approval. Scope categories: read scopes (low risk, may have longer token TTL). Write scopes (higher risk, shorter TTL, may require step-up auth). Admin scopes (highest risk, require separate approval flow, very short TTL or step-up per operation). Implementation: validate that the access token has the required scope for each API endpoint. Return HTTP 403 with WWW-Authenticate specifying the required scope if insufficient. Document scopes in API documentation with clear descriptions of what each scope allows.' },
  { q: 'What is a confidential client vs a public client in OAuth 2.0?', a: 'Confidential client: can securely store a client secret. Server-side web applications: the client secret is stored on the server, inaccessible to end users. Registered with the IdP with a client ID and client secret. Must authenticate to the token endpoint with the secret. Examples: a traditional MVC web application, a backend API. Public client: cannot securely store a client secret. Any secret embedded in the client is accessible to users (browser JavaScript, mobile app decompilation). Examples: SPAs (JavaScript in the browser), mobile apps. Must use PKCE instead of client secrets. Cannot use client credentials flow. Registered with IdP as public client type. Implications: public clients have a smaller set of permitted grant types. The authorization server should apply stricter policies (shorter token lifetimes, require PKCE, restrict refresh token issuance).' },
];

const revision: RevisionSummary = {
  oneLiner: 'OAuth 2.0 delegates resource access; OIDC adds identity — use Auth Code + PKCE for all clients, short-lived access tokens, and httpOnly cookies for refresh tokens.',
  mustKnow: [
    'OAuth 2.0 = authorisation; OIDC = authentication (identity layer on top)',
    'Auth Code + PKCE: correct flow for all public clients (SPAs, mobile) — never implicit flow',
    'Access token: 5–15 min; Refresh token: days/weeks with rotation on each use',
    'State parameter: prevents CSRF on callback; nonce: prevents replay attacks on ID token',
    'Use sub (not email) as stable user identifier',
    'Store access tokens in memory; refresh tokens in httpOnly Secure cookies',
  ],
  interviewFocus: [
    'How does PKCE prevent authorization code interception?',
    'What is the difference between an access token and an ID token?',
    'Why is the implicit flow insecure for SPAs?',
  ],
};

@Component({
  selector: 'app-sec-oauth-oidc',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './oauth-oidc.html',
  styleUrl: './oauth-oidc.scss',
})
export class SecOauthOidc {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
