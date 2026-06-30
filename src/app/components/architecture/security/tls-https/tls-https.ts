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
  { name: 'TLS',          type: 'keyword', desc: 'Transport Layer Security — encrypts and authenticates data in transit. TLS 1.3 is current.' },
  { name: 'Certificate',  type: 'keyword', desc: 'X.509 — binds a public key to a domain name, signed by a trusted Certificate Authority.' },
  { name: 'TLS Handshake', type: 'keyword', desc: 'Negotiation phase: cipher suite, certificate exchange, key establishment — before any data.' },
  { name: 'mTLS',         type: 'keyword', desc: 'Mutual TLS — both client AND server present certificates; used for service-to-service auth.' },
  { name: 'OCSP Stapling', type: 'keyword', desc: 'Server caches certificate revocation status — prevents latency of client OCSP lookups.' },
  { name: 'Let\'s Encrypt', type: 'keyword', desc: 'Free, automated, open CA — issues 90-day DV certificates via ACME protocol.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'How TLS Works',
    points: [
      'TLS provides three things: confidentiality (encryption), integrity (tamper detection via MAC), and authentication (verifying server identity via certificate).',
      'TLS 1.3 handshake (simplified): client sends supported cipher suites + key share; server responds with chosen cipher + its key share + certificate; keys are derived; data flows encrypted.',
      'TLS 1.3 vs 1.2: 1.3 removes weak ciphers (RC4, 3DES, MD5), requires forward secrecy, reduces handshake to 1 round-trip (vs 2 in 1.2), and removes vulnerable features (renegotiation, compression).',
      'Minimum: disable TLS 1.0 and 1.1 (POODLE, BEAST attacks). Support TLS 1.2 for compatibility; prefer TLS 1.3.',
    ],
  },
  {
    heading: 'Certificates and Certificate Authorities',
    points: [
      'A certificate binds a public key to a domain name, signed by a CA the browser trusts. The browser verifies the chain: domain cert → intermediate CA → root CA (in the OS/browser trust store).',
      'DV (Domain Validation): CA verifies you control the domain (DNS record or HTTP challenge). Fast, free (Let\'s Encrypt), suitable for most websites.',
      'OV (Organization Validation): CA verifies the organization exists. Shows company name in cert. Used for business sites.',
      'EV (Extended Validation): deprecated — browsers no longer show the green bar or company name. Not worth the cost over DV.',
      'Certificate pinning: hard-coding expected certificates or public keys. High maintenance (breaks on rotation), not recommended for web — only for mobile apps where you control the client.',
    ],
  },
  {
    heading: 'Mutual TLS (mTLS)',
    points: [
      'In standard TLS, only the server presents a certificate. In mTLS, both client and server present certificates — bidirectional authentication.',
      'Use cases: service-to-service authentication in microservices (Istio, Envoy), API clients (partner integrations), zero-trust networking.',
      'The client certificate proves the caller\'s identity at the transport layer — stronger than API keys because it cannot be replicated without the private key.',
      'Management: PKI infrastructure to issue/rotate client certs. Service meshes (Istio) automate this — short-lived certs (24h) with automatic rotation.',
    ],
  },
  {
    heading: 'Common TLS Misconfigurations',
    points: [
      'Mixed content: HTTPS page loading HTTP resources (images, scripts, fonts). Browsers block active mixed content (scripts); passive (images) shows warnings. Use relative URLs or HTTPS for all resources.',
      'Certificate expiry: Let\'s Encrypt certs expire in 90 days. Automate renewal with certbot or cert-manager. Set alerts at 30 and 7 days before expiry.',
      'Weak cipher suites: disable RC4, DES, 3DES, MD5, SHA-1. Use ECDHE for key exchange (provides forward secrecy). Test with SSL Labs.',
      'Wildcard certs: `*.example.com` covers one level of subdomain — not `a.b.example.com`. Use sparingly; compromise exposes all subdomains.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'TLS Config (Node.js HTTPS)',
    language: 'typescript',
    code: `import https from 'https';
import fs from 'fs';
import tls from 'tls';

// ── HTTPS server with TLS 1.3 preference ────────────────────────────────────
const httpsServer = https.createServer({
  key:  fs.readFileSync('./certs/privkey.pem'),
  cert: fs.readFileSync('./certs/fullchain.pem'),

  // Disable old TLS versions
  minVersion: 'TLSv1.2',   // TLSv1.3 preferred; 1.2 for compatibility
  maxVersion: 'TLSv1.3',

  // Strong cipher suites only (forward secrecy, no RC4/3DES)
  ciphers: [
    'TLS_AES_256_GCM_SHA384',       // TLS 1.3
    'TLS_CHACHA20_POLY1305_SHA256', // TLS 1.3
    'TLS_AES_128_GCM_SHA256',       // TLS 1.3
    'ECDHE-ECDSA-AES256-GCM-SHA384', // TLS 1.2 fallback
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
  ].join(':'),

  honorCipherOrder: true, // server picks cipher from the ordered list
}, app);

httpsServer.listen(443);

// ── Redirect HTTP to HTTPS ──────────────────────────────────────────────────
import http from 'http';
http.createServer((req, res) => {
  res.writeHead(301, { Location: \`https://\${req.headers.host}\${req.url}\` });
  res.end();
}).listen(80);`,
  },
  {
    label: 'mTLS (Express)',
    language: 'typescript',
    code: `import https from 'https';
import fs from 'fs';

// ── Mutual TLS: require client certificate ───────────────────────────────────
const mtlsServer = https.createServer({
  key:    fs.readFileSync('./certs/server-key.pem'),
  cert:   fs.readFileSync('./certs/server-cert.pem'),
  ca:     fs.readFileSync('./certs/client-ca.pem'), // CA that signed client certs
  requestCert:     true,  // ask client for cert
  rejectUnauthorized: true, // reject if cert not signed by trusted CA
}, app);

// ── Read client identity from certificate ────────────────────────────────────
app.get('/api/internal/data', (req, res) => {
  const socket = req.socket as tls.TLSSocket;
  const cert = socket.getPeerCertificate();

  if (!cert || !socket.authorized) {
    return res.status(401).json({ error: 'Client certificate required' });
  }

  // Extract service identity from cert
  const clientService = cert.subject.CN; // e.g., "payment-service"
  console.log(\`Authenticated service: \${clientService}\`);

  res.json({ data: 'internal data', requestedBy: clientService });
});

// ── Let's Encrypt auto-renewal with certbot ──────────────────────────────────
// Cron: 0 */12 * * * certbot renew --quiet && systemctl reload nginx
// cert-manager (Kubernetes): automatic ACME cert issuance and rotation`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not redirecting HTTP to HTTPS',
    wrong: `// App serves on both port 80 (HTTP) and 443 (HTTPS) without redirect`,
    right: `// Always redirect HTTP to HTTPS with 301 (permanent)
http.createServer((req, res) => {
  res.writeHead(301, { Location: \`https://\${req.headers.host}\${req.url}\` });
  res.end();
}).listen(80);`,
    explanation: 'Without HTTP→HTTPS redirect, users who type the URL without `https://` connect over plain HTTP — all data (cookies, form submissions) is sent unencrypted. The 301 is permanent — browsers cache it so future visits go directly to HTTPS.',
  },
  {
    title: 'Not automating certificate renewal (Let\'s Encrypt)',
    wrong: `# Manual cert renewal — certificate expires in 90 days, team forgets
certbot certonly --standalone -d example.com`,
    right: `# Automate with cron
echo "0 */12 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -
# Or use cert-manager in Kubernetes (fully automatic)`,
    explanation: 'Let\'s Encrypt certificates expire every 90 days. Manual renewal is error-prone — expired certs cause browser security warnings and break all HTTPS traffic. Automate with certbot\'s `--renew` cron job or cert-manager.',
  },
  {
    title: 'Accepting self-signed certificates in production clients',
    wrong: `// Disabling TLS verification — man-in-the-middle attack possible
const agent = new https.Agent({ rejectUnauthorized: false });
fetch('https://internal-api.example.com', { agent });`,
    right: `// Use a valid cert (Let's Encrypt or internal CA); provide the CA cert
const agent = new https.Agent({ ca: fs.readFileSync('./internal-ca.pem') });
fetch('https://internal-api.example.com', { agent });`,
    explanation: '`rejectUnauthorized: false` completely disables certificate verification — any certificate is accepted, including a man-in-the-middle\'s forged one. Use a valid certificate or provide the internal CA certificate instead.',
  },
  {
    title: 'Mixed content — loading HTTP resources from an HTTPS page',
    wrong: `<!-- HTTP image on HTTPS page — browser warning / blocked -->
<img src="http://cdn.example.com/logo.png">`,
    right: `<!-- Always use HTTPS or protocol-relative URLs -->
<img src="https://cdn.example.com/logo.png">
<!-- Or: -->
<img src="//cdn.example.com/logo.png">`,
    explanation: 'Mixed content compromises the security of an HTTPS page. Browsers block active mixed content (scripts, iframes) and warn on passive (images). Use HTTPS for all resources, or use the `upgrade-insecure-requests` CSP directive.',
  },
];

