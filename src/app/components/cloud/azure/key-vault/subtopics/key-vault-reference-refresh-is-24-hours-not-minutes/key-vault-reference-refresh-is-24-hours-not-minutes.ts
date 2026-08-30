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
  templateUrl: './key-vault-reference-refresh-is-24-hours-not-minutes.html',
  styleUrl: './key-vault-reference-refresh-is-24-hours-not-minutes.scss'
})
export class KeyVaultReferenceRefreshIs24HoursNotMinutesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy on the main page: rotation is described as picked up "within minutes"',
      points: [
        'The main page\'s own QnA on rotating a secret without downtime originally stated: "If using Key Vault References with a versionless URI, App Service picks up the new version automatically on the next resolution cycle (usually within minutes) — no app restart needed." This sets an expectation that a rotated secret becomes live almost immediately.',
        'That isn\'t how App Service actually resolves Key Vault References by default — the real figure is dramatically longer, and there are specific conditions that trigger an earlier refresh which the main page never mentions.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own App Service documentation: the default refresh window is 24 hours, not minutes',
      points: [
        'Per Microsoft\'s own documentation: "If the secret version isn\'t specified in the reference, the app uses the latest version that exists in the key vault. When newer versions become available, such as with rotation, the app is automatically updated and begins using the latest version within 24 hours. The delay is because App Service caches the values of the Key Vault references and refetches them every 24 hours." A rotated secret can sit unresolved for nearly a full day under default behavior — not minutes.',
        'There are two documented ways to get a faster refresh: "Any configuration change to the app causes an app restart and an immediate refetch of all referenced secrets" — so a genuinely unrelated app setting change happens to force a refresh as a side effect. The more deliberate option is: "To force resolution of your app\'s Key Vault references, make an authenticated POST request to the API endpoint .../config/configreferences/appsettings/refresh."',
        'Neither of these is automatic or something the app does on its own after a rotation — without one of them, the 24-hour cache window is what actually governs when a newly rotated secret takes effect.',
      ]
    },
    {
      heading: 'Why this matters for incident response and rotation planning',
      points: [
        'For routine, planned rotation, a 24-hour propagation window is usually fine — but it changes how "no downtime" rotation should actually be planned: keeping the OLD secret version valid and active for at least 24 hours after creating the new one, not disabling it shortly after rotation as if every app instance had already picked up the change.',
        'For emergency rotation — a leaked credential that needs to stop working immediately — relying on the default 24-hour cache is a real security gap. The correct emergency response is to explicitly force resolution via the refresh API endpoint (or trigger a config change that causes a restart) immediately after rotating, rather than assuming the platform will pick it up "soon."',
        'This same 24-hour caching behavior is specific to App Service\'s own Key Vault Reference resolution — an application reading secrets directly via the Key Vault SDK has entirely different caching behavior (whatever the app\'s own code implements), so this figure shouldn\'t be assumed to apply universally across every way of consuming a Key Vault secret.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Forcing an immediate refresh after emergency rotation',
      language: 'bash',
      code: `# Step 1: rotate the leaked secret to a new version
az keyvault secret set \\
  --vault-name my-kv --name db-password \\
  --value "$(openssl rand -base64 32)"

# Step 2: DON'T assume App Service picks this up "within minutes" --
# per Microsoft's own docs, the default cache window is 24 hours.
# For an emergency rotation, force resolution immediately:
az rest --method post \\
  --uri "https://management.azure.com/subscriptions/{sub-id}/resourceGroups/my-rg/providers/Microsoft.Web/sites/my-app/config/configreferences/appsettings/refresh?api-version=2022-03-01"

# Step 3: verify the app picked up the new version before disabling
# the old one -- check the app's own resolved environment, or query
# Key Vault diagnostic logs for a recent GET on the new version ID
# from the app's Managed Identity.`,
    },
    {
      label: 'Planning routine rotation around the real 24-hour window',
      language: 'bash',
      code: `# Routine (non-emergency) rotation -- plan around the documented
# 24-hour default cache, not an assumed "minutes" resolution time:

# 1. Create the new secret version
az keyvault secret set --vault-name my-kv --name db-password --value "NewSecret456!"

# 2. Wait at least 24 hours (or trigger a refresh explicitly, or
#    make an unrelated app setting change which also forces a
#    refetch as a side effect) before disabling the old version:
az webapp config appsettings set \\
  --name my-app --resource-group my-rg \\
  --settings "ROTATION_MARKER=$(date +%s)"   # forces app restart + refetch

# 3. Only NOW disable the old secret version, once confident every
#    app instance has actually resolved the new one:
az keyvault secret set-attributes \\
  --vault-name my-kv --name db-password \\
  --version <old-version-id> --enabled false`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security incident requires immediately invalidating a leaked database password used via a Key Vault Reference in App Service. The on-call engineer rotates the secret in Key Vault and, following the main page\'s own original guidance ("picked up within minutes"), waits 10 minutes before disabling the old secret version, assuming the app has already switched over. Is this a safe assumption?',
    hint: 'Check Microsoft\'s own documented default refresh interval for App Service Key Vault References, and what specifically triggers a faster refresh than that default.',
    solution: 'This is not a safe assumption. Per Microsoft\'s own documentation, App Service caches Key Vault Reference values and "refetches them every 24 hours" by default — a rotated secret is not guaranteed to be picked up within 10 minutes, or even within hours, without an explicit trigger. Disabling the old version after only 10 minutes risks breaking the app entirely if it hasn\'t yet refetched the new value. For an emergency rotation like this, the correct action is to force immediate resolution via an authenticated POST to the app\'s configreferences/appsettings/refresh management API endpoint (or make an app setting change to trigger a restart) right after rotating — then verify the new version resolved — before disabling the old one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'App Service automatically picks up a rotated Key Vault secret within a few minutes of the new version being created, without any additional action.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the default refresh window is 24 hours — "the app is automatically updated and begins using the latest version within 24 hours" — not minutes, unless an app restart or explicit refresh API call is triggered.'
    },
    {
      thought: 'The only way to make App Service pick up a rotated secret sooner than its default cache window is to wait it out or manually restart the app.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a dedicated API for this specific purpose — an authenticated POST to the app\'s own configreferences/appsettings/refresh endpoint forces immediate resolution without needing a full restart.'
    },
    {
      thought: 'The 24-hour Key Vault Reference caching behavior applies universally to any application reading secrets from Key Vault, regardless of how it accesses them.',
      reality: 'Per this subtopic\'s theory, this specific caching window is documented for App Service\'s own Key Vault Reference resolution mechanism — an application using the Key Vault SDK directly has entirely different, application-controlled caching behavior, not this same 24-hour figure.'
    }
  ];
}
