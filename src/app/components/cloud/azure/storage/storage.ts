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
  selector: 'app-azure-storage',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './storage.html',
  styleUrl: './storage.scss'
})
export class AzureStorage {

  quickRef: QuickRefItem[] = [
    { name: 'Blob Storage', type: 'type', desc: 'Object store for unstructured data. Three tiers: Hot (frequent access), Cool (≥30 days), Archive (≥180 days, offline). Containers hold blobs.' },
    { name: 'Azure Files', type: 'type', desc: 'Fully managed SMB/NFS file shares mountable on Windows, Linux, macOS. Useful as a drop-in replacement for on-premises file servers.' },
    { name: 'Queue Storage', type: 'type', desc: 'Simple message queue for decoupling services. Messages up to 64 KB, TTL up to 7 days. Used by Azure Functions queue triggers.' },
    { name: 'Table Storage', type: 'type', desc: 'NoSQL key-value store for structured data without relationships. Cosmos DB Table API is the modern upgrade with global distribution.' },
    { name: 'SAS Token', type: 'type', desc: 'Shared Access Signature — time-limited, scoped URI token granting specific access rights (read/write/delete) to storage resources without exposing account keys.' },
    { name: 'Lifecycle Policy', type: 'type', desc: 'Automated rules to tier blobs from Hot → Cool → Archive or delete them after N days based on last-modified or last-accessed time.' },
    { name: 'Storage Firewall', type: 'type', desc: 'Restricts storage account access to specific VNet subnets (service endpoints) or IP ranges. Combined with Private Endpoints for full isolation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Blob Storage & Access Tiers',
      points: [
        'Blob storage organises data into storage accounts → containers → blobs. Blob types: Block Blob (files, backups), Append Blob (logging), Page Blob (VHDs). Block Blob is used for almost all application data.',
        'Access tiers control cost: Hot (most expensive storage, cheapest access) → Cool (cheaper storage, higher access cost, 30-day minimum) → Cold (cheaper still, 90-day minimum) → Archive (cheapest storage, offline, 180-day minimum, 1–15 hour rehydration to Hot/Cool).',
        'Tier can be set at the storage account level (default) or overridden per blob. Archive blobs must be rehydrated (priority: Standard 1–15h, High <1h) before they can be read — there is no direct read from Archive.',
        'LRS (Locally Redundant Storage) keeps 3 copies in one datacenter. ZRS (Zone-Redundant) keeps 3 copies across AZs in one region. GRS/GZRS add async replication to a paired region. Use ZRS or GZRS for production.',
        'Versioning, soft delete, and point-in-time restore protect against accidental deletion and overwrite. Enable these before exposing storage to application writes.',
      ]
    },
    {
      heading: 'SAS Tokens & Access Control',
      points: [
        'A Shared Access Signature (SAS) is a URL query string that grants scoped, time-limited access to storage. Types: Account SAS (access across services), Service SAS (one service), User Delegation SAS (signed with Entra ID — preferred for security).',
        'SAS parameters include: signedStart/Expiry, signedPermissions (r=read, w=write, d=delete, l=list), signedResource (b=blob, c=container), and optionally signedIp (IP restriction) and signedProtocol (https only).',
        'Stored Access Policies are server-side policies attached to a container. A SAS can reference a policy by name instead of embedding permissions directly — this allows revoking the SAS before its expiry by deleting the policy.',
        'For server-side access: use Managed Identity + RBAC (Storage Blob Data Reader/Contributor roles) instead of SAS or account keys. Account keys give full storage account access and should be rotated regularly or disabled entirely (Azure AD–only mode).',
        'CORS policies on storage accounts allow browser JavaScript to access Blob or Table endpoints from permitted origins — configure per service (Blob, File, Queue, Table) with allowed origins, methods, and headers.',
      ]
    },
    {
      heading: 'Azure Files & Queue Storage',
      points: [
        'Azure Files provides SMB 3.0/3.1.1 and NFS 4.1 file shares. Use cases: lift-and-shift of legacy apps with file share dependencies, shared configuration across VMs, profile storage for Windows Virtual Desktop (FSLogix).',
        'Azure File Sync extends on-premises Windows file servers to the cloud — files tier to Azure, local cache is served fast, and cloud tiering frees on-premises disk while keeping frequently used files locally.',
        'Premium Azure Files (SSD-backed) for latency-sensitive workloads; Standard (HDD) for general use. Pricing is provisioned: pay per GB provisioned, not used — size up correctly to avoid unexpected costs.',
        'Queue Storage is ideal for decoupling: a web front-end writes messages to a queue, and background workers pull and process them at their own pace. Maximum message size is 64 KB; use Blob references for larger payloads.',
        'For complex messaging (ordering, sessions, dead-letter, pub/sub), use Service Bus instead of Queue Storage. Queue Storage is simpler and cheaper for at-least-once delivery without ordering requirements.',
      ]
    },
    {
      heading: 'Lifecycle Policies & Storage Firewall',
      points: [
        'Lifecycle Management policies automatically transition blobs between tiers or delete them based on age. Rules use filters (prefix, blob type) and actions (tierToCool, tierToArchive, delete) with conditions (daysAfterModificationGreaterThan, daysAfterLastAccessTimeGreaterThan).',
        'Enable last access time tracking in the storage account before using daysAfterLastAccessTimeGreaterThan — it is not tracked by default and must be enabled explicitly (small performance cost).',
        'Storage Firewall (network rules): add "Selected networks" mode, then allow specific VNet subnets (requires Service Endpoint on the subnet for the storage service) or specific IP ranges. The "Allow Azure services to access this storage account" exception is required for Azure Monitor, Azure Backup, and similar built-in services.',
        'Private Endpoints are stronger: create a private NIC with a private IP for the storage account inside your VNet. With a private endpoint, you can disable public internet access entirely — traffic never leaves the Azure backbone.',
        'Customer-Managed Keys (CMK): by default Azure encrypts storage data with Microsoft-managed keys. CMK lets you bring your own key from Azure Key Vault — required for compliance scenarios where you control the encryption key lifecycle.',
      ]
    },
    {
      heading: 'Storage Redundancy Options and Their Tradeoffs',
      points: [
        'Locally Redundant Storage (LRS) replicates data three times within a single datacenter — the cheapest option, but offers no protection against a datacenter-level outage, unlike Zone-Redundant Storage (ZRS) or Geo-Redundant Storage (GRS).',
        'Zone-Redundant Storage (ZRS) replicates across multiple Availability Zones within a region, protecting against a datacenter failure while keeping data within the same region — a middle ground between LRS\'s low cost and GRS\'s full geographic protection.',
        'Geo-Redundant Storage (GRS) replicates data to a secondary, paired region hundreds of miles away, protecting against a full regional outage — but the secondary copy is not readable by default (unless RA-GRS is used) and failover to it is a manual (or, for GZRS, automatic) process, not instant.',
        'Higher redundancy tiers cost more and, for geo-replication, introduce eventual consistency between primary and secondary copies — the appropriate tier should be chosen based on the actual business impact of data loss or unavailability for that specific storage account\'s data.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create Storage & Upload',
      language: 'bash',
      code: `# Create storage account (ZRS for zone redundancy)
az storage account create \\
  --name mystorageacct --resource-group my-rg \\
  --location eastus \\
  --sku Standard_ZRS \\
  --kind StorageV2 \\
  --access-tier Hot \\
  --min-tls-version TLS1_2 \\
  --allow-blob-public-access false

# Create container (private)
az storage container create \\
  --name mycontainer \\
  --account-name mystorageacct \\
  --auth-mode login  # Use Entra ID — not account key

# Upload blob
az storage blob upload \\
  --container-name mycontainer \\
  --file ./myfile.pdf \\
  --name docs/myfile.pdf \\
  --account-name mystorageacct \\
  --auth-mode login

# List blobs
az storage blob list \\
  --container-name mycontainer \\
  --account-name mystorageacct \\
  --auth-mode login --output table`
    },
    {
      label: 'SAS Token & Lifecycle Policy',
      language: 'bash',
      code: `# Generate User Delegation SAS (preferred — uses Entra ID, not account key)
az storage blob generate-sas \\
  --account-name mystorageacct \\
  --container-name mycontainer \\
  --name docs/myfile.pdf \\
  --permissions r \\
  --expiry 2025-12-31T23:59:00Z \\
  --auth-mode login \\
  --as-user

# Lifecycle management policy (JSON rule definition)
# tier blobs to Cool after 30 days, Archive after 90, delete after 365
az storage account management-policy create \\
  --account-name mystorageacct \\
  --resource-group my-rg \\
  --policy '{
    "rules": [{
      "name": "tiering-rule",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": ["blockBlob"] },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      }
    }]
  }'`
    },
    {
      label: 'Storage Firewall & Private Endpoint',
      language: 'bash',
      code: `# Set storage to selected networks only (disable default access)
az storage account update \\
  --name mystorageacct --resource-group my-rg \\
  --default-action Deny

# Allow a specific subnet (service endpoint must be enabled on subnet)
az storage account network-rule add \\
  --account-name mystorageacct --resource-group my-rg \\
  --vnet-name my-vnet --subnet web-subnet

# Allow Azure trusted services (Monitor, Backup, etc.)
az storage account update \\
  --name mystorageacct --resource-group my-rg \\
  --bypass AzureServices

# Create private endpoint for blob service
az network private-endpoint create \\
  --name storage-pe --resource-group my-rg \\
  --vnet-name my-vnet --subnet db-subnet \\
  --private-connection-resource-id \\
    /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/mystorageacct \\
  --group-id blob \\
  --connection-name storage-conn

# Disable public blob access after private endpoint is live
az storage account update \\
  --name mystorageacct --resource-group my-rg \\
  --public-network-access Disabled`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Enabling public blob access on a storage account',
      wrong: `az storage account create --allow-blob-public-access true  # Any blob container can be made public`,
      right: `az storage account create --allow-blob-public-access false  # Enforce private at account level`,
      explanation: 'When allow-blob-public-access is true, individual containers can be set to public access (anonymous read). Disable it at the account level so that even if a container is accidentally set to public, the account-level setting blocks anonymous access. This is a Microsoft security best practice.'
    },
    {
      title: 'Using account keys instead of Managed Identity for application access',
      wrong: `# App config: StorageConnectionString=DefaultEndpointsProtocol=https;AccountKey=xxx`,
      right: `# Use Managed Identity: new BlobServiceClient(uri, new DefaultAzureCredential())`,
      explanation: 'Account keys grant full unrestricted access to all storage services. If leaked, they cannot be scoped or revoked without regenerating the key (which breaks all apps using it). Use Managed Identity + RBAC roles (Storage Blob Data Reader/Contributor) — scoped, auditable, no secrets to manage.'
    },
    {
      title: 'Trying to read a blob directly from Archive tier',
      wrong: `az storage blob download --name archived.pdf  # Error: BlobArchived — cannot read Archive blobs directly`,
      right: `# Rehydrate first: az storage blob set-tier --tier Cool --rehydrate-priority Standard`,
      explanation: 'Archive tier blobs are stored offline. You cannot read or copy from Archive directly. You must first rehydrate the blob to Hot or Cool tier (Standard: 1–15 hours; High Priority: <1 hour for blobs under 10 GB). Plan archive retrieval time into workflows that may need archived data.'
    },
    {
      title: 'Setting a lifecycle policy without enabling last-access-time tracking',
      wrong: `# Policy uses daysAfterLastAccessTimeGreaterThan but tracking not enabled — rule silently skipped`,
      right: `az storage account blob-service-properties update --enable-last-access-tracking true`,
      explanation: 'Last access time tracking must be explicitly enabled on the storage account before using daysAfterLastAccessTimeGreaterThan in lifecycle rules. Without it, the condition is never true and the rule never fires. There is a small performance overhead to tracking last access time, but it\'s worth it for accurate tiering.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse and validate an Azure SAS token',
    language: 'typescript',
    description: 'Write parseSasToken(url: string): { container: string; blob: string; permissions: string[]; expiresAt: Date | null } that extracts info from an Azure Blob SAS URL like:\nhttps://myacct.blob.core.windows.net/mycontainer/myfile.pdf?sp=r&se=2025-12-31T00:00:00Z&sv=2023-11-03&sr=b&sig=xxx\n\nPermission codes: r=read, w=write, d=delete, l=list, a=add, c=create.',
    hints: [
      'Use URL constructor to parse the href and searchParams',
      'sp param contains permission chars — split into individual strings',
      'se param is the expiry in ISO 8601 — parse with new Date()',
      'Extract container and blob from pathname (split by /)',
    ],
    starterCode: `export function parseSasToken(url: string): {
  container: string; blob: string;
  permissions: string[]; expiresAt: Date | null;
} {
  // parse url and extract fields
  return { container: '', blob: '', permissions: [], expiresAt: null };
}`,
    solution: `const PERM_MAP: Record<string, string> = {
  r: 'read', w: 'write', d: 'delete', l: 'list', a: 'add', c: 'create'
};

export function parseSasToken(url: string): {
  container: string; blob: string;
  permissions: string[]; expiresAt: Date | null;
} {
  const parsed = new URL(url);
  const parts = parsed.pathname.replace(/^\\//, '').split('/');
  const container = parts[0] ?? '';
  const blob = parts.slice(1).join('/');
  const sp = parsed.searchParams.get('sp') ?? '';
  const permissions = sp.split('').map(c => PERM_MAP[c] ?? c);
  const se = parsed.searchParams.get('se');
  const expiresAt = se ? new Date(se) : null;
  return { container, blob, permissions, expiresAt };
}

const result = parseSasToken(
  'https://myacct.blob.core.windows.net/mycontainer/docs/file.pdf?sp=rw&se=2025-12-31T00:00:00Z&sv=2023-11-03&sr=b&sig=xxx'
);
console.log(result);
// { container: 'mycontainer', blob: 'docs/file.pdf', permissions: ['read','write'], expiresAt: Date(2025-12-31) }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What must you do before you can read a blob that is in Archive tier?',
      options: [
        'Delete and re-upload the blob in Hot tier',
        'Rehydrate the blob to Hot or Cool tier first (takes 1–15 hours)',
        'Change the storage account tier to Hot',
        'Enable ZRS redundancy on the storage account'
      ],
      answer: 1,
      explanation: 'Archive tier blobs are stored offline and cannot be read directly. You must rehydrate them to Hot or Cool tier: Standard priority (1–15 hours) or High priority (<1 hour for blobs under 10 GB). Plan your data retrieval workflows to account for rehydration time.'
    },
    {
      q: 'Which SAS token type is the most secure for delegating access to clients?',
      options: [
        'Account SAS signed with the storage account key',
        'Service SAS signed with the storage account key',
        'User Delegation SAS signed with an Entra ID credential',
        'Stored Access Policy SAS'
      ],
      answer: 2,
      explanation: 'User Delegation SAS is signed with an Entra ID OAuth token (az storage blob generate-sas --as-user) rather than the account key. This means access can be revoked via Entra ID without rotating the account key, and it provides better audit trails. It is the recommended approach for delegating blob access.'
    },
    {
      q: 'What does a Stored Access Policy allow you to do that a regular SAS cannot?',
      options: [
        'Grant access to files in Azure Files shares',
        'Revoke a SAS before its embedded expiry time by deleting the server-side policy',
        'Allow anonymous read access to containers',
        'Set permissions at the storage account level'
      ],
      answer: 1,
      explanation: 'A regular SAS embeds all permissions and expiry in the URL — once issued it cannot be revoked until it expires. A Stored Access Policy is a server-side policy linked by name in the SAS. Deleting or modifying the policy instantly invalidates any SAS that references it, even before the embedded expiry.'
    },
    {
      q: 'Which redundancy option replicates data across multiple availability zones in the same region?',
      options: ['LRS (Locally Redundant Storage)', 'GRS (Geo-Redundant Storage)', 'ZRS (Zone-Redundant Storage)', 'RA-GRS (Read-Access Geo-Redundant)'],
      answer: 2,
      explanation: 'ZRS synchronously replicates data across 3 availability zones in the same region, providing resilience against datacenter failures. LRS keeps 3 copies in one datacenter. GRS replicates asynchronously to a paired region but is not zone-redundant within the primary region. GZRS combines ZRS + GRS for maximum durability.'
    },
    {
      q: 'What is the "Allow Azure services" exception in Storage Firewall needed for?',
      options: [
        'To allow blob anonymous access from the internet',
        'To allow built-in Azure services (Monitor, Backup, etc.) to access storage when default action is Deny',
        'To enable Private Endpoint connectivity',
        'To allow cross-region replication'
      ],
      answer: 1,
      explanation: 'When the storage account default action is Deny, many trusted Azure services (Azure Monitor, Azure Backup, Azure Site Recovery, Azure Data Factory) cannot reach the storage account unless you enable the "Allow trusted Microsoft services" exception (--bypass AzureServices). Without it, diagnostic logs, backups, and other Azure-native integrations break silently.'
    },
    {
      q: 'What does GZRS (Geo-Zone-Redundant Storage) combine?',
      options: [
        'LRS within a single zone plus a secondary region with LRS',
        'ZRS within the primary region plus asynchronous replication to a secondary region with LRS',
        'GRS across two regions with no zone redundancy',
        'Three synchronous copies in one zone plus two in a remote region',
      ],
      answer: 1,
      explanation: 'GZRS combines ZRS (three synchronous copies across availability zones in the primary region) with GRS (one asynchronous copy in a secondary region) protecting against both zone-level and regional failures.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Azure Files instead of Blob Storage?',
      a: 'Use <strong>Azure Files</strong> when you need a network file system mountable with SMB or NFS — lift-and-shift of apps that use UNC paths, Windows profile storage (FSLogix for Azure Virtual Desktop), or shared config/logs across multiple VMs. Use <strong>Blob Storage</strong> for object storage accessed via REST API or SDK — media files, backups, static website content, data lake files. If the application expects to "open a file" via a file system path, Azure Files. If it accesses objects via URL or SDK, Blob Storage.'
    },
    {
      q: 'What is the difference between LRS, ZRS, GRS, and GZRS?',
      a: '<strong>LRS</strong>: 3 synchronous copies in one datacenter — survives hardware failure but not datacenter failure. <strong>ZRS</strong>: 3 synchronous copies across 3 availability zones in one region — survives zone failure. <strong>GRS</strong>: LRS in primary region + async copy to secondary paired region — survives regional disaster but the secondary is not readable unless Microsoft initiates failover. <strong>GZRS</strong>: ZRS in primary + async to secondary — the most durable option. For production: use ZRS or GZRS.'
    },
    {
      q: 'What is the difference between a Service Endpoint and a Private Endpoint for Storage?',
      a: 'A <strong>Service Endpoint</strong> adds the subnet\'s identity to the storage account firewall — traffic still routes through the Azure backbone but exits the VNet. The storage account still has a public hostname. A <strong>Private Endpoint</strong> creates a NIC with a private VNet IP for the storage account — traffic never leaves the VNet. You can then disable the storage account\'s public endpoint entirely, giving the strongest isolation. Private Endpoints require a private DNS zone (privatelink.blob.core.windows.net) for hostname resolution.'
    },
    {
      q: 'What are Customer-Managed Keys (CMK) and when are they required?',
      a: 'By default, Azure encrypts all storage data at rest using Microsoft-managed keys (AES-256). With <strong>CMK</strong>, you bring your own key from Azure Key Vault — you control the key lifecycle (rotation, revocation). CMK is required for compliance scenarios (FedRAMP, HIPAA, ISO 27001, financial regulations) where you must demonstrate control over encryption keys. Revoking the CMK immediately makes all data in the storage account inaccessible — use with care and ensure key expiry is managed.'
    },
    {
      q: 'How does blob versioning differ from soft delete?',
      a: '<strong>Soft delete</strong>: when a blob is deleted or overwritten, Azure retains it in a deleted state for a configurable retention period (1–365 days). You can restore it within that window. <strong>Blob versioning</strong>: every write (overwrite, metadata update) automatically creates a new version — you retain a full history of all versions. Versioning is stronger (preserves every change) but costs more in storage. Enable both for critical data: soft delete catches accidental deletes, versioning enables point-in-time rollback to any prior state.'
    },
    {
      q: 'What is Azure Blob Storage lifecycle management and how does it reduce cost?',
      a: 'Lifecycle management policies automatically transition blobs between tiers (Hot > Cool > Cold > Archive) or delete them based on rules (last modified time, last access time). Example: move to Cool after 30 days, Archive after 90 days, delete after 365 days. Archive tier is 80%+ cheaper than Hot but has rehydration latency of hours.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Storage offers Blob (object store), Files (SMB/NFS shares), Queue (messaging), and Table (NoSQL) — with access tiers (Hot/Cool/Archive), SAS tokens, lifecycle policies, and network isolation via Private Endpoints.',
    mustKnow: [
      'Blob tiers: Hot (frequent) → Cool (30-day min) → Cold (90-day min) → Archive (180-day min, offline)',
      'Archive blobs must be rehydrated (1–15h Standard, <1h High Priority) before reading',
      'User Delegation SAS (signed with Entra ID) is more secure than account-key SAS',
      'Stored Access Policy enables server-side revocation of SAS before expiry',
      'ZRS = 3 copies across AZs same region; GZRS = ZRS + async to secondary region',
      'Private Endpoint + disable public access = strongest storage network isolation',
    ],
    interviewFocus: [
      'Explain the blob access tiers and when you would use Archive tier',
      'What is the difference between Service Endpoint and Private Endpoint for Storage?',
      'How do Stored Access Policies enable SAS revocation?',
      'Why use Managed Identity instead of account keys for application access to storage?',
    ],
  };
}
