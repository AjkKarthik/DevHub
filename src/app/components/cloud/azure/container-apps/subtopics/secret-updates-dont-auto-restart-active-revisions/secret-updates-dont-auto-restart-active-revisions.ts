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
  templateUrl: './secret-updates-dont-auto-restart-active-revisions.html',
  styleUrl: './secret-updates-dont-auto-restart-active-revisions.scss'
})
export class SecretUpdatesDontAutoRestartActiveRevisionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine main-page inaccuracy this subtopic corrects: "you must create a new revision"',
      points: [
        'Before this correction, the main page\'s own theory stated: "Secrets are versioned — updating a secret does not auto-restart the app; you must create a new revision." This gets the mechanism half right (a running revision does not auto-pick-up a changed secret) but overstates the fix as a single, mandatory path.',
        'Per Microsoft\'s own secrets documentation: "An updated or deleted secret doesn\'t automatically affect existing revisions in your app. When a secret is updated or deleted, you can respond to changes in one of two ways: 1. Deploy a new revision. 2. Restart an existing revision." Restarting the existing revision — with no new revision created at all — is an equally valid, and often faster, second option the main page never mentions.',
        'The main page\'s "versioned" framing is also imprecise as a general statement: per the same docs, "Secrets are scoped to an application, outside of any specific revision of an application... New revisions don\'t get generated through adding, removing, or changing secrets" — a Container Apps secret itself is just a name/value pair with no version history; only a Key Vault-referenced secret has real version semantics, via the URI it points to.',
      ]
    },
    {
      heading: 'The one real exception: unversioned Key Vault references DO auto-refresh and auto-restart',
      points: [
        'Confirmed via Microsoft\'s own Key Vault reference documentation, there is a genuine third path the corrected main-page text now reflects: "If a version isn\'t specified in the URI, then the app uses the latest version that exists in the key vault. When newer versions become available, the app automatically retrieves the latest version within 30 minutes. Any active revisions that reference the secret in an environment variable is automatically restarted to pick up the new value."',
        'This 30-minute figure is a genuinely different number from a similar-sounding claim already corrected elsewhere in this hub — App Service\'s own Key Vault References refresh their cache within 24 hours by default. Container Apps\' equivalent mechanism is a full order of magnitude faster (30 minutes vs. 24 hours), and unlike App Service, Container Apps also performs the restart automatically rather than leaving the app to pick up the new value passively on its own schedule.',
        'This automatic path only applies to an UNVERSIONED Key Vault reference URI (no trailing 32-digit version ID). Pin a specific version in the URI instead, and Container Apps never auto-refreshes it at all — rotating that secret requires the exact same manual restart-or-new-revision choice as a plain, non-Key-Vault secret.',
      ]
    },
    {
      heading: 'Why the distinction between "restart" and "new revision" actually matters operationally',
      points: [
        'A restart (az containerapp revision restart) keeps the exact same revision identity, traffic weight assignment, and revision suffix — it is the lighter-weight of the two options and doesn\'t disturb an in-progress canary traffic split the way deploying a brand-new revision would.',
        'Deploying a new revision (any revision-scope change, such as updating the image or explicitly forcing one) creates a fresh, separately-versioned snapshot that starts receiving traffic according to whatever revision mode and weight rules are in effect — appropriate when the secret change should be bundled with other changes, but unnecessary overhead for a same-config secret rotation.',
        'Multiple revisions in "multiple revision mode" can each reference the same application-scoped secret independently — updating the secret value doesn\'t discriminate between them, so every active revision that references it needs its own restart (or its own replacement revision) before it reflects the new value; an operator who restarts only the revision currently receiving 100% of traffic can still leave an inactive-but-still-live canary revision holding a stale secret.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The two manual paths Microsoft actually documents',
      language: 'bash',
      code: `# Update a secret's value:
az containerapp secret set \\
  --name my-api \\
  --resource-group my-rg \\
  --secrets "db-connection=NEW_CONNECTION_STRING_VALUE"

# Per Microsoft's own docs, this does NOT touch any running revision
# on its own -- "New revisions don't get generated through adding,
# removing, or changing secrets." Two options follow:

# Option 1: restart the existing revision (no new revision created,
# traffic weights and revision suffix are untouched):
az containerapp revision restart \\
  --name my-api \\
  --revision my-api--v2 \\
  --resource-group my-rg

# Option 2: deploy a new revision (e.g. alongside an unrelated
# image update that was happening anyway):
az containerapp update \\
  --name my-api \\
  --resource-group my-rg \\
  --image myregistry.azurecr.io/my-api:v3
  # New revision picks up the current secret value automatically --
  # no separate action needed for THIS revision.

# In multiple-revision mode, remember: every OTHER still-active
# revision referencing the same secret needs its own restart too.`,
    },
    {
      label: 'The one case that auto-restarts: an unversioned Key Vault reference',
      language: 'bash',
      code: `# Reference the LATEST version of a Key Vault secret (no version
# ID in the URI):
az containerapp secret set \\
  --name my-api \\
  --resource-group my-rg \\
  --secrets "db-connection=keyvaultref:https://myvault.vault.azure.net/secrets/db/"
  # Note: no trailing 32-digit version segment after /db/

# When a NEW version of this secret is created in Key Vault:
#   - Container Apps re-fetches it automatically within 30 minutes
#     (per Microsoft's own docs -- no manual action needed at all)
#   - Any active revision referencing it is automatically restarted
#     to pick up the new value -- this is the ONLY case where a
#     secret change auto-restarts a revision with zero operator
#     action.

# Compare: pinning a SPECIFIC version disables this entirely --
az containerapp secret set \\
  --name my-api \\
  --resource-group my-rg \\
  --secrets "db-connection=keyvaultref:https://myvault.vault.azure.net/secrets/db/ec96f02080254f109c51a1f14cdb1931"
  # A pinned version never auto-refreshes -- rotating it needs the
  # same manual restart-or-new-revision choice as any other secret.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team rotates a database password by running az containerapp secret set with a new plaintext value, then confirms in the portal that the secret\'s stored value updated successfully. Twenty minutes later, the running app is still failing to connect with the OLD password. Nothing else was changed. What\'s going on, and what are the team\'s two options to actually fix it without waiting?',
    hint: 'Check whether updating a Container Apps secret\'s value, by itself, has any documented effect on a revision that is already running.',
    solution: 'This is expected, not a bug — per Microsoft\'s own documentation, "an updated or deleted secret doesn\'t automatically affect existing revisions in your app." Updating the secret\'s stored value only changes what NEW references to it will resolve to; the already-running revision has the old value baked into its running container process and has no mechanism to notice the change on its own (this is a plain secret, not an unversioned Key Vault reference, so the 30-minute auto-refresh-and-restart behavior doesn\'t apply here). The team has exactly two documented options: (1) restart the existing revision with az containerapp revision restart, which picks up the new secret value without creating a new revision or disturbing traffic weights, or (2) deploy a new revision (any revision-scope change, such as a no-op image redeploy), which will read the current secret value from the start. Waiting longer will not fix it on its own — a plain secret has no auto-refresh path at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Updating a Container Apps secret\'s value automatically means "you must create a new revision" to make the running app see the change — that\'s the only supported way to fix it.',
      reality: 'Per this subtopic\'s theory (and the correction now on the main page), Microsoft\'s own documentation lists two equally valid options: restart the existing revision, or deploy a new one — a restart alone is sufficient and doesn\'t require creating a new revision at all.'
    },
    {
      thought: 'Container Apps secrets are inherently versioned, similar to how Key Vault secrets are versioned.',
      reality: 'Per this subtopic\'s theory, a plain Container Apps secret is just a name/value pair scoped to the application with no version history of its own — only a Key Vault-referenced secret has real version semantics, and only when its URI is left unversioned does Container Apps track and auto-refresh to whatever the latest Key Vault version is.'
    },
    {
      thought: 'Since the main page already covers a similar Key Vault reference refresh delay for App Service (24 hours), the same 24-hour figure applies to Container Apps too.',
      reality: 'Per this subtopic\'s theory, Container Apps\' own unversioned Key Vault reference refresh is a genuinely different, faster figure — Microsoft\'s own docs state 30 minutes for Container Apps, a full order of magnitude quicker than App Service\'s 24-hour default, and Container Apps additionally auto-restarts the affected revision rather than leaving the refresh passive.'
    }
  ];
}
