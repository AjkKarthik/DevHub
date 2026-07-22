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
  templateUrl: './az-resource-move-orphans-role-assignments-and-changes-the-id.html',
  styleUrl: './az-resource-move-orphans-role-assignments-and-changes-the-id.scss'
})
export class AzResourceMoveOrphansRoleAssignmentsAndChangesTheIdSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions "az resource move" in one QnA sentence, with no warning about what breaks',
      points: [
        'The main page\'s own QnA states only: "Can a resource belong to multiple Resource Groups? No... You can move resources between groups using az resource move, but a resource can never simultaneously be in two groups." That is the ENTIRE treatment of resource moves on the main page — one sentence confirming the command exists, with zero mention of side effects.',
        'The main page\'s own challenge is literally about parsing a resource ID (subscriptionId, resourceGroup, provider, resourceType, resourceName) — making it a notable, unexplained gap that the main page never connects this ID structure to what happens to that SAME ID the moment a resource is moved.',
      ]
    },
    {
      heading: 'A resource move changes its resource ID and silently orphans any role assignment scoped to that resource',
      points: [
        'Per Microsoft\'s own documentation: "When you move a resource, you change its resource ID... If you use the resource ID anywhere, change that value. For example, if you have a custom dashboard in the portal that references a resource ID, update that value. Look for any scripts or templates that need to be updated for the new resource ID." Every one of the five fields the main page\'s own challenge asks you to parse out of a resource ID (subscriptionId, resourceGroup, provider, resourceType, resourceName) can change when a resource moves — any saved reference to the OLD ID silently stops matching.',
        'Role assignments scoped directly to the resource do not follow it: "If you move a resource with an active Azure role assignment (or its child resource with this same assignment), the role assignment doesn\'t move and becomes orphaned. You must create the role assignment again after the move. Although the system automatically removes the orphaned role assignment, we recommend that you remove it before the move." A team that granted a contributor role scoped to one specific VM, then moved that VM to a new resource group, loses that access grant — with no error or warning at move time.',
        'The move operation itself locks BOTH resource groups for up to 4 hours: "During the move operation, both the source and target resource groups are locked. You can\'t create, delete, or update resources within these resource groups while the move is in progress. However, existing resources remain fully operational." This directly parallels — and compounds — the ReadOnly-lock gotcha covered in the previous subtopic: a move temporarily imposes lock-like restrictions on TWO resource groups at once, even though neither one was manually locked.',
        'Dependent resources must move together, and the destination must already have (or receive in the same request) everything the resource needs: per Microsoft\'s own FAQ, "When you move a resource, its dependent resources must exist in the destination resource group or subscription, or be included in the move request" — moving a VM alone, without its managed disks and network interface, fails outright rather than silently succeeding with a broken VM.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Orphaned role assignment after a move',
      language: 'bash',
      code: `# A contractor is granted Contributor scoped to ONE specific VM
az role assignment create \\
  --assignee contractor@example.com \\
  --role Contributor \\
  --scope "/subscriptions/{sub}/resourceGroups/dev-rg/providers/Microsoft.Compute/virtualMachines/build-agent-01"

# Weeks later, the team reorganizes and moves the VM to a new group
az resource move --destination-group shared-infra-rg \\
  --ids "/subscriptions/{sub}/resourceGroups/dev-rg/providers/Microsoft.Compute/virtualMachines/build-agent-01"

# The VM's resource ID has now changed (new resourceGroup segment).
# Per Microsoft's own docs: "the role assignment doesn't move and
# becomes orphaned. You must create the role assignment again after
# the move." The contractor silently loses access -- no error is
# raised at move time, and nothing on the move confirmation screen
# calls this out by name.
az role assignment list --scope \\
  "/subscriptions/{sub}/resourceGroups/shared-infra-rg/providers/Microsoft.Compute/virtualMachines/build-agent-01"
# []  -- empty; the Contributor grant is gone`,
    },
    {
      label: 'Checking the move validates before committing',
      language: 'bash',
      code: `# Always validate first -- catches dependent-resource and policy
# problems before anything actually moves
az resource invoke-action --action validateMoveResources \\
  --ids "/subscriptions/{sub}/resourceGroups/dev-rg" \\
  --request-body '{
    "resources": [
      "/subscriptions/{sub}/resourceGroups/dev-rg/providers/Microsoft.Compute/virtualMachines/build-agent-01",
      "/subscriptions/{sub}/resourceGroups/dev-rg/providers/Microsoft.Compute/disks/build-agent-01-disk",
      "/subscriptions/{sub}/resourceGroups/dev-rg/providers/Microsoft.Network/networkInterfaces/build-agent-01-nic"
    ],
    "targetResourceGroup": "/subscriptions/{sub}/resourceGroups/shared-infra-rg"
  }'
# Per Microsoft's own docs, omitting the disk/NIC here would fail
# with "MissingMoveDependentResources" -- dependent resources must
# be included in the same move request as their parent VM.

# Re-grant role assignments AFTER the move completes, against the
# NEW resource ID (shared-infra-rg, not dev-rg):
az role assignment create \\
  --assignee contractor@example.com --role Contributor \\
  --scope "/subscriptions/{sub}/resourceGroups/shared-infra-rg/providers/Microsoft.Compute/virtualMachines/build-agent-01"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own resource-ID-parsing challenge, a team stores a dashboard link containing a hardcoded resource ID for a critical VM, and separately has an Azure role assignment scoped directly to that same VM. They move the VM to a new resource group using az resource move, and the move succeeds with no errors. A week later, two things break: the dashboard link 404s, and a contractor reports losing access to the VM. Using this subtopic\'s theory, explain both failures with a single root cause.',
    hint: 'Per Microsoft\'s own documentation, which specific field in the resource ID actually changes after a move, and what depends on that exact string staying the same?',
    solution: 'Per this subtopic\'s theory, both failures trace back to the same root cause: moving a resource changes its resource ID. Microsoft\'s own documentation states directly, "When you move a resource, you change its resource ID... If you use the resource ID anywhere, change that value." The dashboard link hardcoded the OLD resource ID (with the old resourceGroup segment), so it no longer resolves to anything after the move — a classic case of the exact challenge the main page\'s own resource-ID-parsing exercise is built around, just applied to a link instead of a script. Separately, the role assignment was scoped directly to the VM\'s resource ID, and per Microsoft\'s own documentation, "If you move a resource with an active Azure role assignment... the role assignment doesn\'t move and becomes orphaned. You must create the role assignment again after the move." Both symptoms are the predictable consequence of the same underlying fact — nothing scoped to a resource\'s exact ID (a saved link, a role assignment, a script variable) survives a move automatically; the fix is re-creating both against the resource\'s new ID after the move completes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Moving a resource to a new resource group is purely an organizational change — the resource keeps the same identity and everything scoped to it keeps working.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the resource ID itself changes on a move — "you change one or more values in that path" — so any saved reference to the old ID (dashboards, scripts, hardcoded values) breaks silently.'
    },
    {
      thought: 'A role assignment scoped to a resource automatically follows that resource if it is moved to a different resource group.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states directly that the role assignment "doesn\'t move and becomes orphaned" — it must be manually re-created against the resource\'s new ID after the move.'
    },
    {
      thought: 'A resource move is a quick, near-instant operation with no real side effects on the resource groups involved.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the move locks BOTH the source and destination resource groups against create/delete/update operations for up to 4 hours while the move completes — existing resources keep running, but the groups themselves are temporarily frozen.'
    }
  ];
}
