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
  templateUrl: './insert-after-targeting-router-means-the-filter-never-runs.html',
  styleUrl: './insert-after-targeting-router-means-the-filter-never-runs.scss'
})
export class InsertAfterTargetingRouterMeansTheFilterNeverRunsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page flags this exact risk in one QnA sentence, without ever showing what the mistake looks like or how to fix it',
      points: [
        'The main page\'s own QnA on debugging a non-executing EnvoyFilter says: "EnvoyFilter insertion points like BEFORE/AFTER/FIRST relative to existing filters can silently place your filter somewhere it never gets invoked, e.g. after the router filter has already terminated the chain." This names the failure mode precisely — but it\'s one clause inside a longer answer about a different question, with no worked example of what causes it or what the fix looks like.',
      ]
    },
    {
      heading: 'Why the router filter is special: it terminates the HTTP filter chain',
      points: [
        'The <code>router</code> filter — always last in a correctly-configured HTTP filter chain — is what actually selects a cluster and forwards the request upstream. Once <code>router</code> has run, the HTTP filter chain\'s job for that request is done; there is no "after router" step where a subsequent filter would meaningfully process anything.',
        'This means an <code>INSERT_AFTER</code> patch that targets the router filter by name places the new filter in a position that is never actually reached during normal request processing — the patch APPLIES successfully (Istio does not reject it), but the filter it inserts is functionally dead code.',
      ]
    },
    {
      heading: 'The correct pattern: INSERT_BEFORE the router, not INSERT_AFTER',
      points: [
        'The main page\'s own working "Add Lua Header" EnvoyFilter example already uses the CORRECT pattern — <code>operation: INSERT_BEFORE</code> with <code>subFilter: { name: "envoy.filters.http.router" }</code> — placing the new filter immediately BEFORE router, so it still runs while the request is genuinely being processed, before cluster selection and forwarding happen.',
        'The lesson generalizes beyond this one filter: any HTTP filter meant to observe or modify a request/response as part of normal processing needs to sit somewhere in the chain BEFORE router is reached — targeting router as an anchor point for <code>INSERT_AFTER</code> (rather than as the anchor for <code>INSERT_BEFORE</code>) is the specific mistake that produces a filter that\'s configured correctly in every other respect, but simply never executes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Broken: INSERT_AFTER the router filter',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: add-response-header-broken
  namespace: production
spec:
  workloadSelector:
    labels: { app: api-gateway }
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: "envoy.filters.network.http_connection_manager"
            subFilter:
              name: "envoy.filters.http.router"
    patch:
      operation: INSERT_AFTER    # <-- WRONG: nothing meaningful
                                  #     happens after router runs
      value:
        name: envoy.filters.http.lua
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.LuaPerRoute
          inline_code: |
            function envoy_on_response(response_handle)
              response_handle:headers():add("X-Powered-By", "ServiceMesh")
            end

# The patch APPLIES successfully -- istioctl analyze shows no
# error, config_dump shows the lua filter present in the chain.
# But: it never actually executes. Response headers are never
# modified, with zero errors or warnings anywhere.`,
    },
    {
      label: 'Fixed: INSERT_BEFORE the router filter',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: add-response-header-fixed
  namespace: production
spec:
  workloadSelector:
    labels: { app: api-gateway }
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: "envoy.filters.network.http_connection_manager"
            subFilter:
              name: "envoy.filters.http.router"
    patch:
      operation: INSERT_BEFORE   # <-- CORRECT: runs while the
                                  #     request is still live
      value:
        name: envoy.filters.http.lua
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.LuaPerRoute
          inline_code: |
            function envoy_on_response(response_handle)
              response_handle:headers():add("X-Powered-By", "ServiceMesh")
            end

# Confirm it's actually running:
kubectl exec deploy/api-gateway -c istio-proxy -- \\
  curl -sI http://localhost:8080/ | grep X-Powered-By
# X-Powered-By: ServiceMesh   -- now present on real responses`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes an EnvoyFilter that patches HTTP_FILTER with subFilter targeting envoy.filters.http.router, using operation: INSERT_AFTER, intending to log every response after it\'s been routed. istioctl analyze reports no errors, and the filter genuinely appears in istioctl proxy-config listener output in the expected position. But the filter\'s own logging never shows up, ever. What\'s actually wrong, and how would you confirm it before even looking at the filter\'s own code?',
    hint: 'What does the router filter actually do, and is there a meaningful "after router" step in an HTTP filter chain for a subsequent filter to run during?',
    solution: 'The filter is placed AFTER the router filter, which is the one that terminates the HTTP filter chain by selecting a cluster and forwarding the request upstream — there is no meaningful "after router" processing step for a subsequent filter to execute during, so the inserted filter is functionally dead even though it applies cleanly and shows up correctly in config inspection tools. This can be confirmed without touching the filter\'s own code at all: the presence of a filter in config_dump/proxy-config output only proves the PATCH applied, not that the filter chain actually reaches it during real request processing — the fix is changing operation to INSERT_BEFORE, so the filter runs while the request is still being actively processed, before router hands it off upstream.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If istioctl proxy-config listener or /config_dump shows a custom EnvoyFilter-inserted filter present in the filter chain at the expected position, that confirms the filter is actually executing on real traffic.',
      reality: 'Per this subtopic\'s theory, config inspection tools only confirm the PATCH applied successfully — they don\'t confirm the filter chain actually reaches that position during real request processing, which is exactly the gap an INSERT_AFTER-targeting-router mistake falls into.'
    },
    {
      thought: 'INSERT_AFTER and INSERT_BEFORE relative to the router filter are functionally interchangeable for a filter meant to observe or modify a response, since both place the new filter directly adjacent to router.',
      reality: 'Per this subtopic\'s theory, router terminates the HTTP filter chain by forwarding the request upstream — INSERT_BEFORE places the new filter somewhere still reached during live processing, while INSERT_AFTER places it somewhere that is never meaningfully executed at all.'
    },
    {
      thought: 'An EnvoyFilter that never actually executes would be flagged by istioctl analyze or fail to apply, since Istio validates EnvoyFilter configurations before accepting them.',
      reality: 'Per this subtopic\'s theory, Istio\'s validation confirms the patch is STRUCTURALLY valid and applies it successfully — it has no way to know the resulting filter position is functionally unreachable, so this specific mistake produces zero errors or warnings anywhere in the toolchain.'
    }
  ];
}
