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
    heading: 'Two Correctly-Parameterized Queries, One Real Vulnerability',
    points: [
      'The quiz\'s own explanation gives the exact scenario: a user registers with the username <code>admin--</code>, stored safely via a parameterized INSERT — then a LATER feature retrieves that stored username and builds a query with it, unparameterized.',
      'Every individual query in this pattern can look correct in isolation — a code reviewer checking the registration handler sees a properly parameterized INSERT and moves on; a reviewer checking the password-change handler sees a query built from "a value we already have," not obviously "user input," and may not think to parameterize it.',
      'The vulnerability exists specifically in the GAP between two functions, not inside either one — which is exactly why the main page\'s own QnA notes that most tracing tools and quick reviews, scoped to a single request/response cycle, don\'t catch it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Step 1: Registration (Correctly Parameterized)',
    language: 'typescript',
    code: `import { Pool } from 'pg';
const db = new Pool();

async function registerUser(username: string, password: string) {
  const passwordHash = await hashPassword(password);

  // Correctly parameterized -- this INSERT is genuinely safe.
  await db.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
    [username, passwordHash]
  );
}

// An attacker registers with a username designed to matter LATER,
// not right now -- it does nothing malicious at registration time:
await registerUser("admin'--", 'someSecurePassword123!');
// Stored exactly as given: the username column now literally
// contains the 8 characters  admin'--`,
  },
  {
    label: 'Step 2: Password Reset (The Real Vulnerability)',
    language: 'typescript',
    code: `// Days later, an unrelated feature -- an admin-triggered password
// reset -- reads the username back OUT of the database and builds a
// query with it. The developer here never touched request.body at
// all; this value came from a "trusted" prior SELECT, which is
// exactly why it doesn't get the same scrutiny as raw user input.
async function resetPasswordByUsername(username: string, newHash: string) {
  // VULNERABLE: string concatenation, using a value that ORIGINATED
  // as user input two steps ago -- it is no less attacker-controlled
  // for having passed through the database once.
  await db.query(
    \`UPDATE users SET password_hash = '\${newHash}' WHERE username = '\${username}'\`
  );
}

const storedUsername = await getUsernameById(userId); // returns "admin'--"
await resetPasswordByUsername(storedUsername, newHash);

// The query that actually executes:
//   UPDATE users SET password_hash = '...' WHERE username = 'admin'--'
//                                                                  ^^
// Everything from the second -- onward is a SQL comment. The WHERE
// clause is truncated to "username = 'admin'" -- silently resetting
// the REAL admin account's password to a value the attacker chose,
// even though the attacker's OWN username was "admin'--", not "admin".

// ── The fix: parameterize this query too, exactly like Step 1 ────────
async function resetPasswordByUsernameFixed(username: string, newHash: string) {
  await db.query(
    'UPDATE users SET password_hash = $1 WHERE username = $2',
    [newHash, username]
  );
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A different attacker registers with the username <code>bob\'; DROP TABLE users;--</code> instead. Assuming the SAME vulnerable <code>resetPasswordByUsername</code> function from Step 2, what happens the next time an admin resets ANY user\'s password (not necessarily this attacker\'s own account)?',
  hint: 'The vulnerable query runs on every call to resetPasswordByUsername — trace what happens when it runs with the ATTACKER\'S stored username specifically, versus when it runs with someone else\'s.',
  solution: `// Nothing malicious happens when an admin resets a DIFFERENT user's
// password -- the vulnerable query only becomes dangerous at the
// exact moment "storedUsername" passed into it IS the attacker's own
// malicious stored value.

// The trigger has to be: someone calls
//   resetPasswordByUsername(storedUsername, newHash)
// where storedUsername is specifically "bob'; DROP TABLE users;--".

// If that happens (e.g. an admin resets THIS SPECIFIC attacker's own
// password, or a batch job iterates over every username and calls
// this function for each one), the resulting query becomes:
//   UPDATE password_hash = '...' WHERE username = 'bob'; DROP TABLE users;--'
// -- a stacked query some DB drivers/configurations execute as two
// separate statements, dropping the table entirely.

// This is exactly why second-order injection is so easy to miss in
// testing: it only fires when the SPECIFIC poisoned value happens to
// flow through the vulnerable second query -- a test suite that
// exercises resetPasswordByUsername with ordinary usernames never
// triggers it at all, even with the vulnerable code deployed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the registration query in Step 1 is correctly parameterized, the stored username is now "safe" and doesn\'t need to be treated as untrusted anywhere else in the codebase.',
    reality: 'Parameterization protects that ONE query from injection — it does nothing to the stored VALUE itself, which remains exactly what the attacker submitted. Every later query that uses data read back from the database needs its own parameterization, independent of how safely that data was originally stored.',
  },
  {
    thought: 'Second-order injection requires a genuinely different defense than first-order injection.',
    reality: 'The fix is identical — parameterized queries — the main page\'s own mustKnow bullet already states this ("data from DB can also be unsafe if later used in string-concatenated queries"). What differs is DISCOVERY difficulty, not the remedy: it\'s easy to overlook that data read FROM the database still needs the same treatment as data read from a request.',
  },
  {
    thought: 'A code reviewer who correctly flags the registration handler\'s SQL has done their job checking this data flow.',
    reality: 'The vulnerability lives entirely in a DIFFERENT function than the one where the "bad" value was introduced — reviewing the registration handler in isolation, however carefully, cannot reveal a bug that only exists in how a completely separate feature later consumes that same stored value.',
  },
];

@Component({
  selector: 'app-sec-injection-second-order',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './second-order-sql-injection-demonstrated.html',
  styleUrl: './second-order-sql-injection-demonstrated.scss',
})
export class SecondOrderSqlInjectionDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
