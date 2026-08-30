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
  selector: 'app-azure-key-vault',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './key-vault.html',
  styleUrl: './key-vault.scss'
})
export class AzureKeyVault {

  quickRef: QuickRefItem[] = [
    { name: 'Secret', type: 'type', desc: 'An arbitrary string value (password, connection string, API key) stored in Key Vault with versioning, expiry, and access auditing.' },
    { name: 'Key', type: 'type', desc: 'Cryptographic key (RSA or EC). Supports encrypt/decrypt, sign/verify operations. HSM-protected keys never leave the HSM in plaintext.' },
    { name: 'Certificate', type: 'type', desc: 'X.509 certificate with its private key. Key Vault can auto-renew certificates from DigiCert or GlobalSign. Eliminates manual certificate rotation.' },
    { name: 'Access Policy', type: 'type', desc: 'Legacy permission model: grant a principal (user/SP/MI) specific secret/key/cert operations (get, list, set, delete). Vault-level, not per-secret.' },
    { name: 'RBAC Model', type: 'type', desc: 'Modern permission model: standard Azure RBAC roles (Key Vault Secrets Officer, Key Vault Secrets User) assigned at vault or secret level. Preferred over access policies.' },
    { name: 'Soft Delete', type: 'type', desc: 'Deleted secrets/keys/certs are retained for 7–90 days in a recoverable state. Cannot be disabled once enabled. Purge protection prevents permanent deletion during retention.' },
    { name: 'Key Vault Reference', type: 'type', desc: 'App Service / Functions setting syntax @Microsoft.KeyVault(SecretUri=...) — platform resolves the secret at runtime using the app\'s Managed Identity. No secret in code or config.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Secrets, Keys & Certificates',
      points: [
        'Key Vault stores three object types: Secrets (arbitrary strings — connection strings, passwords, API keys), Keys (RSA 2048/3072/4096 or EC P-256/P-384 — used for crypto operations), and Certificates (X.509 certs with private keys — TLS, code signing).',
        'Every object is versioned: when you create a new version of a secret, the old version is not deleted — it remains accessible by its full version URI. The versionless URI always resolves to the current (latest) version.',
        'HSM-protected keys (Premium SKU): cryptographic operations happen inside a FIPS 140-2 Level 2 or 3 validated HSM — the private key never leaves the hardware in plaintext. Software-protected keys (Standard SKU) are encrypted at rest by the platform.',
        'Certificate lifecycle: Key Vault can integrate with DigiCert or GlobalSign as certificate authorities. Configure auto-renewal at a specified lifetime percentage (e.g. 80%) — Key Vault requests a new certificate automatically before expiry.',
        'All operations (get, set, delete, backup, restore) are logged in Key Vault diagnostic logs. Enable these logs to Azure Monitor / Log Analytics for compliance and security audit trails.',
      ]
    },
    {
      heading: 'Access Control: RBAC vs Access Policies',
      points: [
        'Key Vault supports two permission models: Legacy Vault Access Policy (assigned at vault level, per-principal, specific operations) and Azure RBAC (role assignments using Azure RBAC at vault or individual object level). RBAC is the recommended model for new vaults.',
        'Key RBAC roles: Key Vault Administrator (full control), Key Vault Secrets Officer (manage secrets), Key Vault Secrets User (read secrets — for applications), Key Vault Reader (metadata only, cannot read secret values).',
        'With RBAC model, you can scope assignments to individual secrets (not just vault-level). This enables fine-grained: one Managed Identity reads only the database-password secret, another reads only the api-key secret.',
        'Access Policies are all-or-nothing at the vault level: you grant get+list+set+delete permissions for all secrets in the vault. You cannot restrict to specific secrets. Use RBAC for new vaults.',
        'When switching from Access Policy to RBAC model on an existing vault, RBAC replaces all access policies — they are no longer evaluated. Ensure all needed RBAC assignments are in place before switching to avoid access loss.',
      ]
    },
    {
      heading: 'Key Vault References & Application Integration',
      points: [
        'Key Vault References allow App Service and Azure Functions to reference secrets without fetching them in code. Set an app setting value to @Microsoft.KeyVault(SecretUri=https://my-kv.vault.azure.net/secrets/my-secret/) — the platform resolves it to the secret value at runtime using the app\'s Managed Identity.',
        'The Managed Identity must have Key Vault Secrets User role (RBAC model) or get+list permissions (access policy model) on the vault. The app sees the secret value in its environment as a regular string — no Key Vault SDK needed.',
        'Secret versioning with references: the versionless URI always fetches the latest version (good for rotation). The versioned URI (append /{version}) pins to a specific version — use for rollback capability or staged rollouts.',
        'Azure App Configuration can store Key Vault references — centralise configuration across many apps, each app fetches only the references it needs. Works well with feature flags and environment-specific configs.',
        'Private Endpoint for Key Vault: disable public access, create a private endpoint in your VNet, add a private DNS zone (privatelink.vaultcore.azure.net). All Key Vault traffic stays on the Azure backbone — required for high-security workloads.',
      ]
    },
    {
      heading: 'Soft Delete, Purge Protection & Backup',
      points: [
        'Soft delete is mandatory on all Key Vaults (enabled by default, cannot be disabled). Deleted objects are retained for the configured retention period (7–90 days) in a "deleted" state. They can be recovered (undelete) within this window.',
        'Purge Protection: once enabled, neither users nor Microsoft can purge (permanently delete) soft-deleted objects or the vault until the retention period expires. Required for BYOK (bring your own key) and CMK (customer-managed key) scenarios to prevent accidental key destruction that would make data permanently inaccessible.',
        'Backup & Restore: Key Vault does not have a traditional backup in the Azure Backup sense. Use az keyvault secret backup and az keyvault secret restore to export/import individual secrets (encrypted blob) within the same geography and subscription. Cross-tenant restore requires the original vault.',
        'Key rotation: rotate secrets by creating new versions. For crypto keys, use Key Vault\'s built-in key rotation policy (set rotation schedule and auto-rotate). Rotation is critical for leaked secret remediation — create a new version, update dependent services, then disable the old version.',
        'Alerts: configure Key Vault to emit diagnostic logs and create Azure Monitor alerts for high error rates (throttling), or for unusual access patterns (many failed get operations may indicate credential stuffing).',
      ]
    },
    {
      heading: 'Managed Identity as the Preferred Access Pattern',
      points: [
        'Using a Managed Identity to authenticate to Key Vault (rather than a stored connection string or service principal secret) eliminates the "secret needed to access secrets" bootstrapping problem — the identity itself is tied to the Azure resource and requires no credential to be stored or rotated by the application.',
        'System-assigned managed identities are tied to a single resource\'s lifecycle (deleted when the resource is deleted), while user-assigned managed identities can be shared across multiple resources and managed independently — the choice affects both flexibility and the blast radius of identity compromise.',
        'Key Vault access policies or RBAC (the newer, recommended model) determine which identities can perform which operations (get, list, set) on secrets/keys/certificates — following least-privilege here means granting only the specific operations an application genuinely needs, not blanket Key Vault access.',
        'Soft-delete and purge protection prevent accidental or malicious permanent deletion of secrets — without these enabled, a deleted secret (or an entire deleted vault) is immediately and irrecoverably gone, a serious risk for vaults holding critical production credentials.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create Vault & Secrets',
      language: 'bash',
      code: `# Create Key Vault with RBAC model (recommended)
az keyvault create \\
  --name my-kv --resource-group my-rg \\
  --location eastus \\
  --enable-rbac-authorization true \\
  --retention-days 90 \\
  --enable-purge-protection true \\
  --sku standard

# Assign current user as Key Vault Administrator
MY_OID=$(az ad signed-in-user show --query id -o tsv)
az role assignment create \\
  --assignee-object-id $MY_OID --assignee-principal-type User \\
  --role "Key Vault Administrator" \\
  --scope $(az keyvault show --name my-kv --resource-group my-rg --query id -o tsv)

# Create a secret
az keyvault secret set \\
  --vault-name my-kv \\
  --name db-password \\
  --value "SuperSecret123!"

# Get secret value
az keyvault secret show \\
  --vault-name my-kv \\
  --name db-password \\
  --query value -o tsv

# List all secret names
az keyvault secret list --vault-name my-kv --output table

# Set secret expiry
az keyvault secret set-attributes \\
  --vault-name my-kv --name db-password \\
  --expires "2026-01-01T00:00:00Z"`
    },
    {
      label: 'Key Vault Reference (App Service)',
      language: 'bash',
      code: `# 1. Enable system-assigned Managed Identity on App Service
az webapp identity assign \\
  --name my-app --resource-group my-rg

# 2. Get the MI principal ID
MI_PID=$(az webapp identity show \\
  --name my-app --resource-group my-rg \\
  --query principalId -o tsv)

# 3. Assign Key Vault Secrets User role to the MI
KV_ID=$(az keyvault show --name my-kv --resource-group my-rg --query id -o tsv)
az role assignment create \\
  --assignee-object-id $MI_PID \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope $KV_ID

# 4. Get the secret URI (versionless — always fetches latest)
SECRET_URI=$(az keyvault secret show \\
  --vault-name my-kv --name db-password \\
  --query id -o tsv | sed 's|/versions/.*||')

# 5. Set app setting as Key Vault Reference
az webapp config appsettings set \\
  --name my-app --resource-group my-rg \\
  --settings "DB_PASSWORD=@Microsoft.KeyVault(SecretUri=$SECRET_URI)"

# App reads process.env.DB_PASSWORD — gets the secret value transparently`
    },
    {
      label: 'Key Rotation & Private Endpoint',
      language: 'bash',
      code: `# Create a new version of a secret (rotation)
az keyvault secret set \\
  --vault-name my-kv \\
  --name db-password \\
  --value "NewSecret456!"  # Creates new version; old version still accessible

# List all versions of a secret
az keyvault secret list-versions \\
  --vault-name my-kv --name db-password \\
  --output table

# Disable old version after updating dependent services
az keyvault secret set-attributes \\
  --vault-name my-kv --name db-password \\
  --version <old-version-id> \\
  --enabled false

# Create Private Endpoint for Key Vault
az network private-endpoint create \\
  --name kv-pe --resource-group my-rg \\
  --vnet-name my-vnet --subnet db-subnet \\
  --private-connection-resource-id $(az keyvault show --name my-kv -g my-rg --query id -o tsv) \\
  --group-id vault --connection-name kv-conn

# Private DNS zone for Key Vault
az network private-dns zone create \\
  --resource-group my-rg \\
  --name "privatelink.vaultcore.azure.net"

az network private-dns link vnet create \\
  --resource-group my-rg \\
  --zone-name "privatelink.vaultcore.azure.net" \\
  --name kv-dns-link --virtual-network my-vnet --registration-enabled false

# Disable public access
az keyvault update \\
  --name my-kv --resource-group my-rg \\
  --public-network-access Disabled`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using the Access Policy model for new Key Vaults instead of RBAC',
      wrong: `az keyvault create --name my-kv  # Default uses access policies — vault-level, coarse-grained`,
      right: `az keyvault create --name my-kv --enable-rbac-authorization true  # RBAC model`,
      explanation: 'The legacy access policy model grants permissions at the vault level — you cannot restrict a service principal to only one specific secret. RBAC model supports per-secret scope, integrates with standard Azure RBAC tooling, and works with PIM for just-in-time access. All new Key Vaults should use the RBAC model.'
    },
    {
      title: 'Not enabling purge protection on vaults storing encryption keys',
      wrong: `az keyvault create --name my-kv  # No purge protection — a deleted vault can be purged immediately`,
      right: `az keyvault create --name my-kv --enable-purge-protection true --retention-days 90`,
      explanation: 'Without purge protection, a deleted vault (or key) can be immediately purged (permanently destroyed) before the retention period ends. If that vault holds a Customer-Managed Key for Storage or SQL, purging the key makes your data permanently inaccessible. Enable purge protection on all vaults storing encryption keys. It cannot be disabled once enabled.'
    },
    {
      title: 'Using versioned secret URI in Key Vault References (pins to old version)',
      wrong: `@Microsoft.KeyVault(SecretUri=https://my-kv.vault.azure.net/secrets/db-password/abc123version)`,
      right: `@Microsoft.KeyVault(SecretUri=https://my-kv.vault.azure.net/secrets/db-password/)  # versionless`,
      explanation: 'A versioned URI (with /versions/{id}) always returns that exact version — rotation creates a new version, but the app still reads the old one. Use the versionless URI (no version segment) so that after you rotate the secret and the new version becomes current, App Service automatically picks it up on the next platform secret resolution cycle.'
    },
    {
      title: 'Storing Key Vault access keys or connection strings in application config',
      wrong: `# App config: KEYVAULT_CLIENT_SECRET=abc123  # Defeats the purpose of Key Vault`,
      right: `# Use Managed Identity — no credentials needed: new DefaultAzureCredential()`,
      explanation: 'Storing credentials to authenticate to Key Vault in config is circular: you need secrets to access the secret store. Use Managed Identity — the Azure platform handles authentication automatically. The app calls Key Vault with no secrets in config. This is the entire point of Managed Identity: eliminate the bootstrap secret problem.'
    },
  ];

  challenge: Challenge = {
    title: 'Secret version manager',
    language: 'typescript',
    description: 'Simulate Key Vault secret versioning. Implement a SecretStore class with:\n- setSecret(name: string, value: string): string — stores a new version, returns version ID (v1, v2, …)\n- getSecret(name: string, version?: string): string | null — returns value at version, or latest if no version given\n- listVersions(name: string): string[] — returns all version IDs for the secret, oldest first',
    hints: [
      'Store secrets as a Map<name, Array<{version, value}>>',
      'Version IDs can be simple: "v1", "v2", ...',
      'getSecret with no version returns the last item in the array',
      'Return null if the secret name does not exist',
    ],
    starterCode: `export class SecretStore {
  private store = new Map<string, { version: string; value: string }[]>();

  setSecret(name: string, value: string): string { return ''; }
  getSecret(name: string, version?: string): string | null { return null; }
  listVersions(name: string): string[] { return []; }
}`,
    solution: `export class SecretStore {
  private store = new Map<string, { version: string; value: string }[]>();

  setSecret(name: string, value: string): string {
    const versions = this.store.get(name) ?? [];
    const version = 'v' + (versions.length + 1);
    versions.push({ version, value });
    this.store.set(name, versions);
    return version;
  }

  getSecret(name: string, version?: string): string | null {
    const versions = this.store.get(name);
    if (!versions || versions.length === 0) return null;
    if (!version) return versions[versions.length - 1].value;
    return versions.find(v => v.version === version)?.value ?? null;
  }

  listVersions(name: string): string[] {
    return (this.store.get(name) ?? []).map(v => v.version);
  }
}

const kv = new SecretStore();
console.log(kv.setSecret('db-pass', 'Secret1'));   // 'v1'
console.log(kv.setSecret('db-pass', 'Secret2'));   // 'v2'
console.log(kv.getSecret('db-pass'));               // 'Secret2' (latest)
console.log(kv.getSecret('db-pass', 'v1'));         // 'Secret1'
console.log(kv.listVersions('db-pass'));            // ['v1', 'v2']`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the recommended permission model for new Azure Key Vaults?',
      options: ['Vault Access Policies', 'Azure RBAC', 'Service Endpoint policies', 'Shared Access Signatures'],
      answer: 1,
      explanation: 'Azure RBAC is the recommended model for new Key Vaults (--enable-rbac-authorization true). It supports per-secret scope, integrates with standard Azure RBAC tooling (az role assignment, PIM), and provides more granular control than the legacy access policy model which is vault-level only.'
    },
    {
      q: 'What does purge protection do in Azure Key Vault?',
      options: [
        'Prevents secrets from being overwritten with new versions',
        'Prevents soft-deleted vaults and objects from being permanently destroyed until the retention period expires',
        'Encrypts secrets with a customer-managed key automatically',
        'Prevents unauthorized access by blocking public network access'
      ],
      answer: 1,
      explanation: 'Purge protection prevents anyone (including administrators and Microsoft) from permanently destroying a soft-deleted vault or secret until the configured retention period (7–90 days) expires. Essential when the vault holds CMK encryption keys — purging them would make all encrypted data permanently inaccessible.'
    },
    {
      q: 'What syntax is used for a Key Vault Reference in Azure App Service?',
      options: [
        '{{keyvault:my-kv/secrets/db-password}}',
        '@Microsoft.KeyVault(SecretUri=https://my-kv.vault.azure.net/secrets/db-password/)',
        'keyvault://my-kv/db-password',
        '${KEYVAULT:db-password}'
      ],
      answer: 1,
      explanation: 'App Service Key Vault References use the syntax @Microsoft.KeyVault(SecretUri=...) as the app setting value. The platform resolves this at runtime using the app\'s Managed Identity, injecting the secret value into the environment. The app sees the resolved value — no Key Vault SDK needed in code.'
    },
    {
      q: 'What is the difference between a software-protected key and an HSM-protected key?',
      options: [
        'Software keys support only AES; HSM keys support RSA and EC',
        'HSM-protected keys never leave the hardware in plaintext — crypto operations happen inside the HSM; software keys are encrypted at rest by the platform',
        'Software keys are free; HSM keys require Premium SKU',
        'HSM keys can only be used for signing; software keys support all operations'
      ],
      answer: 1,
      explanation: 'With HSM-protected keys (Key Vault Premium SKU), the private key is generated inside a FIPS 140-2 Level 2/3 validated HSM and never leaves it in plaintext. All cryptographic operations (sign, encrypt) happen inside the HSM. Software-protected keys (Standard SKU) are stored encrypted by the platform but are processed in software — a difference that matters for compliance and key security.'
    },
    {
      q: 'Why should you use a versionless secret URI in Key Vault References instead of a versioned one?',
      options: [
        'Versioned URIs are more expensive per request',
        'A versionless URI always fetches the current (latest) version — enabling secret rotation without app redeployment',
        'Versionless URIs bypass access policies',
        'Versioned URIs require HSM-protected keys'
      ],
      answer: 1,
      explanation: 'A versionless URI (https://my-kv.vault.azure.net/secrets/db-password/) always resolves to the current version. When you rotate a secret (create a new version), App Service picks up the new value automatically at the next platform resolution cycle. A versioned URI pins the app to a specific version — rotation creates a new version, but the app still reads the old one until the reference is manually updated.'
    },
    {
      q: 'What is the difference between Key Vault access policies and Azure RBAC for Key Vault?',
      options: [
        'Access policies support more granular permissions than RBAC',
        'RBAC is the legacy model; access policies are the modern approach',
        'Access policies are vault-level; Azure RBAC supports per-object (key/secret/certificate) permissions',
        'There is no functional difference they are identical',
      ],
      answer: 2,
      explanation: 'Key Vault access policies grant permissions at the vault level. Azure RBAC for Key Vault supports finer-grained permissions at the individual key, secret, or certificate level using standard Azure roles.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you rotate a secret in Key Vault without downtime?',
      a: '(1) Create a new version of the secret in Key Vault (az keyvault secret set). (2) If using Key Vault References with a versionless URI, App Service picks up the new version automatically within 24 hours by default (it caches resolved values and refetches on that schedule) — an app setting/config change triggers an immediate refetch, or you can force one via a POST to the app\'s configreferences/appsettings/refresh management API endpoint. (3) If the app reads secrets via SDK, implement secret caching with TTL (e.g. cache for 1 hour) — the app will pick up the new version after the cache expires. (4) Disable the old version after confirming all dependents have rotated to the new version. (5) For high-availability rotation, some teams deploy with two active secret versions briefly, then disable the old one.'
    },
    {
      q: 'When should I use Key Vault for keys vs just for secrets?',
      a: 'Use Key Vault <strong>Keys</strong> when: you need to perform cryptographic operations (encrypt, sign, verify) and want those operations to happen server-side in the HSM — the key never leaves Key Vault, your app calls the Key Vault API to encrypt/sign data. This is used for BYOK (bring your own key), CMK for storage/SQL/Cosmos, code signing, and envelope encryption. Use Key Vault <strong>Secrets</strong> when you just need to store and retrieve a string value (connection string, API key, password) — the secret travels to your app as a plaintext string once retrieved.'
    },
    {
      q: 'What is the Key Vault throttling limit and how do you handle it?',
      a: 'Key Vault has per-vault throttle limits: 2,000 secret GET operations per 10 seconds, 200 PUT operations per 10 seconds. At scale, many app instances reading secrets on every request will exceed this. Mitigation: (1) <strong>Cache secrets in memory</strong> with a TTL (e.g., SecretClient with a caching wrapper) — fetch from Key Vault at startup or cache expiry, not per-request. (2) Use <strong>App Configuration + Key Vault References</strong> — App Configuration fetches from Key Vault and caches, reducing direct KV calls. (3) Use <strong>Key Vault References in App Service</strong> — the platform caches the resolved value.'
    },
    {
      q: 'How does Key Vault soft delete and recovery work?',
      a: 'When you delete a secret, key, or certificate (or the entire vault), it enters a <strong>soft-deleted</strong> state for the configured retention period (7–90 days). During this time, the name is reserved — you cannot create a new secret with the same name until the deleted one is either recovered or purged. To recover: az keyvault secret recover --vault-name my-kv --name my-secret. To permanently destroy before the retention period: az keyvault secret purge (blocked if purge protection is enabled). This prevents accidental permanent data loss from fat-finger deletions.'
    },
    {
      q: 'What is Managed HSM and how does it differ from Key Vault Premium?',
      a: '<strong>Key Vault Premium</strong>: shared multi-tenant HSM pool. Your keys are HSM-protected, but the HSM is shared with other Azure customers (hardware partitioning). Meets FIPS 140-2 Level 2. <strong>Azure Managed HSM</strong>: a dedicated single-tenant HSM cluster (3 HSM instances) that only you control. The HSM quorum keys are managed by you — even Microsoft cannot access them. Meets FIPS 140-2 Level 3. Required for the highest compliance regimes (government, financial, healthcare). Significantly more expensive than Key Vault Premium.'
    },
    {
      q: 'How should applications retrieve Key Vault secrets without storing credentials?',
      a: 'Use a <strong>managed identity</strong> assigned to the compute resource (VM, App Service, Function, AKS pod). Grant the identity <code>Key Vault Secrets User</code> role (RBAC) or a get permission (access policy). The app calls the Key Vault SDK or REST API — Azure transparently provides a token for the managed identity with no stored credentials.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Key Vault centrally stores secrets, cryptographic keys, and certificates — accessed via Managed Identity and RBAC, with soft delete, purge protection, and Key Vault References eliminating secrets from application config.',
    mustKnow: [
      'Three object types: Secrets (strings), Keys (RSA/EC crypto), Certificates (X.509 with private key)',
      'RBAC model (--enable-rbac-authorization) is preferred over legacy access policies for new vaults',
      'Key Vault Reference syntax: @Microsoft.KeyVault(SecretUri=...) in App Service/Functions settings',
      'Use versionless URI in references so secret rotation is picked up automatically',
      'Purge protection: once enabled, soft-deleted objects cannot be permanently destroyed until retention period expires',
      'Cache Key Vault secrets with TTL — 2,000 GET ops per 10 seconds throttle limit per vault',
    ],
    interviewFocus: [
      'How do Key Vault References eliminate secrets from application configuration?',
      'What is the difference between RBAC model and Access Policies for Key Vault permissions?',
      'Why enable purge protection on vaults holding encryption keys?',
      'How do you rotate a secret without application downtime?',
    ],
  };
}
