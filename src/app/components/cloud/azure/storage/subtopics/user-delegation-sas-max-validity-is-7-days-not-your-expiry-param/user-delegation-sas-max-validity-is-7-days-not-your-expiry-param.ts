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
  templateUrl: './user-delegation-sas-max-validity-is-7-days-not-your-expiry-param.html',
  styleUrl: './user-delegation-sas-max-validity-is-7-days-not-your-expiry-param.scss'
})
export class UserDelegationSasMaxValidityIs7DaysNotYourExpiryParamSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends User Delegation SAS as "preferred for security" without mentioning its signing key has its own, separate expiry',
      points: [
        'The main page\'s own theory states: "User Delegation SAS (signed with Entra ID — preferred for security)" and its codeTab uses --auth-mode login --as-user — but nowhere does it explain what actually signs a User Delegation SAS, or that the thing doing the signing has a lifetime of its own, independent of the --expiry value you pass.',
        'Every SAS is signed with a key. A Service SAS or Account SAS is signed with the storage account key, which does not expire on its own. A User Delegation SAS is signed with a user delegation key, requested implicitly via Entra ID credentials when you pass --auth-mode login --as-user.',
      ]
    },
    {
      heading: 'The user delegation key has a hard 7-day cap — and a longer --expiry is silently truncated, not rejected',
      points: [
        'Per Microsoft\'s own documentation: "the maximum interval over which the user delegation key is valid is 7 days from the start date, you should specify an expiry time for the SAS that is within 7 days of the start time." This is a hard platform limit, not a configurable policy — there is no setting, support ticket, or subscription tier that raises it.',
        'Critically, requesting a longer expiry does not produce an error at creation time: "The SAS is invalid after the user delegation key expires, so a SAS with an expiry time of greater than 7 days will still only be valid for 7 days." The CLI happily generates the token, embeds your requested --expiry in its se= parameter, and returns success — the token then works normally for 7 days and fails authentication after that, with the URL still visibly claiming the longer expiry.',
        'This is fundamentally unlike a Service SAS or Account SAS, whose account-key-derived signature has no independent expiry of its own — those CAN be set to expire arbitrarily far in the future (a different, separate risk, since a leaked long-lived Service SAS stays valid until its own embedded expiry with no automatic cutoff).',
      ]
    },
    {
      heading: 'How this bites in practice, and the actual fix',
      points: [
        'The failure mode is deceptive: a User Delegation SAS generated with a 90-day or 1-year --expiry works perfectly in testing (which typically happens within the first 7 days), then starts failing in production with an opaque 403 exactly 7 days after the SAS was issued — with nothing about the token itself signaling why, since its own se= parameter still claims a much later date.',
        'The fix for genuinely long-lived, server-side access is not a longer --expiry on the SAS — there is no way to raise the cap. The two real options are: switch to Managed Identity + RBAC entirely (no token exists at all, so nothing to expire), or build re-issuance into the integration itself — a scheduled job that regenerates a fresh User Delegation SAS at least every 7 days.',
        'For the SAS pattern\'s actual intended use case — short-lived, client-facing links (a download link valid for an hour, a one-time upload URL) — the 7-day cap is essentially never a real constraint. It only bites when a User Delegation SAS is mistakenly used as a substitute for a long-lived credential.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A 90-day SAS that actually stops working on day 7',
      language: 'bash',
      code: `# This "looks" like a 90-day SAS -- the --expiry says so
az storage blob generate-sas \\
  --account-name mystorageacct --container-name mycontainer \\
  --name reports/q3.pdf \\
  --permissions r \\
  --expiry 2026-10-20T00:00:00Z \\
  --auth-mode login --as-user --full-uri

# The token returned embeds the requested expiry in its se= param:
# https://mystorageacct.blob.core.windows.net/mycontainer/reports/q3.pdf
#   ?se=2026-10-20T00%3A00%3A00Z&sp=r&sv=2023-11-03&sr=b
#   &skoid=<skoid>&sktid=<sktid>
#   &skt=2026-07-22T00%3A00%3A00Z    <- user delegation key START
#   &ske=2026-07-29T00%3A00%3A00Z    <- user delegation key EXPIRY (7 days later, NOT Oct 20)
#   &sks=b&skv=2023-11-03&sig=<signature>

# Every request with this URL succeeds until 2026-07-29T00:00:00Z.
# After that: 403 AuthenticationFailed -- "Signature not valid in the
# specified time frame" -- even though se= still says 2026-10-20.`,
    },
    {
      label: 'Fixing it: re-issue on a schedule instead of extending expiry',
      language: 'bash',
      code: `# There is no flag or setting that raises the 7-day cap -- it's a
# hard limit on the user delegation key itself, confirmed by
# Microsoft's own docs with no override option.

# Option 1: switch to Managed Identity + RBAC for server-side access.
# No token is issued at all, so there's nothing to expire:
#   new BlobServiceClient(accountUrl, new DefaultAzureCredential())

# Option 2: if a SAS is genuinely required (e.g. handing a URL to a
# third party that can't use Managed Identity), re-issue on a timer
# well inside the 7-day window -- e.g. a daily scheduled job:
az storage blob generate-sas \\
  --account-name mystorageacct --container-name mycontainer \\
  --name reports/q3.pdf --permissions r \\
  --expiry $(date -u -d '+3 days' '+%Y-%m-%dT%H:%M:%SZ') \\
  --auth-mode login --as-user --full-uri
# Run this (or the SDK equivalent) every 1-3 days so a fresh,
# still-valid token is always available before the old one's real
# (7-day-capped) expiry hits.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A background integration job generates a User Delegation SAS with --expiry set to 90 days from now and stores the resulting URL in a config file, expecting it to keep working for those 90 days. On day 10, the job starts failing every request with a 403. What\'s the most likely cause, and what\'s the correct fix — extending the --expiry further?',
    hint: 'Check what actually signs a User Delegation SAS, and how long that signing key itself stays valid for, independent of the --expiry value passed at creation.',
    solution: 'The SAS\'s own se= parameter still says day 90, but the underlying user delegation key that signs the token is only valid for 7 days from the SAS\'s start time — per Microsoft\'s own docs, "a SAS with an expiry time of greater than 7 days will still only be valid for 7 days." Authorization silently stopped working on day 7 (rounding to day 10 when the job happened to next run), not day 90. Extending --expiry further would not help — there is no way to raise the 7-day cap on the signing key itself. The correct fix is either switching the integration to Managed Identity + RBAC (eliminating the token entirely) or adding a scheduled re-issuance step that generates a fresh User Delegation SAS at least every 7 days.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting --expiry to a date 90 days or a year from now on a User Delegation SAS means the token stays valid for that long, the same as it would for a Service SAS.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states a User Delegation SAS "with an expiry time of greater than 7 days will still only be valid for 7 days" — the requested --expiry is embedded in the URL but has no effect past 7 days, because the key signing the token expires first.'
    },
    {
      thought: 'The 7-day cap on User Delegation SAS validity is a configurable policy that can be raised via a setting, support request, or subscription tier.',
      reality: 'Per this subtopic\'s theory, it is a hard platform limit tied to how the user delegation key itself works — Microsoft\'s own docs state the 7-day maximum with no override mechanism mentioned anywhere.'
    },
    {
      thought: 'Since a Service SAS, an Account SAS, and a User Delegation SAS are all just "SAS tokens," they must share the same 7-day validity cap.',
      reality: 'Per this subtopic\'s theory, only a User Delegation SAS has this cap, because only it is signed by a temporary, Entra ID-derived key. A Service SAS or Account SAS is signed by the storage account key, which does not expire on its own — their expiry genuinely can be set arbitrarily far into the future (a different, separate risk from this one).'
    }
  ];
}
