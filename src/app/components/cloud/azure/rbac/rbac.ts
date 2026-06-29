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
  selector: 'app-azure-rbac',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rbac.html',
  styleUrl: './rbac.scss'
})
export class AzureRbac {

  quickRef: QuickRefItem[] = [
    { name: 'Owner', type: 'type', desc: 'Full access to all resources + ability to grant access to others. Includes all Contributor actions plus the ability to manage role assignments.' },
    { name: 'Contributor', type: 'type', desc: 'Create and manage all Azure resources but cannot grant access or manage role assignments. Most CI/CD pipelines use Contributor.' },
    { name: 'Reader', type: 'type', desc: 'View all resources but cannot make any changes. Good for read-only monitoring or audit access.' },
    { name: 'Scope', type: 'type', desc: 'Where a role is applied: Management Group > Subscription > Resource Group > Resource. Assignments are inherited downward.' },
    { name: 'Managed Identity', type: 'type', desc: 'Automatic service principal for Azure resources — no credentials to manage. System-assigned (tied to resource) or user-assigned (independent, shareable).' },
    { name: 'Custom Role', type: 'type', desc: 'User-defined role with a specific set of allowed actions (Microsoft.Storage/blobs/read), not-actions, and data actions. Assigned like built-in roles.' },
    { name: 'Deny Assignment', type: 'type', desc: 'Explicitly blocks specific actions regardless of role assignments. Set by Azure Blueprints and Managed Applications — cannot be created directly by users.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'RBAC Scope Hierarchy',
      points: [
        'Azure RBAC uses a scope hierarchy: Management Group → Subscription → Resource Group → Individual Resource. Role assignments at a higher scope are inherited by all child scopes.',
        'A role assignment has three parts: Security Principal (who — user, group, service principal, managed identity), Role Definition (what — set of allowed actions), and Scope (where — the resource or container).',
        'Role assignments are additive: a user can have multiple role assignments across scopes. The effective permissions are the union of all assignments. There are no deny rules in regular RBAC (only Deny Assignments created by Blueprints/Managed Apps).',
        'Built-in roles cover most scenarios. Key resource-specific roles: Storage Blob Data Contributor (read/write/delete blobs), Key Vault Secrets User (read secrets), Cosmos DB Account Reader Role, Monitoring Reader.',
        'Role assignments take effect within a few minutes of creation but propagation across all Azure services can take up to 30 minutes — account for this in deployment pipelines.',
      ]
    },
    {
      heading: 'Built-in vs Custom Roles',
      points: [
        'Azure has 300+ built-in roles. Always prefer built-in roles — they are maintained by Microsoft, tested, and have documented action sets. Only create custom roles when no built-in role provides the right combination of permissions.',
        'Role definitions contain: Actions (control plane — Azure Resource Manager operations), NotActions (subtract from Actions), DataActions (data plane — e.g. blob read/write), NotDataActions, and AssignableScopes.',
        'Actions use a namespace/resource-type/operation format: Microsoft.Compute/virtualMachines/start/action, Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read. Wildcards are supported: Microsoft.Storage/storageAccounts/*.',
        'Custom roles have an assignable scope — they can only be assigned at or below the listed scopes. A custom role scoped to a subscription cannot be assigned at a management group level.',
        'Azure Blueprints and Policy can enforce role assignments at scale across subscriptions — use these for organisation-wide RBAC governance rather than manual per-subscription assignments.',
      ]
    },
    {
      heading: 'Managed Identities',
      points: [
        'Managed Identity gives an Azure resource (VM, App Service, Functions, AKS pod) an automatic service principal in Entra ID. The Azure platform manages credential rotation — the application never handles a secret.',
        'System-assigned MI: enabled directly on the resource. The MI is deleted when the resource is deleted. One resource → one identity. Simplest for single-resource deployments.',
        'User-assigned MI: created as a separate Azure resource. Can be assigned to multiple Azure resources — a fleet of VMs can all use the same MI with the same RBAC assignments. Must be explicitly deleted.',
        'Inside a VM or App Service, the application gets a token by calling the local IMDS endpoint (http://169.254.169.254/metadata/identity/oauth2/token) or using DefaultAzureCredential from the Azure SDK — which automatically tries Managed Identity among other credential sources.',
        'Workload Identity Federation extends managed-identity-style authentication to non-Azure workloads (GitHub Actions, AKS pods) via OIDC federation — the workload exchanges an OIDC token for an Entra ID token, no secret needed.',
      ]
    },
    {
      heading: 'Least Privilege & Access Reviews',
      points: [
        'Principle of Least Privilege: grant only the minimum permissions needed. Prefer resource-group or resource scope over subscription scope. Prefer data-plane roles (Storage Blob Data Reader) over control-plane roles (Contributor) for application access.',
        'Avoid Owner assignments for service principals and CI/CD pipelines — Contributor is sufficient for most deployment scenarios. Owner is only needed when the deployment itself creates role assignments.',
        'Entra ID Access Reviews (requires P2): periodic reviews where role holders must re-justify their access. Unused or unjustified access is automatically removed. Use for privileged roles and Guest user access.',
        'PIM (Privileged Identity Management) makes high-privilege roles eligible rather than permanently active — activated JIT with MFA and justification. Combine with Access Reviews for full privilege lifecycle management.',
        'Azure Policy can enforce RBAC compliance: deny assignments outside approved scopes, require tags, or audit resources without specific RBAC configurations. Policy and RBAC together form the governance backbone.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Role Assignments',
      language: 'bash',
      code: `# Assign built-in role to a user at resource group scope
az role assignment create \\
  --assignee user@example.com \\
  --role "Storage Blob Data Contributor" \\
  --scope /subscriptions/<subId>/resourceGroups/my-rg

# Assign Contributor to a service principal at subscription scope
SP_OID=$(az ad sp show --id <client-id> --query id -o tsv)
az role assignment create \\
  --assignee-object-id $SP_OID \\
  --assignee-principal-type ServicePrincipal \\
  --role "Contributor" \\
  --scope /subscriptions/<subId>

# List all role assignments for a resource group
az role assignment list \\
  --resource-group my-rg \\
  --output table

# Remove a role assignment
az role assignment delete \\
  --assignee user@example.com \\
  --role "Storage Blob Data Contributor" \\
  --scope /subscriptions/<subId>/resourceGroups/my-rg

# Enable system-assigned Managed Identity on a VM
az vm identity assign --name my-vm --resource-group my-rg

# Get the Managed Identity principal ID
MI_PID=$(az vm show --name my-vm --resource-group my-rg \\
  --query identity.principalId -o tsv)

# Assign Key Vault Secrets User to the VM's MI
az role assignment create \\
  --assignee-object-id $MI_PID \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.KeyVault/vaults/my-kv`
    },
    {
      label: 'Custom Role',
      language: 'bash',
      code: `# Create a custom role definition (JSON file)
cat > custom-role.json << 'EOF'
{
  "Name": "Blob Reader and Lister",
  "Description": "Can read and list blobs but not write or delete",
  "Actions": [],
  "NotActions": [],
  "DataActions": [
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read",
    "Microsoft.Storage/storageAccounts/blobServices/containers/read"
  ],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/<subId>"
  ]
}
EOF

# Create the custom role in Azure
az role definition create --role-definition @custom-role.json

# Update a custom role (change assignable scopes)
az role definition update --role-definition @updated-role.json

# List all custom roles in a subscription
az role definition list --custom-role-only true --output table

# Delete a custom role
az role definition delete --name "Blob Reader and Lister"`
    },
    {
      label: 'Managed Identity Token',
      language: 'bash',
      code: `# From inside a VM with system-assigned Managed Identity:
# Call IMDS to get a token for Azure Storage
curl -s -H "Metadata: true" \\
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/" \\
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'][:50])"

# Use the token to list blobs (Storage Blob Data Reader role required)
ACCESS_TOKEN=$(curl -s -H "Metadata: true" \\
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/" \\
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "x-ms-version: 2020-08-04" \\
  "https://mystorageacct.blob.core.windows.net/mycontainer?restype=container&comp=list"

# In application code (TypeScript/Node.js with @azure/identity):
# const credential = new DefaultAzureCredential();
# const client = new BlobServiceClient(url, credential);
# DefaultAzureCredential tries: EnvVar → WorkloadIdentity → ManagedIdentity → AzureCLI`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Assigning Owner role to CI/CD service principals',
      wrong: `az role assignment create --role "Owner" --assignee $SP_OID --scope /subscriptions/<subId>`,
      right: `az role assignment create --role "Contributor" --assignee $SP_OID --scope /subscriptions/<subId>/resourceGroups/my-rg`,
      explanation: 'Owner includes the ability to grant access to others — a compromised CI/CD service principal with Owner can escalate privileges by assigning itself or an attacker Contributor or Owner on other resources. Contributor is sufficient for deploying resources. Scope to the resource group, not the subscription, for further restriction.'
    },
    {
      title: 'Using --assignee with an email address for service principal assignments',
      wrong: `az role assignment create --assignee app-service-principal --role Reader  # Fails for SP`,
      right: `SP_OID=$(az ad sp show --id <client-id> --query id -o tsv)
az role assignment create --assignee-object-id $SP_OID --assignee-principal-type ServicePrincipal --role Reader`,
      explanation: '--assignee resolves email addresses to user objects. For service principals, use --assignee-object-id with the service principal\'s object ID (not the app/client ID) and add --assignee-principal-type ServicePrincipal. Without the principal type, the CLI must do an extra lookup that can fail in some tenant configurations.'
    },
    {
      title: 'Granting access at subscription scope when resource group scope is sufficient',
      wrong: `az role assignment create --role "Storage Blob Data Reader" --scope /subscriptions/<subId>`,
      right: `az role assignment create --role "Storage Blob Data Reader" --scope /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/myacct`,
      explanation: 'RBAC assignments are inherited downward. Granting Storage Blob Data Reader at subscription scope gives read access to ALL storage accounts in the subscription. Scope to the minimum needed: the specific storage account or at most the resource group. Subscription-scope assignments should be reserved for cross-resource-group monitoring or management roles.'
    },
    {
      title: 'Not specifying --assignee-principal-type, causing slow or failed assignment lookups',
      wrong: `az role assignment create --assignee <object-id> --role Reader --scope /subscriptions/<subId>`,
      right: `az role assignment create --assignee-object-id <object-id> --assignee-principal-type ServicePrincipal --role Reader --scope /subscriptions/<subId>`,
      explanation: 'Without --assignee-principal-type, the CLI resolves the object ID by querying Entra ID — this lookup can fail in cross-tenant scenarios or when the principal is a foreign service principal. Explicitly specifying the type (User, Group, ServicePrincipal) avoids the lookup and makes assignments faster and more reliable in automation scripts.'
    },
  ];

  challenge: Challenge = {
    title: 'RBAC scope path parser',
    language: 'typescript',
    description: 'Azure RBAC scope paths follow a hierarchy:\n/subscriptions/{subId}\n/subscriptions/{subId}/resourceGroups/{rg}\n/subscriptions/{subId}/resourceGroups/{rg}/providers/{ns}/{type}/{name}\n\nWrite parseScope(scope: string): { subscription: string; resourceGroup?: string; provider?: string; resourceType?: string; resourceName?: string } that extracts each component.',
    hints: [
      'Split path by "/" and parse segments positionally',
      'Path always starts with /subscriptions/{id}',
      'resourceGroups is the next segment pair if present',
      'providers comes after resourceGroups if present',
    ],
    starterCode: `export function parseScope(scope: string): {
  subscription: string;
  resourceGroup?: string;
  provider?: string;
  resourceType?: string;
  resourceName?: string;
} {
  // parse the scope path
  return { subscription: '' };
}`,
    solution: `export function parseScope(scope: string): {
  subscription: string;
  resourceGroup?: string;
  provider?: string;
  resourceType?: string;
  resourceName?: string;
} {
  const parts = scope.replace(/^\\//, '').split('/');
  const result: ReturnType<typeof parseScope> = { subscription: '' };
  for (let i = 0; i < parts.length; i += 2) {
    const key = parts[i]?.toLowerCase();
    const val = parts[i + 1];
    if (key === 'subscriptions') result.subscription = val;
    else if (key === 'resourcegroups') result.resourceGroup = val;
    else if (key === 'providers') { result.provider = val; result.resourceType = parts[i + 2]; result.resourceName = parts[i + 3]; break; }
  }
  return result;
}

console.log(parseScope('/subscriptions/abc/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/myacct'));
// { subscription: 'abc', resourceGroup: 'my-rg', provider: 'Microsoft.Storage', resourceType: 'storageAccounts', resourceName: 'myacct' }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which built-in RBAC role allows full resource management but NOT granting access to others?',
      options: ['Owner', 'Contributor', 'User Access Administrator', 'Reader'],
      answer: 1,
      explanation: 'Contributor can create and manage all Azure resources but cannot create or delete role assignments. Owner includes both resource management AND the ability to grant access (manage role assignments). For CI/CD pipelines and service principals, Contributor is the appropriate role — not Owner.'
    },
    {
      q: 'How does scope inheritance work in Azure RBAC?',
      options: [
        'Role assignments only apply at the exact scope they are assigned — no inheritance',
        'Role assignments at a parent scope (subscription) are inherited by all child scopes (resource groups, resources)',
        'Inheritance only works from resource group down to resources, not from subscription',
        'Inheritance is opt-in — you must enable it per assignment'
      ],
      answer: 1,
      explanation: 'RBAC scope inheritance is automatic. A role assigned at subscription scope applies to all resource groups and resources within that subscription. A role assigned at resource group scope applies to all resources in that group. Effective permissions are the union of all assignments across all applicable scopes.'
    },
    {
      q: 'What is a Deny Assignment and how is it created?',
      options: [
        'A role assignment that removes a specific permission from a user — created via az role assignment create',
        'A system-created block that explicitly denies specific actions regardless of role assignments — created by Blueprints or Managed Applications',
        'A custom role with only NotActions defined',
        'A Conditional Access policy that blocks access to Azure resources'
      ],
      answer: 1,
      explanation: 'Deny Assignments explicitly block actions even when a role assignment would allow them — they take precedence over all role assignments. Unlike role assignments, Deny Assignments cannot be created directly by users; they are created by Azure Blueprints, Managed Applications, and Azure-managed resources. They appear in the portal under "Deny assignments" in the Access Control (IAM) blade.'
    },
    {
      q: 'What is the difference between a system-assigned and user-assigned Managed Identity?',
      options: [
        'System-assigned can access any resource; user-assigned is restricted to one resource group',
        'System-assigned is tied to one resource and deleted with it; user-assigned is independent and shareable across resources',
        'User-assigned requires a client secret; system-assigned does not',
        'They are functionally identical — the distinction is just billing'
      ],
      answer: 1,
      explanation: 'System-assigned MI has a lifecycle tied to its resource — when the resource is deleted, the MI is deleted. One resource to one identity. User-assigned MI is a standalone resource you create explicitly; it can be assigned to multiple Azure resources (VMs, App Services, Functions) and persists independently. Use user-assigned when multiple resources need the same identity and RBAC permissions.'
    },
    {
      q: 'What does NotActions in a role definition do?',
      options: [
        'Lists actions that are explicitly denied for users with this role',
        'Subtracts specific actions from the Actions set — the effective allowed actions are Actions minus NotActions',
        'Lists actions that require admin consent before use',
        'Defines which scopes this role cannot be assigned to'
      ],
      answer: 1,
      explanation: 'NotActions is subtracted from Actions to compute the effective allowed control-plane operations. It is NOT a deny — it is a set subtraction. This means a user with another role assignment that grants the NotActions permission can still perform those actions through that other role. For true deny semantics, Deny Assignments (created by Blueprints) are required.'
    },
    {
      q: 'What problem does Azure Privileged Identity Management (PIM) solve?',
      options: [
        'It replaces Conditional Access for MFA enforcement',
        'It provides just-in-time, time-bound privileged role activation with approval workflows and audit logs',
        'It automatically assigns Contributor roles to new users',
        'It monitors resource health and revokes roles when issues are detected',
      ],
      answer: 1,
      explanation: 'PIM enables just-in-time privileged access users activate high-privilege roles only when needed, for a limited time, with optional approval and full audit trail, reducing standing access risk.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a custom RBAC role vs a built-in role?',
      a: 'Always prefer <strong>built-in roles</strong> — they are maintained by Microsoft, have documented semantics, and are tested against all resource type changes. Create a <strong>custom role</strong> only when no built-in role fits: (1) you need a subset of Contributor permissions (e.g. start/stop VMs but not create/delete), (2) you need to combine control-plane and data-plane actions in one role, or (3) compliance requires granular audit of allowed actions. Custom roles add maintenance burden — when resource providers add new operations, you must update custom roles manually.'
    },
    {
      q: 'How does DefaultAzureCredential work and what order does it try credentials?',
      a: '<strong>DefaultAzureCredential</strong> from @azure/identity (and equivalent in Python, .NET, Java) tries credential sources in order: (1) Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID), (2) Workload Identity (Kubernetes pod with federated token), (3) Managed Identity (IMDS endpoint), (4) Azure CLI (az login session), (5) Azure PowerShell, (6) Azure Developer CLI. In production on Azure (VM, App Service, AKS), Managed Identity activates automatically — no code change needed between local development (CLI auth) and production (MI).'
    },
    {
      q: 'What is the User Access Administrator role and when do you need it?',
      a: '<strong>User Access Administrator</strong> grants the ability to manage role assignments (Microsoft.Authorization/roleAssignments/*) without granting access to actual resources. It is narrower than Owner (which bundles full resource access + role management). Use it when a team or automation needs to assign roles (e.g., a deployment pipeline that grants the app\'s Managed Identity access to Key Vault) without giving them the ability to manage the underlying resources. Combine with resource-scope restrictions.'
    },
    {
      q: 'How do you audit who has access to what in Azure?',
      a: 'Use multiple tools: (1) <strong>az role assignment list --all</strong>: enumerate all role assignments in a subscription. (2) <strong>Azure Portal → Resource → Access Control (IAM) → Role assignments</strong>: visual per-resource view. (3) <strong>Entra ID Access Reviews</strong> (P2): periodic, automated reviews where principals must re-justify access. (4) <strong>Azure Activity Log</strong>: logs all write operations including role assignment create/delete with caller identity and timestamp. (5) <strong>Microsoft Defender for Cloud</strong>: identifies overly permissive assignments and unused identities.'
    },
    {
      q: 'Can RBAC roles control data plane access (reading/writing blob data)?',
      a: 'Yes — RBAC has both <strong>control-plane</strong> roles (operating on the storage account resource itself via ARM: create, delete, configure) and <strong>data-plane</strong> roles (operating on the data inside: read/write/delete blobs, list containers). Examples: Storage Blob Data Reader (read blobs), Storage Blob Data Contributor (read/write/delete blobs), Storage Queue Data Message Processor. Data-plane RBAC is strongly preferred over Shared Key / SAS for application access — it uses Entra ID tokens, is auditable, and can be revoked instantly by removing the role assignment.'
    },
    {
      q: 'What are the four built-in Azure roles and when do you use them?',
      a: '<strong>Owner</strong>: full access + can manage access (use for resource owners who need to delegate). <strong>Contributor</strong>: full resource management, cannot manage access (developers, ops). <strong>Reader</strong>: view-only (auditors, stakeholders). <strong>User Access Administrator</strong>: manage access only, no resource access (security admins who assign roles). Always follow least privilege.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure RBAC controls who can do what at which scope — using built-in roles, custom roles, and Managed Identities to implement least-privilege access across the subscription hierarchy.',
    mustKnow: [
      'Scope hierarchy: Management Group > Subscription > Resource Group > Resource — assignments inherited downward',
      'Role = who (principal) + what (role definition) + where (scope)',
      'Owner = full access + manage role assignments; Contributor = full resource access, no role management',
      'Custom roles: Actions – NotActions = effective permissions (NotActions is subtraction, not deny)',
      'Managed Identity = no credentials, automatic service principal, IMDS endpoint for token acquisition',
      'Deny Assignments override all role assignments — created only by Blueprints/Managed Apps, not by users',
    ],
    interviewFocus: [
      'What is the difference between Owner and Contributor? When would you use each?',
      'How does scope inheritance work and why is it important to scope assignments narrowly?',
      'Explain the difference between system-assigned and user-assigned Managed Identity',
      'What is NotActions and how does it differ from a Deny Assignment?',
    ],
  };
}
