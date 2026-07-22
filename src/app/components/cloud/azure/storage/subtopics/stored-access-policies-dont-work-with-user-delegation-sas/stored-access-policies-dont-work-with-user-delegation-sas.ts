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
  templateUrl: './stored-access-policies-dont-work-with-user-delegation-sas.html',
  styleUrl: './stored-access-policies-dont-work-with-user-delegation-sas.scss'
})
export class StoredAccessPoliciesDontWorkWithUserDelegationSasSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents both features as independent best practices, never stating they\'re mutually exclusive',
      points: [
        'The main page\'s own theory recommends User Delegation SAS as "preferred for security" in one bullet, and separately explains that "Stored Access Policies... allow revoking the SAS before its expiry by deleting the policy" in another — with nothing connecting the two or warning that you cannot have both on the same token.',
        'Per Microsoft\'s own documentation on stored access policies, stated plainly: "Stored access policies are not supported for the user delegation SAS or the account SAS." A Stored Access Policy can only be referenced by a Service SAS — the type signed with the storage account key, not Entra ID credentials.',
        'Confirmed from the User Delegation SAS side too: "A user delegation SAS does not support defining permissions with a stored access policy." Both official pages agree — this isn\'t a documentation gap on one side, it\'s a real platform constraint stated consistently.',
      ]
    },
    {
      heading: 'What this actually means: you must choose between stronger signing and per-token revocation',
      points: [
        'If you use a User Delegation SAS (the main page\'s recommended, most-secure-signing option), you give up server-side, pre-expiry revocation of that individual token via a Stored Access Policy — there is no policy mechanism that attaches to it at all.',
        'If you want Stored Access Policy revocation, you must use a Service SAS signed with the storage account key — a less secure signing mechanism than Entra ID-based User Delegation SAS, since the account key is a long-lived shared secret rather than a token tied to an identity and role assignment.',
        'The actual revocation lever for a User Delegation SAS is different and much coarser: az storage account revoke-delegation-keys invalidates every user delegation key — and therefore every outstanding User Delegation SAS token issued by anyone — for the entire storage account simultaneously. There is no way to revoke a single User Delegation SAS individually.',
      ]
    },
    {
      heading: 'Choosing the right tradeoff for a given scenario',
      points: [
        'Need to revoke individual tokens independently (e.g., different SAS URLs issued to different partners, revoke one without touching the others)? Use Service SAS + a separate Stored Access Policy per partner, accepting the account-key signing tradeoff.',
        'Want the strongest signing security (Entra ID-based, auditable, no shared secret to leak) and can tolerate "revoke everything for this account at once" as the only manual lever? Use User Delegation SAS, and lean on its 7-day maximum validity as a built-in blast-radius limiter instead of policy-based revocation.',
        'A third option that sidesteps the tradeoff for either type: keep SAS lifetimes short (minutes to hours). If a token expires naturally before revocation would ever matter, the choice between these two mechanisms becomes far less consequential.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Service SAS + Stored Access Policy (per-token revocation)',
      language: 'bash',
      code: `# 1. Create a stored access policy on the container -- one per
#    partner, so each can be revoked independently
az storage container policy create \\
  --account-name mystorageacct --container-name partner-a-data \\
  --name partner-a-policy \\
  --permissions r \\
  --expiry 2026-12-31T23:59:00Z

# 2. Issue a Service SAS that REFERENCES the policy by name
#    (signed with the account key, NOT Entra ID)
az storage container generate-sas \\
  --account-name mystorageacct --name partner-a-data \\
  --policy-name partner-a-policy \\
  --account-key <account-key>

# 3. To revoke JUST partner A's access, without touching any
#    other partner's policy or SAS:
az storage container policy delete \\
  --account-name mystorageacct --container-name partner-a-data \\
  --name partner-a-policy
# Every SAS referencing "partner-a-policy" is instantly invalid.
# Partner B's separate policy/SAS is completely unaffected.`,
    },
    {
      label: 'User Delegation SAS revocation (all-or-nothing)',
      language: 'bash',
      code: `# A User Delegation SAS CANNOT reference a stored access policy --
# az storage container generate-sas --policy-name ... --auth-mode login --as-user
# fails / the policy-name parameter has no effect for this SAS type.

# The only revocation lever for User Delegation SAS is account-wide:
az storage account revoke-delegation-keys \\
  --name mystorageacct --resource-group my-rg

# This invalidates EVERY user delegation key for the account --
# every outstanding User Delegation SAS issued to EVERY partner,
# app, or user becomes invalid at the same moment. There is no
# per-token or per-partner scoping available for this command.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your team issues SAS tokens to 5 different external partners and needs the ability to revoke ONE partner\'s access without affecting the other 4. A teammate suggests using User Delegation SAS "since it\'s the most secure option, per the main page." Will this design achieve the goal? Why or why not?',
    hint: 'Check what a Stored Access Policy can attach to, and what az storage account revoke-delegation-keys actually revokes when called.',
    solution: 'No — this design does not achieve the goal. A Stored Access Policy cannot be attached to a User Delegation SAS at all ("Stored access policies are not supported for the user delegation SAS"), so there is no way to revoke one partner\'s token individually while using this SAS type. The only revocation command for User Delegation SAS, az storage account revoke-delegation-keys, invalidates every user delegation key for the whole storage account — it would take down all 5 partners\' tokens simultaneously, not just the one intended. To revoke one partner independently, each partner needs a Service SAS referencing its own separate Stored Access Policy — accepting the account-key signing tradeoff in exchange for genuine per-token revocation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'I can attach a Stored Access Policy to a User Delegation SAS to make it individually revocable before its expiry, since Stored Access Policies work with "SAS tokens" generally.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly that stored access policies "are not supported for the user delegation SAS or the account SAS" — only a Service SAS can reference one.'
    },
    {
      thought: 'az storage account revoke-delegation-keys revokes just the specific User Delegation SAS token I\'m concerned about, similar to deleting one Stored Access Policy.',
      reality: 'Per this subtopic\'s theory, it revokes every user delegation key for the entire storage account at once — every outstanding User Delegation SAS token issued by anyone becomes invalid simultaneously, not just a targeted one.'
    },
    {
      thought: 'Because User Delegation SAS is described as "more secure" than Service SAS, it must support every capability Service SAS has, including Stored Access Policy revocation.',
      reality: 'Per this subtopic\'s theory, signing security (Entra ID vs. account key) and revocation flexibility are separate, independent axes — User Delegation SAS trades away per-token revocation in exchange for stronger signing, while Service SAS + Stored Access Policy trades the reverse.'
    }
  ];
}
