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
  templateUrl: './front-door-health-probe-samplesize-explained.html',
  styleUrl: './front-door-health-probe-samplesize-explained.scss'
})
export class FrontDoorHealthProbeSamplesizeExplainedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Front Door codeTab sets sample-size and successful-samples-required to specific numbers with zero explanation of what they mean',
      points: [
        'The main page\'s own "Azure Front Door" codeTab creates an origin group with: "--sample-size 4 --successful-samples-required 3" alongside a 30-second probe interval — four numbers total, none of which are defined anywhere in the main page\'s own theory, mistakes, or QnA.',
        'The main page\'s own theory mentions only that "Origin groups define health probes and priority/weight for failover between origins" — a one-sentence summary that gives no hint of how origin health is actually CALCULATED from multiple probe results, as opposed to a simple pass/fail on the most recent probe.',
      ]
    },
    {
      heading: 'Front Door doesn\'t judge health from the latest probe alone — it looks at a rolling window of recent probes, and a full-origin-group outage triggers a documented, specific fallback behavior',
      points: [
        'Per Microsoft\'s own documentation: "Front Door looks at the last n health probe responses. If at least x responses are healthy, the origin is considered healthy. Change the SampleSize property in load-balancing settings to set n. Change the SuccessfulSamplesRequired property in load-balancing settings to set x." The main page\'s own "--sample-size 4 --successful-samples-required 3" configuration means Front Door judges an origin healthy only if at least 3 of its last 4 probe attempts succeeded — a single failed probe out of four doesn\'t immediately mark the origin unhealthy, but two failures out of four does.',
        'Complete failure across an entire origin group has a specific, documented fallback — distinct from simply routing no traffic anywhere: "If health probes fail for every origin in an origin group, Front Door considers all origins unhealthy and routes traffic in a round robin distribution across all of them. When an origin returns to a healthy state, Front Door resumes the normal load-balancing algorithm." Rather than returning errors to every client when every origin looks unhealthy, Front Door keeps sending traffic anyway, spread evenly — favoring "some requests might reach a struggling origin" over "guarantee zero requests succeed."',
        'Probe volume is not fixed at the configured interval — it adapts to real client traffic reaching each edge location: "If the Azure Front Door edge locations don\'t receive real traffic from your end users, the frequency of the health probe from the edge location decreases from the configured frequency." An origin group serving a low-traffic region can receive noticeably fewer probes per minute than the configured interval alone would suggest.',
        'The default HTTP method for probes on new profiles isn\'t GET, and Microsoft recommends keeping it that way: "HEAD: The HEAD method is identical to GET except that the server MUST NOT return a message-body in the response. For new Front Door profiles, the probe method is set as HEAD by default... To lower the load and cost to your origins, use HEAD requests for health probes."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s own configuration and its actual meaning',
      language: 'bash',
      code: `# The main page's own example, unchanged
az afd origin-group create \\
  --profile-name my-fd --resource-group my-rg \\
  --origin-group-name my-origins \\
  --probe-request-type GET --probe-protocol Http \\
  --probe-interval-in-seconds 30 --probe-path /health \\
  --sample-size 4 --successful-samples-required 3

# Per Microsoft's own docs, this means: Front Door looks at the
# LAST 4 probe results for this origin. If 3 or more of those 4 were
# healthy (2xx), the origin is considered healthy overall -- one bad
# probe in the last 4 doesn't flip the origin to unhealthy, avoiding
# flapping from a single transient failure. Two bad probes out of
# the last 4 DOES flip it unhealthy.

# Tightening this for faster, more sensitive failure detection:
az afd origin-group update \\
  --profile-name my-fd --resource-group my-rg \\
  --origin-group-name my-origins \\
  --sample-size 2 --successful-samples-required 2
# Now requires BOTH of the last 2 probes to succeed -- a single
# failure immediately marks the origin unhealthy, at the cost of
# being more sensitive to transient blips.`,
    },
    {
      label: 'What happens if every origin fails at once',
      language: 'bash',
      code: `# Both origins in the group start failing health checks
# (e.g. a shared upstream dependency goes down)

# Per Microsoft's own docs: "If health probes fail for every origin
# in an origin group, Front Door considers all origins unhealthy and
# routes traffic in a round robin distribution across all of them."
# Front Door does NOT stop routing traffic entirely -- it keeps
# sending requests, evenly split, to origins it already knows are
# failing, on the reasoning that some traffic reaching a struggling
# origin beats guaranteed 100% failure for every client.

# Once at least one origin starts passing its SampleSize/
# SuccessfulSamplesRequired check again:
# "When an origin returns to a healthy state, Front Door resumes
# the normal load-balancing algorithm." -- normal priority/weight-
# based routing resumes automatically, no manual intervention
# required.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An origin configured with the main page\'s own default (--sample-size 4 --successful-samples-required 3) experiences exactly one failed health probe, then returns to passing on every subsequent probe. Using this subtopic\'s theory, does Front Door mark this origin as unhealthy at any point, and does it recover automatically?',
    hint: 'Per Microsoft\'s own documentation, does Front Door judge health based on the single most recent probe, or a rolling window of the last several probes — and how many failures within that window actually flip the status?',
    solution: 'Per this subtopic\'s theory, this single isolated failure does NOT mark the origin unhealthy at any point, because Front Door evaluates health over a rolling window, not the single latest probe. Microsoft\'s own documentation confirms: "Front Door looks at the last n health probe responses. If at least x responses are healthy, the origin is considered healthy." With SampleSize=4 and SuccessfulSamplesRequired=3, the origin needs at least 3 of its last 4 probes to succeed. Immediately after the one failed probe, the rolling window of the last 4 probes still contains 3 successes (assuming the 3 probes before it also succeeded), which already satisfies the "at least 3 of 4" requirement — the origin never drops below the healthy threshold at all in this scenario. If a SECOND failure had occurred within the same 4-probe window, the origin would have dropped to only 2 healthy out of 4, falling below the required 3, and would have been marked unhealthy until enough subsequent successful probes pushed the failure(s) out of the rolling window again.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Front Door marks an origin unhealthy the moment a single health probe fails, similar to a simple binary up/down check.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a rolling-window evaluation instead — "Front Door looks at the last n health probe responses. If at least x responses are healthy, the origin is considered healthy" — a single failed probe within a larger window of successes does not flip the origin to unhealthy.'
    },
    {
      thought: 'If every origin in a Front Door origin group is simultaneously unhealthy, Front Door stops routing traffic entirely and returns errors to all clients.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite: "Front Door considers all origins unhealthy and routes traffic in a round robin distribution across all of them" — it keeps sending traffic rather than failing every request outright.'
    },
    {
      thought: 'Front Door sends health probes to every origin at exactly the configured interval, regardless of how much real client traffic that region is receiving.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states probe frequency adapts to real traffic: "If the Azure Front Door edge locations don\'t receive real traffic from your end users, the frequency of the health probe from the edge location decreases from the configured frequency."'
    }
  ];
}
