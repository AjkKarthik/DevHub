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
    heading: 'The Detection Signal Is Explained, Never Built',
    points: [
      'The QnA describes password spraying\'s distinctive shape precisely: "each account has only 1-2 failures, staying under lockout thresholds... if any single IP hits many different accounts with failures in a short window, block and alert." That is a complete, buildable detection rule — but nothing on the main page ever builds it.',
      'It also explains why the main page\'s own per-account lockout mistake block (temporary lockout after N failures) does nothing to stop this specific attack: spraying deliberately keeps each individual account\'s failure count LOW, so no single account ever crosses the lockout threshold at all. The two defences (account lockout, spray detection) catch two DIFFERENT attack shapes, and this subtopic builds the one the main page never demonstrates.',
    ],
  },
  {
    heading: 'Why the Signal Is "Distinct Accounts," Not "Total Failures"',
    points: [
      'A naive per-IP rate limit (counting total failed attempts from one IP) can\'t distinguish password spraying from an ordinary user who just mistyped their own password five times — both produce "5 failures from one IP." The QnA\'s own detection rule is specifically about the number of DISTINCT accounts one IP has touched with failures, which a normal user\'s mistyping never produces (a legitimate user only ever fails against their OWN one account).',
      'This means the detector needs to track a SET of distinct usernames per IP within a sliding time window, not just a raw failure count — the set\'s SIZE is the actual spray signal, independent of how many total attempts were made.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Per-IP, Cross-Account Spray Detector',
    language: 'typescript',
    code: `type FailureRecord = { username: string; timestamp: number };

const WINDOW_MS = 10 * 60_000;        // 10-minute sliding window
const DISTINCT_ACCOUNT_THRESHOLD = 8; // >= 8 different accounts from one IP -> spray signal

// In-memory for illustration -- a real deployment would use Redis so
// this state is shared across multiple server instances.
const failuresByIp = new Map<string, FailureRecord[]>();

function recordLoginFailure(ip: string, username: string): { isSpraySuspected: boolean; distinctAccounts: number } {
  const now = Date.now();
  const existing = failuresByIp.get(ip) ?? [];

  // Prune anything outside the sliding window before adding the new one.
  const recent = existing.filter(r => now - r.timestamp < WINDOW_MS);
  recent.push({ username, timestamp: now });
  failuresByIp.set(ip, recent);

  // The actual spray signal: how many DISTINCT usernames, not how many
  // total attempts -- a Set collapses repeated failures against the
  // SAME account down to one entry, which is exactly what should NOT
  // count toward the spray threshold.
  const distinctAccounts = new Set(recent.map(r => r.username)).size;

  return { isSpraySuspected: distinctAccounts >= DISTINCT_ACCOUNT_THRESHOLD, distinctAccounts };
}

// ── Wired into the login endpoint ─────────────────────────────────────────
app.post('/auth/login', rateLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findByEmail(email);
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    const { isSpraySuspected, distinctAccounts } = recordLoginFailure(req.ip, email);
    if (isSpraySuspected) {
      logger.warn({ event: 'password_spray_suspected', ip: req.ip, distinctAccounts });
      // Escalate: CAPTCHA-gate this IP, alert the security team --
      // NOT a per-account lockout, since no single account here has
      // crossed its own lockout threshold at all.
    }
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: issueJwt(user.id) });
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'One IP address fails to log in to the SAME account 20 times in a row within the 10-minute window (a plain brute-force attempt, or just a very confused legitimate user). Does <code>recordLoginFailure</code> flag this as spray-suspected? Trace <code>distinctAccounts</code> for this exact scenario.',
  hint: 'The 20 failures all share one <code>username</code> value. What does that do to the SIZE of the <code>Set</code> built from <code>recent.map(r => r.username)</code>?',
  solution: `// No -- distinctAccounts stays at 1, regardless of how many times the
// SAME account failed, so isSpraySuspected is false for this entire
// scenario, even after all 20 attempts.

// recent.map(r => r.username) produces an array of 20 entries, but
// every single one of them is the SAME username string. Building a
// Set from that array collapses all 20 duplicate entries down to
// exactly 1 unique value -- distinctAccounts is 1, nowhere near the
// threshold of 8.

// This is intentional, not a gap: 20 failures against ONE account is
// a DIFFERENT attack shape (classic brute force, or account
// enumeration), which the main page's own per-account rate limiting
// and temporary lockout are specifically designed to catch instead.
// The detector built here is deliberately narrow -- it exists to
// catch the ONE signal a per-account defence structurally cannot see
// (many accounts, each touched lightly), not to be a general-purpose
// abuse detector on its own. Real deployments run both defences
// side by side, each covering the attack shape the other misses.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A per-IP rate limit that counts TOTAL failed login attempts (regardless of which account) would catch password spraying just as well as tracking distinct accounts.',
    reality: 'A total-failure-count limit can\'t distinguish spraying from an ordinary user repeatedly mistyping their own password — both produce the same raw number. The Try It above shows the opposite failure mode is just as real: a total-count-based rule set loosely enough to avoid false-positiving on typos would also let a real spray attack (many accounts, 1-2 failures each) sail under the threshold, since the PER-ACCOUNT failure count in a spray attack is deliberately kept low. Tracking the SET of distinct accounts is what actually isolates the spray-specific signal.',
  },
  {
    thought: 'Since spraying keeps each account\'s failure count low, the existing per-account temporary lockout (from the main page\'s own mistakes block) will eventually catch a determined attacker anyway.',
    reality: 'Not if the attacker knows the lockout threshold and deliberately stays under it — a spray attack trying 2 passwords against 10,000 accounts never comes close to any single account\'s lockout count, no matter how long the attack runs, precisely because it is designed around that exact defence. Per-account lockout and cross-account spray detection are not redundant; they are complementary, each closing a gap the other structurally cannot.',
  },
];

@Component({
  selector: 'app-sec-ps-spray',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './detecting-password-spraying-across-accounts.html',
  styleUrl: './detecting-password-spraying-across-accounts.scss',
})
export class DetectingPasswordSprayingAcrossAccountsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
