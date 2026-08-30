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
    heading: 'Every Step Named in Prose, No Polling Loop Anywhere',
    points: [
      'The QnA describes RFC 8628 step by step: "device requests a device_code... authorization server returns device_code, user_code, verification_uri... device displays go to example.com/device and enter XKCD-1234... device polls the token endpoint until the user approves." That is a complete, accurate description of every step — but the main page has no codeTab for any of it; every other flow on the page is browser-redirect-based (Auth Code + PKCE), which a smart TV or CLI tool cannot do at all.',
      'This subtopic builds the actual polling loop, verified via WebSearch against RFC 8628\'s own error-code semantics — specifically the distinction between <code>authorization_pending</code> (keep polling at the same interval) and <code>slow_down</code> (the interval must increase by 5 seconds, cumulatively, for every subsequent poll) — a distinction easy to get wrong by treating both errors identically.',
    ],
  },
  {
    heading: 'Why This Flow Has No Redirect At All',
    points: [
      'Every other OAuth flow on the main page depends on the device being able to open a browser and receive an HTTP redirect back — the Auth Code flow\'s entire <code>state</code>/callback mechanism assumes this. A smart TV remote, a CLI tool running over SSH, or a printer\'s tiny screen has no way to receive a redirect at all.',
      'The device authorization grant sidesteps this entirely: the DEVICE never navigates anywhere. It shows a short, human-typeable code on its own screen, the USER separately opens a browser on a DIFFERENT device (their phone) to approve it, and the original device discovers the outcome purely by repeatedly asking the token endpoint "am I approved yet?" — no redirect URI is needed anywhere in this flow.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Step 1 — Request a Device Code',
    language: 'typescript',
    code: `async function requestDeviceCode(): Promise<{
  device_code: string; user_code: string; verification_uri: string;
  expires_in: number; interval: number;
}> {
  const res = await fetch('https://auth.example.com/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: 'smart-tv-app', scope: 'openid profile' }),
  });
  return res.json();
}

// Display to the user on the device's OWN screen -- no redirect,
// no browser on THIS device at all:
const { device_code, user_code, verification_uri, expires_in, interval } = await requestDeviceCode();
console.log(\`Go to \${verification_uri} and enter code: \${user_code}\`);
// -> "Go to example.com/device and enter code: XKCD-1234"
// The user reads this off the TV screen and enters it on their PHONE.`,
  },
  {
    label: 'Step 2 — Poll the Token Endpoint',
    language: 'typescript',
    code: `async function pollForToken(deviceCode: string, initialIntervalSec: number, expiresInSec: number) {
  let intervalMs = initialIntervalSec * 1000;
  const deadline = Date.now() + expiresInSec * 1000;

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    const res = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode,
        client_id: 'smart-tv-app',
      }),
    });
    const body = await res.json();

    if (res.ok) return body; // { access_token, refresh_token, id_token, ... }

    if (body.error === 'authorization_pending') {
      continue; // user hasn't approved yet -- poll again at the SAME interval
    }
    if (body.error === 'slow_down') {
      // RFC 8628: the interval MUST increase by 5s, cumulatively, for
      // this and every subsequent poll -- NOT the same handling as
      // authorization_pending, even though both mean "keep trying."
      intervalMs += 5_000;
      continue;
    }
    // access_denied, expired_token, or anything else -- stop polling.
    throw new Error(\`Device flow failed: \${body.error}\`);
  }
  throw new Error('Device code expired before user approved');
}

const tokens = await pollForToken(device_code, interval, expires_in);`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The authorization server returns <code>slow_down</code> THREE times in a row before the user finally approves on the fourth poll. If the initial <code>interval</code> was 5 seconds, what is the actual polling interval by the time the fourth (successful) poll happens?',
  hint: 'Trace <code>intervalMs</code> through the loop above — each <code>slow_down</code> response adds exactly 5,000ms to whatever the CURRENT value already is, it does not reset back to the original interval.',
  solution: `// 20 seconds (5s initial + 5s + 5s + 5s = 20s) by the time the fourth
// poll succeeds.

// Tracing intervalMs through the loop: it starts at 5,000ms (the
// initial interval). Poll 1 returns slow_down -> intervalMs becomes
// 10,000ms. Poll 2 (now waiting 10s before firing) returns slow_down
// -> intervalMs becomes 15,000ms. Poll 3 (waiting 15s) returns
// slow_down -> intervalMs becomes 20,000ms. Poll 4 (waiting 20s) is
// the one that finally succeeds.

// The key detail the RFC is explicit about, and that the code above
// respects: each slow_down response ADDS to whatever the interval
// currently is -- it is cumulative, not a reset to a fixed "slow"
// value. A client that mishandled this (e.g. always adding 5s to the
// ORIGINAL interval instead of the CURRENT one, or resetting to the
// original interval after a successful poll instead of after the
// whole flow restarts) would poll faster than the server is actually
// willing to tolerate, risking further slow_down responses or, in a
// stricter implementation, outright rate-limiting.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>authorization_pending</code> and <code>slow_down</code> should be handled identically — both just mean "keep trying."',
    reality: 'Both errors DO mean "the flow isn\'t finished, keep polling" — but only <code>slow_down</code> carries the additional, RFC-mandated instruction to increase the polling interval by 5 seconds, cumulatively, for every subsequent request. Treating <code>slow_down</code> the same as <code>authorization_pending</code> (continuing to poll at the ORIGINAL interval) means ignoring the authorization server\'s explicit signal that it is being polled too aggressively — exactly the kind of subtle behavioral difference that\'s easy to miss when two error codes both superficially mean "not done yet."',
  },
  {
    thought: 'The device authorization grant is really just the Authorization Code flow with an extra polling step bolted on.',
    reality: 'It has no redirect URI, no <code>state</code> parameter, and no browser navigation on the requesting device AT ALL — the entire mechanism that makes the Auth Code flow work (the authorization server redirecting the user\'s browser back to the client with a code) is structurally absent here, because the requesting device (a TV, a CLI tool) often has no way to receive a redirect in the first place. The device code / user code / polling pattern is a genuinely different mechanism for achieving the same end goal (get an access token), not a minor variation of the redirect-based flow.',
  },
];

@Component({
  selector: 'app-sec-oauth-device',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-device-authorization-grant-implemented.html',
  styleUrl: './the-device-authorization-grant-implemented.scss',
})
export class TheDeviceAuthorizationGrantImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
