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
    heading: 'A Detailed Explanation, No Working Fetch Endpoint',
    points: [
      'The main page\'s own quiz question on A10 SSRF is unusually detailed — it names the AWS instance metadata endpoint (<code>169.254.169.254</code>), private IP ranges to block, and even the <code>file://</code> URL scheme risk. No codeTab on the page ever shows the actual vulnerable "fetch a user-supplied URL" endpoint, or what checking those ranges looks like in real code.',
      'This subtopic builds exactly that: a link-preview feature that fetches whatever URL a user provides — the canonical SSRF-vulnerable shape — and the allowlist/blocklist fix the quiz\'s own explanation describes.',
    ],
  },
  {
    heading: 'Why Cloud Metadata Endpoints Make SSRF Especially Dangerous',
    points: [
      'A plain "the server can read files I can\'t" SSRF is bad enough — but the main page\'s own quiz calls out WHY cloud SSRF specifically is worse: <code>169.254.169.254</code> is a special, non-routable address every major cloud provider uses to hand a running instance its OWN IAM credentials, no authentication required from ON THE INSTANCE ITSELF. An SSRF vulnerability lets an EXTERNAL attacker make a request that LOOKS like it came from the instance, walking straight through that "no auth needed if you\'re already inside" assumption.',
      'This is exactly why the fix has to block PRIVATE and LINK-LOCAL IP ranges specifically — <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>, and <code>169.254.0.0/16</code> — not just validate that the URL "looks like a normal website."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SSRF-Vulnerable — Fetches Any URL',
    language: 'typescript',
    code: `// A link-preview feature: given a URL, fetch it and extract the
// page title -- the canonical SSRF-vulnerable shape.
app.post('/preview-link', async (req, res) => {
  const { url } = req.body;
  const response = await fetch(url);   // fetches WHATEVER url the caller provides
  const html = await response.text();
  const title = extractTitle(html);
  res.json({ title });
});

// An attacker sends { "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }
// The SERVER (which genuinely IS running on the cloud instance) makes
// this request on the attacker's behalf -- and the response, containing
// real IAM credentials, gets extracted and returned to the attacker
// as if it were just a webpage's <title> tag.`,
  },
  {
    label: 'Fixed — Allowlist Scheme, Block Private Ranges',
    language: 'typescript',
    code: `import { isIP } from 'node:net';
import dns from 'node:dns/promises';

// Private/link-local ranges the quiz's own explanation names --
// requests to any of these are always rejected, regardless of what
// hostname or URL scheme was used to reach them.
const BLOCKED_RANGES = [
  { start: '10.0.0.0',     prefix: 8 },
  { start: '172.16.0.0',   prefix: 12 },
  { start: '192.168.0.0',  prefix: 16 },
  { start: '169.254.0.0',  prefix: 16 },   // link-local -- covers cloud metadata endpoints
  { start: '127.0.0.0',    prefix: 8 },
];

function isBlockedIp(ip: string): boolean {
  return BLOCKED_RANGES.some(range => ipInRange(ip, range.start, range.prefix));
}

app.post('/preview-link', async (req, res) => {
  const { url } = req.body;

  let parsed: URL;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  // Allowlist scheme -- rejects file://, gopher://, etc. outright.
  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only https URLs are allowed' });
  }

  // Resolve the hostname and check the ACTUAL IP -- not just the
  // hostname text, which an attacker could make LOOK innocent while
  // still resolving to a private address.
  const { address } = await dns.lookup(parsed.hostname);
  if (!isIP(address) || isBlockedIp(address)) {
    return res.status(400).json({ error: 'URL resolves to a disallowed address' });
  }

  const response = await fetch(url);
  const html = await response.text();
  res.json({ title: extractTitle(html) });
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An attacker sends a URL like <code>http://evil.com/redirect-to-metadata</code>, where <code>evil.com</code> is a real, public IP that passes the DNS-resolution check — but the page at that URL immediately issues an HTTP redirect to <code>http://169.254.169.254/...</code>. Does the fixed codeTab above catch this?',
  hint: 'Check exactly WHEN the IP-range check runs relative to when <code>fetch(url)</code> is called, and whether <code>fetch</code> follows redirects by default.',
  solution: `// No -- the fixed version as written does NOT catch this. The IP
// check only validates the address the ORIGINAL hostname resolves
// to (evil.com's real IP), BEFORE fetch(url) is called. fetch()
// follows HTTP redirects by default, and the redirect target
// (169.254.169.254) is never independently re-checked against
// BLOCKED_RANGES.

// A more complete fix needs one of: disabling redirect-following
// entirely (fetch(url, { redirect: 'manual' }) and manually
// validating each hop before following it), or using an HTTP client
// configured to re-validate the destination IP on every redirect,
// not just the first request. This is a well-known, genuinely tricky
// edge case in real SSRF defenses -- the main page's own quiz
// explanation doesn't mention it, but it's a direct consequence of
// combining "resolve and check up front" with a fetch client that
// transparently follows redirects afterward.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Checking that the URL\'s hostname "looks like" a normal public domain (not an IP address, not "localhost") is sufficient to prevent SSRF.',
    reality: 'A hostname is just a label an attacker fully controls the DNS record for — <code>evil-attacker-domain.com</code> can be configured to resolve to <code>169.254.169.254</code> just as easily as to a real public IP, an attack technique called "DNS rebinding." This is exactly why the fixed codeTab checks the RESOLVED IP address, not the hostname text — the hostname alone proves nothing about where the request will actually go.',
  },
  {
    thought: 'Restricting the URL scheme to <code>https:</code> alone is a complete SSRF fix on its own.',
    reality: 'Scheme restriction closes ONE specific channel the quiz names (<code>file://</code>, <code>gopher://</code>) but does nothing to stop an <code>https://</code> request from reaching a private IP or the cloud metadata endpoint — those are perfectly valid HTTPS (or even plain HTTP) targets from the SERVER\'s own network position. Scheme allowlisting and IP-range blocking address two genuinely different attack vectors within the same SSRF category, and the main page\'s own quiz names both as separate prevention steps for exactly this reason.',
  },
];

@Component({
  selector: 'app-sec-owasp-ssrf',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './preventing-ssrf-with-an-ip-allowlist.html',
  styleUrl: './preventing-ssrf-with-an-ip-allowlist.scss',
})
export class PreventingSsrfWithAnIpAllowlistSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
