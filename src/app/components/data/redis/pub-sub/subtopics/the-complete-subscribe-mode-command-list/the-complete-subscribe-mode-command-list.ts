import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-complete-subscribe-mode-command-list',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-complete-subscribe-mode-command-list.html',
  styleUrl: './the-complete-subscribe-mode-command-list.scss',
})
export class TheCompleteSubscribeModeCommandListSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two sections of the same page disagreed with each other',
      points: [
        'The main page\'s own theory listed the allowed subscribe-mode commands as "SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, and QUIT" — while a SEPARATE quiz question on the very same page listed a DIFFERENT set: "SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, and RESET." Neither list matches the other, and neither is the complete list.',
        'Verified directly against Redis\'s own official SUBSCRIBE command docs: the real, complete list is SUBSCRIBE, SSUBSCRIBE, PSUBSCRIBE, UNSUBSCRIBE, SUNSUBSCRIBE, PUNSUBSCRIBE, PING, RESET, AND QUIT — both RESET and QUIT are allowed, not just one or the other, plus the sharded-pub/sub variants (SSUBSCRIBE/SUNSUBSCRIBE) neither section mentioned at all.',
        'RESET itself is a comparatively recent addition to this list — available since Redis 6.2.0 — while QUIT has been part of the protocol since long before Pub/Sub existed. This is likely why two different sections of the page each ended up with a different partial list: each was correct about ONE half of a two-part history.',
      ],
    },
    {
      heading: 'A genuinely new nuance neither section mentioned at all',
      points: [
        'The SAME official docs page adds one more exception the main page never covers: "if RESP3 is used (see HELLO) it is possible for a client to issue any commands while in subscribed state" — the entire subscribe-mode command restriction is specific to the RESP2 protocol.',
        'This directly connects to the main page\'s own theory claim that "two separate connections are needed per client" for Pub/Sub — that statement is true under RESP2, but not a fundamental limitation of Pub/Sub itself.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The complete, verified command list',
      language: 'typescript',
      code: `// Verified directly against Redis's own official SUBSCRIBE command docs --
// the real list is longer than either section of the main page originally stated.
const ALLOWED_IN_SUBSCRIBE_MODE_RESP2 = [
  'SUBSCRIBE', 'SSUBSCRIBE', 'PSUBSCRIBE',
  'UNSUBSCRIBE', 'SUNSUBSCRIBE', 'PUNSUBSCRIBE',
  'PING', 'RESET', 'QUIT',
] as const;

function isAllowedInSubscribeMode(command: string, protocol: 'RESP2' | 'RESP3'): boolean {
  if (protocol === 'RESP3') return true; // RESP3 lifts the restriction entirely
  return (ALLOWED_IN_SUBSCRIBE_MODE_RESP2 as readonly string[]).includes(command.toUpperCase());
}

console.log('RESET allowed under RESP2:', isAllowedInSubscribeMode('RESET', 'RESP2'));
console.log('QUIT allowed under RESP2:', isAllowedInSubscribeMode('QUIT', 'RESP2'));
console.log('GET allowed under RESP2:', isAllowedInSubscribeMode('GET', 'RESP2'));
console.log('GET allowed under RESP3:', isAllowedInSubscribeMode('GET', 'RESP3'));
// RESET allowed under RESP2: true
// QUIT allowed under RESP2: true
// GET allowed under RESP2: false
// GET allowed under RESP3: true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client library wraps every Redis command in a helper that first checks <code>isAllowedInSubscribeMode()</code> before sending it, to fail fast with a clear client-side error rather than waiting for the server to reject it. The library only supports RESP2. Should this helper hardcode the SHORTER list from the main page\'s original theory bullet (ending at PING/QUIT), or the complete, verified list?',
    hint: 'Think about what happens the first time application code legitimately tries to call RESET on a subscribed connection, if the helper\'s own list is missing that command.',
    solution: `The complete, verified list. A client-side "fail fast" check is only helpful if it agrees with what the SERVER will actually allow -- if the helper's own list is missing RESET (as the main page's original theory bullet was), a legitimate RESET call on a subscribed connection gets rejected by the CLIENT LIBRARY itself with a misleading "not allowed in subscribe mode" error, even though the real Redis server would have accepted it without complaint.

This is a genuine risk of copying a plausible-looking-but-incomplete command list from documentation into actual defensive code -- the incompleteness doesn't just misinform a reader, it can become an executable bug that rejects valid operations the real server supports.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since QUIT and RESET both end a connection/session in some sense, only one of them would realistically be allowed in subscribe mode — the other must be a mistake somewhere."',
      reality: 'Verified directly against Redis\'s own docs: both are genuinely, simultaneously allowed. They serve different purposes — QUIT closes the connection entirely, while RESET (Redis 6.2+) resets the connection\'s STATE (exiting subscribe mode, among other things) while keeping the connection itself open for further use.',
    },
    {
      thought: '"The \'two connections needed for Pub/Sub\' rule is a fundamental, protocol-level limitation that will always be true."',
      reality: 'Verified directly against Redis\'s own docs: it is specifically a RESP2 limitation. Under RESP3, a client that has opted in via HELLO can issue any command — including regular reads/writes — on the same connection it is subscribed with.',
    },
  ];

  topicLabel = 'Pub/Sub Messaging';
  topicRoute = '/redis/pub-sub';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'RESP3 Removes the Subscribe-Mode Restriction Entirely',
    route: '/redis/pub-sub/resp3-removes-the-subscribe-mode-restriction',
  };
}
