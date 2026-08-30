import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Single-Tenant Code, Multi-Tenant QnA',
    points: [
      'The QnA lays out real multi-tenant architecture in detail: "each enterprise customer has their own IdP configuration... tenant resolution: domain-based (john@acme.com -> Acme IdP)... validate that the authenticated user belongs to the expected tenant." The main page\'s own codeTabs are entirely single-tenant — one hardcoded <code>issuer</code>, one hardcoded IdP metadata file, no tenant concept anywhere.',
      'This subtopic builds exactly what the QnA describes: resolving WHICH tenant\'s IdP to redirect to based on the user\'s email domain, and — critically — the isolation check the QnA calls out as essential: confirming a returned assertion actually belongs to the tenant that was expected, not just any tenant the platform happens to trust.',
    ],
  },
  {
    heading: 'Why Tenant Isolation Is a Separate Check From Signature Validation',
    points: [
      'A signature check (as the main page\'s own SAML mistakes block covers) proves an assertion was genuinely issued by SOME IdP the platform trusts — but in a multi-tenant platform, the platform trusts MANY different IdPs, one per customer. A valid, correctly-signed assertion from Tenant B\'s own real IdP is still a SEPARATE problem if it ends up authenticating a user into Tenant A\'s data.',
      'This is exactly the QnA\'s own warning about "trusting the wrong IdP": the fix isn\'t a stronger signature check (the signature is genuinely valid) — it\'s an explicit, separate comparison confirming the IdP that issued THIS assertion is the SAME IdP the login flow expected for THIS tenant, checked independently of whether the signature itself passes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Domain-Based Tenant Resolution',
    language: 'typescript',
    code: `interface TenantConfig {
  tenantId: string;
  idpEntityId: string;      // the SPECIFIC IdP this tenant trusts
  idpMetadataUrl: string;
  emailDomains: string[];   // domains routed to THIS tenant's IdP
}

const tenants: TenantConfig[] = [
  { tenantId: 'acme',   idpEntityId: 'https://acme.okta.com',      idpMetadataUrl: '...', emailDomains: ['acme.com', 'acme-corp.com'] },
  { tenantId: 'globex', idpEntityId: 'https://globex.login.microsoftonline.com', idpMetadataUrl: '...', emailDomains: ['globex.com'] },
];

function resolveTenantByEmail(email: string): TenantConfig | undefined {
  const domain = email.split('@')[1]?.toLowerCase();
  return tenants.find(t => t.emailDomains.includes(domain));
}

// ── Login initiation ─────────────────────────────────────────────────────────
app.post('/auth/sso/start', (req, res) => {
  const { email } = req.body;
  const tenant = resolveTenantByEmail(email);
  if (!tenant) return res.status(400).json({ error: 'No SSO configured for this email domain' });

  // Remember WHICH tenant this login flow is FOR -- this is what the
  // isolation check below will later verify the response against.
  req.session.pendingTenantId = tenant.tenantId;
  const { context } = sp.createLoginRequest(idpFor(tenant), 'redirect');
  res.redirect(context);
});`,
  },
  {
    label: 'Tenant Isolation on Callback',
    language: 'typescript',
    code: `app.post('/auth/sso/callback', async (req, res) => {
  const expectedTenantId = req.session.pendingTenantId;
  if (!expectedTenantId) return res.status(400).json({ error: 'No pending login' });

  const expectedTenant = tenants.find(t => t.tenantId === expectedTenantId)!;
  const idp = idpFor(expectedTenant);

  // Signature validation -- proves the assertion was genuinely issued
  // by SOME trusted IdP. This alone does NOT prove it's the RIGHT one.
  const { extract } = await sp.parseLoginResponse(idp, 'post', req);

  // ── The isolation check the QnA warns is easy to skip ────────────
  // Confirm the assertion's OWN issuer matches the SPECIFIC IdP this
  // tenant is configured to trust -- not just "some IdP we trust."
  if (extract.issuer !== expectedTenant.idpEntityId) {
    throw new Error(
      \`Tenant isolation violation: expected issuer \${expectedTenant.idpEntityId}, got \${extract.issuer}\`
    );
  }

  const user = await db.users.findOrCreate({
    tenantId:    expectedTenant.tenantId,   // every user row is scoped to ONE tenant
    ssoProvider: 'saml',
    ssoSub:      extract.nameID,
    email:       extract.attributes['email'],
  });

  req.session.userId = user.id;
  req.session.tenantId = user.tenantId;
  res.redirect('/dashboard');
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Globex is a real customer with a real, correctly-configured IdP at <code>https://globex.login.microsoftonline.com</code>. A Globex employee starts a login flow (<code>pendingTenantId = \'globex\'</code>), but a bug elsewhere in the code accidentally sends their browser to ACME\'s IdP redirect URL instead. The Globex employee authenticates successfully there (Acme\'s IdP has no way to know it\'s the wrong flow) and a genuinely signed, valid assertion comes back with <code>issuer: \'https://acme.okta.com\'</code>. Does the callback code above accept this login?',
  hint: 'The signature on the returned assertion is completely valid — Acme\'s IdP really did sign it. What does the isolation check compare against, and does IT pass?',
  solution: `// No -- the isolation check rejects this, even though the signature
// itself is perfectly valid.

// expectedTenantId is still 'globex' (set at the START of the flow,
// before the redirect bug occurred), so expectedTenant.idpEntityId is
// 'https://globex.login.microsoftonline.com'. The assertion that came
// back has issuer: 'https://acme.okta.com' -- genuinely, validly
// signed by Acme's real IdP, but NOT the issuer the isolation check
// expects for a login flow that started as a Globex login.

// The comparison 'https://acme.okta.com' !== 'https://globex.login.microsoftonline.com'
// is true, so the isolation check throws -- the mismatched-tenant
// login is rejected specifically BECAUSE the check compares against
// what was recorded at the START of the flow (expectedTenantId),
// completely independent of whether the signature validation (which
// only asks "is this signed by ANY IdP we trust across ALL tenants")
// happens to pass. This is exactly the scenario the QnA's own warning
// about "trusting the wrong IdP" describes -- a signature-valid
// assertion from the WRONG tenant's IdP is still a real security
// failure without this separate check.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the SAML library already validates the assertion\'s signature against a known-trusted IdP, that\'s sufficient proof the login belongs to the correct tenant.',
    reality: 'The Try It above shows exactly why this is insufficient in a MULTI-tenant platform specifically: the library correctly validates that Acme\'s IdP genuinely signed the assertion — Acme really is one of the platform\'s trusted IdPs — but "signed by A trusted IdP" and "signed by THE SPECIFIC IdP this login flow was FOR" are two different questions. A single-tenant platform (one IdP, period) never has to distinguish them; a multi-tenant platform always does.',
  },
  {
    thought: 'Storing which tenant a login flow is "for" in the session before redirecting to the IdP is an unnecessary extra step — the returned assertion\'s issuer alone is enough information.',
    reality: 'The returned assertion\'s issuer, by itself, only tells you WHICH IdP responded — it says nothing about which tenant\'s login flow the CURRENT request is supposed to be completing. Without recording <code>pendingTenantId</code> at the START of the flow, the callback would have no independent, trusted value to compare the returned issuer against — it would just be trusting whatever issuer shows up, which is precisely the vulnerability being closed.',
  },
];

@Component({
  selector: 'app-sec-sso-multitenant',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './multi-tenant-sso-domain-resolution-and-isolation.html',
  styleUrl: './multi-tenant-sso-domain-resolution-and-isolation.scss',
})
export class MultiTenantSsoDomainResolutionAndIsolationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
