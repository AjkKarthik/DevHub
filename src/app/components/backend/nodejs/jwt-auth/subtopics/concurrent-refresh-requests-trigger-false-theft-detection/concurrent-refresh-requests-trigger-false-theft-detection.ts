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
  templateUrl: './concurrent-refresh-requests-trigger-false-theft-detection.html',
  styleUrl: './concurrent-refresh-requests-trigger-false-theft-detection.scss'
})
export class ConcurrentRefreshRequestsTriggerFalseTheftDetectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own /auth/refresh code treats "an already-used refresh token is presented" as unambiguous evidence of theft — but that same signal can also be produced by two completely legitimate, concurrent requests racing each other, with no attacker involved at all',
      points: [
        'This is a genuinely recognized problem in refresh-token-rotation design, discussed across OAuth identity-provider security literature: if two requests carrying the SAME, not-yet-rotated refresh token reach the server nearly simultaneously — two open browser tabs both waking up and refreshing at once, or a client\'s automatic retry racing the original request after a slow or dropped response — the FIRST one processed succeeds, deletes the old token, and issues a new one. The SECOND request, arriving moments later with that now-already-deleted token, looks IDENTICAL to what a real attacker replaying a stolen, already-used token would produce.',
        'The main page\'s own code has no way to distinguish these two scenarios — "a genuine race between two legitimate requests from the same user" and "an attacker replaying a token they stole after it was already rotated" both trigger the exact same code path: db.refreshTokens.findByFamily() finds nothing (or the stored hash doesn\'t match), and the response is "Token reuse detected," followed by invalidating the ENTIRE token family — logging the legitimate user out of every device, purely because of unlucky request timing.',
        'This false-positive risk is a genuine, actively-discussed tradeoff of strict, zero-tolerance refresh-token rotation — not a flaw unique to the main page\'s specific implementation. It is the direct cost of the exact security property (detecting stolen-token reuse) the rotation scheme exists to provide.',
      ]
    },
    {
      heading: 'The commonly recommended mitigation: a short grace period, not zero tolerance',
      points: [
        'Identity-provider security guidance commonly recommends a short GRACE PERIOD (widely seen in the range of roughly 5 to 60 seconds) during which the IMMEDIATELY-PRIOR rotated token still validates and returns the SAME new token pair the first successful request already generated — rather than immediately, permanently invalidating it the instant a newer token exists. A second, near-simultaneous legitimate request lands within that grace window and gets the same (already-issued) new tokens back, harmlessly, instead of triggering theft detection.',
        'This is a genuine security/usability tradeoff, not a free fix: a grace period necessarily gives a real attacker who has ALSO obtained the old token that same small window to also successfully use it before rotation truly locks them out — the grace period\'s length is chosen to be just long enough to absorb realistic legitimate-race timing, without meaningfully widening a genuine attacker\'s opportunity.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own code — a legitimate race looks identical to theft',
      language: 'typescript',
      code: `// The main page's own /auth/refresh handler, unmodified.
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  // ... verify JWT signature ...

  const stored = await db.refreshTokens.findByFamily(payload.family);
  if (!stored) return res.status(401).json({ error: 'Token family reused — possible theft' });

  if (!(await bcrypt.compare(refreshToken, stored.tokenHash))) {
    // TWO scenarios produce this EXACT same branch:
    // (a) A real attacker replaying a stolen, already-rotated token.
    // (b) Two legitimate tabs/requests from the SAME user racing
    //     each other — the first already rotated the token by the
    //     time this second request's compare() runs.
    // The code cannot tell these apart — both get treated as theft.
    await db.refreshTokens.deleteByFamily(payload.family);
    return res.status(401).json({ error: 'Token reuse detected' });
  }
  // ... normal rotation continues ...
});`,
    },
    {
      label: 'Mitigation: a short grace period for the immediately-prior token',
      language: 'typescript',
      code: `app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  // ... verify JWT signature ...

  const stored = await db.refreshTokens.findByFamily(payload.family);
  if (!stored) return res.status(401).json({ error: 'Token family reused — possible theft' });

  if (!(await bcrypt.compare(refreshToken, stored.tokenHash))) {
    // Before assuming theft, check if this token matches the
    // IMMEDIATELY-PRIOR rotated token, within a short grace window.
    const prior = await db.refreshTokens.findPriorInGracePeriod(
      payload.family,
      /* graceSeconds */ 10
    );
    if (prior && await bcrypt.compare(refreshToken, prior.tokenHash)) {
      // Within the grace window — return the SAME new token pair
      // the first successful request already issued, instead of
      // treating this as theft. Harmless for a genuine race.
      return res.json({ accessToken: prior.issuedAccessToken });
    }

    // Genuinely outside the grace window — treat as theft as before.
    await db.refreshTokens.deleteByFamily(payload.family);
    return res.status(401).json({ error: 'Token reuse detected' });
  }
  // ... normal rotation continues ...
});

// Tradeoff: a real attacker who ALSO has the old token gets this
// same short grace window — the length is a deliberate balance
// between absorbing legitimate races and limiting attacker benefit.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A support team reports a recurring, low-frequency pattern: a small number of users occasionally get logged out of ALL their devices simultaneously, with no password change, no suspicious login location, and no other sign of actual compromise — support cannot find any evidence of a real attack in these cases. Using the documented race-condition failure mode of strict refresh-token rotation, what is a plausible explanation, and what change would reduce (not eliminate) its frequency?',
    hint: 'Does a user need more than one browser tab, or a flaky network connection triggering a client-side retry, to send two refresh requests carrying the exact same refresh token nearly simultaneously? Does the main page\'s own code distinguish that scenario from actual token theft?',
    solution: 'A plausible, well-documented explanation is exactly the race condition this subtopic describes — a user with multiple open tabs, or a client experiencing a slow/dropped response that triggers an automatic retry, can end up sending two requests carrying the SAME not-yet-rotated refresh token nearly simultaneously. The main page\'s own strict rotation logic has no way to distinguish this from a real attacker replaying a stolen, already-rotated token — both produce the identical "stored hash doesn\'t match" condition, both trigger the same "Token reuse detected" response, and both result in the entire token family (all of that user\'s devices) being invalidated — exactly matching the pattern support is describing, with no actual compromise involved. The recommended change is introducing a short grace period (commonly in the 5–60 second range, per common identity-provider guidance) during which the immediately-prior rotated token still validates and returns the SAME already-issued new token pair, rather than immediately treating any non-matching token as theft — this would let the losing request in a legitimate race land within the grace window and succeed harmlessly. This reduces, but does not fully eliminate, the false-positive frequency (a race wider than the grace period can still trigger it) — and deliberately trades a small amount of attacker opportunity (an attacker who also has the old token gets the same window) for meaningfully fewer legitimate users unnecessarily logged out.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a server\'s refresh-token-rotation logic detects an already-used refresh token being presented again, this unambiguously proves an attacker has stolen and replayed that token.',
      reality: 'This subtopic\'s theory and first code example both show this signal is genuinely ambiguous — two legitimate, concurrent requests from the SAME user (multiple tabs, or a client retry) can produce the exact identical "already-used token presented" condition, with no attacker involved at all.'
    },
    {
      thought: 'Adding a grace period for the immediately-prior rotated token is a pure improvement with no real security tradeoff — it only helps legitimate users, never an actual attacker.',
      reality: 'This subtopic\'s theory and second code example both clarify this is a genuine security/usability tradeoff — a real attacker who has ALSO obtained the old, stolen token gets the exact same grace window to successfully use it, meaning the grace period\'s length is a deliberate balance, not a free improvement.'
    },
    {
      thought: 'This false-positive risk is a flaw specific to the main page\'s own particular refresh-rotation implementation, and a genuinely well-designed rotation scheme would not have this problem at all.',
      reality: 'This subtopic\'s theory clarifies the opposite — this is a widely recognized, actively-discussed tradeoff across OAuth identity-provider security literature generally, an inherent cost of the exact reuse-detection security property strict rotation schemes are designed to provide, not a defect unique to this specific code.'
    }
  ];
}
