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
    heading: 'Why the Standard Pattern Doesn\'t Apply Here',
    points: [
      'The main page\'s own QnA names login CSRF precisely — an attacker forges a login request that logs the VICTIM into the ATTACKER\'s account, then waits for the victim to unknowingly enter sensitive data (a saved search, a payment method) into an account the attacker controls.',
      'The standard CSRF-token pattern (the main page\'s own Challenge) validates a token against a value stored per AUTHENTICATED SESSION — but at the moment a login form is submitted, no session exists yet. There is nothing to look the token up against.',
      'The fix is a "pre-session" token: issued and stored (in a short-lived, unauthenticated cookie) BEFORE the user ever logs in, specifically so the login form itself has something to validate against.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable: Login Form With No CSRF Protection',
    language: 'typescript',
    code: `app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await verifyCredentials(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  res.json({ success: true });
});

// evil.com contains an auto-submitting form:
//
//   <form action="https://app.example.com/login" method="POST">
//     <input type="hidden" name="username" value="attacker">
//     <input type="hidden" name="password" value="attacker-pw-123">
//   </form>
//   <script>document.forms[0].submit();</script>
//
// Any visitor's browser submits it -- since there's no CSRF check at
// all, the victim's browser silently gets a session cookie logging
// THEM into the ATTACKER's account. They may then unknowingly enter
// real data (a search, a saved card) into that attacker-controlled
// account, which the attacker retrieves later.`,
  },
  {
    label: 'Fixed: Pre-Session CSRF Token on the Login Form',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── GET /login: issue a token BEFORE any authentication happens ──────
app.get('/login', (req, res) => {
  const preSessionToken = crypto.randomBytes(32).toString('hex');

  // Short-lived, unauthenticated cookie -- exists purely to let the
  // login POST validate against something.
  res.cookie('login_csrf', preSessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  res.render('login', { csrfToken: preSessionToken });
  // Template embeds it: <input type="hidden" name="csrfToken" value="...">
});

// ── POST /login: validate the pre-session token FIRST ────────────────
app.post('/login', async (req, res) => {
  const cookieToken = req.cookies.login_csrf;
  const formToken = req.body.csrfToken;

  if (!cookieToken || cookieToken !== formToken) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }

  const { username, password } = req.body;
  const user = await verifyCredentials(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  res.clearCookie('login_csrf'); // one-time use
  req.session.userId = user.id;
  res.json({ success: true });
});

// The attacker's forged form on evil.com can supply a fake csrfToken
// form field, but has no way to also set the matching login_csrf
// cookie in the victim's browser -- that cookie only ever gets set
// by a real GET /login response from app.example.com itself.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A pre-session CSRF token is stored in an httpOnly cookie set on GET /login, and the SAME value is embedded as a hidden form field. An attacker\'s auto-submitting form on evil.com POSTs to /login with the attacker\'s own username/password but no csrfToken field at all. Does the login succeed?',
  hint: 'What does the server compare the missing form field against?',
  solution: `// No -- the login is rejected before the credentials are even checked.

// The server reads the pre-session token from the httpOnly cookie
// (which DOES still get sent automatically -- cookies aren't
// protected from cross-site sending by their mere presence) and
// compares it against req.body.csrfToken. The attacker's forged form
// has no way to know or supply the real value -- cross-origin
// JavaScript cannot read an httpOnly cookie, and the attacker never
// received one from a real GET /login response in the victim's own
// browser session anyway. The comparison fails, and the server
// returns 403 before ever touching verifyCredentials() at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Login CSRF isn\'t a real risk since the attacker doesn\'t gain access to the VICTIM\'s account.',
    reality: 'The danger runs the other way: the victim gets silently logged into the ATTACKER\'s account and may then enter sensitive data (search terms, a saved payment method, personal details) into it without realizing, which the attacker can later retrieve.',
  },
  {
    thought: 'A CSRF token for a login form needs to be tied to a user account, the same way the main page\'s own session-based Challenge ties a token to a sessionId.',
    reality: 'A pre-session token is tied to an ANONYMOUS, short-lived identifier (a random cookie value issued to any visitor, logged in or not) — there is no user account yet to tie it to at the point the login form is first rendered.',
  },
  {
    thought: 'SameSite=Lax alone fully protects a login form from this attack, so pre-session tokens are unnecessary.',
    reality: 'Lax blocks the cross-site POST case shown here, which is real protection — but the main page\'s own QnA lists a pre-session CSRF token as a genuine additional defense specifically because some legitimate flows (an OAuth-style login initiated by a cross-site redirect) rely on a cross-site POST reaching the login endpoint, which SameSite=Lax alone would also block.',
  },
];

@Component({
  selector: 'app-sec-csrf-login',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './login-csrf-defending-a-page-with-no-session-yet.html',
  styleUrl: './login-csrf-defending-a-page-with-no-session-yet.scss',
})
export class LoginCsrfDefendingAPageWithNoSessionYetSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