const challenge: Challenge = {
  title: 'TLS Certificate Validator',
  language: 'typescript',
  description: `Implement validateCertInfo(cert: CertInfo): { valid: boolean; issues: string[] } that checks:
1. notAfter > now (not expired)
2. notBefore <= now (not future-dated)
3. minVersion must be 'TLSv1.2' or 'TLSv1.3'
4. subject.CN must be a non-empty string`,
  hints: [
    'Use new Date() for current time',
    'Array.includes() for version check',
    'Push to issues array for each failure',
  ],
  starterCode: `interface CertInfo {
  subject: { CN: string };
  notBefore: Date;
  notAfter: Date;
  minVersion: string;
}
function validateCertInfo(cert: CertInfo): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  // TODO
  return { valid: issues.length === 0, issues };
}`,
  solution: `interface CertInfo {
  subject: { CN: string };
  notBefore: Date;
  notAfter: Date;
  minVersion: string;
}
function validateCertInfo(cert: CertInfo): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const now = new Date();
  if (cert.notAfter <= now) issues.push('Certificate has expired');
  if (cert.notBefore > now) issues.push('Certificate not yet valid');
  if (!['TLSv1.2', 'TLSv1.3'].includes(cert.minVersion)) issues.push('TLS version must be 1.2+');
  if (!cert.subject.CN) issues.push('Missing Common Name (CN)');
  return { valid: issues.length === 0, issues };
}
const future = new Date(Date.now() + 86400000 * 30);
const past = new Date(Date.now() - 86400000);
console.log(validateCertInfo({ subject: { CN: 'example.com' }, notBefore: past, notAfter: future, minVersion: 'TLSv1.3' }));
// { valid: true, issues: [] }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is forward secrecy (perfect forward secrecy) in TLS?',
    options: [
      'Encrypting data before it leaves the server',
      'Using ephemeral key pairs per session — compromise of long-term keys does not decrypt past sessions',
      'Validating the server certificate before each request',
      'Caching TLS session tickets to reduce handshake latency',
    ],
    answer: 1,
    explanation: 'Forward secrecy uses ephemeral (temporary) key pairs (ECDHE) for each TLS session. The session key is derived from these ephemeral keys and discarded after the session. If the server\'s long-term private key is compromised later, past recorded sessions cannot be decrypted because the ephemeral keys no longer exist.',
  },
  {
    q: 'What is the key difference between TLS 1.3 and TLS 1.2?',
    options: [
      'TLS 1.3 uses symmetric encryption; 1.2 uses asymmetric',
      'TLS 1.3 removes weak ciphers, requires forward secrecy, 1-RTT handshake vs 2-RTT in 1.2',
      'TLS 1.3 is only for HTTP/3; TLS 1.2 for HTTP/1.1 and HTTP/2',
      'TLS 1.3 requires client certificates by default',
    ],
    answer: 1,
    explanation: 'TLS 1.3 removes insecure features: no RSA key exchange (no forward secrecy), no CBC ciphers, no MD5/SHA-1, no renegotiation, no compression. It mandates ECDHE for forward secrecy and reduces the handshake from 2 round-trips to 1, improving latency.',
  },
  { q: 'What cipher suites does TLS 1.3 support and why did it remove so many from TLS 1.2?', options: ['TLS 1.3 keeps all TLS 1.2 suites but marks deprecated ones as optional', 'TLS 1.3 allows only five cipher suites (all using AEAD and forward secrecy), removing weak algorithms, RSA key exchange, and CBC mode that had known vulnerabilities', 'TLS 1.3 only supports ECDHE-RSA suites for compatibility', 'TLS 1.3 removed cipher suite negotiation entirely and uses a fixed algorithm per key size'], answer: 1, explanation: 'TLS 1.3 approved cipher suites: TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256, TLS_AES_128_CCM_SHA256, TLS_AES_128_CCM_8_SHA256. All five use AEAD (Authenticated Encryption with Associated Data) and forward secrecy. Removed in TLS 1.3: RSA key exchange (no forward secrecy — if the server private key is compromised, past traffic can be decrypted). CBC mode (BEAST, POODLE, Lucky13 attacks). RC4 (broken stream cipher). SHA-1 and MD5 in MAC. Export-grade cipher suites (FREAK, LOGJAM attacks). Simplified negotiation reduces attack surface and makes protocol analysis easier.' },
  { q: 'What is certificate transparency and how does it detect mis-issued certificates?', options: ['A protocol that transparently displays certificate validity to end users in the browser UI', 'A public, append-only log of all TLS certificates issued; browsers require certificates to be in the log, enabling detection of unauthorized or misissued certificates', 'A certificate revocation mechanism that makes revocation status transparent in real time', 'A monitoring system that scans for expired certificates before they cause outages'], answer: 1, explanation: 'Certificate Transparency (CT): all publicly trusted TLS certificates must be submitted to at least two public CT logs (Chromium policy requires signed certificate timestamps from at least two logs). CT logs are append-only, cryptographically verifiable Merkle trees. Anyone can monitor CT logs. Domain owners monitor for certificates issued for their domain: if a CA misissues a certificate for your domain (DigiNotar breach, Symantec mis-issuance), it appears in the CT log within hours. Security benefits: rapid detection of mis-issuance. Domain owners can use monitoring services (crt.sh, Google CT API) to be notified of any new certificate. Limits: CT detects after the fact; it does not prevent issuance. Combined with CAA DNS records (specify which CAs can issue for your domain) for prevention.' },
  { q: 'What is OCSP stapling and why is it preferred over traditional OCSP?', options: ['OCSP stapling caches revocation responses in the browser to avoid per-connection OCSP requests', 'The server fetches and caches an OCSP response and staples it to the TLS handshake, so the client receives revocation status without making a separate OCSP request to the CA', 'OCSP stapling pins the certificate to the browser for the duration of the session', 'OCSP stapling allows the client to verify revocation status after the TLS handshake completes'], answer: 1, explanation: 'Traditional OCSP: during TLS handshake, the client makes a separate HTTP request to the CA OCSP responder to check if the server certificate is revoked. Problems: privacy (the CA learns which sites the user visits). Performance (adds latency). Reliability (if the OCSP responder is unavailable, browsers soft-fail and accept the certificate). OCSP stapling: the server periodically fetches a signed OCSP response from the CA and caches it. During the TLS handshake, the server includes the cached OCSP response (stapled). The client verifies the signed OCSP response (no separate request to the CA). Benefits: no privacy leak (CA does not see individual client requests). Better performance (OCSP is fetched once by the server, not per client). Enable in nginx: ssl_stapling on; ssl_stapling_verify on.' },
  { q: 'What is mutual TLS (mTLS) and when is it used for service-to-service authentication?', options: ['TLS where both the client and server exchange certificates; used for authenticating both endpoints in service-to-service communication', 'A double-TLS wrapper where two separate TLS sessions are nested for extra security', 'TLS with mutual session keys derived using two separate DH key exchanges', 'A protocol where two servers mutually validate each other TLS certificates before routing traffic between them'], answer: 0, explanation: 'Standard TLS: the client verifies the server certificate. The server does not verify the client. mTLS: the server also requests a client certificate. The client presents a certificate signed by a trusted CA. The server validates the client certificate. Both endpoints are authenticated. Use cases: service mesh authentication (Istio and Linkerd use mTLS to authenticate all pod-to-pod communication). API client authentication (a partner API requires a client certificate instead of or in addition to an API key). Zero trust networks (every service must present a certificate to communicate). Implementation: each service has a certificate issued by the same internal CA. Service mesh sidecars (Envoy) handle mTLS transparently so application code does not need to be changed. Certificate rotation is automated by the service mesh control plane.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is certificate pinning and when should you use it?',
    a: 'Certificate pinning: the client hard-codes the expected certificate (or its public key hash) and rejects any connection presenting a different cert — even if signed by a trusted CA. <strong>Use case</strong>: mobile apps where you control both client and server — prevents MITM attacks using rogue CA-signed certificates. <strong>Downsides</strong>: cert rotation breaks pinned clients (requires app update); CA compromise + new cert needs emergency app update. <strong>Recommendation</strong>: use public key pinning (not full cert) with a backup pin; set a pin expiry; only pin on mobile/native clients. Do NOT pin in web browsers — the browser\'s CA trust store is the mechanism there.',
  },
  {
    q: 'How do you handle TLS in a service mesh like Istio?',
    a: 'Istio sidecars (Envoy proxies) handle TLS termination and mTLS automatically between services. Your application code talks plain HTTP internally; the sidecar encrypts and authenticates at the network layer. Istio\'s control plane (istiod) issues short-lived client certificates (24h) using SPIFFE/SPIRE — no manual certificate management. Enable with: <code>PeerAuthentication</code> policy set to STRICT mTLS for the namespace. This zero-trust approach means every service-to-service call is authenticated and encrypted even inside the cluster.',
  },
  { q: 'How do you configure a web server for strong TLS and what settings matter?', a: 'TLS hardening checklist: protocol versions: disable SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1. Enable TLS 1.2 and TLS 1.3 only. Cipher suite order (TLS 1.2): prefer ECDHE for forward secrecy. Prefer GCM over CBC. Example: ECDHE-RSA-AES256-GCM-SHA384. TLS 1.3 cipher suites are fixed; no additional configuration needed. Key and certificate: use RSA 2048+ or ECDSA P-256 keys. Minimum 2048-bit RSA or 256-bit EC. DH parameters: if using DHE cipher suites, use 2048-bit DH parameters minimum. HSTS: Strict-Transport-Security: max-age=63072000; includeSubDomains; preload. OCSP stapling: enabled with a valid CA certificate chain. Session tickets: rotate the TLS session ticket key at least every 24 hours. Test: SSL Labs (ssllabs.com/ssltest) grades your configuration and identifies weaknesses.' },
  { q: 'What is TLS certificate pinning and what are the operational risks?', a: 'Certificate pinning: hard-coding the expected server certificate (or its public key hash) into a client application. The client rejects any TLS connection where the server certificate or chain does not match the pinned values. Prevents: rogue CA certificate used to intercept traffic. Attacker-issued certificate from a compromised intermediate CA. MITM proxies used in corporate networks for inspection. Operational risks: if the pinned certificate expires or the server rotates keys, the app stops working until updated. Mobile apps take weeks to update in app stores; a broken pin = app outage. Solutions: pin the public key hash of the issuing intermediate CA certificate (changes less frequently than leaf certificates). Pin multiple public keys (current + backup) to allow rotation. HPKP (HTTP-based certificate pinning) was deprecated because of operational risk (accidental DoS). Use Expect-CT header instead for CT monitoring without pinning risk.' },
  { q: 'What is the TLS handshake process in TLS 1.3 and how does 0-RTT work?', a: 'TLS 1.3 handshake (1-RTT): Client Hello: client sends supported cipher suites, key share (ECDHE public key), TLS version. Server Hello: server selects cipher suite, sends its key share, server certificate, CertificateVerify (signature), Finished. Client Finished: client verifies server certificate and signature, sends Finished. The shared secret is derived from the ECDHE key exchange. Application data flows after the first roundtrip. TLS 1.3 0-RTT (early data): on session resumption, the client can send early data (application data) before the handshake completes, using a pre-shared key from the previous session. Risks: 0-RTT data is vulnerable to replay attacks (attacker can replay the early data to another server). Never allow state-changing requests (POST, PUT) as 0-RTT early data. Use only for idempotent read operations. The server must implement replay protection (use session ticket binding or timestamps).' },
  { q: 'What is Let Encrypt and how does ACME automate certificate issuance?', a: 'ACME (Automatic Certificate Management Environment, RFC 8555): a protocol for automated certificate issuance and renewal. The ACME client (Certbot, Caddy, etc.) proves domain ownership to the CA. Domain validation methods: HTTP-01 challenge: ACME client places a token at a well-known URL on the web server. The CA fetches the token to verify domain control. DNS-01 challenge: ACME client creates a TXT DNS record. The CA queries DNS to verify. Useful for wildcard certificates and servers without HTTP access. TLS-ALPN-01 challenge: validates using a special TLS extension. Let Encrypt: a free, automated CA. Issues 90-day certificates. Short lifetime forces automation (Certbot renews at 60 days). Integration: Nginx and Apache plugins for automatic renewal. Kubernetes cert-manager watches Ingress resources and automatically issues and renews certificates. Wildcard certificates require DNS-01 challenge and a DNS API provider.' },
];

const revision: RevisionSummary = {
  oneLiner: 'TLS encrypts and authenticates data in transit — use TLS 1.3, disable 1.0/1.1, automate cert renewal, redirect HTTP→HTTPS, and use mTLS for service-to-service auth.',
  mustKnow: [
    'TLS 1.3: removes weak ciphers, requires ECDHE (forward secrecy), 1-RTT handshake',
    'Forward secrecy: ephemeral keys per session — past sessions safe even if private key leaked',
    'Certificate chain: domain cert → intermediate CA → root CA (trusted by browser)',
    'Let\'s Encrypt: free DV certs, 90-day expiry — automate renewal with certbot/cert-manager',
    'mTLS: both sides present certificates — for service-to-service authentication',
    'rejectUnauthorized: false disables TLS verification entirely — never do this in production',
  ],
  interviewFocus: [
    'What is forward secrecy and why does TLS 1.3 require it?',
    'When would you use mTLS over standard TLS?',
    'How do you handle certificate expiry in production?',
  ],
};

@Component({
  selector: 'app-sec-tls-https',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './tls-https.html',
  styleUrl: './tls-https.scss',
})
export class SecTlsHttps {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
