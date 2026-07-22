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
  templateUrl: './scale-to-zero-has-a-hidden-5-minute-cooldown.html',
  styleUrl: './scale-to-zero-has-a-hidden-5-minute-cooldown.scss'
})
export class ScaleToZeroHasAHidden5MinuteCooldownSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory states "with no traffic or events, replicas drop to 0" — with no timing attached',
      points: [
        'The main page\'s "Scaling: KEDA & Scale to Zero" section reads: "Scale to zero: with no traffic or events, replicas drop to 0. The first request after zero-scale triggers a cold start." Read on its own, this sentence describes an instantaneous transition — the moment the last request finishes or the last queue message is drained, the reader could reasonably assume replicas vanish immediately.',
        'Nothing on the main page names a delay, a timer, or any KEDA-level setting that governs exactly when that drop to zero actually happens — despite Container Apps using KEDA-driven scaling behaviors that are fully documented and have concrete default values.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own scaling documentation: a 300-second cooldown, not an instant drop',
      points: [
        'Per Microsoft\'s own "Scale behavior" reference table, the defaults are: Polling interval 30 seconds, Cool down period 300 seconds, Scale up stabilization window 0 seconds, Scale down stabilization window 300 seconds. The docs define cool down period explicitly: "how long after the last event KEDA waits before the application scales down to its minimum replica count."',
        'Microsoft\'s own documentation adds a scope-limiting note that is easy to miss: "The cool down period only takes effect when scaling in from the final replica to 0. The cool down period doesn\'t affect scaling as any other replicas are removed." So a revision going from 5 replicas down to 2 happens on the normal scale-down step (100% of replicas that need to shut down) — the 300-second wait applies only to that very last replica\'s trip to zero.',
        'The worked example in Microsoft\'s own docs makes the full timeline concrete: KEDA polls a queue every 30 seconds (the polling interval), and once the queue length reaches 0, "KEDA waits for 300 seconds (cool down period) before scaling the app to 0" — meaning an app can sit at 1 idle replica for up to five minutes after the last message was processed, still consuming compute, before it actually reaches zero.',
      ]
    },
    {
      heading: 'Why this matters for both the cost story and the cold-start story',
      points: [
        'The main page\'s own cost-motivated framing of scale-to-zero ("great for cost") is only fully true after this cooldown elapses — an app with bursty, on-and-off traffic every few minutes may never actually reach zero at all, since each new burst resets the cooldown clock before the previous one expires, keeping at least one replica billed continuously.',
        'This cuts the other way for latency too: because the last replica lingers for up to five minutes after traffic stops, an app that gets even occasional low-frequency traffic (say, once every 2–3 minutes) will almost never experience the cold start the main page warns about — the replica is often still warm from the cooldown window when the next request arrives, even with min-replicas left at 0.',
        'HTTP and TCP scale rules use a different, shorter measurement window (a rolling 15-second average of requests/connections) for the scale-UP decision, but the SAME 300-second cool-down/scale-down-stabilization defaults govern the scale-DOWN-to-zero decision regardless of which rule type triggered the scale-out — the cooldown is a property of scale-in behavior generally, not something HTTP rules opt out of.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page implies vs. what actually happens',
      language: 'bash',
      code: `# Main page's own framing: "with no traffic or events, replicas drop to 0"
# reads as instantaneous. The default scale BEHAVIOR (not the scale
# RULE itself) tells a different story:

az containerapp update \\
  --name my-worker \\
  --resource-group my-rg \\
  --scale-rule-name sb-rule \\
  --scale-rule-type azure-servicebus \\
  --scale-rule-auth "connection=servicebus-connection" \\
  --scale-rule-metadata "queueName=orders" "messageCount=5" \\
  --min-replicas 0 --max-replicas 20

# Per Microsoft's own "Scale behavior" table, these are NOT
# configurable per scale-rule -- they are fixed platform defaults:
#   Polling interval:              30 seconds
#   Cool down period:              300 seconds (5 minutes)
#   Scale down stabilization:      300 seconds (5 minutes)
#
# Timeline after the LAST message in "orders" is processed:
#   t+0s    queue length reaches 0, replica count is still 1
#   t+30s   KEDA polls again, confirms queue is still empty
#   t+300s  cool down period elapses -> replica finally scales to 0
#
# The app is billed for up to 5 extra idle minutes after the
# last real unit of work finished -- not zero.`,
    },
    {
      label: 'The exception: mid-scale-down replicas skip the cooldown',
      language: 'bash',
      code: `# Per Microsoft's own docs: "The cool down period only takes effect
# when scaling in from the final replica to 0. The cool down period
# doesn't affect scaling as any other replicas are removed."

# Scenario: an HTTP app currently running at 8 replicas under load.
# Traffic drops sharply.

# Step 1 (immediate-ish, governed by the 300s SCALE-DOWN
# STABILIZATION WINDOW, not the cool-down period):
#   8 replicas -> 1 replica
#   This uses the "Scale down step: 100% of replicas that need to
#   shut down" behavior once the stabilization window confirms load
#   has genuinely dropped -- still not instant, but a DIFFERENT
#   300-second timer than the one governing the final replica.

# Step 2 (the one this subtopic is about):
#   1 replica -> 0 replicas
#   Only THIS transition is gated by the 300-second cool down period
#   described above -- the trip from "some replicas" down to "a
#   few" is governed by the scale-down stabilization window instead.

# Net effect either way: nothing about Container Apps scale-in,
# at any replica count, is instantaneous by default.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Container Apps worker (min-replicas 0, scaled by an Azure Storage Queue trigger) processes a burst of messages, finishes the last one, and the queue is confirmed empty. A teammate checks the Azure portal 90 seconds later and is confused to see 1 replica still listed as running, with no messages left to process. Is this a bug?',
    hint: 'Check what Microsoft\'s own "Scale behavior" defaults say about how long KEDA waits after the last event before scaling the final replica down to zero, and how that number compares to 90 seconds.',
    solution: 'Not a bug — this is the documented default cool down period working as intended. Per Microsoft\'s own Container Apps scaling reference, the cool down period defaults to 300 seconds (5 minutes) and governs exactly this transition: "how long after the last event KEDA waits before the application scales down to its minimum replica count." At 90 seconds after the queue emptied, the app is still well within that 300-second window, so seeing 1 replica still running is expected, not a fault. The replica will scale to 0 once the full cool down period elapses (assuming no new messages arrive first and reset the clock) — the same worked example in Microsoft\'s own docs shows a queue-triggered app waiting the full 300 seconds after the queue reaches length 0 before finally reaching zero replicas.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once the last message is processed or the last request finishes, a Container Apps replica scales to zero immediately.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own "Scale behavior" defaults define a 300-second cool down period specifically for the transition from the final replica down to zero — the app can sit at 1 idle (but billed) replica for up to five minutes after the last real unit of work finished.'
    },
    {
      thought: 'The 300-second cooldown applies to every scale-down step, so an app scaling from 8 replicas to 1 also waits 5 minutes at each step.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation is explicit that "the cool down period only takes effect when scaling in from the final replica to 0" — scaling down from any higher replica count is governed by the separate 300-second scale-down stabilization window instead, using a scale-down step of 100% of the replicas that need to shut down.'
    },
    {
      thought: 'Because it costs nothing extra, there\'s no reason to think about the scale-to-zero cooldown when reasoning about an app\'s cost or cold-start behavior.',
      reality: 'Per this subtopic\'s theory, an app is billed for the idle replica that lingers during the cool down window (idle replicas can be billed at a lower rate, but they are not free), and bursty traffic that repeats faster than every 5 minutes can keep resetting the cooldown clock and prevent the app from ever actually reaching zero at all.'
    }
  ];
}
