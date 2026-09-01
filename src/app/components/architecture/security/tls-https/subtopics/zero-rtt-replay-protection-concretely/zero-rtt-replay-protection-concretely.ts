import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Why 0-RTT Data Can Be Replayed At All',
    points: [
      'The main page\'s own QnA explains 0-RTT precisely: on session RESUMPTION, TLS 1.3 lets a client send application data in its very first flight, encrypted with a key derived from a PREVIOUS session\'s pre-shared key — before any fresh handshake round trip completes.',
      'The risk this creates: an attacker who captures that first flight (the encrypted early data) can resend the EXACT SAME bytes to the server again later. The connection has no protocol-level way to distinguish "the real client sending this again" from "an attacker replaying a captured copy" — both look like a valid 0-RTT request with a valid pre-shared key.',
      'The QnA states the fix in one sentence — "never allow state-changing requests as 0-RTT early data... use only for idempotent read operations" — but never shows what enforcing that actually looks like in a real deployment.',
      'Node.js\'s own <code>https</code>/<code>tls</code> modules do not expose 0-RTT/early-data detection as a public API at all — TLS 1.3 termination (and the 0-RTT decision) happens at whatever\'s actually terminating TLS in front of the app: nginx, a CDN, or a load balancer, not inside Node.js application code directly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'nginx: Flagging Early Data for the App',
    language: 'typescript',
    code: `# nginx.conf -- nginx terminates TLS and decides whether 0-RTT is
# even enabled; it forwards the RESULT to the app via a header rather
# than the app trying to detect this itself.

server {
    listen 443 ssl;
    ssl_early_data on;

    location / {
        proxy_pass http://node-app:3000;

        # RFC 8470's own standard header, forwarded to the app --
        # $ssl_early_data is "1" for a request nginx accepted as
        # 0-RTT data, empty otherwise.
        proxy_set_header Early-Data \$ssl_early_data;
    }
}

# nginx can ALSO enforce this itself, before the request ever reaches
# the app -- but the app-level check below is what this subtopic
# builds, since nginx-level config alone can't apply request-specific
# logic (like the download-counter edge case in the Try It).`,
  },
  {
    label: 'The Node.js App: Rejecting Mutating Requests Sent as Early Data',
    language: 'typescript',
    code: `import express from 'express';
const app = express();

app.use((req, res, next) => {
  // Early-Data is a REAL, RFC 8470-defined HTTP header -- nginx (or
  // any RFC 8470-compliant proxy/CDN) sets it to "1" specifically for
  // requests that arrived as TLS 1.3 0-RTT data.
  const wasEarlyData = req.headers['early-data'] === '1';

  if (wasEarlyData && !['GET', 'HEAD'].includes(req.method)) {
    // A POST/PUT/DELETE arriving as 0-RTT data is exactly the
    // scenario the main page's own QnA warns against -- reject it
    // outright rather than trust it could only ever be the real
    // client, once, sending it for the first time.
    return res.status(425).json({
      error: 'State-changing requests are not accepted as 0-RTT early data',
    });
  }

  next();
});

// HTTP 425 "Too Early" (RFC 8470) exists in the spec SPECIFICALLY for
// this case -- it tells a well-behaved client "retry this exact same
// request once the full handshake has completed," which a real
// client can do automatically; a replay attacker gains nothing from
// a 425 response, since it never reveals whether the request would
// have otherwise succeeded.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A <code>GET /api/reports/download?reportId=42</code> request has a real side effect the developer didn\'t anticipate: it increments a <code>downloadCount</code> column server-side, purely for analytics. Assuming the method-based 425 middleware above is the ONLY defense in place, does allowing this specific route as 0-RTT data create a real replay risk?',
  hint: 'The middleware keys off <code>req.method</code> specifically — does a GET request satisfy that check\'s condition for being rejected?',
  solution: `// Yes -- this is a genuine gap, and the method-only check misses it
// entirely.

// The 425 rejection only fires for methods OUTSIDE ['GET', 'HEAD'] --
// a GET request always passes that check and is allowed as 0-RTT
// data, regardless of what the handler actually DOES once it runs.
// This GET has a real side effect (downloadCount incrementing) even
// though its HTTP method looks safe on paper -- exactly the same
// "GET should be idempotent but isn't" anti-pattern the main page's
// own CSRF topic warns about, just surfacing here as a 0-RTT replay
// risk instead of a CSRF one.

// A captured-and-replayed copy of this exact request would silently
// inflate downloadCount every time it's replayed, with the method-
// based check never noticing at all. The real fix is the SAME
// principle the CSRF topic already teaches: a GET that isn't
// genuinely idempotent is the underlying bug, independent of 0-RTT --
// moving the counter increment to a separate, explicitly non-early-
// data-eligible endpoint (or accepting the small inaccuracy) closes
// the gap, since no HTTP-method-based check alone can distinguish a
// "safe-looking but not actually safe" GET from a genuinely safe one.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Node.js has a built-in way to detect whether the current request arrived as TLS 1.3 0-RTT data.',
    reality: 'Node\'s own <code>https</code>/<code>tls</code> modules expose no such API — 0-RTT is a TLS-TERMINATION-layer decision, made by whatever actually terminates TLS (nginx, a CDN, a load balancer). The application only ever learns about it if that layer explicitly forwards the standard <code>Early-Data</code> header (RFC 8470), as the nginx config above does.',
  },
  {
    thought: 'Rejecting 0-RTT data for non-GET/HEAD methods (via a 425 response) is a complete defense against every 0-RTT replay risk.',
    reality: 'It only catches the case where the HTTP method itself signals a mutation. A route using GET but carrying a real side effect (the Try It\'s download-counter example) slips through a method-only check entirely — the underlying fix there is the same "GET must be idempotent" discipline this hub\'s own CSRF topic already teaches, not a 0-RTT-specific patch.',
  },
  {
    thought: '0-RTT replay risk only matters for a connection\'s literal first-ever request.',
    reality: 'It applies to EVERY request sent as early data during session RESUMPTION, not just a brand-new connection\'s first request — any 0-RTT flight, on any resumed session, can be captured and replayed by an attacker sitting on the network path.',
  },
];

@Component({
  selector: 'app-sec-tls-0rtt',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './zero-rtt-replay-protection-concretely.html',
  styleUrl: './zero-rtt-replay-protection-concretely.scss',
})
export class ZeroRttReplayProtectionConcretelySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
