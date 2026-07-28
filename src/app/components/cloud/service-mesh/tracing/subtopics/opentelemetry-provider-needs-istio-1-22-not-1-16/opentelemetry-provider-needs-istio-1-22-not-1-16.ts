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
  templateUrl: './opentelemetry-provider-needs-istio-1-22-not-1-16.html',
  styleUrl: './opentelemetry-provider-needs-istio-1-22-not-1-16.scss'
})
export class OpenTelemetryProviderNeedsIstio122Not116Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A version claim worth double-checking before planning a migration around it',
      points: [
        'The main page originally stated: "Istio 1.16+ supports OpenTelemetry as a first-class tracing provider." Checking Istio\'s own documentation archive directly (rather than trusting the number at face value), the dedicated OpenTelemetry tracing-provider task page does not exist for the 1.16, 1.18, 1.20, or 1.21 documentation archives — it first appears at Istio 1.22. The main page has been corrected.',
      ]
    },
    {
      heading: 'Why this specific kind of claim is easy to get wrong — and easy to verify',
      points: [
        'Istio ships a new minor version roughly every few months, and OpenTelemetry itself has been evolving rapidly over the same period — it is genuinely easy to misremember or conflate "when the Telemetry API was introduced" (Istio 1.12, a real and different milestone) with "when THIS SPECIFIC provider (OpenTelemetry) became available inside that API."',
        'The verification method that surfaced this: rather than trusting a remembered or assumed version number, checking whether the archived documentation page for a specific Istio release version (`istio.io/v1.XX/docs/...`) actually exists is a fast, direct way to bound when a documented feature was introduced — a 404 on an older archived version is a strong signal the feature (or at least its dedicated task page) did not yet exist at that release.',
      ]
    },
    {
      heading: 'Practical implication for planning an OpenTelemetry migration',
      points: [
        'A team running an Istio version between 1.16 and 1.21 who read the ORIGINAL (incorrect) main-page claim might reasonably conclude their current version already supports the OpenTelemetry extension provider — and be surprised when `meshConfig.extensionProviders[0].opentelemetry` is rejected as an unrecognized field, or simply has no effect, on their actual installation.',
        'Before planning any OpenTelemetry tracing migration, confirm the CURRENT running Istio version explicitly (`istioctl version`) against the corrected 1.22+ requirement, rather than assuming an older mesh already has this capability available.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking your actual Istio version before relying on this feature',
      language: 'bash',
      code: `# Confirm the control plane version BEFORE assuming
# meshConfig.extensionProviders[0].opentelemetry is available:
istioctl version --short

# Example output:
# client version: 1.22.3
# control plane version: 1.19.4    <-- too old for the
#                                        OpenTelemetry provider
#
# On Istio < 1.22, meshConfig.extensionProviders[0].opentelemetry
# is either rejected outright or silently has no effect --
# depending on exactly how old the installation is, the
# failure mode itself can differ, which makes this an easy
# thing to misdiagnose as "a typo in my YAML" rather than
# "my control plane doesn't support this field yet."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team running Istio 1.18 reads documentation claiming OpenTelemetry tracing provider support has existed "since 1.16" and plans a tracing migration assuming their current version already supports it. During a proof-of-concept, they apply an IstioOperator spec with meshConfig.extensionProviders[0].opentelemetry configured, and tracing data never reaches their OTel Collector — no errors, just silence. What should they check first, and what does this subtopic\'s corrected version information suggest about the likely cause?',
    hint: 'Per the corrected version information, what is the actual minimum Istio version documented for the OpenTelemetry tracing provider — and is the team\'s running version (1.18) at or above that?',
    solution: 'The team should first confirm their actual running Istio control plane version with istioctl version --short, then compare it against the corrected minimum of 1.22+ for the documented OpenTelemetry tracing provider — 1.18 is below that threshold. This strongly suggests the silent failure (no errors, but no data reaching the OTel Collector) is because their control plane version does not support the opentelemetry extension provider field as documented, rather than a misconfiguration in their YAML. The fix is either upgrading the Istio control plane to 1.22 or later before attempting this specific migration, or using the older Zipkin-format tracing provider (which their 1.18 installation does support) as an interim step.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'OpenTelemetry has been available as a first-class Istio tracing provider since Istio 1.16, so any reasonably recent Istio installation should support it.',
      reality: 'Per this subtopic\'s theory (a version claim corrected on the main page during this batch), the documented minimum version is actually 1.22 — confirmed by the OpenTelemetry tracing-provider documentation page not existing in Istio\'s own archived docs for 1.16 through 1.21.'
    },
    {
      thought: 'A specific version number stated confidently in documentation ("supported since 1.16") is inherently reliable and doesn\'t need independent verification.',
      reality: 'Per this subtopic\'s theory, a stated version number is exactly the kind of specific, checkable claim that benefits from direct verification (e.g. checking whether an archived docs page exists for that version) rather than being trusted at face value — version claims are easy to misremember or conflate with a related but different milestone.'
    },
    {
      thought: 'If a feature like the OpenTelemetry extension provider isn\'t supported on an older Istio version, applying its configuration will produce a clear, obvious validation error.',
      reality: 'Per this subtopic\'s theory, the actual failure mode on an unsupported version can be silent — no errors, just data never arriving at the intended destination — making a version mismatch easy to misdiagnose as a configuration typo rather than a genuine version requirement.'
    }
  ];
}
