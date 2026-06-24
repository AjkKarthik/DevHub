import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface IQ { q: string; a: string; diff: 'beginner' | 'intermediate' | 'advanced'; topic: string; open?: boolean; }

const ALL: IQ[] = [
  // Auth
  { q: 'What is the difference between authentication and authorization?', a: 'Authentication verifies identity (who you are). Authorization determines what you are allowed to do after identity is confirmed. Auth before authz — you can\'t authorize an unknown party.', diff: 'beginner', topic: 'Auth' },
  { q: 'Why is bcrypt preferred over SHA-256 for password storage?', a: 'SHA-256 is fast — designed for throughput. bcrypt is intentionally slow (configurable work factor) and includes a salt, making brute-force and rainbow-table attacks impractical. Argon2id is the modern choice.', diff: 'beginner', topic: 'Auth' },
  { q: 'What are the risks of storing JWT tokens in localStorage?', a: 'LocalStorage is accessible via JS, making tokens vulnerable to XSS theft. Prefer httpOnly Secure cookies for refresh tokens (JS-inaccessible) and in-memory storage for short-lived access tokens.', diff: 'intermediate', topic: 'Auth' },
  { q: 'Explain the OAuth 2.0 Authorization Code flow with PKCE.', a: 'Client generates code_verifier and SHA-256 code_challenge. Auth request includes challenge. After user consents, server returns code. Token exchange includes code_verifier — server hashes and compares, preventing interception attacks. PKCE makes auth code flow safe for public clients.', diff: 'intermediate', topic: 'Auth' },
  { q: 'What is the "alg:none" JWT vulnerability and how do you prevent it?', a: '"alg:none" tells the JWT library to skip signature verification. An attacker crafts a token with any claims unsigned. Prevention: always specify allowed algorithms explicitly (e.g., RS256) and reject tokens whose alg header doesn\'t match.', diff: 'advanced', topic: 'Auth' },
  { q: 'How does WebAuthn differ from TOTP?', a: 'TOTP generates time-based codes susceptible to phishing (attacker forwards code in real time). WebAuthn uses asymmetric key pairs stored in hardware authenticators; the private key never leaves the device and signatures are origin-bound — completely phishing-resistant.', diff: 'advanced', topic: 'Auth' },

  // Authz
  { q: 'What is IDOR and how do you prevent it?', a: 'Insecure Direct Object Reference — accessing a resource by its ID without ownership check. Prevention: always verify resource.ownerId === req.user.sub server-side on every fetch. Never rely on the frontend to hide links.', diff: 'beginner', topic: 'Authz' },
  { q: 'How does RBAC differ from ABAC?', a: 'RBAC assigns roles to users; permissions map to roles (e.g., admin can delete). ABAC uses policies over attributes of user, resource, and environment (e.g., user.dept === resource.dept AND time === business-hours). ABAC is more expressive but harder to audit.', diff: 'intermediate', topic: 'Authz' },
  { q: 'Why is "check permission in the backend even if the frontend hides it" a security rule?', a: 'Frontend code is controlled by the user — they can modify JS, call APIs directly with fetch(), replay requests from DevTools. Backend is the only trust boundary. Frontend auth is purely UX.', diff: 'beginner', topic: 'Authz' },
  { q: 'How do you prevent privilege escalation in a multi-tenant SaaS?', a: 'Extract tenantId from verified JWT claims (never from request body). Apply tenantId to EVERY database query. Test with two separate tenant accounts and verify tenant A cannot read tenant B\'s data. Automate this check in integration tests.', diff: 'advanced', topic: 'Authz' },

  // Injection
  { q: 'What is SQL injection and how do you prevent it?', a: 'Attacker injects SQL fragments into inputs that are concatenated into queries, allowing data theft, modification, or deletion. Prevention: parameterized queries / prepared statements always. Never build SQL from string concatenation.', diff: 'beginner', topic: 'Injection' },
  { q: 'What is the difference between reflected, stored, and DOM XSS?', a: 'Reflected: payload in URL echoed in response. Stored: payload saved to DB and served to other users. DOM: payload processed entirely in browser JS without server involvement. Stored XSS has the highest impact; DOM XSS is hardest to detect with static analysis.', diff: 'intermediate', topic: 'Injection' },
  { q: 'How do NoSQL injection attacks work?', a: 'MongoDB queries accept objects — sending { "$gt": "" } instead of a string bypasses string equality checks. Prevention: validate and sanitize types with schema validation (Zod) before query execution, rejecting unexpected objects.', diff: 'intermediate', topic: 'Injection' },
  { q: 'What is mass assignment and how do you prevent it?', a: 'Blindly binding all request body fields to a model — attacker adds admin:true. Prevention: explicit allowlist in schema validation (Zod .pick() or strip). Never merge req.body directly into a model.', diff: 'intermediate', topic: 'Injection' },

  // CSRF & Headers
  { q: 'How does SameSite=Strict prevent CSRF?', a: 'Browsers withhold cookies on cross-site requests entirely. An attacker\'s page cannot trigger authenticated POST to your API because the session cookie is never sent with the cross-site request. Requires cookie-based auth — does not protect token-in-header auth.', diff: 'intermediate', topic: 'CSRF' },
  { q: 'What is Content Security Policy and why does nonce-based CSP outperform hash-based?', a: 'CSP restricts what scripts/styles a page may load. Nonce-based CSP adds a random per-request nonce to the header and matching script tags, making injection of new scripts impossible even if the nonce leaks (it changes each request). Hash-based is good for static scripts but breaks on any change.', diff: 'advanced', topic: 'CSRF' },
  { q: 'Name 5 security headers and what each prevents.', a: 'HSTS (downgrade/SSLstrip), CSP (XSS, mixed content), X-Frame-Options/frame-ancestors (clickjacking), X-Content-Type-Options:nosniff (MIME-sniffing attacks), Referrer-Policy (credential leakage in Referer header).', diff: 'beginner', topic: 'Headers' },

  // Cryptography
  { q: 'Why is AES-CBC insecure without authentication?', a: 'CBC mode alone provides confidentiality but not integrity. Padding oracle attacks (BEAST, POODLE) can decrypt ciphertext by probing decryption errors. AES-GCM provides both encryption and authentication in one primitive — always prefer GCM.', diff: 'advanced', topic: 'Crypto' },
  { q: 'What is forward secrecy and why does it matter?', a: 'If the server\'s long-term private key is compromised, past sessions remain undecipherable because ephemeral session keys (ECDHE) were never stored. Without FS, a recorded TLS session can be decrypted years later once the private key leaks.', diff: 'intermediate', topic: 'Crypto' },
  { q: 'What is the difference between hashing and encryption?', a: 'Hashing is one-way — you cannot recover the input. Encryption is reversible with a key. Use hashing for passwords (bcrypt/Argon2) and integrity checks (SHA-256). Use encryption when you need to recover the original (AES-256-GCM). Never encrypt passwords.', diff: 'beginner', topic: 'Crypto' },
  { q: 'What is envelope encryption and why is it used with KMS?', a: 'A Data Encryption Key (DEK) encrypts the data. A Key Encryption Key (KEK) stored in KMS encrypts the DEK. Only the encrypted DEK is stored alongside data. Key rotation only requires re-encrypting the DEK, not re-encrypting all data.', diff: 'advanced', topic: 'Crypto' },

  // Infrastructure
  { q: 'Where should API keys be stored in a production application?', a: 'Environment variables injected at runtime (not hardcoded). For Kubernetes: secrets. For cloud: AWS Secrets Manager / Azure Key Vault / GCP Secret Manager. Never in source code, never in .env files committed to git.', diff: 'beginner', topic: 'Infra' },
  { q: 'How do you harden a Docker container?', a: 'Non-root user (USER 1001), readOnlyRootFilesystem:true, drop ALL capabilities, no privileged mode, distroless/alpine base image, pin image digest (sha256:…), scan with Trivy in CI, fail on HIGH/CRITICAL CVEs.', diff: 'intermediate', topic: 'Infra' },
  { q: 'What is the SolarWinds attack pattern and how do SLSA/SBOM help?', a: 'Attacker compromised the SolarWinds build pipeline to inject malicious code into signed updates. SLSA provides provenance records proving what source/build produced an artifact. SBOM lists every dependency so you can audit for known-malicious packages after a disclosure.', diff: 'advanced', topic: 'Infra' },
  { q: 'What is rate limiting and why is it critical for auth endpoints?', a: 'Rate limiting caps requests per time window per IP/user. Auth endpoints without it are vulnerable to credential stuffing and brute force. Apply strict limits (5–10/min) on /login, /forgot-password, /verify-otp — and exponential back-off after failures.', diff: 'beginner', topic: 'Infra' },
];

@Component({
  selector: 'app-sec-interview-prep',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class SecInterviewPrep {
  topics = ['All', ...Array.from(new Set(ALL.map(q => q.topic)))];
  diffs = ['All', 'beginner', 'intermediate', 'advanced'];

  selectedTopic = signal('All');
  selectedDiff  = signal('All');

  items = ALL.map(q => ({ ...q, open: false }));

  filtered = computed(() => {
    const t = this.selectedTopic();
    const d = this.selectedDiff();
    return this.items.filter(q =>
      (t === 'All' || q.topic === t) &&
      (d === 'All' || q.diff === d)
    );
  });

  setTopic(t: string) { this.selectedTopic.set(t); }
  setDiff(d: string)  { this.selectedDiff.set(d); }
  toggle(q: IQ & { open: boolean }) { q.open = !q.open; }
}
