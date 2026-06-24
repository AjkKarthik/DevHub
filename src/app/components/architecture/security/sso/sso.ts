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
  { name: 'SSO',      type: 'keyword', desc: 'Single Sign-On — authenticate once at an IdP, access many SPs without re-authentication.' },
  { name: 'IdP',      type: 'keyword', desc: 'Identity Provider — authenticates the user (Azure AD, Okta, Google Workspace).' },
  { name: 'SP',       type: 'keyword', desc: 'Service Provider — the application that trusts the IdP for authentication.' },
  { name: 'SAML 2.0', type: 'keyword', desc: 'XML-based SSO standard — enterprise/B2B, uses signed XML assertions.' },
  { name: 'OIDC SSO', type: 'keyword', desc: 'OAuth 2.0 + OIDC for SSO — modern, JSON/JWT based, preferred for new integrations.' },
  { name: 'SLO',      type: 'keyword', desc: 'Single Log-Out — propagates logout to all sessions across all SPs.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'How SSO Works',
    points: [
      'User visits Service Provider (SP — your app). SP checks: does this user have an active session?',
      'If no session, SP redirects to Identity Provider (IdP — Okta, Azure AD) with a request.',
      'User authenticates at the IdP (once). IdP creates a session and redirects back to SP with an authentication assertion (SAML response or OIDC code).',
      'SP validates the assertion, creates its own session, and logs the user in. On a second SP, the IdP session is already active — no re-auth needed.',
      'This "authenticate once, access many" pattern is the core SSO promise.',
    ],
  },
  {
    heading: 'SAML 2.0 vs OIDC for SSO',
    points: [
      'SAML 2.0: XML-based, enterprise standard, widely supported by legacy systems. Assertions are signed XML documents posted browser-side (POST binding) or redirected (Redirect binding).',
      'OIDC: JSON/JWT-based, modern, developer-friendly, built on OAuth 2.0. Preferred for new integrations, especially with cloud-native IdPs.',
      'SAML is dominant in B2B enterprise SSO (e.g., integrating with a corporate Azure AD). OIDC is dominant in consumer/B2C SSO (e.g., "Sign in with Google").',
      'Both achieve the same goal — OIDC is simpler to implement correctly; SAML has more mature enterprise tooling and corporate IdP support.',
    ],
  },
  {
    heading: 'Session Management in SSO',
    points: [
      'The IdP session is separate from each SP session. The IdP session is typically longer-lived (8–12 hours for enterprise); SP sessions are shorter.',
      'SP session expiry does NOT log out the user from the IdP. Re-authenticating with the SP will check the IdP session and silently re-establish the SP session.',
      'Single Log-Out (SLO): when the user logs out of one SP, the SP notifies the IdP, which notifies all other SPs. Complex to implement correctly — many organizations skip it and use short session timeouts instead.',
      'Forced re-auth: SPs can request fresh authentication from the IdP even if an IdP session exists (`prompt=login` in OIDC, `ForceAuthn="true"` in SAML) — use for sensitive operations.',
    ],
  },
  {
    heading: 'Security Considerations',
    points: [
      'SAML assertion validation: verify XML signature, `Issuer`, `Audience` (must match your SP Entity ID), `NotBefore`/`NotOnOrAfter` timestamps.',
      'SAML XML signature wrapping: a class of attack where the assertion is duplicated and the signature is moved to reference the original but the SP reads the malicious copy. Use a well-maintained SAML library — do not implement parsing yourself.',
      'OIDC: validate the ID token (`iss`, `aud`, `exp`, signature) before trusting any claims.',
      'IdP metadata: fetch and cache IdP metadata (signing certificates) from the well-known endpoint. Rotate on IdP certificate rotation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'OIDC SSO (Passport.js)',
    language: 'typescript',
    code: `import passport from 'passport';
import { Strategy as OidcStrategy } from 'passport-openidconnect';

passport.use('oidc', new OidcStrategy({
  issuer:            'https://accounts.google.com',
  authorizationURL:  'https://accounts.google.com/o/oauth2/v2/auth',
  tokenURL:          'https://oauth2.googleapis.com/token',
  userInfoURL:       'https://openidconnect.googleapis.com/v1/userinfo',
  clientID:          process.env.GOOGLE_CLIENT_ID!,
  clientSecret:      process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL:       'https://app.example.com/auth/oidc/callback',
  scope:             ['openid', 'profile', 'email'],
}, async (issuer, profile, done) => {
  // profile.id = sub claim — stable identifier across SSO sessions
  const user = await db.users.findOrCreate({
    ssoProvider: 'google',
    ssoSub:      profile.id,
    email:       profile.emails?.[0]?.value,
    displayName: profile.displayName,
  });
  return done(null, user);
}));

// Routes
app.get('/auth/oidc', passport.authenticate('oidc'));

app.get('/auth/oidc/callback',
  passport.authenticate('oidc', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/dashboard')
);

// Force fresh authentication for sensitive operations
app.get('/auth/oidc/step-up',
  (req, res, next) => {
    req.query['prompt'] = 'login'; // force re-auth even if IdP session exists
    next();
  },
  passport.authenticate('oidc')
);`,
  },
  {
    label: 'SAML 2.0 (samlify)',
    language: 'typescript',
    code: `import { IdentityProvider, ServiceProvider } from 'samlify';
import * as validator from '@authenio/samlify-node-xmllint';

samlify.setSchemaValidator(validator); // required — validates SAML schema

const idp = IdentityProvider({
  metadata: fs.readFileSync('./idp-metadata.xml'),
});

const sp = ServiceProvider({
  entityID:    'https://app.example.com',
  assertionConsumerService: [{
    Binding:  'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://app.example.com/auth/saml/callback',
  }],
  signingCert:  fs.readFileSync('./sp-signing-cert.pem', 'utf8'),
  privateKey:   fs.readFileSync('./sp-private-key.pem', 'utf8'),
});

// ── Initiate SSO ─────────────────────────────────────────────────────────────
app.get('/auth/saml', (req, res) => {
  const { context } = sp.createLoginRequest(idp, 'redirect');
  res.redirect(context);
});

// ── Handle SAML Response ─────────────────────────────────────────────────────
app.post('/auth/saml/callback', async (req, res) => {
  try {
    const { extract } = await sp.parseLoginResponse(idp, 'post', req);
    const { nameID, attributes } = extract;

    // samlify validates: signature, issuer, audience, timestamps
    const user = await db.users.findOrCreate({
      ssoProvider: 'saml',
      ssoSub:      nameID,
      email:       attributes['email'],
    });

    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (err) {
    res.status(401).send('SAML validation failed');
  }
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using the email claim as a user identifier instead of sub',
    wrong: `// Using email as the user's primary key for SSO
const user = await db.users.findByEmail(profile.emails[0].value);`,
    right: `// Use ssoSub (the 'sub' claim) — stable and unique per IdP
const user = await db.users.findBySsoSub(profile.id);`,
    explanation: 'Email addresses can change (user changes name, company rebrands). The `sub` (subject) claim is the IdP\'s stable, unique identifier for the user — it will not change. Using email as the key causes login failures or account collisions when emails change.',
  },
  {
    title: 'Implementing SAML parsing from scratch instead of using a library',
    wrong: `// Manual XML parsing — vulnerable to signature wrapping attacks
const xml = req.body.SAMLResponse;
const doc = parseXml(atob(xml));
const email = doc.querySelector('Attribute[Name=email]').textContent;`,
    right: `// Use samlify or node-saml — validates signature, schema, and timestamps
const { extract } = await sp.parseLoginResponse(idp, 'post', req);`,
    explanation: 'SAML XML signature wrapping is a class of vulnerability where a second unsigned assertion is injected alongside the signed one, and the parser reads the wrong node. SAML libraries built for security handle this correctly; manual parsing almost never does.',
  },
  {
    title: 'Not implementing SLO and relying on IdP session expiry only',
    wrong: `// No SLO — users think they logged out but IdP session persists
app.post('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });`,
    right: `// Initiate SLO: redirect to IdP logout endpoint
app.post('/logout', (req, res) => {
  const { context } = sp.createLogoutRequest(idp, 'redirect', { nameID: req.session.ssoNameId });
  req.session.destroy();
  res.redirect(context);
});`,
    explanation: 'Without SLO, logging out of one app leaves the IdP session (and all other app sessions) active. On a shared computer, the next user can access all apps without re-authenticating. Implement SLO for security-sensitive applications.',
  },
  {
    title: 'Not validating the SAML audience restriction',
    wrong: `// Accept any SAML response — no audience check
const attrs = extract.attributes; // attacker could replay a token from another SP`,
    right: `// samlify checks Audience matches your SP entityID automatically
// Ensure entityID is set correctly in SP configuration
const sp = ServiceProvider({ entityID: 'https://app.example.com', ... });`,
    explanation: 'The SAML Audience Restriction must match your Service Provider\'s Entity ID. Without this check, an attacker who obtains a valid SAML assertion issued for service A can replay it against service B.',
  },
];

const challenge: Challenge = {
  title: 'SSO Assertion Validator',
  language: 'typescript',
  description: `Implement validateSamlClaims(claims: SamlClaims): ValidationResult that checks:
1. issuer must equal 'https://idp.example.com'
2. audience must equal 'https://sp.example.com'
3. notBefore <= now <= notOnOrAfter (Date objects)
4. email must be a non-empty string
Returns { valid: boolean; errors: string[] }`,
  hints: [
    'Check each condition separately and push to errors array',
    'new Date() for current time',
    'Return valid: errors.length === 0',
  ],
  starterCode: `interface SamlClaims {
  issuer: string;
  audience: string;
  notBefore: Date;
  notOnOrAfter: Date;
  email: string;
}
interface ValidationResult { valid: boolean; errors: string[]; }

function validateSamlClaims(claims: SamlClaims): ValidationResult {
  const errors: string[] = [];
  // TODO
  return { valid: errors.length === 0, errors };
}`,
  solution: `interface SamlClaims {
  issuer: string;
  audience: string;
  notBefore: Date;
  notOnOrAfter: Date;
  email: string;
}
interface ValidationResult { valid: boolean; errors: string[]; }

function validateSamlClaims(claims: SamlClaims): ValidationResult {
  const errors: string[] = [];
  const now = new Date();

  if (claims.issuer !== 'https://idp.example.com') errors.push('Invalid issuer');
  if (claims.audience !== 'https://sp.example.com') errors.push('Invalid audience');
  if (now < claims.notBefore) errors.push('Assertion not yet valid');
  if (now > claims.notOnOrAfter) errors.push('Assertion has expired');
  if (!claims.email) errors.push('Missing email attribute');

  return { valid: errors.length === 0, errors };
}

// Test
console.log(validateSamlClaims({
  issuer: 'https://idp.example.com',
  audience: 'https://sp.example.com',
  notBefore: new Date(Date.now() - 60000),
  notOnOrAfter: new Date(Date.now() + 300000),
  email: 'user@example.com',
})); // { valid: true, errors: [] }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which claim should you use as a stable user identifier in an SSO integration?',
    options: ['email', 'name', 'sub (subject)', 'displayName'],
    answer: 2,
    explanation: 'The `sub` (subject) claim is the IdP\'s stable, unique identifier for the user. Email addresses can change; names can be shared across users. Always store and look up users by `sub` + IdP combination, never by email alone.',
  },
  {
    q: 'What is the SAML XML signature wrapping attack?',
    options: [
      'Stealing the signing key from the IdP',
      'Injecting an unsigned malicious assertion alongside the signed one, exploiting parsers that read the wrong element',
      'Replaying an expired SAML response',
      'Brute-forcing the XML encryption key',
    ],
    answer: 1,
    explanation: 'In a signature wrapping attack, the attacker duplicates the SAML assertion, modifies the copy (e.g., changes the email to an admin), and moves the signature to reference the original. Parsers that search for the assertion element rather than navigating to the signed element can read the unsigned malicious copy.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should you use SAML vs OIDC for SSO?',
    a: '<strong>Choose OIDC</strong> for new integrations, especially: cloud-native apps, APIs, mobile apps, SaaS products with consumer users ("Sign in with Google"), developer-built IdP integrations. JSON/JWT is simpler and well-understood. <strong>Choose SAML</strong> when: the enterprise customer\'s IT department requires it (very common — most corporate IdPs are primarily SAML-configured), integrating with legacy systems, or your customers are large enterprises with existing SAML infrastructure. In practice, B2B SaaS products often support both: OIDC for modern customers, SAML for enterprise customers.',
  },
  {
    q: 'What is Just-In-Time (JIT) provisioning in SSO?',
    a: 'JIT provisioning automatically creates a user account in your application the first time that user authenticates via SSO — without requiring a separate invitation or pre-provisioning step. The SSO assertion contains enough user attributes (email, name, department, roles) to create the account. The alternative is <strong>SCIM</strong> (System for Cross-domain Identity Management): the IdP pushes user changes (create, update, deactivate) to your app in real time. SCIM is more robust — it handles deactivation (JIT cannot deactivate accounts; you only learn a user logged in, not that they left the company).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'SSO: authenticate once at an IdP, access many SPs — use OIDC for new integrations, SAML for enterprise; always use sub not email as the user identifier.',
  mustKnow: [
    'IdP = authenticates users; SP = trusts the IdP and provides services',
    'OIDC SSO: modern, JSON/JWT, prefer for new integrations',
    'SAML 2.0: XML-based, enterprise standard, use for corporate customers',
    'Always identify users by sub + idpId — never by email alone',
    'SAML: validate signature, issuer, audience, and timestamps — use a library, never parse manually',
    'SLO (Single Log-Out) propagates logout to all SPs; skip only if sessions are short-lived',
  ],
  interviewFocus: [
    'What is the SAML XML signature wrapping attack?',
    'Why use sub instead of email as the user identifier in SSO?',
    'When would you choose SAML over OIDC?',
  ],
};

@Component({
  selector: 'app-sec-sso',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sso.html',
  styleUrl: './sso.scss',
})
export class SecSso {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
