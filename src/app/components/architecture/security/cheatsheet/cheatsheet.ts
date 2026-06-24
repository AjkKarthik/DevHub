import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface CheatCard { title: string; body: string; }
interface CheatSection { heading: string; cards: CheatCard[]; }

const sections: CheatSection[] = [
  {
    heading: 'Authentication',
    cards: [
      { title: 'Password Hashing', body: 'Argon2id or bcrypt (cost≥12). Never MD5/SHA-1/SHA-256 for passwords.' },
      { title: 'JWT Validation', body: 'Always verify: algorithm (RS256), iss, aud, exp, signature. Never trust alg:none.' },
      { title: 'MFA Factor Strength', body: 'WebAuthn > TOTP app > Push > SMS. Phishing-resistant = WebAuthn only.' },
      { title: 'OAuth PKCE', body: 'Auth Code + PKCE for all public clients. Never implicit flow. State param = CSRF guard.' },
      { title: 'Session Cookies', body: 'HttpOnly + Secure + SameSite=Strict. Short expiry (15–30 min idle).' },
      { title: 'Token Storage', body: 'Access token: memory only. Refresh token: httpOnly Secure cookie. Never localStorage.' },
    ],
  },
  {
    heading: 'Authorization',
    cards: [
      { title: 'RBAC', body: 'Roles → Permissions mapping. Check permission (not role name) in code. Least privilege.' },
      { title: 'ABAC / CASL', body: 'Policy: user.dept === resource.dept AND status === draft. Centralise policy.' },
      { title: 'BOLA / IDOR', body: 'Verify object ownership on EVERY fetch: order.userId === req.user.sub.' },
      { title: 'Multi-Tenant', body: 'Every DB query MUST filter by tenantId from verified token claims.' },
      { title: 'Frontend Auth', body: 'Frontend hides UI — backend ALWAYS re-checks permission on every API call.' },
      { title: 'OAuth Scopes', body: 'Check scope claim on every protected endpoint: scopes.includes(\'read:orders\').' },
    ],
  },
  {
    heading: 'Transport Security',
    cards: [
      { title: 'TLS', body: 'Min TLS 1.2; prefer 1.3. Disable RC4/3DES/MD5. Use ECDHE (forward secrecy).' },
      { title: 'HSTS', body: 'max-age=31536000; includeSubDomains; preload. Prevents SSLstrip.' },
      { title: 'Cert Renewal', body: 'Let\'s Encrypt: 90-day certs. Automate with certbot cron or cert-manager (K8s).' },
      { title: 'mTLS', body: 'Both sides present certs. Service-to-service auth. Istio automates with short-lived certs.' },
      { title: 'Mixed Content', body: 'All resources must be HTTPS on HTTPS pages. Use CSP upgrade-insecure-requests.' },
    ],
  },
  {
    heading: 'Security Headers',
    cards: [
      { title: 'CSP', body: 'default-src \'none\'; script-src \'self\' \'nonce-xxx\'. No unsafe-inline. Report violations.' },
      { title: 'X-Frame-Options', body: 'DENY — prevents clickjacking. Also set CSP frame-ancestors \'none\'.' },
      { title: 'nosniff', body: 'X-Content-Type-Options: nosniff — prevents MIME sniffing attacks.' },
      { title: 'Referrer-Policy', body: 'strict-origin-when-cross-origin. Use no-referrer on password reset / SSO pages.' },
      { title: 'Permissions-Policy', body: 'geolocation=(), camera=(), microphone=() — disable features you don\'t use.' },
    ],
  },
  {
    heading: 'Injection & Input',
    cards: [
      { title: 'SQL Injection', body: 'Parameterized queries ALWAYS. Never string concat SQL. Use $1/$2 placeholders.' },
      { title: 'Command Injection', body: 'Use execFile([cmd, args]) not exec(string). Validate input first.' },
      { title: 'NoSQL Injection', body: 'Validate input types with Zod. Reject objects where strings expected in queries.' },
      { title: 'XSS — Output', body: 'textContent not innerHTML. HTML-encode &<>"\' for server-side templates.' },
      { title: 'XSS — Framework', body: 'Angular {{ }} = safe. [innerHTML] = unsafe. React JSX = safe. dangerouslySetInnerHTML = unsafe.' },
      { title: 'Mass Assignment', body: 'Zod schema allowlist on body. Never bind all request fields to a model.' },
    ],
  },
  {
    heading: 'CSRF & Clickjacking',
    cards: [
      { title: 'CSRF Primary', body: 'SameSite=Strict cookies — browser never sends on cross-site requests.' },
      { title: 'CSRF Token', body: 'Server-issued secret in hidden field, verified on every mutating request.' },
      { title: 'GET Idempotency', body: 'GET must NEVER have side effects — CSRF trivially triggered via <img src>.' },
      { title: 'Clickjacking', body: 'X-Frame-Options: DENY + CSP frame-ancestors \'none\' on all sensitive pages.' },
    ],
  },
  {
    heading: 'Cryptography',
    cards: [
      { title: 'Symmetric Encrypt', body: 'AES-256-GCM. Random 12-byte IV per message. Authenticate before decrypt.' },
      { title: 'Asymmetric Sign', body: 'Ed25519 (preferred) or ECDSA P-256. RSA-PSS for RSA. Never raw RSA.' },
      { title: 'Key Exchange', body: 'ECDH with ephemeral keys. Derives shared secret without transmitting it.' },
      { title: 'Hashing', body: 'SHA-256 for integrity. HMAC-SHA256 for integrity + authenticity. Never MD5/SHA-1.' },
      { title: 'Envelope Encrypt', body: 'DEK encrypts data; KEK (in KMS) encrypts DEK. Cheap rotation; no static credential.' },
      { title: 'Timing-Safe', body: 'crypto.timingSafeEqual() for ALL security-sensitive comparisons. Never ===.' },
    ],
  },
  {
    heading: 'Infrastructure',
    cards: [
      { title: 'Secrets', body: 'Never in git. Load from env vars (dev) → platform secrets (CI) → KMS (prod).' },
      { title: 'Container', body: 'Non-root user. readOnlyRootFilesystem. Drop ALL caps. Distroless/Alpine base.' },
      { title: 'Image Scanning', body: 'Trivy in CI. Fail on HIGH/CRITICAL CVEs. Pin image digest (sha256:...).' },
      { title: 'Supply Chain', body: 'npm ci in CI. npm audit --audit-level=high. Commit lockfile. Verify new packages.' },
      { title: 'API Keys', body: 'Store SHA-256 hash in DB. Prefix for scanner detection. Never log raw keys.' },
      { title: 'Rate Limiting', body: 'Auth endpoints: 5/min. Read: 100/min. Write: 20/min. Per-IP + per-user.' },
    ],
  },
];

@Component({
  selector: 'app-sec-cheatsheet',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class SecCheatsheet {
  sections = sections;
}
