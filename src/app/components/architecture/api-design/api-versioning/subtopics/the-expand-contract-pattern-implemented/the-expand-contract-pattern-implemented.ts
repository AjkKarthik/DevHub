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
    heading: 'A Named Field-Rename Example — Never Built as Real Code',
    points: [
      'The main page’s own QnA describes expand-contract with a concrete example: "renaming customer_name to customerName. Expand: response includes both customer_name and customerName with identical values. Contract: after migration, remove customer_name." No codeTab on the page ever implements this exact scenario.',
      'The whole point of this pattern is that it achieves a breaking-looking change (a field rename) WITHOUT a version bump — old clients reading <code>customer_name</code> keep working, new clients can start reading <code>customerName</code> immediately, and NEITHER client needs to know the migration is happening.',
      'The QnA also names the real cost: "the API surface temporarily doubles for the affected fields" and "requires monitoring to know when old fields are safe to remove" — this subtopic builds both the doubled response AND the usage-monitoring mechanism that tells you when the old field can finally be dropped.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Phase 1 — Expand: Both Fields, Identical Values',
    language: 'typescript',
    code: `interface Customer { id: string; name: string; }

// Both the OLD field name (customer_name) and the NEW one
// (customerName) are present in every response, holding the exact
// same value -- neither old nor new clients need to change anything
// to keep working during this phase.
app.get('/customers/:id', async (req, res) => {
  const customer = await db.customers.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });

  res.json({
    id: customer.id,
    customer_name: customer.name, // OLD field -- still here for old clients
    customerName: customer.name,  // NEW field -- available for new clients
  });
});`,
  },
  {
    label: 'Monitoring: Is customer_name Safe to Remove Yet?',
    language: 'typescript',
    code: `// A tiny middleware that records whenever a response ACTUALLY gets
// read with the old field name still present -- this alone doesn't
// prove a client is READING it, but combined with client-side
// analytics or a deprecation-header-driven client survey, it's the
// starting signal for "is anyone still relying on this field."
const oldFieldUsage = { count: 0, lastSeenAt: null as string | null };

app.use('/customers', (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (body && 'customer_name' in body) {
      oldFieldUsage.count++;
      oldFieldUsage.lastSeenAt = new Date().toISOString();
    }
    return originalJson(body);
  };
  next();
});

// An internal endpoint the team checks before starting Phase 2:
app.get('/internal/migration-status/customer-name', (req, res) => {
  res.json({
    fieldBeingRetired: 'customer_name',
    responsesServedWithOldField: oldFieldUsage.count,
    lastSeenAt: oldFieldUsage.lastSeenAt,
    safeToRemove: oldFieldUsage.count === 0,
  });
});

// ── Phase 2 — Contract: remove customer_name once usage hits zero ──────────
app.get('/customers/:id', async (req, res) => {
  const customer = await db.customers.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json({ id: customer.id, customerName: customer.name }); // customer_name is gone
});`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'This monitoring middleware counts how many times a response is SERVED with <code>customer_name</code> present — not how many times a CLIENT actually reads that field out of the response. Why is <code>oldFieldUsage.count</code> alone not quite enough evidence to safely conclude it’s time for Phase 2?',
  hint: 'Every single response includes BOTH fields during Phase 1, by design — does the server serving <code>customer_name</code> in a response tell you anything about whether any CLIENT parsed it?',
  solution: `// The middleware counts every response SERVED with customer_name --
// but during Phase 1, that's ALL of them, by design (both fields are
// always included). oldFieldUsage.count will stay high for the
// entire expand phase regardless of whether a single client is
// actually reading the old field, because it's measuring the wrong
// side of the interaction: what the SERVER sends, not what a CLIENT
// consumes.

// A response containing a field says nothing about whether anyone
// parses it -- this is the exact same "server-known vs. client-
// observed" gap that shows up whenever a server-side signal is used
// as a proxy for genuine client behavior. True usage evidence needs
// to come from somewhere that can see the CLIENT side of the
// interaction: client-side analytics reporting which fields a
// parsing library actually accessed, a deprecation-header-triggered
// survey of active integrations, or a controlled experiment (briefly
// omitting the old field for a sampled subset of traffic and
// watching for support tickets or error spikes).

// The middleware above is still useful -- it's a necessary
// PREREQUISITE (you obviously can't remove a field still being
// served) -- it's just not SUFFICIENT evidence on its own for when
// it's genuinely safe to contract.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Expand-contract requires a version bump for each phase, the same way a fully breaking rename would.',
    reality: 'The entire point of the pattern is avoiding a version bump at all — both codeTab phases above serve from the SAME endpoint, the SAME version, with no <code>/v2</code> anywhere. Old and new clients are served simultaneously from one unversioned response shape during Phase 1, which is what makes this "evolution," not "versioning," in the main page’s own terminology.',
  },
  {
    thought: 'Once both fields are added in Phase 1, the migration is essentially done — Phase 2 is just cleanup that can happen whenever.',
    reality: 'Phase 2 (removing the old field) is a genuinely breaking change for any client still reading it — the whole reason the monitoring codeTab exists is that contracting too early, before usage has actually dropped to zero, breaks exactly the clients expand-contract was supposed to protect. The QnA’s own caution ("requires monitoring to know when old fields are safe to remove") is not optional advice, it’s the mechanism that makes Phase 2 safe at all.',
  },
  {
    thought: 'Counting how many responses include the old field name is sufficient proof that it’s safe to remove once that count reaches zero.',
    reality: 'As the Try It above traces, the server-side count measures what’s being SERVED (both fields, always, during Phase 1), not what a client actually READS — it’s a necessary signal but not sufficient on its own; genuine confidence needs client-side usage evidence too.',
  },
];

@Component({
  selector: 'app-api-versioning-expand-contract',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-expand-contract-pattern-implemented.html',
  styleUrl: './the-expand-contract-pattern-implemented.scss',
})
export class TheExpandContractPatternImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
