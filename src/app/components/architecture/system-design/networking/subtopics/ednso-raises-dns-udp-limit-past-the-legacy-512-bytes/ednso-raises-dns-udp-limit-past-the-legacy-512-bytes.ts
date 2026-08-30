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
  templateUrl: './ednso-raises-dns-udp-limit-past-the-legacy-512-bytes.html',
  styleUrl: './ednso-raises-dns-udp-limit-past-the-legacy-512-bytes.scss'
})
export class Edns0RaisesDnsUdpLimitPastTheLegacy512BytesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "falls back to TCP" threshold that hasn\'t reflected reality for years',
      points: [
        'The main page\'s quiz explanation originally stated DNS "falls back to TCP for responses > 512 bytes" as a flat, current rule. This is the ORIGINAL 1987 DNS specification\'s limit — modern DNS has moved well past it. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: EDNS0 lets resolvers negotiate a much larger UDP buffer',
      points: [
        'EDNS0 (RFC 6891) added an OPT pseudo-record that lets a DNS client advertise the maximum UDP response size it can accept — resolvers using EDNS0 (which is the overwhelming majority of DNS traffic today) are NOT capped at 512 bytes at all.',
        'Following the 2020 "DNS Flag Day," the recommended and now-common EDNS0 buffer size is ~1232 bytes (chosen specifically to avoid IP fragmentation on typical internet paths) — a meaningful jump from the legacy 512-byte figure, though still well below the historically-advertised 4096-byte maximum some older resolvers used.',
        'TCP fallback still exists and still matters — for zone transfers (always TCP), for responses that exceed even the negotiated EDNS0 buffer size, and for responses with the truncation (TC) bit set — but the specific "512 bytes" threshold the main page cited is the legacy pre-EDNS0 number, not today\'s effective limit.',
      ]
    },
    {
      heading: 'Why the specific number matters, not just "DNS sometimes uses TCP"',
      points: [
        'DNSSEC-signed responses (carrying cryptographic signatures) and responses with many records routinely exceed 512 bytes but comfortably fit within a ~1232-byte EDNS0 buffer — under the main page\'s original framing, these would seem to require constant TCP fallback, when in practice EDNS0 handles them over UDP just fine.',
        'This matters concretely for anyone reasoning about DNS infrastructure capacity or latency: assuming near-constant TCP fallback (with its extra RTT for connection setup) for anything beyond 512 bytes would meaningfully overestimate DNS resolution latency and TCP listener load in a real capacity plan.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Seeing EDNS0\'s advertised buffer size directly',
      language: 'bash',
      code: `# Check whether a query uses EDNS0 and what buffer size it
# advertises -- 'dig' shows this in its OPT PSEUDOSECTION:
dig example.com A

# Look for a line like:
# ;; OPT PSEUDOSECTION:
# ; EDNS: version: 0, flags:; udp: 1232
#                                  ^^^^ the negotiated UDP buffer
#                                       size -- NOT 512

# Force a legacy, non-EDNS0 query to see the old 512-byte-era
# behavior for comparison:
dig +noedns example.com A

# Force TCP explicitly (for zone transfers, or responses that
# genuinely exceed the negotiated UDP buffer):
dig +tcp example.com A`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DNSSEC-signed response for a domain is 900 bytes. Using the main page\'s original (now-corrected) "falls back to TCP above 512 bytes" rule, you\'d expect this to require a TCP connection. Using the corrected EDNS0 behavior, does it?',
    hint: 'What UDP buffer size does modern EDNS0 typically negotiate, and is 900 bytes above or below that?',
    solution: 'No — a 900-byte response comfortably fits within the ~1232-byte UDP buffer size EDNS0 commonly negotiates today, so it would be delivered over plain UDP with no TCP fallback needed. The main page\'s original "512 bytes" threshold would have wrongly predicted a TCP fallback here. This is exactly the kind of case (DNSSEC-signed responses routinely exceeding 512 bytes) where the legacy threshold gives a meaningfully wrong answer about real-world DNS behavior.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any DNS response larger than 512 bytes requires falling back to a TCP connection.',
      reality: 'Per this subtopic\'s theory (a stale threshold corrected on the main page during this batch), EDNS0 lets modern DNS resolvers negotiate a much larger UDP buffer (commonly ~1232 bytes) — 512 bytes is the legacy, pre-EDNS0 limit, not today\'s effective one.'
    },
    {
      thought: 'DNSSEC-signed responses, which are often larger than 512 bytes, must routinely use TCP.',
      reality: 'Per this subtopic\'s theory, most DNSSEC responses fit comfortably within a typical ~1232-byte EDNS0 buffer and are delivered over plain UDP — TCP fallback is the exception, not the rule, for these.'
    },
    {
      thought: 'TCP fallback in DNS is essentially obsolete now that EDNS0 exists.',
      reality: 'Per this subtopic\'s theory, TCP fallback is still real and necessary — for zone transfers (always TCP), for responses exceeding even the negotiated EDNS0 buffer, and for truncated responses — the correction is about the THRESHOLD number, not whether TCP fallback still exists at all.'
    }
  ];
}
