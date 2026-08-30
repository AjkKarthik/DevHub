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
  templateUrl: './telemetry-api-sampling-wins-over-meshconfig-when-both-are-set.html',
  styleUrl: './telemetry-api-sampling-wins-over-meshconfig-when-both-are-set.scss'
})
export class TelemetryApiSamplingWinsOverMeshConfigWhenBothAreSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap the main page\'s own example walks straight into',
      points: [
        'The main page\'s own "Enable Tracing (Istio)" code example configures BOTH mechanisms at once: `meshConfig.defaultConfig.tracing.sampling: 10` in the IstioOperator spec, AND a separate Telemetry resource with `randomSamplingPercentage: 10`. In that example they happen to match, so the ambiguity never surfaces — but nothing on the page explains what happens when they DON\'T match.',
      ]
    },
    {
      heading: 'The reality: the Telemetry API always wins when both are configured',
      points: [
        'When a Telemetry resource\'s `randomSamplingPercentage` is set, it takes precedence over `meshConfig.defaultConfig.tracing.sampling` for whatever scope that Telemetry resource applies to — the mesh-config value becomes irrelevant wherever a Telemetry resource\'s sampling setting reaches.',
        '`meshConfig.defaultConfig.tracing.sampling` is the OLDER mechanism, predating the Telemetry API. It still works and still has real effect in the absence of a competing Telemetry resource, but it is not the SOURCE OF TRUTH once Telemetry-API-based sampling is introduced anywhere that would apply to the same workload.',
      ]
    },
    {
      heading: 'Why teams get bitten by this specifically during sampling changes',
      points: [
        'A common failure pattern: a team wants to lower sampling for a noisy service, so they add a workload-scoped Telemetry resource with a new `randomSamplingPercentage`. If a DIFFERENT team member later "double-checks" by also editing the mesh-wide `meshConfig.defaultConfig.tracing.sampling` value (not realizing a Telemetry resource already exists and wins), the mesh-config edit has NO effect on that workload at all — silently. Confusion follows: "I changed the sampling rate and nothing changed," when in fact the WRONG configuration surface was edited.',
        'The safe practice going forward: pick ONE mechanism — the Telemetry API — and stop editing `meshConfig.defaultConfig.tracing.sampling` at all once any Telemetry-based sampling exists in the mesh, to avoid this exact class of "I changed a setting and nothing happened" confusion.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The conflict: two DIFFERENT sampling rates configured',
      language: 'bash',
      code: `# IstioOperator (older mechanism) says 50%:
cat <<EOF | kubectl apply -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    defaultConfig:
      tracing:
        sampling: 50   # <- this value is NOW IGNORED wherever
                          #    a Telemetry resource applies
EOF

# Telemetry API (current mechanism) says 5%:
cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-tracing
  namespace: istio-system
spec:
  tracing:
  - providers:
    - name: otel-tracing
    randomSamplingPercentage: 5   # <- THIS is the one that
                                     #    actually takes effect
EOF
# The mesh actually samples at 5%, not 50% -- the
# IstioOperator value is silently superseded.`,
    },
    {
      label: 'The recommended, unambiguous setup: Telemetry API only',
      language: 'bash',
      code: `# Do NOT set meshConfig.defaultConfig.tracing.sampling at all --
# configure sampling exclusively through the Telemetry API,
# so there is only ONE place to look when adjusting rates:

cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-tracing
  namespace: istio-system
spec:
  tracing:
  - providers:
    - name: otel-tracing
    randomSamplingPercentage: 10
EOF
# Per-workload overrides (also Telemetry API, narrower scope):
cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: low-sampling-healthcheck
  namespace: production
spec:
  selector:
    matchLabels:
      app: high-traffic-api
  tracing:
  - providers:
    - name: otel-tracing
    randomSamplingPercentage: 1
EOF`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their tracing sampling rate is 5% and wants to raise it to 25% mesh-wide. They edit meshConfig.defaultConfig.tracing.sampling in their IstioOperator spec, changing it from 5 to 25, and apply the change. After waiting for the config to propagate, Jaeger still shows roughly 5% of requests being traced. What\'s the most likely explanation, and how would they confirm it?',
    hint: 'If a Telemetry resource with randomSamplingPercentage is already configured for the mesh, which of the two sampling settings actually takes effect?',
    solution: 'The most likely explanation is that a Telemetry resource with randomSamplingPercentage already exists (mesh-wide or covering this scope) and is set to 5% — since the Telemetry API takes precedence over meshConfig.defaultConfig.tracing.sampling whenever both are present, editing the IstioOperator value has no observable effect. To confirm, run kubectl get telemetry -A and inspect any resource with a tracing.randomSamplingPercentage field for a value matching the observed 5% rate. The fix is either updating that Telemetry resource\'s randomSamplingPercentage directly, or removing the competing Telemetry API sampling configuration if the team genuinely wants to fall back to the mesh-config value (not recommended, since it reintroduces this exact ambiguity for the next person).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'meshConfig.defaultConfig.tracing.sampling and the Telemetry API\'s randomSamplingPercentage are two independent settings that can be used interchangeably or safely combined for extra control.',
      reality: 'Per this subtopic\'s theory, these are NOT independent — when both apply to the same workload, the Telemetry API value always wins, making the mesh-config value silently irrelevant rather than an additional layer of control.'
    },
    {
      thought: 'If a sampling rate change via meshConfig.defaultConfig.tracing.sampling doesn\'t take effect, the most likely cause is a propagation delay or a caching issue.',
      reality: 'Per this subtopic\'s theory, a far more likely explanation — especially in a mesh that already uses the Telemetry API anywhere sampling-related — is that a Telemetry resource\'s randomSamplingPercentage is already governing that scope and simply overriding the mesh-config edit entirely, with no propagation delay involved at all.'
    },
    {
      thought: 'Since the main page\'s own example configures both meshConfig.defaultConfig.tracing.sampling and the Telemetry API\'s randomSamplingPercentage together, that dual-configuration pattern is the recommended, safe way to set sampling.',
      reality: 'Per this subtopic\'s theory, configuring both is not actually necessary or recommended — since the Telemetry API always wins when both are present, the safer, less confusing practice is configuring sampling exclusively through the Telemetry API and leaving meshConfig.defaultConfig.tracing.sampling untouched.'
    }
  ];
}
