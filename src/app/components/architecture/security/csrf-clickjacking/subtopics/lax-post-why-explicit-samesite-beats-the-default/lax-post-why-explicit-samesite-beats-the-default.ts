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
    heading: 'A Narrow, Often-Misapplied Exception',
    points: [
      'The main page\'s own QnA names Chromium\'s "Lax+POST" intervention as an edge case for <code>SameSite=Lax</code> — but the exception applies specifically to cookies with NO explicit SameSite attribute at all (the ones Chrome defaults to Lax automatically), not to a cookie where the developer wrote <code>SameSite=Lax</code> explicitly.',
      'Concretely: <code>res.cookie(\'session\', token)</code> with zero SameSite option set gets Chrome\'s implicit default AND the 2-minute Lax+POST exception; <code>res.cookie(\'session\', token, { sameSite: \'lax\' })</code> gets Lax\'s normal protection with NO such exception.',
      'Chromium\'s own documentation states this is a temporary compatibility measure (for SSO/redirect flows expecting a cross-site POST shortly after login) and that it is being phased out over time — relying on it, even implicitly, is a fading strategy.',
    ],
  },
  {
    heading: 'The Practical Fix',
    points: [
      'Always set SameSite explicitly on every cookie you issue — never rely on the browser default, even though modern browsers default to a reasonably safe Lax.',
      'For a session cookie specifically, prefer an explicit <code>SameSite=Strict</code> (or <code>Lax</code>, if you need to preserve top-level-navigation login flows) over leaving the attribute unset — the explicit form has no Lax+POST exception window at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Implicit vs Explicit SameSite=Lax, Compared',
    language: 'typescript',
    code: `// ── Cookie A: SameSite never set at all ──────────────────────────────
res.cookie('session', tokenA, { httpOnly: true, secure: true });
// Chrome's default: implicitly treated as Lax
// -- ALSO gets the "Lax+POST" 2-minute compatibility exception

// ── Cookie B: SameSite explicitly written as 'lax' ───────────────────
res.cookie('session', tokenB, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax', // <-- the ONLY difference from Cookie A
});
// Behaves identically to Cookie A for normal navigation...
// ...but has NO Lax+POST exception window. A cross-site POST never
// carries this cookie, regardless of how recently it was issued.

// The fix costs one config line -- there is no reason to ever issue
// a session cookie with SameSite left unset.`,
  },
  {
    label: 'A Concrete 90-Second-Old-Cookie Attack Window',
    language: 'typescript',
    code: `// Timeline, assuming the vulnerable Cookie A above:
//
// t = 0s     User logs into bank.com. Server sets the session cookie
//            with NO explicit SameSite -- Chrome treats it as Lax,
//            AND starts the Lax+POST 2-minute compatibility clock.
//
// t = 60s    User, still within the 2-minute window, opens a link to
//            evil.com in a new tab (completely unrelated action --
//            an ad, a search result, anything).
//
// t = 61s    evil.com's page contains a hidden <form method="POST"
//            action="https://bank.com/transfer"> that auto-submits
//            via JavaScript on page load.
//
// t = 61s    Because the session cookie is (a) implicitly Lax, not
//            explicitly, and (b) under 2 minutes old, Chrome's
//            Lax+POST exception ALLOWS it on this cross-site POST.
//            The transfer request reaches bank.com fully authenticated.
//
// If bank.com had used { sameSite: 'lax' } explicitly instead, this
// exact same sequence fails at t=61s -- the cookie is never attached
// to the cross-site POST, exception window or not.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A session cookie is set as <code>res.cookie(\'session\', token, { sameSite: \'lax\' })</code> (SameSite explicitly written as \'lax\'). Does Chromium\'s Lax+POST 2-minute exception apply to it?',
  hint: 'The exception is specifically for cookies where the attribute was never set at all — re-read exactly which case Chromium\'s docs describe.',
  solution: `// No -- the exception does NOT apply here.

// Lax+POST is a compatibility intervention ONLY for cookies that never
// had SameSite set at all (the ones Chrome silently defaults to Lax).
// Once a developer explicitly writes { sameSite: 'lax' }, the cookie
// gets Lax's normal, full protection -- cross-site POST/PUT/DELETE
// requests never carry it, with no 2-minute grace window at all.

// This is exactly why "always set SameSite explicitly" is the
// practical fix: it isn't just style -- it structurally removes an
// entire class of exception that only exists for the IMPLICIT case.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '"SameSite=Lax" (the main page\'s own primary CSRF recommendation) has a documented 2-minute vulnerability window, so it\'s not actually reliable.',
    reality: 'The 2-minute Lax+POST exception applies only to cookies with NO explicit SameSite attribute — a cookie with <code>SameSite=Lax</code> written out explicitly gets Lax\'s full protection with no such window at all. The fix is one config option, not switching away from Lax.',
  },
  {
    thought: 'Since Chrome defaults unset cookies to Lax anyway, explicitly writing <code>SameSite=Lax</code> is redundant.',
    reality: 'It removes the Lax+POST exception window entirely — the DEFAULT (implicit) and the EXPLICIT settings produce genuinely different, non-equivalent browser behavior, even though both are described as "Lax."',
  },
  {
    thought: 'Lax+POST is a security bug Chrome is patching.',
    reality: 'It\'s a deliberate, documented compatibility measure (for SSO/OAuth-style flows expecting a cross-site POST shortly after login) that Chromium itself states is temporary and being phased out — not an accidental vulnerability.',
  },
];

@Component({
  selector: 'app-sec-csrf-laxpost',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lax-post-why-explicit-samesite-beats-the-default.html',
  styleUrl: './lax-post-why-explicit-samesite-beats-the-default.scss',
})
export class LaxPostWhyExplicitSamesiteBeatsTheDefaultSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
