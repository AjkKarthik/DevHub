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
    heading: 'API3 Has Two Independent Halves — the Page Only Codes One',
    points: [
      'The QnA distinguishing API1 (Broken Object Level Authorization) from API3 (Broken Object Property Level Authorization) states the read-side risk precisely: "an endpoint returning a user\'s full profile including an internal admin-only \'creditLimit\' field to a regular user." Every codeTab on the page, though, only ever protects the WRITE side — the fixed <code>CreateUserSchema</code> stops extra fields from being accepted INTO the system, but nothing on the page stops extra fields from being returned OUT of it.',
      'These are genuinely separate allowlists, maintained independently: the input schema decides which fields a request body is parsed into; a completely separate output allowlist decides which fields of the full, stored record are ever serialized back into a response. Fixing one says nothing about the other.',
      'A naive <code>res.json(userRecordFromDb)</code> — passing the full database record straight to the response — silently returns every field the record happens to have: a password hash, an internal <code>creditLimit</code>, moderation notes, anything a schema migration ever added. No input validation anywhere in the request path prevents this, because the leak never touches the request body at all.',
      'The fix is an explicit output allowlist, structurally identical in spirit to the input schema’s allowlist but operating on the OTHER end of the request/response cycle — a small, deliberate list of exactly which fields of a full record are safe to expose to this caller.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Naive vs. Allowlisted Serialization',
    language: 'typescript',
    code: `// The full record as stored in the database -- has fields no
// ordinary caller should ever see.
const fullUserRecord = {
  id: 42,
  name: 'Alice',
  email: 'alice@example.com',
  passwordHash: '$2b$10$abcdefg...',
  isAdmin: false,
  creditLimit: 5000,        // internal, admin-only field
  internalNotes: 'flagged for review',
};

// BAD: naive serialization -- returns the whole DB record verbatim.
// The input-side CreateUserSchema fix from the prior subtopic does
// NOTHING to protect this path -- it only guards what's accepted,
// never what's returned.
function serializeUserNaive(record: typeof fullUserRecord) {
  return record;
}

// GOOD: an explicit output allowlist -- a second, independent list
// from the input schema, maintained for the opposite direction.
const PUBLIC_USER_FIELDS = ['id', 'name', 'email'] as const;
function serializeUser(record: typeof fullUserRecord) {
  const out: Record<string, unknown> = {};
  for (const field of PUBLIC_USER_FIELDS) out[field] = record[field];
  return out;
}

app.get('/users/:id', authenticate, async (req, res) => {
  const record = await User.findById(req.params.id);
  res.json(serializeUser(record)); // never serializeUserNaive()
});

// Verified output:
//
//   serializeUserNaive(fullUserRecord)
//     -> { id, name, email, passwordHash, isAdmin, creditLimit, internalNotes }
//        -- everything leaks, including the password hash.
//
//   serializeUser(fullUserRecord)
//     -> { id: 42, name: 'Alice', email: 'alice@example.com' }
//        -- only the three allowlisted fields, regardless of what
//           else the stored record contains now or ever gains later.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A future migration adds a new <code>lastLoginIp</code> field to the stored user record, for internal fraud-monitoring use only. Does <code>serializeUser()</code> as written above leak it to an ordinary <code>GET /users/:id</code> caller? What would leak it, and what keeps it safe?',
  hint: 'Trace what <code>PUBLIC_USER_FIELDS</code> actually contains, and what the <code>for</code> loop in <code>serializeUser()</code> does with a field name that ISN’T in that list.',
  solution: `// PUBLIC_USER_FIELDS is still just ['id', 'name', 'email'] -- adding a
// new field to the STORED record (fullUserRecord / the DB schema)
// does not automatically add it to this separate, hand-maintained list.
//
// serializeUser(recordWithLastLoginIp)
//   -> { id: 42, name: 'Alice', email: 'alice@example.com' }
//      -- lastLoginIp is silently excluded. Safe by default.
//
// What WOULD leak it: switching serializeUser() back to
// serializeUserNaive() (returning the record directly), or adding
// 'lastLoginIp' to PUBLIC_USER_FIELDS by mistake during a future edit.
//
// This is the key property an output allowlist gives you that a
// "denylist" (list fields to REMOVE) doesn't: a new sensitive field
// added to the database is safe by default, not leaked by default --
// it has to be explicitly ADDED to the allowlist before it's ever
// exposed, rather than explicitly excluded after someone notices the leak.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Once request-body validation is in place (like the fixed <code>CreateUserSchema</code> from the previous subtopic), an endpoint is protected against sending sensitive fields to unauthorized callers.',
    reality: 'Input validation only governs what a request body is parsed INTO — it has no effect on what a response serializes OUT. A handler can validate its input perfectly and still call <code>res.json()</code> on a full, unfiltered database record, leaking every field the record happens to contain.',
  },
  {
    thought: 'Preventing sensitive-field leaks means remembering to strip out the bad fields (password hash, <code>creditLimit</code>, etc.) before sending a response.',
    reality: 'A "strip the bad fields" (denylist) approach is fragile — a new sensitive field added to the record later leaks by default until someone remembers to add it to the strip list. An allowlist (name only the SAFE fields) is safe by default: anything not explicitly named is excluded automatically, including fields that don’t exist yet.',
  },
  {
    thought: 'API1 (Broken Object Level Authorization) and API3 (Broken Object Property Level Authorization) describe the same underlying mistake, just at slightly different severities.',
    reality: 'They’re structurally different failures with different fixes. API1 is accessing the WRONG OBJECT entirely (changing an ID to view someone else’s record) — fixed with an ownership check. API3 is accessing the RIGHT object but exposing (or accepting) the WRONG FIELDS of it — fixed with field-level allowlisting on both the read and write paths, exactly what this subtopic and the previous one each build one half of.',
  },
];

@Component({
  selector: 'app-api-security-output-allowlist',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './output-side-field-allowlisting-for-api3.html',
  styleUrl: './output-side-field-allowlisting-for-api3.scss',
})
export class OutputSideFieldAllowlistingForApi3Subtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
