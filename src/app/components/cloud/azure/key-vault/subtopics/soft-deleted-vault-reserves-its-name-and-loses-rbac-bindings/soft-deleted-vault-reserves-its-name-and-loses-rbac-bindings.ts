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
  templateUrl: './soft-deleted-vault-reserves-its-name-and-loses-rbac-bindings.html',
  styleUrl: './soft-deleted-vault-reserves-its-name-and-loses-rbac-bindings.scss'
})
export class SoftDeletedVaultReservesItsNameAndLosesRbacBindingsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own soft-delete coverage focuses entirely on individual objects, never the vault itself',
      points: [
        'The main page\'s own theory and QnA describe soft delete almost entirely in terms of secrets, keys, and certificates — "az keyvault secret recover," "az keyvault secret purge," name reservation for individual objects. The vault-level behavior of soft delete gets far less attention, and two specific consequences are never mentioned at all.',
        'Soft delete applies to the vault as a resource, not just the objects inside it — and deleting an entire vault has consequences the main page\'s object-level framing doesn\'t prepare a reader for.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own soft-delete reference: a deleted vault\'s name is locked, and its integrations don\'t come back automatically',
      points: [
        'Per Microsoft\'s own documentation: "You can\'t reuse the name of a key vault that was soft-deleted, until the retention period expires." Key Vault names are globally unique DNS names — a team that deletes a vault expecting to immediately recreate one with the identical name (a common instinct when "starting over" or fixing a misconfigured deployment) will find that name unavailable for the full retention window (up to 90 days), not just until the delete operation completes.',
        'A second, more consequential gap: "When a Key Vault is soft-deleted, services that are integrated with the Key Vault are deleted. For example: Azure RBAC roles assignments and Event Grid subscriptions. Recovering a soft-deleted Key Vault does not restore these services. They must be recreated." Recovering a soft-deleted vault brings back the vault\'s own secrets, keys, and certificates — but NOT the RBAC role assignments that granted applications access to them, and not any Event Grid subscriptions watching for vault events.',
        'This means a "successful" vault recovery can still leave every application that was reading from it broken — the secrets are back, but the Managed Identity permissions that let anything read them are gone, and need to be reassigned from scratch, exactly as if configuring vault access for the first time.',
      ]
    },
    {
      heading: 'What this means for planning around accidental deletion or infrastructure-as-code redeployment',
      points: [
        'A CI/CD pipeline or IaC template that deletes and recreates a vault by design (rather than updating it in place) is at real risk of hitting the name-reservation gap — a redeploy that seems to "just create the vault fresh" can fail on vault creation with a name-conflict error, because the previous vault is sitting in a soft-deleted state the pipeline never accounted for.',
        'The correct recovery sequence after an accidental vault deletion is: recover the vault first (az keyvault recover), THEN explicitly re-create every RBAC role assignment and Event Grid subscription that existed before — treating the post-recovery vault as needing the exact same access-provisioning steps as a brand-new vault, not assuming recovery is a complete restore.',
        'Purge protection (covered on the main page as protecting against permanent data loss) doesn\'t change any of this — it only prevents the underlying secrets/keys/certs from being permanently destroyed during the retention window; it has no bearing on whether RBAC assignments or Event Grid subscriptions survive a delete-and-recover cycle.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why recreating a vault with the same name fails immediately after deletion',
      language: 'bash',
      code: `# Vault deleted (soft-delete, not purged)
az keyvault delete --name my-kv --resource-group my-rg

# Attempting to immediately recreate a vault with the SAME NAME:
az keyvault create --name my-kv --resource-group my-rg --location eastus
# Fails -- per Microsoft's own docs: "You can't reuse the name of a
# key vault that was soft-deleted, until the retention period expires."
# The name stays reserved for up to 90 days, NOT just until the
# delete operation completes.

# The correct move if the deletion was a mistake: RECOVER instead
# of trying to recreate:
az keyvault recover --name my-kv --location eastus
# Or, if a genuinely new vault is needed under the same name, purge
# the old one first (requires Key Vault Purge Operator role and
# purge protection to be OFF):
az keyvault purge --name my-kv --location eastus`,
    },
    {
      label: 'What recovery does NOT restore -- and the follow-up steps it needs',
      language: 'bash',
      code: `# Recover the vault -- brings back secrets, keys, certificates:
az keyvault recover --name my-kv --location eastus

# Per Microsoft's own docs: "Recovering a soft-deleted Key Vault
# does not restore these services. They must be recreated" --
# referring specifically to RBAC role assignments and Event Grid
# subscriptions. The vault LOOKS restored, but every app trying to
# read from it will get 403 Forbidden until access is re-granted:

# Re-assign every RBAC role that existed before deletion (this is
# NOT automatic -- treat it as configuring a brand-new vault):
KV_ID=$(az keyvault show --name my-kv --resource-group my-rg --query id -o tsv)
az role assignment create \\
  --assignee-object-id <app-managed-identity-object-id> \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope $KV_ID

# Re-create any Event Grid subscriptions that watched this vault
# for events (secret near-expiry, new version created, etc.) --
# these were deleted along with the vault and are not restored:
az eventgrid event-subscription create \\
  --name my-kv-events --source-resource-id $KV_ID \\
  --endpoint <endpoint-url>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DevOps pipeline accidentally deletes a production Key Vault during a bad deployment. An engineer quickly runs az keyvault recover and confirms the vault and all its secrets are back. Applications are still failing with 403 Forbidden errors when trying to read secrets. What\'s the most likely missing step, and why didn\'t recovery alone fix it?',
    hint: 'Check what Microsoft\'s own documentation says specifically does NOT come back when a soft-deleted vault is recovered, beyond the vault\'s own secrets, keys, and certificates.',
    solution: 'The most likely missing step is re-creating the RBAC role assignments that granted applications access to the vault. Per Microsoft\'s own documentation, "when a Key Vault is soft-deleted, services that are integrated with the Key Vault are deleted. For example: Azure RBAC roles assignments and Event Grid subscriptions. Recovering a soft-deleted Key Vault does not restore these services. They must be recreated." The vault and its secrets are genuinely restored by recovery, but every RBAC role assignment that previously granted a Managed Identity access to read those secrets was deleted along with the vault and needs to be explicitly reassigned — treating the recovered vault the same as a brand-new one for access-provisioning purposes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'After deleting a Key Vault, you can immediately create a new vault with the exact same name, since soft delete only affects the vault\'s own contents, not its name availability.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly: "You can\'t reuse the name of a key vault that was soft-deleted, until the retention period expires" — the name remains reserved for the full retention window, up to 90 days.'
    },
    {
      thought: 'Running az keyvault recover on a soft-deleted vault fully restores it to its exact previous state, including who and what had access to it.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states that RBAC role assignments and Event Grid subscriptions "are deleted" when the vault is soft-deleted and recovery "does not restore these services" — they must be manually recreated after recovery.'
    },
    {
      thought: 'Enabling purge protection on a Key Vault also protects the vault\'s RBAC role assignments and Event Grid subscriptions from being lost if the vault is deleted.',
      reality: 'Per this subtopic\'s theory, purge protection only governs whether the underlying secrets/keys/certificates can be permanently destroyed during the retention window — it has no bearing on whether RBAC assignments or Event Grid subscriptions survive a delete-and-recover cycle, since those are deleted immediately regardless of purge protection.'
    }
  ];
}
