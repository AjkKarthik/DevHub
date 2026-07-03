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

@Component({
  selector: 'app-azure-entra-id',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './entra-id.html',
  styleUrl: './entra-id.scss'
})
export class AzureEntraId {

  quickRef: QuickRefItem[] = [
    { name: 'Tenant', type: 'type', desc: 'An Entra ID directory instance for your organisation. Has a unique tenant ID (GUID). Users, groups, apps, and service principals all live in a tenant.' },
    { name: 'App Registration', type: 'type', desc: 'Registers an application with Entra ID. Produces a client ID (application ID). Used to obtain tokens for accessing APIs. Distinct from the service principal.' },
    { name: 'Service Principal', type: 'type', desc: 'An identity for an app or service within a tenant. Created automatically when you register an app or create a Managed Identity. Assigned RBAC roles for resource access.' },
    { name: 'OAuth 2.0', type: 'type', desc: 'Authorisation framework. Entra ID issues access tokens (JWT) to clients that present valid credentials or consent. Used by client credentials flow, auth code flow, and device code flow.' },
    { name: 'OIDC', type: 'type', desc: 'OpenID Connect — authentication layer on top of OAuth 2.0. Issues ID tokens in addition to access tokens. Used for user sign-in with Microsoft identity.' },
    { name: 'Conditional Access', type: 'type', desc: 'Policy engine that gates access to apps/resources based on conditions: user, location, device compliance, sign-in risk. Enforces MFA, block, or compliant-device requirements.' },
    { name: 'Managed Identity', type: 'type', desc: 'Automatic service principal for Azure resources (VMs, App Service, AKS) — no credentials needed. System-assigned: lifecycle tied to the resource. User-assigned: independent lifecycle, shareable.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Tenants, Users & Groups',
      points: [
        'An Entra ID tenant is the identity directory for your organisation. It has a tenant ID (GUID) and a default domain (yourtenant.onmicrosoft.com). Subscriptions trust one tenant — a subscription\'s resources are managed by identities in that tenant.',
        'Users can be Member (created in the tenant, full directory read by default) or Guest (B2B collaboration from another tenant or external identity providers — limited directory read). Groups can be Security (for RBAC) or Microsoft 365 (includes mailbox, Teams).',
        'Dynamic groups use attribute-based membership rules (e.g. department=Engineering) — members join/leave automatically as attributes change. No manual membership management needed.',
        'Entra ID Connect (or Entra Cloud Sync) synchronises on-premises Active Directory users to Entra ID. Password hash sync, pass-through auth, and federation (ADFS) are the three sync modes.',
        'Administrative Units partition directory management — delegate user/group management to regional admins without granting tenant-wide admin roles.',
      ]
    },
    {
      heading: 'App Registrations & Service Principals',
      points: [
        'An App Registration defines an application\'s identity: client ID, redirect URIs, API permissions, and client secrets or certificates. The registration exists once (home tenant). A Service Principal is the per-tenant instance of that app — the actual identity that gets RBAC assignments and consent.',
        'Client credentials flow (app-to-app, no user): the app presents client ID + secret (or certificate) to get a token. Certificate credentials are strongly preferred over secrets — secrets expire and cannot be rotated without downtime; certificates have private key proof.',
        'Authorization Code flow (user sign-in): user is redirected to Entra ID, authenticates, Entra ID returns a code, the app exchanges the code for access + ID tokens. Use PKCE (Proof Key for Code Exchange) for SPAs and mobile apps to prevent code interception.',
        'API permissions: Delegated (on behalf of a signed-in user) vs Application (app acts as itself, no user). Application permissions require admin consent — a tenant admin must grant them, they are not user-consented.',
        'Certificates and secrets on app registrations expire. Set up expiry notifications (Entra ID Workbooks or alerts), rotate before expiry, and prefer certificate auth (rotatable without restarting the app, more secure than a shared secret).',
      ]
    },
    {
      heading: 'OAuth 2.0 Flows & Token Anatomy',
      points: [
        'Access tokens are short-lived JWTs (typically 1 hour). Refresh tokens are opaque, longer-lived (up to 90 days for confidential clients) and used to get new access tokens without re-authentication.',
        'Token claims include: iss (issuer), aud (audience/resource), sub (subject — user or service principal OID), oid (object ID), tid (tenant ID), scp (scopes for delegated), roles (app roles). Validate iss, aud, and exp on token receipt.',
        'Scope format: resource-uri/permission — e.g. https://storage.azure.com/user_impersonation or api://<client-id>/ReadData. The .default scope requests all statically configured permissions for that resource.',
        'The v2.0 endpoint (login.microsoftonline.com/<tenant>/oauth2/v2.0/token) is the current standard. v1.0 endpoint tokens use resource parameter instead of scope — newer SDKs use v2.0.',
        'MSAL (Microsoft Authentication Library) handles token acquisition, caching, and refresh automatically. Use MSAL rather than raw HTTP calls — it handles silent token refresh, conditional access claims challenges, and multi-account scenarios.',
      ]
    },
    {
      heading: 'Conditional Access & Security',
      points: [
        'Conditional Access (CA) policies evaluate every sign-in: Who is signing in? From where? With what device? What app? Policies can require MFA, compliant device (Intune-enrolled), specific IP ranges, or block access entirely.',
        'Sign-in risk (Identity Protection): ML-based risk evaluation of each sign-in (anonymous IP, atypical travel, leaked credentials). High-risk sign-ins can trigger step-up MFA or block. Requires Entra ID P2.',
        'Privileged Identity Management (PIM): just-in-time elevation to privileged roles (Global Admin, Subscription Owner). Roles are inactive by default; users activate for a time-limited window with optional MFA and justification. Replaces permanent admin role assignments.',
        'Multi-Factor Authentication (MFA) can be required by CA policy or user-level MFA settings. Authenticator app push notifications are more secure than SMS OTP (SIM-swap attacks). FIDO2 security keys and Windows Hello are phishing-resistant.',
        'Entra ID Protection monitors for leaked credentials (dark-web breach lists), impossible travel, and anonymous proxy sign-ins. Configure risk-based CA policies to auto-remediate high-risk users by requiring password change.',
      ]
    },
    {
      heading: 'Conditional Access as Risk-Based Policy Enforcement',
      points: [
        'Conditional Access policies evaluate signals (user location, device compliance, sign-in risk level) at authentication time and apply access controls (require MFA, block access, require a compliant device) accordingly — a fundamentally more adaptive model than a static "always require MFA" rule.',
        'This risk-based approach means a low-risk sign-in (known device, trusted location) can have a smoother experience while a high-risk sign-in (new device, unusual location, leaked credential signal) is challenged more strongly — balancing security against user friction dynamically rather than uniformly.',
        'Conditional Access policies are evaluated for every sign-in, not just the first one — a session that becomes risky mid-flow (a token reused from a different location) can be re-evaluated and challenged, providing ongoing protection beyond the initial login moment.',
        'Misconfigured Conditional Access policies (an overly broad exclusion, a policy that inadvertently locks out all admins) can cause serious availability incidents — testing policies in report-only mode before enforcing them is a critical safety practice before rolling out a new policy broadly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'App Registration & Token',
      language: 'bash',
      code: `# Create app registration
az ad app create \\
  --display-name my-api-app \\
  --sign-in-audience AzureADMyOrg

# Get the app/client ID
APP_ID=$(az ad app list --display-name my-api-app --query '[0].appId' -o tsv)

# Create service principal for the app
az ad sp create --id $APP_ID

# Add a client secret (prefer certificate in production)
az ad app credential reset \\
  --id $APP_ID \\
  --years 1

# Assign RBAC role to the service principal on a resource group
SP_OID=$(az ad sp show --id $APP_ID --query id -o tsv)
az role assignment create \\
  --assignee-object-id $SP_OID \\
  --role "Storage Blob Data Reader" \\
  --scope /subscriptions/<subId>/resourceGroups/my-rg \\
  --assignee-principal-type ServicePrincipal`
    },
    {
      label: 'OAuth2 Client Credentials Flow',
      language: 'bash',
      code: `# Acquire token using client credentials (app-to-app, no user)
# Replace tenant-id, client-id, client-secret, and scope
curl -X POST \\
  "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=<client-id>" \\
  -d "client_secret=<client-secret>" \\
  -d "scope=https://management.azure.com/.default"

# The response contains:
# {
#   "access_token": "<JWT>",
#   "expires_in": 3599,
#   "token_type": "Bearer"
# }

# Use the token to call Azure REST API
ACCESS_TOKEN="<token-from-above>"
curl -H "Authorization: Bearer $ACCESS_TOKEN" \\
  "https://management.azure.com/subscriptions/<subId>/resourceGroups?api-version=2021-04-01"`
    },
    {
      label: 'Conditional Access & PIM',
      language: 'bash',
      code: `# List Conditional Access policies (Microsoft Graph)
az rest \\
  --method GET \\
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" \\
  --headers "Content-Type=application/json"

# Create a CA policy requiring MFA for all users (Graph API)
az rest \\
  --method POST \\
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" \\
  --body '{
    "displayName": "Require MFA for all users",
    "state": "enabled",
    "conditions": {
      "users": { "includeUsers": ["All"] },
      "applications": { "includeApplications": ["All"] }
    },
    "grantControls": {
      "operator": "OR",
      "builtInControls": ["mfa"]
    }
  }'

# List eligible PIM role assignments for current user
az rest \\
  --method GET \\
  --url "https://graph.microsoft.com/v1.0/roleManagement/directory/roleEligibilitySchedules/filterByCurrentUser(on='principal')"

# Activate a PIM role (self-activate)
az rest \\
  --method POST \\
  --url "https://graph.microsoft.com/v1.0/roleManagement/directory/roleAssignmentScheduleRequests" \\
  --body '{
    "action": "selfActivate",
    "principalId": "<user-oid>",
    "roleDefinitionId": "<role-def-id>",
    "directoryScopeId": "/",
    "justification": "Deploying hotfix",
    "scheduleInfo": { "startDateTime": null, "expiration": { "type": "AfterDuration", "duration": "PT1H" } }
  }'`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using client secrets instead of certificates for service principals',
      wrong: `az ad app credential reset --id $APP_ID --years 1  # Secret string stored in config/env`,
      right: `# Use certificate credential: az ad app credential reset --id $APP_ID --cert @cert.pem`,
      explanation: 'Client secrets are shared strings — if leaked, there is no way to know who used them. They also expire and rotation requires application restarts. Certificate credentials use private key proof (the private key never leaves your system), are harder to phish, and can be rotated without secrets exposure. Use certificates or Managed Identity whenever possible.'
    },
    {
      title: 'Granting Application permissions without understanding admin consent requirement',
      wrong: `# App.ReadWrite.All (Application permission) added to registration — token requests fail silently`,
      right: `# Admin must consent: az ad app permission admin-consent --id $APP_ID`,
      explanation: 'Application permissions (no user context) always require admin consent before tokens can include them. Delegated permissions can be user-consented (unless marked admin-only). Forgetting the admin consent step results in AADSTS65001 errors when the app tries to acquire tokens. Use az ad app permission admin-consent or the Azure portal consent button.'
    },
    {
      title: 'Hardcoding tenant ID and not validating iss claim in tokens',
      wrong: `# Accept any valid JWT from Entra ID without checking issuer tenant`,
      right: `# Validate iss == "https://sts.windows.net/<your-tenant-id>/" (v1) or login.microsoftonline.com/<tid>/v2.0 (v2)`,
      explanation: 'A token from a different tenant\'s service principal is cryptographically valid but should not be trusted by your API. Always validate the iss (issuer) claim to ensure the token was issued by your specific tenant. MSAL and most middleware do this automatically — do not disable issuer validation.'
    },
    {
      title: 'Assigning permanently active admin roles instead of using PIM',
      wrong: `az role assignment create --role "Global Administrator" --assignee user@org.com  # Permanently active`,
      right: `# Use PIM: eligible assignment, activated on-demand with justification and MFA`,
      explanation: 'Permanently active privileged roles (Global Admin, Subscription Owner) are a major attack surface — a compromised account immediately has full access. Privileged Identity Management (PIM) makes these roles eligible (inactive by default). Users activate for a time-limited window with MFA and justification. This limits the blast radius of compromised accounts.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse and validate a JWT access token',
    language: 'typescript',
    description: 'Entra ID access tokens are JWTs (Base64URL-encoded header.payload.signature).\n\nWrite parseJwt(token: string): { tenantId: string; appId: string; scopes: string[]; expiresAt: Date } that decodes the payload and extracts tid (tenant ID), appid (app/client ID), scp (space-separated scopes), and exp (Unix timestamp expiry).',
    hints: [
      'Split token by "." — the payload is the second part',
      'Base64URL decode: replace - with +, _ with /, then atob()',
      'scp may be a space-separated string — split(" ") to get string[]',
      'exp is Unix seconds — multiply by 1000 for Date constructor',
    ],
    starterCode: `export function parseJwt(token: string): {
  tenantId: string; appId: string;
  scopes: string[]; expiresAt: Date;
} {
  // decode the JWT payload (middle section)
  return { tenantId: '', appId: '', scopes: [], expiresAt: new Date(0) };
}`,
    solution: `export function parseJwt(token: string): {
  tenantId: string; appId: string;
  scopes: string[]; expiresAt: Date;
} {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '='));
  const payload = JSON.parse(json);
  return {
    tenantId: payload.tid ?? '',
    appId: payload.appid ?? payload.azp ?? '',
    scopes: (payload.scp ?? '').split(' ').filter(Boolean),
    expiresAt: new Date((payload.exp ?? 0) * 1000),
  };
}

// Example — decode a token (replace with a real token for testing)
const claims = parseJwt('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ0aWQiOiJhYmMxMjMiLCJhcHBpZCI6ImRlZjQ1NiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsImV4cCI6MTc1MDAwMDAwMH0.sig');
console.log(claims);
// { tenantId: 'abc123', appId: 'def456', scopes: ['user_impersonation'], expiresAt: Date }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between an App Registration and a Service Principal?',
      options: [
        'They are the same thing — App Registration is just the old name',
        'App Registration defines the app globally (home tenant); Service Principal is the per-tenant runtime identity',
        'Service Principal is for users; App Registration is for non-human identities',
        'App Registration is for multi-tenant apps; Service Principal is for single-tenant only'
      ],
      answer: 1,
      explanation: 'An App Registration is the global definition of an application (client ID, secrets, permissions) — exists once in the home tenant. A Service Principal is the per-tenant instance of that app — the actual runtime identity that receives RBAC assignments and user consent. Multi-tenant apps have one registration but one service principal in every tenant where a user consents.'
    },
    {
      q: 'Which OAuth 2.0 flow should a background service use to get tokens without a user present?',
      options: ['Authorization Code Flow', 'Device Code Flow', 'Client Credentials Flow', 'Implicit Flow'],
      answer: 2,
      explanation: 'Client Credentials Flow is for service-to-service (daemon) scenarios where there is no interactive user. The app authenticates with its own client ID + secret or certificate and receives an access token scoped to Application permissions. Authorization Code and Device Code flows require user interaction. Implicit Flow is deprecated.'
    },
    {
      q: 'What does Privileged Identity Management (PIM) provide over regular role assignments?',
      options: [
        'Permanent admin role assignments with audit logs',
        'Just-in-time role activation with time limits, MFA, and justification requirements',
        'Automatic role assignment based on group membership',
        'Role assignments across multiple subscriptions simultaneously'
      ],
      answer: 1,
      explanation: 'PIM makes privileged roles "eligible" (inactive by default). Users activate them on-demand for a configured time window (e.g., 1 hour), typically requiring MFA and a justification reason. This dramatically reduces the attack surface compared to permanently active admin roles, which are immediately exploitable if the account is compromised.'
    },
    {
      q: 'What is the difference between Delegated and Application API permissions?',
      options: [
        'Delegated = app only; Application = user + app combined',
        'Delegated = acts on behalf of a signed-in user; Application = acts as the app itself with no user context',
        'Delegated permissions require admin consent; Application permissions do not',
        'There is no functional difference — both produce the same tokens'
      ],
      answer: 1,
      explanation: 'Delegated permissions are for when a user is signed in — the token represents "this app acting on behalf of this user." Application permissions are for daemon/background services — the token represents the app itself, no user context. Application permissions always require admin consent; some Delegated permissions require it too (marked AdminOnly).'
    },
    {
      q: 'What is Conditional Access and what can it enforce?',
      options: [
        'A network firewall that blocks traffic from unapproved IP ranges',
        'A policy engine that gates sign-ins based on user, location, device, and risk — enforcing MFA, compliant device, or blocking access',
        'A tool for configuring RBAC roles based on user attributes',
        'A feature for setting password complexity and expiration policies'
      ],
      answer: 1,
      explanation: 'Conditional Access evaluates every sign-in against configured policies (conditions: who, where, what device, what app, risk level) and applies controls: require MFA, require Intune-compliant device, require hybrid Azure AD join, block access, or require password change. It is the primary zero-trust enforcement mechanism in Entra ID.'
    },
    {
      q: 'Why is it strongly recommended to exclude at least one "break-glass" emergency admin account from every Conditional Access policy?',
      options: [
        'Break-glass accounts do not need this since Conditional Access never applies to admin roles',
        'A misconfigured Conditional Access policy (e.g. one that accidentally requires a compliant device that no longer exists) can lock out ALL users including admins — an excluded emergency account with a strong, offline-stored credential ensures there is always a way back in',
        'Excluding an account is required for licensing reasons only',
        'Break-glass accounts are only relevant for on-premises Active Directory, not Entra ID',
      ],
      answer: 1,
      explanation: 'Because Conditional Access policies are evaluated on every sign-in including administrators, a policy bug or overly broad condition (targeting "All users" instead of a specific group, or requiring a device compliance state that got misconfigured) can lock every single account out of the tenant simultaneously, with no way to sign in and fix the policy through the portal. Keeping at least one emergency-access account permanently excluded from Conditional Access, with a strong credential stored securely offline, is the standard safety net against this exact scenario.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between System-assigned and User-assigned Managed Identity?',
      a: '<strong>System-assigned</strong>: created with the Azure resource (VM, App Service, etc.), tied to its lifecycle — deleted when the resource is deleted. One-to-one: one resource, one identity. Simple to set up. <strong>User-assigned</strong>: independent resource with its own lifecycle. Can be assigned to multiple Azure resources — useful when you want multiple apps to share the same identity and RBAC permissions (e.g., fleet of VMs all reading the same Key Vault). User-assigned identities must be explicitly deleted.'
    },
    {
      q: 'What is the .default scope and when do you use it?',
      a: 'The <strong>.default scope</strong> (e.g. https://management.azure.com/.default) tells Entra ID to issue a token with all the API permissions that the app registration has been granted and consented to — without listing them individually. Use it for: (1) Client Credentials Flow where you want all configured Application permissions, (2) cases where you want Entra ID to aggregate all statically configured delegated permissions into one token request. Avoid .default for end-user flows where you want to minimise requested permissions (request only what you need).'
    },
    {
      q: 'How does B2B (business-to-business) collaboration work in Entra ID?',
      a: 'B2B collaboration allows you to invite external users (from other Entra ID tenants, Google, or Microsoft Accounts) as <strong>Guest users</strong> in your tenant. They authenticate against their home identity provider (IdP) and receive a guest account in your directory. You can assign them RBAC roles, add them to groups, and grant access to applications just like internal users. B2B is used for partner access, vendor access, and cross-company collaboration without managing external passwords.'
    },
    {
      q: 'What tokens does an OIDC sign-in return and what is each used for?',
      a: 'An OIDC sign-in returns three tokens: (1) <strong>ID Token</strong>: a JWT containing identity claims about the authenticated user (name, email, OID, tid) — used by the client to display user info, NOT to call APIs. (2) <strong>Access Token</strong>: a JWT authorising calls to a specific API (aud claim) — sent in Authorization: Bearer header. (3) <strong>Refresh Token</strong>: an opaque long-lived token used to silently get new access tokens without re-authentication — stored securely server-side, never in browser localStorage.'
    },
    {
      q: 'Why is certificate authentication preferred over client secrets for service principals?',
      a: 'Client secrets are shared strings — if exposed (in logs, git, env files), anyone can use them. They expire (1–2 years) and rotation requires a coordinated deployment. <strong>Certificate credentials</strong> use asymmetric cryptography: the private key never leaves your key store (Key Vault HSM-protected). Entra ID only stores the public key. Authentication requires proving possession of the private key — a stolen certificate hash is useless without the private key. Rotation can be done with key overlap (upload new cert, update app, revoke old cert) with zero downtime.'
    },
    {
      q: 'What is the difference between a service principal and a managed identity in Azure?',
      a: 'A <strong>service principal</strong> is an Entra ID app identity with client ID and secret/certificate that must be managed manually. A <strong>managed identity</strong> (system-assigned or user-assigned) is an automatically managed identity for Azure resources — no credentials to rotate, Azure handles the lifecycle. Always prefer managed identities for Azure-to-Azure auth.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Entra ID is Microsoft\'s cloud identity platform — tenants hold users/apps/service principals, OAuth2/OIDC issues tokens, Conditional Access enforces zero-trust sign-in policies, and PIM provides just-in-time privileged access.',
    mustKnow: [
      'App Registration = global app definition (client ID); Service Principal = per-tenant runtime identity',
      'Client Credentials Flow: app gets token with its own identity (no user) — requires Application permissions + admin consent',
      'Delegated permissions: on behalf of signed-in user. Application permissions: app acting as itself',
      'Managed Identity: automatic service principal for Azure resources — no credentials to manage',
      'PIM: eligible roles activated JIT with MFA + justification — reduces permanently active privileged accounts',
      'Validate iss (issuer) and aud (audience) claims when accepting tokens in your API',
    ],
    interviewFocus: [
      'Explain the difference between App Registration, Service Principal, and Managed Identity',
      'Which OAuth 2.0 flow is used for background services and what credentials does it use?',
      'What is PIM and how does it reduce the attack surface of privileged accounts?',
      'Why are certificate credentials preferred over client secrets for service principals?',
    ],
  };
}
