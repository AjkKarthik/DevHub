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
  templateUrl: './clocktolerance-handles-drift-between-distributed-servers.html',
  styleUrl: './clocktolerance-handles-drift-between-distributed-servers.scss'
})
export class ClocktoleranceHandlesDriftBetweenDistributedServersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz question explains exp precisely — "jwt.verify() throws TokenExpiredError if Date.now()/1000 > exp" — a correct description that quietly assumes the verifying server\'s clock is exactly right, which in a distributed system is not always true',
      points: [
        'exp (and the less-commonly-used nbf, "not before") are checked by comparing the claim against the CURRENT SYSTEM CLOCK of whichever server happens to be running jwt.verify() at that moment — not against the clock of the server that originally issued the token. In a single-server setup this distinction is invisible; in a distributed system with multiple servers (or containers, or microservices) issuing and verifying tokens, it is not.',
        'Server clocks drift. Even with NTP synchronization, small differences of a few seconds between machines are normal and expected in real infrastructure — a token issued at exp: now+900 by one server could, in principle, be checked by a verifying server whose clock reads a few seconds ahead, making a token that should still have time left appear to have just barely expired.',
        'The jsonwebtoken library\'s own documentation addresses this directly with a dedicated verify() option: clockTolerance — described as the "number of seconds to tolerate when checking the nbf and exp claims, to deal with small clock differences among different servers." Passing, for example, { clockTolerance: 10 } gives a 10-second grace window on both sides of the exp/nbf boundary before the library actually rejects the token.',
      ]
    },
    {
      heading: 'Why this matters more as an architecture scales, and a related testing-specific option',
      points: [
        'This is exactly the kind of gap that never shows up in local development (one machine, one clock) or even small deployments, but becomes a real, intermittent source of confusing "randomly expired token" bug reports once an application scales to multiple server instances, containers on different hosts, or a microservices architecture where the token-issuing service and the token-verifying service are genuinely different processes on genuinely different machines.',
        'A related, separate option — clockTimestamp — lets test code override what "now" means entirely for a specific verify() call, useful for writing deterministic unit tests around expiry behavior (e.g., asserting a token is correctly rejected exactly one second after its exp) without needing to actually wait in real time or mock the global Date object.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without clockTolerance — vulnerable to clock drift edge cases',
      language: 'typescript',
      code: `// The main page's own requireAuth middleware, unmodified — no
// tolerance for any clock difference between the issuing server
// and whichever server instance happens to run this verify() call.
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, ACCESS_SECRET, {
      issuer:   'devhub-api',
      audience: 'devhub-client',
      // No clockTolerance — a token that SHOULD still have a few
      // seconds of validity left, per the issuing server's clock,
      // can be rejected as expired if the verifying server's clock
      // happens to be running even slightly ahead.
    });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}`,
    },
    {
      label: 'With clockTolerance — a documented grace window',
      language: 'typescript',
      code: `export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, ACCESS_SECRET, {
      issuer:         'devhub-api',
      audience:       'devhub-client',
      clockTolerance: 10, // 10-second grace window on exp AND nbf,
                          // absorbing small, normal clock differences
                          // between distributed server instances.
    });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Testing use case for the related clockTimestamp option — override
// "now" deterministically instead of waiting in real time:
const futureCheck = jwt.verify(token, ACCESS_SECRET, {
  clockTimestamp: Math.floor(Date.now() / 1000) + 901, // pretend it's
                                                          // 1 second
                                                          // past exp
});
// Lets a test assert exact expiry-boundary behavior deterministically.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team running their Node.js API across multiple containers on different physical hosts occasionally sees a small, seemingly-random trickle of "Token expired" errors on requests using access tokens that, per the client\'s own clock, should still have several seconds of validity remaining. The issue is intermittent, not tied to any specific route or user, and disappears when the exact same request is retried moments later. What is the most likely explanation, and what jsonwebtoken option directly addresses it?',
    hint: 'In a multi-container, multi-host deployment, is there any guarantee every container\'s system clock reads the exact same time, down to the second? Does jwt.verify() check exp against the token\'s own issuing server\'s clock, or against whichever server happens to be running the verify() call?',
    solution: 'The most likely explanation is small, ordinary clock drift between different physical hosts running different containers — jwt.verify() checks the exp claim against the CURRENT SYSTEM CLOCK of whichever specific server instance happens to be handling that particular verify() call, not against any shared, guaranteed-synchronized notion of "now." Even with NTP synchronization, small differences of a few seconds between machines are normal in real infrastructure, and a request that happens to land on a container whose clock is running slightly ahead can see a token rejected as expired a few seconds before it "should" be, purely due to that clock difference — exactly matching the intermittent, request-dependent (not user-dependent or route-dependent) pattern described, and why an identical retry moments later succeeds (it likely landed on a different container, or the clock drift simply wasn\'t enough to matter for that particular request\'s timing). The jsonwebtoken option that directly addresses this is clockTolerance, passed as part of the options object to jwt.verify() — e.g. { clockTolerance: 10 } — which gives a documented grace window (in seconds) around both the exp and nbf checks specifically to absorb small clock differences among different servers, exactly the scenario this team is experiencing.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'jwt.verify() checks a token\'s exp claim against the clock of the server that originally ISSUED the token, so clock differences between servers don\'t affect expiry checking.',
      reality: 'This subtopic\'s theory shows the opposite — exp is checked against the current system clock of whichever server happens to be running the verify() call at that moment, which is not necessarily the same server (or the same clock reading) as the one that issued the token.'
    },
    {
      thought: 'Small clock differences between servers in a distributed system are rare enough, or NTP synchronization reliable enough, that they never practically affect JWT expiry checking in real production systems.',
      reality: 'This subtopic\'s exercise shows this is exactly the kind of gap that surfaces as a real, intermittent, hard-to-diagnose bug once an application scales beyond a single server — normal, expected small clock differences between machines are precisely why jsonwebtoken\'s own documentation provides the clockTolerance option in the first place.'
    },
    {
      thought: 'clockTolerance and clockTimestamp are the same option under two different names, or serve the same purpose.',
      reality: 'This subtopic\'s code example clarifies these are two DIFFERENT, separate options — clockTolerance adds a grace-window margin around normal exp/nbf checking to absorb real clock drift, while clockTimestamp overrides what "now" means entirely for a specific verify() call, primarily useful for writing deterministic tests rather than handling production clock drift.'
    }
  ];
}
