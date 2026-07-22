import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './readonly-locks-block-more-than-deletes-control-plane-only.html',
  styleUrl: './readonly-locks-block-more-than-deletes-control-plane-only.scss'
})
export class ReadonlyLocksBlockMoreThanDeletesControlPlaneOnlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page only ever shows the CanNotDelete lock — it never mentions ReadOnly exists, or what either one actually blocks',
      points: [
        'The main page\'s own mistake entry #4 shows exactly one lock command: "az lock create --name no-delete --lock-type CanNotDelete --resource-group prod-rg" with the explanation "Put a CanNotDelete lock on production resource groups to prevent accidental deletion." This is the ONLY lock type the main page ever demonstrates.',
        'Nothing on the main page hints that a second lock type (ReadOnly) exists, or that either lock type can silently break entirely unrelated, non-destructive operations — the main page\'s own framing implies locks are purely about preventing an accidental "az group delete."',
      ]
    },
    {
      heading: 'ReadOnly locks are far more restrictive than CanNotDelete, and both scope ONLY to control-plane operations — with a long list of documented surprises',
      points: [
        'Per Microsoft\'s own documentation: "CanNotDelete means authorized users can read and modify a resource, but they can\'t delete it. ReadOnly means authorized users can read a resource, but they can\'t delete or update it. Applying this lock is similar to restricting all authorized users to the permissions that the Reader role provides." ReadOnly is a much harder restriction than the main page\'s single CanNotDelete example suggests.',
        'Locks apply ONLY to Azure Resource Manager (control-plane) requests, never to a service\'s own data operations: "Locks only apply to control plane Azure operations and not to data plane operations... locks protect a resource from changes, but they don\'t restrict how a resource performs its functions." This cuts both ways — a CanNotDelete lock on a storage account does NOT protect the actual blob/queue/table data inside it from being deleted, per Microsoft\'s own docs: "A read-only lock or cannot-delete lock on a storage account doesn\'t protect its data from being deleted or modified."',
        'Because many routine, non-destructive operations are implemented as control-plane POST requests, a ReadOnly lock blocks far more than "editing" — Microsoft\'s own documented list includes: "A read-only lock on a resource group that contains a virtual machine prevents all users from starting or restarting a virtual machine," "a read-only lock on a resource group that contains an App Service plan prevents you from scaling up or out of the plan," and "a read-only lock on a storage account prevents users from listing the account keys" (forcing Entra ID credentials for blob/queue access instead).',
        'Locks are inherited down the hierarchy and the MOST restrictive one wins: "When you apply a lock at a parent scope, all resources within that scope inherit the same lock... The most restrictive lock in the inheritance chain takes precedence." A ReadOnly lock placed on a Resource Group therefore silently blocks VM restarts and Auto Scale on everything inside it — not just on the group itself.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ReadOnly lock on a resource group — silent, surprising breakage',
      language: 'bash',
      code: `# Team locks a production resource group READONLY, intending only
# to prevent accidental config drift:
az lock create --name freeze-prod --lock-type ReadOnly \\
  --resource-group prod-rg

# Weeks later, an on-call engineer needs to restart a hung VM inside
# the SAME resource group during an incident:
az vm restart --resource-group prod-rg --name web-01
# Fails -- "start"/"restart" are POST-method control-plane
# operations, and per Microsoft's own docs: "A read-only lock on a
# resource group that contains a virtual machine prevents all users
# from starting or restarting a virtual machine." The team never
# intended to block incident response -- they only wanted to freeze
# resource CONFIGURATION, but ReadOnly blocks all POST operations,
# including ones with no destructive effect at all.`,
    },
    {
      label: 'What CanNotDelete does NOT protect',
      language: 'bash',
      code: `# Team assumes a CanNotDelete lock on a storage account fully
# protects everything inside it:
az lock create --name no-delete --lock-type CanNotDelete \\
  --resource-group prod-rg --resource-name mystorageacct \\
  --resource-type Microsoft.Storage/storageAccounts

# A misconfigured lifecycle policy (or a compromised data-plane key)
# still deletes blobs inside a container -- the lock never stops it:
az storage blob delete-batch --account-name mystorageacct \\
  --source my-container
# Succeeds. Per Microsoft's own docs: "A read-only lock or
# cannot-delete lock on a storage account doesn't protect its data
# from being deleted or modified. It also doesn't protect the data
# in a blob, queue, table, or file." The lock only ever protects the
# storage ACCOUNT resource itself (a control-plane object) from
# being deleted -- never the data plane content inside it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team places a ReadOnly lock on a production resource group so nobody can accidentally change resource configuration. During an incident, an engineer tries to restart a hung VM in that group and the restart fails. The team is confused: "we only locked configuration changes, not operational actions like a restart." Using this subtopic\'s theory, explain what actually happened.',
    hint: 'Per Microsoft\'s own documentation, what determines whether an operation is blocked by a lock — whether it "sounds" destructive, or which HTTP method it uses?',
    solution: 'Per this subtopic\'s theory, the block is not a bug or misconfiguration — it is documented, expected behavior. Microsoft\'s own documentation states directly: "A read-only lock on a resource group that contains a virtual machine prevents all users from starting or restarting a virtual machine. These operations require a POST method request." A ReadOnly lock does not distinguish "operational" actions from "configuration" changes — it blocks EVERY control-plane POST request, and VM start/restart happens to be implemented as a POST call to Azure Resource Manager, even though conceptually it changes nothing about the VM\'s configuration. The team\'s mental model (ReadOnly = "can\'t edit settings") was too narrow; the actual scope is "can\'t send any POST/PUT/DELETE to the control plane," which sweeps in many operationally harmless actions. The fix is either using a narrower CanNotDelete lock (which still allows POST requests like restart), or removing the ReadOnly lock before any operation that isn\'t a pure read.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A resource lock only prevents deletion — "locking" a resource just means "don\'t let anyone delete this."',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation defines TWO distinct lock levels — CanNotDelete (blocks deletion only) and ReadOnly (blocks deletion AND updates, "similar to restricting all authorized users to the permissions that the Reader role provides") — and ReadOnly is far more restrictive than the main page\'s single CanNotDelete example suggests.'
    },
    {
      thought: 'A CanNotDelete or ReadOnly lock on a storage account fully protects the data (blobs, queues, tables, files) stored inside it.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states directly that neither lock type "protect[s] its data from being deleted or modified" — locks apply only to control-plane operations on the resource itself, never to data-plane operations on the content inside it.'
    },
    {
      thought: 'Placing a lock on a specific resource only affects that resource, not anything else in the same resource group.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms lock inheritance flows the OPPOSITE direction as well — locks apply top-down: "When you apply a lock at a parent scope, all resources within that scope inherit the same lock," so a lock on a resource GROUP affects every resource inside it, with the most restrictive lock in the chain always winning.'
    }
  ];
}
