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
  templateUrl: './fault-injection-and-retries-cannot-coexist-on-the-same-route.html',
  styleUrl: './fault-injection-and-retries-cannot-coexist-on-the-same-route.scss'
})
export class FaultInjectionAndRetriesCannotCoexistOnTheSameRouteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents fault injection and retries as two independent features, in two separate sections',
      points: [
        'The main page covers "Timeouts and Retries" and "Traffic Mirroring and Fault Injection" as two distinct theory sections, each with its own code example. Nothing on the page states what happens if you combine both on the SAME VirtualService route — a natural thing to want, since testing "does my retry policy actually recover from a fault?" seems like exactly what fault injection should be for.',
      ]
    },
    {
      heading: 'The real constraint: Istio does not support fault injection and retries/timeouts on the same route',
      points: [
        'If a VirtualService HTTP route configures BOTH a <code>fault</code> block AND <code>retries</code>/<code>timeout</code>, Istio silently disables the retry and timeout policy on that specific route — the fault injection takes effect, but the retry/timeout configuration you also wrote simply does not apply.',
        'This is not a validation error or a rejected config — both blocks are accepted, and only the fault injection actually behaves as configured. The retries/timeout fields sit there, syntactically valid, functionally inert for that route.',
      ]
    },
    {
      heading: 'The consequence: the exact "does retry recover from a fault?" test doesn\'t work the way you\'d expect',
      points: [
        'A team wanting to verify their retry policy handles a simulated failure — injecting an abort or delay on one route while expecting the SAME route\'s retry policy to kick in and recover — will find the retries never actually fire, because Istio has disabled them on that route the moment fault injection was added.',
        'The correct pattern requires SEPARATING the two concerns across different VirtualServices (or different routes): configure retries genuinely, independently, on the client\'s normal route to the real service, and inject the fault via a SEPARATE mechanism — either a distinct VirtualService/route matched only for chaos-testing traffic, or (for cases needing both together) injecting the fault at the Envoy level directly via EnvoyFilter rather than through the VirtualService fault field, which sidesteps this specific restriction.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Broken: fault + retries on the same route',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment
spec:
  hosts:
  - payment
  http:
  - fault:
      abort:
        percentage: { value: 100 }
        httpStatus: 503
    timeout: 5s              # <-- accepted syntactically...
    retries:                 # <-- ...but SILENTLY DISABLED on
      attempts: 3             #     this route, because fault
      retryOn: 5xx             #     injection is also present
    route:
    - destination:
        host: payment
        subset: stable
EOF

# Every request to this route gets the injected 503 abort --
# but the retries NEVER fire, despite retryOn: 5xx matching
# exactly the status code being injected. The client sees a
# single 503, not 3 retried attempts.`,
    },
    {
      label: 'Correct: separate the fault test from the real retry policy',
      language: 'bash',
      code: `# VirtualService 1: the REAL route, with genuine retries --
# no fault block, retries actually work here
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment
spec:
  hosts:
  - payment
  http:
  - timeout: 5s
    retries:
      attempts: 3
      retryOn: 5xx
    route:
    - destination:
        host: payment
        subset: stable
---
# VirtualService 2: a SEPARATE, header-matched route used only
# for chaos testing -- fault injection here, no retries
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-chaos-test
spec:
  hosts:
  - payment
  http:
  - match:
    - headers:
        x-chaos-test: { exact: "true" }
    fault:
      abort:
        percentage: { value: 100 }
        httpStatus: 503
    route:
    - destination:
        host: payment
        subset: stable

# A chaos-testing client sends x-chaos-test: true and observes
# the raw 503 (proving the fault fires); a normal client uses
# the first VirtualService's real, working retry policy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to verify their VirtualService\'s retry policy (retries.attempts: 3, retryOn: 5xx) actually works, by adding a fault.abort block with httpStatus: 503 to the SAME route and observing whether the client still succeeds after retries. Every test run shows the client receiving a single 503 with no retry behavior at all, even though retryOn: 5xx should clearly match the injected status. What\'s actually happening?',
    hint: 'Does Istio allow a fault block and a retries/timeout block to both take effect on the exact same VirtualService route?',
    solution: 'Istio does not support fault injection and retries/timeouts on the same route — when a route configures both, Istio silently disables the retry and timeout policy for that route, leaving only the fault injection active. This is why retryOn: 5xx never fires despite exactly matching the injected 503 — the retries field is syntactically present but functionally inert on a route that also has fault injection configured. To actually test whether the retry policy recovers from a failure, the fault needs to be injected on a SEPARATE route or VirtualService (e.g. matched only for chaos-testing traffic via a header), leaving the real route\'s retries genuinely active and untouched by the fault configuration.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Configuring both a fault block and a retries/timeout block on the same VirtualService route lets you directly test whether the retry policy successfully recovers from the injected failure.',
      reality: 'Per this subtopic\'s theory, Istio silently disables retries and timeouts on any route where fault injection is also configured — the two features cannot coexist on the same route, so this exact "does retry recover the fault" test does not work as expected.'
    },
    {
      thought: 'If a VirtualService route has both fault and retries fields configured, and the retries never seem to fire, this indicates a validation error or misconfiguration in the retries block itself.',
      reality: 'Per this subtopic\'s theory, both blocks are accepted as syntactically valid configuration with no error — the retries block is simply inert on that route because fault injection is present, not because anything is wrong with the retries configuration itself.'
    },
    {
      thought: 'The only way to test how a service and its retry policy behave under simulated failure is to accept that fault injection and retries can never both be tested at once.',
      reality: 'Per this subtopic\'s theory, the two can still both be tested — just not on the identical route. Splitting the fault-injected traffic onto a separate, header-matched route or VirtualService (or injecting the fault via EnvoyFilter instead of the VirtualService fault field) lets both behaviors be verified independently.'
    }
  ];
}
