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
  templateUrl: './theres-no-redis-contributor-data-role.html',
  styleUrl: './theres-no-redis-contributor-data-role.scss'
})
export class TheresNoRedisContributorDataRoleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine main-page inaccuracy this subtopic corrects: "the Redis Contributor data access role"',
      points: [
        'Before this correction, the main page\'s own "Security & Access" theory stated: "Entra ID authentication... The MI must be assigned the Redis Contributor data access role." No Azure Cache for Redis data access policy is actually named "Redis Contributor" — the name doesn\'t appear anywhere in Microsoft\'s own Entra authentication documentation.',
        'Confirmed via Microsoft\'s own Entra authentication guide, the real data access policies are exactly three: "Data Owner", "Data Contributor", and "Data Reader" — assigned on the cache\'s own Data Access Configuration blade, not through a generic Azure RBAC role assignment at all. The default policy a user gets when Entra authentication is first enabled through the portal is Data Owner: "The user you enter is automatically assigned Data Owner Access Policy by default when you select Save."',
      ]
    },
    {
      heading: 'The trap hiding in the almost-right name: a REAL Azure role called "Redis Cache Contributor" exists — and it grants zero data access',
      points: [
        'Azure does have a built-in RBAC role named "Redis Cache Contributor" (role ID e0f68234-74aa-48ed-b826-c38b57376e17) — close enough to the main page\'s incorrect "Redis Contributor" that someone acting on the old text could plausibly search for and find this role instead, assume it\'s the right one, and assign it.',
        'That would be a mistake with a very specific, silent failure mode: "Redis Cache Contributor" is a pure control-plane management role — it lets a principal create, delete, configure, and scale the Azure Cache for Redis RESOURCE itself (via Microsoft.Cache/redis/* management operations), but grants no dataActions at all. A managed identity holding only this role can fully manage the cache\'s infrastructure and simultaneously be unable to read or write a single key inside it.',
        'This is the same category of trap as an IAM role that sounds like it should cover something adjacent but actually governs a completely different plane of access (control-plane resource management vs. data-plane read/write) — the two "Redis Contributor"-ish names look almost interchangeable but do not overlap in permissions at all.',
      ]
    },
    {
      heading: 'Choosing correctly among the three real data access policies',
      points: [
        'Data Owner grants full read/write/administrative command access to the cache\'s data plane — the closest equivalent to an access-key connection, appropriate for an application that both reads and writes and needs the full command surface Entra authentication supports.',
        'Data Contributor and Data Reader are narrower, purpose-built policies for read/write and read-only workloads respectively — assigning the narrowest policy that a given application actually needs (rather than defaulting every identity to Data Owner because it\'s what the portal pre-selects) follows the same least-privilege principle the main page\'s own access-key rotation guidance already implicitly encourages by treating keys "like passwords."',
        'None of these three policies replace or interact with the Azure RBAC "Redis Cache Contributor" role at all — a real deployment often needs BOTH: "Redis Cache Contributor" (or a narrower custom RBAC role) so someone can provision and configure the cache resource, plus a separate Data Access Configuration entry (Data Owner/Contributor/Reader) so an application\'s managed identity can actually talk to the data inside it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page said vs. the real data access policies',
      language: 'bash',
      code: `# Main page's OLD (incorrect) claim:
#   "The MI must be assigned the Redis Contributor data access role."
# No such data access policy exists. The real ones, assigned on the
# cache's own Data Access Configuration blade:

az redis identity assign \\
  --name my-redis --resource-group my-rg \\
  --identity-type SystemAssigned

# Then grant a DATA ACCESS POLICY (not an Azure RBAC role) via the
# portal's "Data Access Configuration" blade -- choose exactly one of:
#   Data Owner       -- full read/write/admin data-plane access
#   Data Contributor -- read/write, narrower than Owner
#   Data Reader      -- read-only

# Portal path: Azure Cache for Redis instance
#   -> Resource menu -> Data Access Configuration -> Add -> New Redis User
#   -> Access Policies tab -> pick one of the three above
#   -> Redis Users tab -> select the managed identity`,
    },
    {
      label: 'The real Azure RBAC role with an almost-identical name (control-plane only)',
      language: 'bash',
      code: `# A DIFFERENT, REAL Azure built-in role -- easy to reach for by
# mistake if you're hunting for something named "Redis Contributor":

az role assignment create \\
  --assignee <PRINCIPAL_ID> \\
  --role "Redis Cache Contributor" \\
  --scope /subscriptions/<SUB_ID>/resourceGroups/my-rg/providers/Microsoft.Cache/Redis/my-redis

# Per its own published permissions, "Redis Cache Contributor"
# includes actions like Microsoft.Cache/redis/* (manage the resource:
# create, delete, scale, configure) but defines NO dataActions and NO
# notDataActions at all.
#
# Net effect: an identity with ONLY this role assigned can fully
# manage the cache as an Azure resource, but every single Redis data
# command it attempts (GET, SET, PUBLISH, everything) is denied --
# because control-plane RBAC and the cache's own data access
# policies are two entirely separate authorization systems.

# Correct setup almost always needs BOTH, for different purposes:
#   1. "Redis Cache Contributor" (or similar) -- to provision/manage
#      the resource itself
#   2. A Data Access Configuration entry (Data Owner/Contributor/
#      Reader) -- for an application identity to actually read or
#      write cache data`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer follows an internal wiki page (written before this correction) that says to grant a container app\'s managed identity "the Redis Contributor role" for Entra ID authentication. They search the Azure RBAC role picker, find "Redis Cache Contributor," and assign it. The app can successfully call az redis show and see the cache\'s properties, but every Redis command it issues (GET, SET) fails with an authorization error. Why?',
    hint: 'Check whether "Redis Cache Contributor" is a data-plane role (grants Redis commands) or a control-plane role (grants Azure resource management operations), and what dataActions it actually defines.',
    solution: 'The developer assigned a role that manages the CACHE RESOURCE, not one that grants access to the DATA inside it. "Redis Cache Contributor" is a pure control-plane Azure RBAC role — per its own published permissions, it includes broad Microsoft.Cache/redis/* resource-management actions but defines no dataActions at all, which is exactly why az redis show (a control-plane, resource-metadata operation) succeeds while every actual Redis command (a data-plane operation) is denied. The fix is to also grant the managed identity one of the three real data access policies — Data Owner, Data Contributor, or Data Reader — through the cache\'s own Data Access Configuration blade, which is a completely separate authorization mechanism from Azure RBAC. Neither role alone covers both needs; a typical setup needs "Redis Cache Contributor" (or similar) for resource management AND a Data Access Configuration entry for the application to actually talk to cache data.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Cache for Redis has a data access role literally named "Redis Contributor" that you assign to a managed identity for Entra ID authentication.',
      reality: 'Per this subtopic\'s theory (and the correction now on the main page), Microsoft\'s own documentation names exactly three data access policies — Data Owner, Data Contributor, and Data Reader — assigned through the cache\'s own Data Access Configuration blade, not a role picker; no policy named "Redis Contributor" exists.'
    },
    {
      thought: 'Since "Redis Cache Contributor" sounds like it should grant Redis data access, assigning it to a managed identity is enough for that identity to run Redis commands.',
      reality: 'Per this subtopic\'s theory, "Redis Cache Contributor" is confirmed to be a pure control-plane role with no dataActions defined at all — it lets a principal manage the cache resource (create, delete, scale, configure) but grants zero ability to read or write actual Redis data.'
    },
    {
      thought: 'Azure RBAC role assignments and the cache\'s Data Access Configuration policies are two names for the same underlying permission system.',
      reality: 'Per this subtopic\'s theory, these are two entirely separate authorization systems that operate on different planes — Azure RBAC governs management of the cache as an Azure resource, while Data Access Configuration policies (Data Owner/Contributor/Reader) govern what Redis data commands an Entra-authenticated identity can run — a real deployment typically needs both, granted independently.'
    }
  ];
}
