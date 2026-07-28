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
  templateUrl: './check-the-gateways-own-programmed-condition-not-just-the-route.html',
  styleUrl: './check-the-gateways-own-programmed-condition-not-just-the-route.scss'
})
export class CheckTheGatewaysOwnProgrammedConditionNotJustTheRouteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real gap: the main page\'s debugging guidance only ever checks the ROUTE\'s status',
      points: [
        'The main page\'s "Not checking HTTPRoute status after applying" mistakes entry, and its matching quiz question, both direct debugging effort exclusively at <code>httproute .status.parents[].conditions</code> — checking for <code>Accepted</code> and <code>ResolvedRefs</code>. Neither mentions checking the GATEWAY resource\'s own status first, even though a broken Gateway can make every one of its attached routes behave strangely regardless of how correctly each route itself is configured.',
      ]
    },
    {
      heading: 'The reality: the Gateway resource has its own, separate status condition worth checking FIRST',
      points: [
        'A Gateway\'s own <code>status.conditions</code> includes a condition type called <strong>Programmed</strong> — per the Gateway API spec, this is True when "the object\'s config has been fully parsed, and has been successfully sent to a data plane for configuration." A Gateway that is NOT Programmed has not actually been deployed to any real load balancer/proxy infrastructure yet, no matter how correct its own YAML looks.',
        'Individual LISTENERS on a Gateway also carry their own conditions — a specific listener can report "Programmed" (ready) while a DIFFERENT listener on the SAME Gateway resource is not, e.g. because of a port conflict or an unresolvable TLS certificate reference scoped to just that one listener.',
      ]
    },
    {
      heading: 'Why checking the Gateway first is the more efficient debugging order',
      points: [
        'If the Gateway itself isn\'t Programmed, EVERY route attached to it will behave oddly (empty responses, connection refused, or routes stuck showing unclear states) — debugging by inspecting each individual HTTPRoute\'s own status first, one at a time, wastes time chasing symptoms of a single, shared root cause.',
        'Practical debugging order: check the Gateway\'s own <code>status.conditions</code> for <code>Programmed: True</code> FIRST (and the specific listener\'s own condition, if multiple listeners exist) — only once that confirms the underlying infrastructure is actually up should attention move to each individual HTTPRoute\'s <code>Accepted</code>/<code>ResolvedRefs</code> conditions, which is where the main page\'s existing guidance already correctly picks up.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking the Gateway\'s OWN status first (before any route)',
      language: 'bash',
      code: `kubectl get gateway main-gateway -n istio-system -o yaml

# Look for status.conditions with type: Programmed
# status:
#   conditions:
#   - type: Programmed
#     status: "False"     # <-- the whole Gateway isn't up yet
#     reason: ListenersNotValid
#     message: "port 443 conflicts with an existing listener"
#
# If Programmed is False here, EVERY route attached to this
# Gateway is affected -- there's no point debugging individual
# HTTPRoute status until this is resolved.

# Also check PER-LISTENER conditions (a Gateway can have
# multiple listeners, each with its own status):
kubectl get gateway main-gateway -n istio-system \\
  -o jsonpath='{.status.listeners[*].conditions}'`,
    },
    {
      label: 'THEN check individual route status (the main page\'s existing guidance)',
      language: 'bash',
      code: `# Only after confirming the Gateway itself is Programmed:
kubectl get httproute api-route -n production -o yaml

# .status.parents[].conditions:
# - type: Accepted
#   status: "True"      # Route was accepted by the Gateway
# - type: ResolvedRefs
#   status: "True"      # All backend Services exist and resolve

# If the Gateway is Programmed but a SPECIFIC route still
# fails, THIS is where the main page's original debugging
# guidance correctly applies.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has 6 HTTPRoutes all attached to the same Gateway. All 6 routes are suddenly returning connection errors. Following the main page\'s original debugging guidance, an engineer starts checking each HTTPRoute\'s .status.parents[].conditions one at a time — all 6 show Accepted: True and ResolvedRefs: True, which is confusing since the routes all claim to be fine. What should they check that the main page\'s original guidance never mentioned, and why does checking it FIRST (rather than each route individually) make sense here?',
    hint: 'If every route attached to the SAME Gateway is failing identically, what shared resource — checked before any individual route — could explain a single root cause affecting all of them?',
    solution: 'The engineer should check the Gateway resource\'s OWN status.conditions for the Programmed condition (and each listener\'s own condition), not just each HTTPRoute\'s status. Since all 6 routes attach to the same Gateway and are failing identically, a shared root cause at the Gateway level (e.g. the listener itself isn\'t Programmed — perhaps a certificate reference broke, or the underlying load balancer infrastructure failed to provision) is far more likely than 6 coincidentally-simultaneous route-level problems, especially since every route\'s own Accepted/ResolvedRefs conditions already look fine. Checking the Gateway\'s Programmed condition FIRST, before iterating through individual routes, would have identified the shared root cause immediately rather than spending time confirming (repeatedly) that each individual route\'s own configuration is correct.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When an HTTPRoute isn\'t working, the HTTPRoute\'s own status.parents[].conditions (Accepted, ResolvedRefs) is the complete picture — checking it is sufficient to diagnose any Gateway API routing problem.',
      reality: 'Per this subtopic\'s theory, the Gateway resource itself has its OWN separate status (including a Programmed condition) that must also be checked — a route can show perfectly healthy Accepted/ResolvedRefs conditions while the underlying Gateway infrastructure itself has failed to deploy.'
    },
    {
      thought: 'If multiple HTTPRoutes attached to the same Gateway are all failing simultaneously, the efficient debugging approach is checking each route\'s own status individually to rule each one out one at a time.',
      reality: 'Per this subtopic\'s theory, when multiple routes sharing the same Gateway fail identically, checking the shared Gateway\'s own status FIRST is more efficient — a single root cause at the Gateway level explains simultaneous failures across all its routes far more often than coincidental, simultaneous per-route issues.'
    },
    {
      thought: 'A Gateway resource with multiple listeners either works entirely or fails entirely — there\'s no such thing as one listener being healthy while another on the same Gateway is broken.',
      reality: 'Per this subtopic\'s theory, individual listeners on a Gateway carry their OWN separate conditions — one listener can be Programmed and healthy while a different listener on the exact same Gateway resource is not, due to an issue scoped specifically to that listener (like a port conflict or an unresolvable TLS certificate).'
    }
  ];
}
