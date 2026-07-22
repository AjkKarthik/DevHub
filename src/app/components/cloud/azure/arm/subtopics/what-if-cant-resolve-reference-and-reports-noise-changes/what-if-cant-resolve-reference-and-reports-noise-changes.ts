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
  templateUrl: './what-if-cant-resolve-reference-and-reports-noise-changes.html',
  styleUrl: './what-if-cant-resolve-reference-and-reports-noise-changes.scss'
})
export class WhatIfCantResolveReferenceAndReportsNoiseChangesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats what-if as a simple, trustworthy dry run — it never says the preview can be wrong',
      points: [
        'The main page\'s own theory states only: "ARM template validation (what-if deployments) lets you preview exactly what a deployment would change before actually applying it — a critical safety check before running Complete-mode deployments." The word "exactly" implies a fully accurate preview, with no caveat.',
        'The main page\'s own mistake entry #2 tells readers to "Always run what-if first" before Complete mode, treating a clean what-if output as sufficient reassurance — with no mention that certain properties can be reported as changing when they will not actually change.',
      ]
    },
    {
      heading: 'What-if has two documented, real accuracy limitations — a reference()-function blind spot and "noise" false-positive deletions',
      points: [
        'Per Microsoft\'s own documentation: "The what-if operation can\'t resolve the reference function. Every time you set a property to a template expression that includes the reference function, what-if reports the property will change. This behavior happens because what-if compares the current value of the property... with the unresolved template expression. Obviously, these values will not match." Any property whose value comes from reference() — a common pattern for pulling a live value like a connection string or endpoint from another resource — will ALWAYS show as "changing" in what-if, even when redeploying the exact same template with no real change at all.',
        'A second, separate limitation produces false-positive DELETIONS: "Some of the properties that are listed as deleted won\'t actually change. Properties can be incorrectly reported as deleted when they aren\'t in the template, but are automatically set during deployment as default values. This result is considered \'noise\' in the what-if response. The final deployed resource will have the values set for the properties." A property Azure fills in automatically (not something the template ever set) can show up in what-if as being removed, even though redeploying will silently restore it to the same default value.',
        'The what-if operation also has hard limits that silently degrade its own accuracy on large deployments: "What-if expands nested templates until these limits are reached: 500 nested templates, 800 resource groups in a cross resource-group deployment, 5 minutes taken for expanding the nested templates. When one of the limits is reached, the remaining resources\' change type is set to Ignore." A huge multi-resource-group deployment can silently stop being previewed partway through, with the untested remainder reported as "Ignore" rather than flagged as "unknown."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'False-positive change from a reference() expression',
      language: 'bash',
      code: `# Template sets a Function App setting from a Storage Account's
# live connection string via reference():
# "appSettings": [{
#   "name": "STORAGE_CONNECTION",
#   "value": "[reference(resourceId('Microsoft.Storage/storageAccounts', parameters('storageName')), '2023-01-01').primaryEndpoints.blob]"
# }]

# Redeploying the IDENTICAL template, with zero actual changes:
az deployment group what-if \\
  --resource-group prod-rg \\
  --template-file main.json \\
  --parameters storageName=prodstore123

# Per Microsoft's own docs: "what-if reports the property will
# change" for STORAGE_CONNECTION every single time, even though
# nothing about it is actually different -- what-if compares the
# CURRENT resolved value against the UNRESOLVED template expression
# string, which can never match. A team reviewing this output has
# no reliable way to tell a real change from this known blind spot
# just by reading the what-if diff.`,
    },
    {
      label: '"Noise" — a property Azure filled in automatically shows as deleted',
      language: 'bash',
      code: `# Template never sets networkAcls on a storage account -- Azure
# fills in a default value automatically at deploy time
az deployment group what-if \\
  --resource-group prod-rg \\
  --template-file main.json
# Output includes:
#   ~ Microsoft.Storage/storageAccounts/prodstore123
#     - properties.networkAcls.defaultAction: "Allow"
# -- LOOKS like the deployment will remove/change network access
# rules. Per Microsoft's own docs: "Properties can be incorrectly
# reported as deleted when they aren't in the template, but are
# automatically set during deployment as default values. This
# result is considered 'noise'... The final deployed resource will
# have the values set for the properties." The actual redeploy
# leaves networkAcls completely untouched -- what-if's diff is
# simply wrong here, not a genuine pending change.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own advice to "Always run what-if first" before a Complete-mode deployment, a team reviews the what-if output and sees a property they never touched listed as being deleted, alongside a connection-string property (populated via reference()) also flagged as changing. They pause the deployment, worried both are real, unintended changes. Using this subtopic\'s theory, what should they actually check before assuming the worst?',
    hint: 'Per Microsoft\'s own documentation, are there specific, DOCUMENTED categories of false-positive results in what-if output — and if so, does a property\'s presence in the diff alone prove it will really change?',
    solution: 'Per this subtopic\'s theory, the team should check whether either flagged change matches one of the two documented what-if false-positive categories before assuming something is wrong. The reference()-based connection-string property matches Microsoft\'s own documented blind spot exactly: "The what-if operation can\'t resolve the reference function... what-if reports the property will change" — this is EXPECTED, not a real change, for any property whose value comes from reference(). The unexpectedly-deleted property they never set in the template matches the second documented category: "noise" from an automatically-applied Azure default value, which Microsoft\'s own documentation confirms "won\'t actually change" despite appearing in the deleted list. Neither flagged item is necessarily evidence of an unintended change — the correct next step is recognizing these as the two specific, documented what-if limitations (not a general "just trust the tool less" heuristic), and for anything else in the diff that does NOT match either pattern, treating it as a genuine predicted change worth investigating.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'What-if is a fully accurate preview — if it reports a property will change, that property really will change when the template is deployed.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes two specific, real accuracy gaps: reference()-derived properties are ALWAYS reported as changing (a comparison artifact, not a real change), and automatically-applied default values can be reported as "deleted" even though the actual deployment leaves them untouched.'
    },
    {
      thought: 'A property shown as "will be deleted" in what-if output means that property is currently set in Azure and the new deployment will genuinely remove it.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation explicitly names this "noise" — a property that was never in the template but was automatically defaulted by Azure at deploy time can be misreported as deleted, when redeploying actually leaves the default value in place.'
    },
    {
      thought: 'What-if always previews the complete set of changes for any deployment, regardless of its size.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes hard expansion limits (500 nested templates, 800 resource groups, 5 minutes) beyond which "the remaining resources\' change type is set to Ignore" — a very large deployment can be only partially previewed, with the untested remainder silently marked Ignore rather than flagged as unverified.'
    }
  ];
}
