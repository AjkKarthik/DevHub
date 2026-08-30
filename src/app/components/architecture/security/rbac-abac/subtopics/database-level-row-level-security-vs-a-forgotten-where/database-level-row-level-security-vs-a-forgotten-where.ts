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
    heading: 'The Risk Named, the Two Approaches Never Contrasted in Code',
    points: [
      'The QnA explains the exact risk and its database-level fix: "every query includes a WHERE clause enforcing ownership... Risk: developer forgets to add the WHERE clause on one endpoint, exposing all orders... Database-level RLS is safer because it cannot be bypassed by an omitted application filter." The main page\'s own "Not checking ownership on row-level operations" mistake block shows an application-level ownership check — but never the database-level alternative, or what happens when the application-level check is simply left out somewhere.',
      'This subtopic builds both side by side: an application-level endpoint that forgets the ownership filter (reproducing the QnA\'s own named risk directly), and the PostgreSQL <code>CREATE POLICY</code> that would have protected the same table even with that exact application bug in place.',
    ],
  },
  {
    heading: 'Why "Cannot Be Bypassed" Is a Precise, Not Just a Rhetorical, Claim',
    points: [
      'An application-level ownership filter is one <code>WHERE</code> clause among potentially dozens of query sites touching the same table — every new endpoint, every ad-hoc admin script, every future developer\'s query has to remember to add it independently. Missing it even once in ANY of those call sites is a real, silent vulnerability with no error or warning at write time.',
      'PostgreSQL Row-Level Security is enforced by the DATABASE ENGINE itself, at the table level — once a policy is enabled, EVERY query against that table, regardless of which application code wrote it or whether that code remembered to filter, has the policy\'s condition applied automatically. The protection moves from "every call site must remember" to "the table itself refuses to return rows that don\'t match," which is a structurally different, much stronger guarantee.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Application-Level — The QnA\'s Own Named Risk',
    language: 'typescript',
    code: `// Endpoint A: correctly filters by ownership.
app.get('/api/orders', requireAuth, async (req, res) => {
  const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [req.user.id]);
  res.json(orders);
});

// Endpoint B: added later, by a different developer, for an admin
// "search all orders by status" feature -- the WHERE user_id filter
// was simply never added here, because this endpoint's author was
// thinking about STATUS filtering, not ownership at all.
app.get('/api/orders/search', requireAuth, async (req, res) => {
  const { status } = req.query;
  // BUG: no user_id filter -- returns EVERY user's orders matching
  // this status, to ANY authenticated user, not just admins.
  const orders = await db.query('SELECT * FROM orders WHERE status = $1', [status]);
  res.json(orders);
});

// This is exactly the QnA's own described failure mode: nothing about
// endpoint B looks obviously wrong on its own -- the bug is an
// ABSENCE, not a visibly incorrect line of code, which is precisely
// why it's easy to miss in review.`,
  },
  {
    label: 'Database-Level RLS — Protects Endpoint B Too',
    language: 'typescript',
    code: `// PostgreSQL: enable RLS on the table, then define a policy that
// applies to EVERY query against it -- including endpoint B above,
// with ZERO changes to that endpoint's own (buggy) application code.
const rlsSetup = \`
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_user_isolation ON orders
  USING (user_id = current_setting('app.current_user_id')::int);
\`;

// The application sets the current user's ID as a session variable
// ONCE, at the start of each request -- not per-query.
app.use(requireAuth, async (req, res, next) => {
  await db.query("SET app.current_user_id = $1", [req.user.id]);
  next();
});

// Endpoint B, UNCHANGED from the vulnerable version above:
app.get('/api/orders/search', requireAuth, async (req, res) => {
  const { status } = req.query;
  const orders = await db.query('SELECT * FROM orders WHERE status = $1', [status]);
  res.json(orders);
});
// Even though this query's OWN WHERE clause still only filters by
// status, PostgreSQL silently ADDS the RLS policy's user_id condition
// to every row read from the orders table -- the developer's omission
// in the application code no longer matters.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A THIRD endpoint is added later by yet another developer, running a raw admin script directly against the database (not through the Express app at all, and therefore never hitting the <code>SET app.current_user_id</code> middleware). Does PostgreSQL\'s RLS policy still protect this query, or does bypassing the Express layer also bypass RLS?',
  hint: 'RLS is enforced by the DATABASE, based on whatever <code>current_setting(\'app.current_user_id\')</code> currently evaluates to for THAT connection — what happens if that session variable was simply never set at all?',
  solution: `// RLS itself STILL applies (it's enforced at the database engine, not
// by the Express middleware) -- but the ADMIN SCRIPT's query behaves
// unexpectedly, because current_setting('app.current_user_id') was
// never set on that raw connection and has no default value.

// Depending on how the policy is written, this produces one of two
// outcomes: if current_setting() is called without a "missing_ok"
// second argument, PostgreSQL raises an error for that query entirely
// (the setting doesn't exist), effectively BLOCKING the script rather
// than leaking data -- a fail-CLOSED outcome. If the policy is written
// more permissively (e.g. using current_setting(..., true) which
// returns NULL instead of erroring), the comparison
// "user_id = NULL" evaluates to NULL (neither true nor false) for
// every row, and RLS's default-deny behavior means NO rows are
// returned at all -- again fail-closed, just via a different
// mechanism.

// Either way, the key property holds: RLS being bypassed entirely
// would require either disabling it explicitly (ALTER TABLE ...
// DISABLE ROW LEVEL SECURITY) or connecting as a role that has been
// granted BYPASSRLS -- simply skipping the application's own
// middleware is not enough to see other users' data, which is exactly
// the "cannot be bypassed by an omitted application filter" guarantee
// the QnA names.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Database-level RLS is strictly better than application-level filtering in every way, so application-level ownership checks (like the main page\'s own mistake-block fix) are now unnecessary once RLS is in place.',
    reality: 'RLS closes the specific "someone forgot the WHERE clause" failure mode, but it operates PURELY at the row-visibility layer — it has no concept of business rules like "an editor can update their own posts but not delete them" or multi-step authorization logic. The main page\'s own application-level ownership check and RLS are complementary, not competing: RLS is a strong SAFETY NET specifically against the omission bug the QnA describes, while richer authorization logic still belongs in the application layer.',
  },
  {
    thought: 'Setting the current user via <code>SET app.current_user_id</code> once per request is just as easy to forget as adding a WHERE clause per query — RLS doesn\'t actually reduce the number of places a developer can make a mistake.',
    reality: 'The critical difference is in what FAILS SAFE: forgetting a per-query WHERE clause silently returns the WRONG (too much) data — a failure that leaks information. Forgetting to SET the session variable (as explored in the Try It) causes RLS\'s comparison to fail, which returns NO data or an outright error — a failure that is loud and immediately visible during testing, not a silent security hole discovered later. The remaining "one thing to remember" is deliberately positioned so that getting it wrong breaks functionality obviously, rather than leaking data quietly.',
  },
];

@Component({
  selector: 'app-sec-rbac-rls',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './database-level-row-level-security-vs-a-forgotten-where.html',
  styleUrl: './database-level-row-level-security-vs-a-forgotten-where.scss',
})
export class DatabaseLevelRowLevelSecurityVsAForgottenWhereSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
