import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Authentication': 'authn', 'Authorisation': 'authz',
  'Web Security': 'web', 'Network & Infra': 'infra', 'Cryptography': 'crypto', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Authentication', 'Authorisation', 'Web Security', 'Network & Infra', 'Cryptography', 'Reference'];

const ALL_TOPICS: Topic[] = [
  // Foundations
  { title: 'Security Fundamentals',     route: '/security', badge: 'Foundations', available: false,
    description: 'CIA triad, defence-in-depth, least privilege, zero trust, and the security mindset every developer needs.',
    keyPoints: ['CIA: Confidentiality, Integrity, Availability', 'Defence-in-depth: multiple independent security controls', 'Zero trust: never trust, always verify — even internal traffic'] },
  { title: 'OWASP Top 10',              route: '/security', badge: 'Foundations', available: false,
    description: 'The ten most critical web application security risks — with attack examples and mitigation code.',
    keyPoints: ['A01 Broken Access Control — most critical since 2021', 'A03 Injection: SQL, OS, LDAP — parameterised queries always', 'A07 Identification & Authentication Failures — multi-factor everywhere'] },
  { title: 'Threat Modelling',          route: '/security', badge: 'Foundations', available: false,
    description: 'STRIDE methodology, attack trees, data flow diagrams — build security in from the design stage.',
    keyPoints: ['STRIDE: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation', 'DFD: map trust boundaries, identify assets worth protecting', 'DREAD scoring: risk prioritisation by damage/reproducibility/exploitability'] },
  { title: 'Secure Coding Practices',   route: '/security', badge: 'Foundations', available: false,
    description: 'Input validation, output encoding, error handling, logging without leaking, and code review for security.',
    keyPoints: ['Never trust input — validate at every trust boundary', 'Fail securely: default-deny, not default-allow', 'Log what happened, not what the data contained'] },

  // Authentication
  { title: 'Password Security',         route: '/security', badge: 'Authentication', available: false,
    description: 'Bcrypt/Argon2 hashing, salting, PBKDF2, credential stuffing prevention, and password policy best practices.',
    keyPoints: ['Argon2id is the current recommended password hash', 'Salt prevents rainbow table attacks — BCrypt auto-generates a unique salt', 'Credential stuffing: rate limit + MFA, never security questions'] },
  { title: 'OAuth 2.0 & OIDC',          route: '/security', badge: 'Authentication', available: false,
    description: 'Authorization Code Flow with PKCE, implicit vs code flow, token types, and refresh token rotation.',
    keyPoints: ['PKCE protects public clients (SPAs, mobile apps) from code interception', 'Access token: short-lived (15 min); refresh token: longer-lived (days)', 'OIDC = OAuth 2.0 + ID token (JWT with user claims)'] },
  { title: 'JWT Deep Dive',             route: '/security', badge: 'Authentication', available: false,
    description: 'Structure, signing algorithms, common vulnerabilities (alg:none, key confusion), and validation rules.',
    keyPoints: ['Header.Payload.Signature — base64url encoded, not encrypted', 'alg:none attack: reject JWTs with no signature', 'Always validate: exp, iss, aud, signature — all four'] },
  { title: 'Multi-Factor Authentication', route: '/security', badge: 'Authentication', available: false,
    description: 'TOTP, FIDO2/WebAuthn, SMS OTP trade-offs, and MFA UX patterns.',
    keyPoints: ['TOTP (Google Authenticator): HMAC-based, time-window, phishable', 'WebAuthn: phishing-resistant, device-bound, no shared secrets', 'SMS OTP: weakest; SIM-swap attacks are a real threat'] },
  { title: 'Single Sign-On (SSO)',       route: '/security', badge: 'Authentication', available: false,
    description: 'SAML 2.0 vs OIDC-based SSO, enterprise identity federation, and service provider trust.',
    keyPoints: ['SAML: XML-based, enterprise IdPs (AD FS, Okta, Azure AD)', 'OIDC SSO: JSON-based, modern; Auth Code Flow + refresh tokens', 'Session management: SLO (single logout) propagation'] },

  // Authorisation
  { title: 'RBAC & ABAC',               route: '/security', badge: 'Authorisation', available: false,
    description: 'Role-Based Access Control, Attribute-Based Access Control, and policy languages like Cedar and OPA.',
    keyPoints: ['RBAC: simple, well-understood; role explosion at scale', 'ABAC: fine-grained (user attributes, resource attributes, environment)', 'OPA (Open Policy Agent): decouple policy from application code'] },
  { title: 'Claims-Based Identity',     route: '/security', badge: 'Authorisation', available: false,
    description: 'JWT claims for authorisation, scope-based APIs, and claim enrichment in the token pipeline.',
    keyPoints: ['scope: coarse-grained API access; custom claims: fine-grained business rules', 'Claim enrichment: enrich access token with DB roles at issue time', '.NET: ClaimsPrincipal; policy-based authorization with IAuthorizationHandler'] },
  { title: 'API Security & OWASP API Top 10', route: '/security', badge: 'Authorisation', available: false,
    description: 'The ten most critical API security risks — broken object-level auth, mass assignment, rate limiting.',
    keyPoints: ['BOLA (Broken Object-Level Auth): check ownership on every object read/write', 'Mass assignment: never bind user input directly to model — whitelist fields', 'Excessive data exposure: return minimum needed, not full entities'] },

  // Web Security
  { title: 'XSS Prevention',            route: '/security', badge: 'Web Security', available: false,
    description: 'Stored, reflected, and DOM XSS — Content Security Policy, output encoding, and sanitisation.',
    keyPoints: ['Output-encode all user-controlled content in HTML context', 'CSP header blocks inline scripts and restricts resource origins', 'DOMPurify for user-generated HTML that must be rendered'] },
  { title: 'CSRF & Clickjacking',       route: '/security', badge: 'Web Security', available: false,
    description: 'Cross-Site Request Forgery prevention — SameSite cookies, CSRF tokens, and X-Frame-Options.',
    keyPoints: ['SameSite=Strict cookies prevent CSRF for same-origin requests', 'Double-submit cookie pattern for stateless CSRF protection', 'X-Frame-Options: DENY; or Content-Security-Policy: frame-ancestors'] },
  { title: 'SQL & NoSQL Injection',      route: '/security', badge: 'Web Security', available: false,
    description: 'Injection fundamentals, parameterised queries, ORM pitfalls, and NoSQL injection in MongoDB.',
    keyPoints: ['Always use parameterised queries or ORM with no raw string concat', 'EF Core uses parameters by default; raw SQL is the risk area', 'MongoDB: $where operator allows JS injection; prefer aggregation pipeline'] },
  { title: 'Security Headers',          route: '/security', badge: 'Web Security', available: false,
    description: 'HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — the full header set.',
    keyPoints: ['HSTS: Strict-Transport-Security forces HTTPS for duration', 'X-Content-Type-Options: nosniff prevents MIME-type confusion attacks', 'Use securityheaders.com to grade your current header set'] },

  // Network & Infra
  { title: 'TLS & HTTPS',               route: '/security', badge: 'Network & Infra', available: false,
    description: 'TLS 1.3, certificate management, HSTS preloading, mTLS, and certificate pinning.',
    keyPoints: ['TLS 1.3 removes weak cipher suites; mandate minimum TLS 1.2', 'Let\'s Encrypt: free, automated certificate rotation via ACME', 'mTLS: both sides present certificates — internal service-to-service auth'] },
  { title: 'Secrets Management',        route: '/security', badge: 'Network & Infra', available: false,
    description: 'Never hardcode secrets — Azure Key Vault, AWS Secrets Manager, Vault by HashiCorp, and secret rotation.',
    keyPoints: ['Never commit secrets to git — use .gitignore + pre-commit hooks', 'Azure Key Vault: managed identity auth; no secret in connection string', 'Secret rotation: auto-rotate DB passwords with zero-downtime dual credentials'] },
  { title: 'Container Security',        route: '/security', badge: 'Network & Infra', available: false,
    description: 'Non-root containers, read-only filesystems, image scanning, pod security standards.',
    keyPoints: ['Run containers as non-root (USER 10001 in Dockerfile)', 'Scan images with Trivy, Grype, or Snyk in CI pipeline', 'Kubernetes PodSecurityAdmission: enforce baseline or restricted profile'] },

  // Cryptography
  { title: 'Symmetric Encryption',      route: '/security', badge: 'Cryptography', available: false,
    description: 'AES-GCM, key management, IV/nonce uniqueness, and the Data Protection API in .NET.',
    keyPoints: ['AES-256-GCM: authenticated encryption — integrity + confidentiality', 'IV must be unique per encryption — never reuse a nonce with same key', '.NET Data Protection API handles key rotation automatically'] },
  { title: 'Asymmetric Cryptography',   route: '/security', badge: 'Cryptography', available: false,
    description: 'RSA, EC keys, digital signatures, certificate chains, and key exchange protocols.',
    keyPoints: ['RSA: encrypt small data or symmetric keys; EC: smaller, faster, same strength', 'Digital signature: sign with private key, verify with public key', 'ECDH key exchange: establish shared secret without transmitting it'] },
  { title: 'Hashing & Integrity',       route: '/security', badge: 'Cryptography', available: false,
    description: 'SHA-256/SHA-3, HMAC, checksum use cases, hash collisions, and length extension attacks.',
    keyPoints: ['SHA-256: one-way, collision-resistant, not suitable for passwords', 'HMAC: keyed hash — proves authenticity + integrity', 'Length extension attack: use HMAC or SHA-3, not SHA-2 directly with secret'] },

  // Reference
  { title: 'Security Cheat Sheet',      route: '/security', badge: 'Reference', available: false,
    description: 'Quick-reference for OWASP controls, security headers, hash algorithm choices, and auth flows.',
    keyPoints: ['OWASP control checklist per category', 'Algorithm recommendation table: which to use, which to avoid', 'Security testing tools: OWASP ZAP, Burp Suite, Semgrep'] },
  { title: 'Security Interview Prep',   route: '/security', badge: 'Reference', available: false,
    description: '40+ security interview questions — fundamentals through secure-by-design system design.',
    keyPoints: ['Entry: OWASP Top 10, SQL injection, XSS, basic auth flows', 'Mid: OAuth 2.0, JWT, CSRF, TLS, secrets management', 'Senior: threat modelling, zero trust, compliance, security architecture'] },
];

@Component({
  selector: 'app-security-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class SecurityHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
