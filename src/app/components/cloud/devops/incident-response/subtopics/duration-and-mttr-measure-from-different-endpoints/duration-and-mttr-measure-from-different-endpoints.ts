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
  templateUrl: './duration-and-mttr-measure-from-different-endpoints.html',
  styleUrl: './duration-and-mttr-measure-from-different-endpoints.scss'
})
export class DurationAndMttrMeasureFromDifferentEndpointsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own worked postmortem states two different duration numbers for the same incident, without ever reconciling them',
      points: [
        'The main page\'s own "Post-Mortem Template" code tab headlines the incident as "Duration: 47 minutes (14:22 – 15:09 UTC)." Further down, in the "What went well" section, the SAME postmortem states "MTTD: 2 minutes, MTTR: 11 minutes (rollback was fast)." These are two genuinely different numbers — 47 minutes and 11 minutes — for what a reader could easily assume is "how long the incident lasted," stated twice with no explanation of why they differ.',
        'The postmortem\'s own timeline resolves the apparent contradiction, if read carefully: "14:35 — Error rate < 0.1%, alert resolved" is the actual service-restoration moment — only 11 minutes after "14:24" (implied acknowledgment, matching the stated MTTD-plus-detection window). But "15:09 — Status page updated: resolved" is 47 minutes after the alert first fired at 14:22 — a full 34 minutes AFTER the service itself was already fixed.',
      ]
    },
    {
      heading: 'Two different endpoints, two different metrics — and the postmortem\'s own "what went wrong" section names the gap explicitly',
      points: [
        'MTTR (11 minutes), per the main page\'s own theory section elsewhere on the page, specifically measures "how long from detection until service is restored" — its endpoint is the moment the SERVICE itself is actually fixed (14:35, when the error rate genuinely dropped below 0.1%), not any later administrative step.',
        'The headline "Duration: 47 minutes" instead uses the STATUS PAGE UPDATE (15:09) as its endpoint — a fundamentally different milestone: not "when was the problem fixed" but "when did the team finish externally communicating that it was fixed." The postmortem\'s own "What went wrong" section names this gap directly and critically: "Status page was not updated until 38 minutes after resolution" — the SAME 34-38 minute gap (small rounding aside) between the 14:35 fix and the 15:09 status update that separates the two headline numbers.',
        'This is a genuinely useful postmortem pattern once named explicitly: a single incident can have MULTIPLE valid "duration" numbers depending on which endpoint you choose — technical resolution (feeds MTTR, the DORA metric), and full incident closure including communication (a broader, but less standardized, measure of the END-TO-END incident lifecycle). The main page\'s own postmortem template implicitly uses both without ever stating that they measure different things — a reader building their own postmortem template from this one could easily report only ONE of these numbers as "the" duration, silently hiding whichever gap the other measurement would have revealed (in this case, a genuine process failure the postmortem\'s own action items never even address).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing both numbers back to the postmortem\'s own timeline',
      language: 'bash',
      code: `# The main page's own timeline (UTC):
# 14:20 — Deployment completed (the actual root cause introduced)
# 14:22 — AlertManager: HighErrorRate firing        <- MTTD starts
# 14:23 — PagerDuty paged primary on-call (Alice)
# 14:25 — Alice acknowledged                        <- MTTD ends (~2-3 min)
# 14:27 — Identified deployment as likely cause
# 14:29 — Rollback initiated
# 14:31 — Rollback complete, pods healthy
# 14:35 — Error rate < 0.1%, alert resolved          <- MTTR ENDPOINT
#                                                     (~11 min after ack)
# 15:09 — Status page updated: resolved              <- "Duration" ENDPOINT
#                                                     (47 min after 14:22)

# MTTR (11 min) = 14:35 minus roughly 14:24 (detection/ack) --
# measures SERVICE restoration specifically.

# "Duration: 47 minutes" = 15:09 minus 14:22 -- measures the FULL
# span including the 34-minute gap where the service was already
# fixed but the status page hadn't caught up yet.

# Same incident. Same postmortem document. Two genuinely different
# numbers, because they're answering two different questions.`,
    },
    {
      label: 'The postmortem\'s own "what went wrong" section already names the gap',
      language: 'bash',
      code: `# The main page's own "What went wrong" section:
# - No pre-deploy env var validation caught the missing config
# - Readiness probe did not catch the configuration error at startup
# - Status page was not updated until 38 minutes after resolution
#                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^
#   This IS the gap between MTTR's endpoint (14:35, service fixed)
#   and Duration's endpoint (15:09, status page updated) -- named
#   explicitly here as its own real process failure, worth its
#   own action item, distinct from the technical root cause that
#   caused the outage in the first place.

# Yet the "Action Items" table never actually includes a fix for
# THIS specific gap -- all four action items address the technical
# root cause (env var validation, readinessProbe, automation) or a
# related pipeline gate. The 34-38 minute status-page delay,
# despite being explicitly flagged as "what went wrong," has no
# corresponding action item of its own in the main page's own
# template -- a good illustration of exactly the kind of finding
# that's easy to note but forget to actually assign an owner to.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team building their own postmortem template from the main page\'s own example decides to simplify it by keeping only ONE duration-style number at the top, to avoid "confusing readers with two similar-looking numbers." They choose to keep only "MTTR: 11 minutes" and drop the "Duration: 47 minutes" header entirely. Using this subtopic\'s theory, explain what information this simplification would silently lose.',
    hint: 'Per this subtopic\'s theory, does MTTR\'s own endpoint (service restoration) capture the same information as the full incident timeline, including the communication delay the postmortem\'s own "what went wrong" section flags?',
    solution: 'Dropping the "Duration: 47 minutes" figure and keeping only "MTTR: 11 minutes" would silently hide the exact process gap this subtopic\'s theory identifies — per the postmortem\'s own timeline, MTTR\'s endpoint is service restoration (14:35), which makes the incident look like it was resolved in 11 minutes total. But the postmortem\'s own "What went wrong" section explicitly flags that "Status page was not updated until 38 minutes after resolution" — a real process failure that only becomes visible when a SEPARATE, later-endpoint number (the 47-minute Duration, ending at the 15:09 status page update) is tracked alongside MTTR. A team reporting only the 11-minute MTTR would have no natural place in their own postmortem template to surface — or assign an action item to fix — the exact kind of external-communication delay this specific incident actually suffered from. The two numbers aren\'t redundant; each one exposes a different failure mode, and dropping either one narrows what the postmortem can actually catch.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "Duration: 47 minutes" and "MTTR: 11 minutes" are inconsistent or contradictory numbers in the same postmortem — probably just an error in the example.',
      reality: 'Per this subtopic\'s theory, tracing both numbers back to the postmortem\'s own timeline shows they are both correct — they simply measure from different endpoints (status page update vs. actual service restoration), a deliberate and useful distinction, not an inconsistency.'
    },
    {
      thought: '"Incident duration" and "MTTR" are two names for the same underlying measurement — how long the incident lasted.',
      reality: 'This subtopic\'s theory shows they can diverge significantly depending on what happens after the technical fix — MTTR specifically ends at service restoration, while a broader "duration" figure can extend to include post-fix administrative steps like status page updates, exactly as the main page\'s own worked example demonstrates with an 11-minute MTTR inside a 47-minute total duration.'
    },
    {
      thought: 'Since a postmortem already reports MTTR, tracking a separate "duration" figure covering the same incident is redundant information.',
      reality: 'Per this subtopic\'s second code example, the two numbers can each surface a DIFFERENT failure mode — MTTR reveals how fast the technical fix was; a separate, later-endpoint duration figure is what actually surfaces the postmortem\'s own flagged "status page not updated for 38 minutes" process gap, information the MTTR figure alone would never reveal.'
    }
  ];
}
