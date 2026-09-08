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
    heading: 'The Localhost Exception, Not "Create the User First"',
    points: [
      'The main page\'s own QnA claimed the ONLY way to bootstrap the first admin user is to create it BEFORE enabling authorization, restarting mongod without --auth if authorization is already on. Verified directly against MongoDB\'s own official docs: this describes a valid fallback, not the standard path — the actual documented mechanism is called the "localhost exception."',
      'The real, standard order is the OPPOSITE: enable <code>security.authorization: enabled</code> FIRST, then connect via localhost. With authorization already on and zero users in the system, MongoDB still permits that localhost connection to create exactly one user or role — typically with the <code>userAdminAnyDatabase</code> role in the <code>admin</code> database, which itself has permission to create every other user afterward.',
      'The exception is genuinely one-shot: the instant that first user or role is created, it closes permanently — every connection after that, including from localhost, must authenticate normally. No restart is required anywhere in this sequence; the "restart without --auth" approach the main page\'s QnA described as necessary is only a fallback for when the localhost exception itself is unreachable (an unusual <code>bindIp</code>, or a proxy sitting in front of mongod that changes the connection\'s apparent origin).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Enable Auth, Then Bootstrap via Localhost',
    language: 'bash',
    code: `# 1. Enable authorization FIRST, before any user exists.
# In mongod.conf:
#   security:
#     authorization: enabled
# Then restart mongod once with this config.

# 2. Connect via mongosh from the SAME machine (localhost) --
#    the localhost exception permits this even with zero users
#    and authorization already on.
mongosh --host 127.0.0.1

# 3. Create the first user -- this is the ONE action the
#    localhost exception permits before it closes.
use admin
db.createUser({
  user: "admin",
  pwd: passwordPrompt(),   // prompts securely, never typed in plaintext
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# 4. The exception is now closed. Every connection from here on,
#    including from localhost, requires real credentials:
mongosh --host 127.0.0.1 -u admin -p --authenticationDatabase admin

# No mongod restart happened anywhere in this sequence -- the
# ENTIRE bootstrap ran with authorization already enabled the
# whole time.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'After the first user is created and the localhost exception closes, a second administrator connects from localhost with no credentials at all, hoping the exception is still available for a second user. What happens?',
  hint: 'The exception closes based on whether a user or role EXISTS in the system, not based on WHO is connecting or from WHERE.',
  solution: `// The connection is REJECTED. The localhost exception's own condition
// is "zero users or roles exist anywhere in the system" -- not "the
// CURRENT connection hasn't used it yet." The moment the first
// db.createUser() call succeeded, that condition became permanently
// false for the life of the deployment (until every user and role is
// somehow removed again, which is not a realistic operational path).
//
// The second administrator has to authenticate with real credentials
// like anyone else -- either the first admin's own account, or an
// account that first admin creates for them using its
// userAdminAnyDatabase privilege.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The localhost exception means MongoDB is permanently open to anyone connecting from localhost, as a kind of trusted-network shortcut.',
    reality: 'It grants exactly one privileged action — creating the FIRST user or role — and nothing more. It is not a standing bypass of authentication for localhost connections in general; every OTHER operation, even from localhost, is still subject to normal authorization rules the moment even one user exists. Conflating it with a general "localhost is trusted" policy is a real security misunderstanding, not just an imprecise description.',
  },
  {
    thought: 'Restarting mongod without --auth to create the first user is the wrong, non-standard way to do this, and should never be done.',
    reality: 'It is a completely valid FALLBACK, explicitly acknowledged by MongoDB\'s own documentation, for cases where the localhost exception genuinely does not apply — most commonly, when mongod sits behind a proxy or load balancer that makes the connection\'s apparent source address something other than localhost, so the exception\'s own origin check never passes. The point isn\'t that this approach is wrong, only that it is the fallback, not the standard documented path the main page\'s original QnA presented it as.',
  },
];

@Component({
  selector: 'app-mongo-install-localhost-exception',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-real-path-to-enabling-auth-the-localhost-exception.html',
  styleUrl: './the-real-path-to-enabling-auth-the-localhost-exception.scss',
})
export class TheRealPathToEnablingAuthTheLocalhostExceptionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
