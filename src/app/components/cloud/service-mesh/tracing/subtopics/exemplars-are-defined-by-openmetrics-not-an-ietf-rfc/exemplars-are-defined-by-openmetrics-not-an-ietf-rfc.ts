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
  templateUrl: './exemplars-are-defined-by-openmetrics-not-an-ietf-rfc.html',
  styleUrl: './exemplars-are-defined-by-openmetrics-not-an-ietf-rfc.scss'
})
export class ExemplarsAreDefinedByOpenMetricsNotAnIetfRfcSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A fabricated citation caught during this batch — the most clear-cut kind of inaccuracy',
      points: [
        'The main page\'s QnA originally opened with: "Prometheus Exemplars (RFC 4652) attach a trace ID to a specific metric sample." Checking this citation directly, RFC 4652 is a REAL, existing IETF document — but it has nothing whatsoever to do with Prometheus, metrics, or tracing. Exemplars are not defined by any IETF RFC at all. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: Exemplars are defined by the OpenMetrics specification',
      points: [
        'Prometheus Exemplars are specified by <strong>OpenMetrics</strong>, a community-driven, Prometheus-format-based specification (not an IETF RFC) that formally defines the exemplar concept: a LabelSet and a Number value, with a required timestamp, attached to a metric sample as a reference to "data outside of the MetricSet" — commonly a trace ID and span ID pointing at the specific request that produced that data point.',
        'OpenMetrics also documents real, concrete constraints worth knowing: a histogram bucket "MUST NOT have more than one exemplar," and there is a hard 128 UTF-8 character limit across all exemplar label names and values combined — specifically to prevent exemplars being misused as a general-purpose event-logging or span-data channel rather than a lightweight pointer.',
      ]
    },
    {
      heading: 'Why a fabricated-but-plausible citation is worth flagging specifically',
      points: [
        'An "RFC 4652" citation looks exactly like the kind of specific, authoritative-sounding detail that invites no scrutiny — a genuine IETF RFC number, formatted correctly, attached to a real, correctly-described feature. The citation itself being wrong doesn\'t change anything about whether Exemplars work the way the main page describes; it is a fabricated SOURCE for an otherwise accurate claim, not an inaccurate claim about the feature\'s behavior.',
        'This is a distinct failure mode from every other inaccuracy caught in this hub so far (wrong field names, wrong defaults, backwards semantics) — those were errors about WHAT something does; this was an error about WHERE the authoritative definition of something correctly-described actually lives. Both are worth catching, but they call for different verification approaches: checking a claimed citation means actually looking up whether that citation exists and says what it\'s claimed to say, not just checking whether the described BEHAVIOR sounds plausible.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The corrected citation, with the real defining constraints',
      language: 'bash',
      code: `# Exemplars are defined by the OpenMetrics specification --
# NOT any IETF RFC. Real, documented OpenMetrics constraints:

# 1. An exemplar MUST consist of a LabelSet + a Number value,
#    and MUST have a timestamp.

# 2. A histogram bucket MUST NOT have more than one exemplar
#    (only ONE trace_id can be attached per bucket per scrape).

# 3. Hard 128 UTF-8 character limit across ALL exemplar label
#    names and values combined -- deliberately too small for
#    exemplars to be (mis)used as a general event-logging or
#    full-span-data channel; they're a lightweight POINTER only.

# Example exemplar-annotated Prometheus scrape line:
http_request_duration_seconds_bucket{le="0.5"} 42 # {trace_id="abc123",span_id="def456"} 0.45 1699564800`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'While reviewing internal documentation before a team presentation on observability, an engineer notices a slide citing "RFC 4652" as the specification defining Prometheus Exemplars — copied from an older internal wiki page. They want to verify this before presenting it publicly. What should they check, and what will they find?',
    hint: 'Is RFC 4652 an IETF document that actually exists — and if so, does it have anything to do with Prometheus, metrics, or tracing?',
    solution: 'RFC 4652 is a genuine, existing IETF RFC — but it has no connection to Prometheus, metrics, exemplars, or tracing whatsoever; it is a real document about an entirely unrelated topic. The engineer should look up the actual authoritative source for the Exemplars feature, which is the OpenMetrics specification (a community-driven, Prometheus-format-based spec, not an IETF RFC) — it formally defines exemplars as a LabelSet + Number value with a required timestamp, attached to a metric sample. The fix for the presentation is replacing the "RFC 4652" citation with a reference to the OpenMetrics specification\'s exemplar definition, and this is also a good opportunity to flag the same error anywhere else it may have been copied across the team\'s internal documentation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Prometheus Exemplars are formally defined by an IETF RFC (RFC 4652), similar to how many other well-known internet protocols and formats have an RFC as their authoritative specification.',
      reality: 'Per this subtopic\'s theory (a fabricated citation caught and corrected on the main page during this batch), Exemplars are defined by the OpenMetrics specification, a community-driven spec — not any IETF RFC. RFC 4652 is a real but entirely unrelated document.'
    },
    {
      thought: 'Since the main page\'s original description of HOW Exemplars work (attaching a trace ID to a metric sample) was accurate, the RFC 4652 citation attached to it must have been correct too.',
      reality: 'Per this subtopic\'s theory, a correct description of a feature\'s behavior and a correct citation for where that feature is formally defined are two separate claims — the behavior description was accurate, but the specific citation attached to it was fabricated and unrelated.'
    },
    {
      thought: 'Verifying a claim about a feature\'s BEHAVIOR (what it does) is sufficient due diligence — if the behavior sounds right, any citation attached to it can be trusted without separately checking it.',
      reality: 'Per this subtopic\'s theory, a citation is a distinct, separately-checkable claim from the behavior it\'s attached to — verifying it requires actually looking up whether the cited source exists and says what it\'s claimed to say, not just confirming the described behavior sounds plausible.'
    }
  ];
}
