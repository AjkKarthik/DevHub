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
    heading: 'Three Phases, Named in Prose, Never Written as Code',
    points: [
      'The QnA on Expand-Contract describes all three phases precisely, using the page’s own <code>userName</code> → <code>fullName</code> rename example: Phase 1 (Expand) returns BOTH fields; Phase 2 is migrating every consumer to read the new field; Phase 3 (Contract) removes the old field once migration is confirmed complete. No codeTab anywhere on the page actually implements this — the "Additive Rename Pattern" comment in the "Safe vs Breaking Changes" codeTab shows the two raw JSON shapes (both-present, then new-only) but never the serialization function that produces each of them.',
      'The genuinely useful property Expand-Contract has is that Phase 1 and Phase 3 are BOTH independently non-breaking for the client that’s currently on the correct side of the migration — an old client reading only <code>userName</code> works fine during Phase 1, and a new client reading only <code>fullName</code> works fine in both Phase 1 AND Phase 3. The one client that breaks is an OLD, unmigrated client still reading <code>userName</code> once Phase 3 ships — which is exactly why the "measuring deprecated-endpoint traffic" QnA elsewhere on this page is the gate that should decide when it’s actually safe to move from Phase 1 to Phase 3, not a calendar date alone.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Expand-Contract, Implemented',
    language: 'typescript',
    code: `interface User { id: number; name: string; }

// PHASE 1 -- Expand: return both the old and new field names.
// Nothing breaks -- old clients read userName, new clients read fullName.
function serializeUserPhase1(user: User) {
  return { id: user.id, userName: user.name, fullName: user.name };
}

// PHASE 3 -- Contract: return only the new field name.
// Safe ONLY once monitoring confirms no active client still reads userName.
function serializeUserPhase3(user: User) {
  return { id: user.id, fullName: user.name };
}

// Simulated clients -- an "old" one built before the rename, a "new" one
// built after it.
function oldClientRead(response: any): string | undefined { return response.userName; }
function newClientRead(response: any): string | undefined { return response.fullName; }

const user: User = { id: 42, name: 'Alice' };

// Phase 1: both clients work correctly.
console.log('Phase 1, old client:', oldClientRead(serializeUserPhase1(user)));   // 'Alice'
console.log('Phase 1, new client:', newClientRead(serializeUserPhase1(user)));   // 'Alice'

// Phase 3: only the migrated (new) client keeps working -- this is the
// expected, ACCEPTABLE breakage, since Phase 3 should only ship after
// traffic monitoring confirms no old clients remain.
console.log('Phase 3, old client:', oldClientRead(serializeUserPhase3(user)));   // undefined
console.log('Phase 3, new client:', newClientRead(serializeUserPhase3(user)));   // 'Alice'`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'PHASE 2 (migrate clients) is the one phase with no serialization function at all — it’s a monitoring activity, not a code change. Using the page’s own "measuring deprecated-endpoint traffic" QnA logic, what concrete signal would tell you it’s safe to move from Phase 1 to Phase 3 for the <code>userName</code>/<code>fullName</code> rename specifically?',
  hint: 'Phase 1’s response includes BOTH fields — think about what a server could log about which field name each consumer actually reads (or, more realistically, which field name appears in a consumer’s error logs / support requests), and what "zero" would mean for that specific signal.',
  solution: `// There's no direct, first-party way for the SERVER to see which JSON key a
// client's own deserialization code reads from a response it already sent --
// that happens entirely client-side. The realistic proxy signals used in
// practice:
//
// 1. Ask consumers to instrument client-side reads of BOTH keys (if you
//    control the SDK) and report which one is actually used.
// 2. If the OLD key name also appears elsewhere as a REQUEST parameter
//    somewhere in your API (not this specific response field), log requests
//    still using the old name as a proxy for "this consumer hasn't migrated."
// 3. The most practical version for a pure RESPONSE field rename: after
//    announcing the Phase 3 date, directly ask registered API consumers to
//    confirm migration (the same "reach out to high-traffic consumers" step
//    the main page's own "How do you handle breaking changes that are
//    unavoidable?" QnA already recommends), since a response-only field
//    genuinely can't be observed server-side the way a REQUEST field can.
//
// The concrete answer: for THIS SPECIFIC rename (an added response field,
// not a request field), the "measuring deprecated-endpoint traffic" pattern
// from the main page's QnA doesn't directly apply -- it works for tracking
// USAGE of an entire deprecated ENDPOINT (which the server can observe by
// definition, since the request has to reach it), not for which of two
// fields already present in every response a client happens to read.
// Phase 2 for a pure response-field rename relies on direct consumer
// confirmation, not server-side traffic monitoring.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Expand-Contract means every breaking change can be made "non-breaking" simply by adding a transition period.',
    reality: 'Expand-Contract turns a SINGLE breaking change into two smaller, individually non-breaking steps (Phase 1 add, Phase 3 remove) -- but Phase 3 is still, definitionally, breaking for any client that never migrated during Phase 2. The pattern reduces risk and gives consumers time, it doesn’t eliminate the underlying breaking change.',
  },
  {
    thought: 'Since Phase 1 (Expand) is always safe by construction, it can ship without any monitoring or announcement — only Phase 3 (Contract) needs care.',
    reality: 'Phase 1 being safe is exactly what makes it easy to skip announcing — but without visibly communicating that <code>userName</code> is now deprecated in favor of <code>fullName</code> starting at Phase 1, consumers have no reason to start their own migration, which stalls Phase 2 indefinitely and delays how soon Phase 3 can safely ship.',
  },
  {
    thought: 'Because the server can log every request it receives, it can always tell exactly which field name in a JSON response a given client is actually reading.',
    reality: 'The Try It above traces the real limit of server-side observability precisely: reading a response body happens entirely on the CLIENT after the response is sent — the server can observe which endpoint/parameters a request used, but not which of several already-returned fields the client’s own deserialization code chose to read.',
  },
];

@Component({
  selector: 'app-api-breaking-changes-expand-contract',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-expand-contract-all-three-phases.html',
  styleUrl: './implementing-expand-contract-all-three-phases.scss',
})
export class ImplementingExpandContractAllThreePhasesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
