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
  templateUrl: './wasmplugin-phase-determines-order-relative-to-built-in-filters.html',
  styleUrl: './wasmplugin-phase-determines-order-relative-to-built-in-filters.scss'
})
export class WasmpluginPhaseDeterminesOrderRelativeToBuiltInFiltersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists WasmPlugin\'s phase values without saying what they actually order against',
      points: [
        'The main page\'s theory bullet says: "WasmPlugin spec: ... phase (AUTHN/AUTHZ/STATS/UNSPECIFIED) ..." — naming the four phase values, but never stating what determines relative to WHAT: whether an AUTHN-phase plugin runs before or after Istio\'s own built-in authentication filter (<code>jwt_authn</code>), for instance.',
      ]
    },
    {
      heading: 'What phase actually controls: placement relative to Istio\'s own internal security filters',
      points: [
        'A WasmPlugin\'s <code>phase</code> field determines where in the filter chain it is inserted relative to Istio\'s own built-in filters — specifically its authentication (<code>jwt_authn</code>, often referred to as <code>istio.authn</code> in filter-chain listings) and authorization (<code>rbac</code>) filters.',
        'A plugin in the <code>AUTHN</code> phase runs BEFORE Istio\'s own built-in authentication filter — this is precisely what makes it possible to write a custom authentication plugin (e.g. an OpenID Connect handshake) that produces a JWT and writes it into the request\'s <code>Authorization</code> header, for Istio\'s OWN <code>jwt_authn</code> filter to then validate immediately afterward in the same chain.',
        'A plugin in the <code>AUTHZ</code> phase runs after authentication has already completed, positioned to make authorization decisions using identity/claims that authentication (built-in or Wasm-based) has already established.',
      ]
    },
    {
      heading: 'Why this matters: getting the phase wrong breaks the exact use case WasmPlugin is meant to enable',
      points: [
        'If a custom authentication WasmPlugin were placed in the <code>AUTHZ</code> phase (or otherwise positioned after Istio\'s built-in <code>jwt_authn</code>) instead of <code>AUTHN</code>, the plugin\'s own JWT-producing logic would run too late — Istio\'s <code>jwt_authn</code> filter would have already evaluated the request BEFORE the plugin had a chance to populate the token it depends on, causing every request to fail authentication regardless of whether the plugin\'s own logic is otherwise correct.',
        'This is a different failure mode from a filter simply being silently skipped — it is a real ordering dependency between a custom plugin and Istio\'s own security pipeline, and <code>phase</code> is the field that expresses that dependency correctly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AUTHN-phase plugin runs BEFORE Istio\'s built-in jwt_authn',
      language: 'bash',
      code: `apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: openid-connect-bridge
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  url: oci://my-registry.io/wasm/oidc-bridge:v1.0.0
  phase: AUTHN          # <-- runs BEFORE istio's own jwt_authn filter
  pluginConfig:
    oidc_provider: "https://login.example.com"

# Resulting filter chain order (illustrative):
#   openid-connect-bridge (this WasmPlugin)
#     -> performs OIDC handshake, writes a signed JWT into the
#        request's Authorization header
#   istio.authn (Istio's built-in jwt_authn filter)
#     -> validates the JWT the plugin just wrote -- this ONLY
#        works because the plugin ran FIRST
#   router
#     -> forwards the now-authenticated request`,
    },
    {
      label: 'The wrong phase breaks the whole flow',
      language: 'bash',
      code: `apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: openid-connect-bridge
spec:
  selector:
    matchLabels: { app: api-gateway }
  url: oci://my-registry.io/wasm/oidc-bridge:v1.0.0
  phase: AUTHZ          # WRONG -- runs AFTER jwt_authn, not before
  pluginConfig:
    oidc_provider: "https://login.example.com"

# Resulting order (broken):
#   istio.authn (Istio's built-in jwt_authn filter)
#     -> looks for a JWT in the Authorization header
#     -> FINDS NOTHING -- the OIDC plugin hasn't run yet
#     -> rejects the request with 401, every single time
#   openid-connect-bridge (this WasmPlugin)
#     -> never actually gets a chance to run its own logic,
#        since the request was already rejected upstream of it

# Every request fails auth, even though the plugin's OWN code
# is completely correct -- the only thing wrong is 'phase'.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a WasmPlugin that performs a custom OIDC handshake and injects a resulting JWT into the request before forwarding it onward, intending for Istio\'s own jwt_authn filter to then validate that token. They set phase: AUTHZ on the plugin (reasoning "authentication produces an identity, and identity feeds into authorization, so AUTHZ feels right"). Every request now fails with a 401 from Istio\'s built-in filter, even though the plugin\'s own OIDC logic works correctly in isolation. What\'s wrong, and what should phase have been set to?',
    hint: 'Does an AUTHZ-phase plugin run before or after Istio\'s own authentication filter validates the request?',
    solution: 'The phase should have been AUTHN, not AUTHZ. An AUTHZ-phase plugin runs AFTER authentication has already completed — but this plugin\'s job is to PRODUCE the credential (the JWT) that Istio\'s own jwt_authn filter is supposed to validate. With phase: AUTHZ, Istio\'s built-in authentication filter runs first, looks for a JWT in the Authorization header, finds nothing (since the plugin that would have written it hasn\'t run yet), and rejects every request with a 401 — the plugin never even gets a chance to execute its own logic. Setting phase: AUTHN correctly places the plugin BEFORE Istio\'s built-in authentication filter, so its OIDC-produced JWT is already in place by the time jwt_authn evaluates the request.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A WasmPlugin\'s phase field is primarily a categorization/labeling mechanism for organizing plugins by purpose, similar to a tag, rather than something that changes actual filter-chain execution order.',
      reality: 'Per this subtopic\'s theory, phase directly determines placement in the filter chain relative to Istio\'s own built-in security filters — an AUTHN-phase plugin genuinely executes before jwt_authn, and getting this wrong causes real, functional failures, not just a cosmetic mislabeling.'
    },
    {
      thought: 'Since authentication logically precedes authorization, a plugin that "does something related to identity" is safe to place in either the AUTHN or AUTHZ phase — the distinction matters more for authorization-specific logic than for anything touching identity broadly.',
      reality: 'Per this subtopic\'s theory, the AUTHN/AUTHZ distinction is a strict ordering boundary relative to Istio\'s OWN built-in jwt_authn filter — a plugin that must run BEFORE jwt_authn (like one producing the token jwt_authn will validate) breaks entirely if placed in AUTHZ, regardless of how "identity-related" its purpose is.'
    },
    {
      thought: 'If a WasmPlugin is configured with the wrong phase, the symptom would be the plugin itself malfunctioning or erroring, making the misconfiguration easy to spot by looking at the plugin\'s own logs.',
      reality: 'Per this subtopic\'s theory, the actual symptom can be Istio\'s OWN built-in filter (jwt_authn) rejecting every request before the misplaced plugin ever runs — the plugin\'s own logs may show nothing wrong at all, since it never got invoked, making the root cause easy to misattribute to the plugin\'s code rather than its phase configuration.'
    }
  ];
}
