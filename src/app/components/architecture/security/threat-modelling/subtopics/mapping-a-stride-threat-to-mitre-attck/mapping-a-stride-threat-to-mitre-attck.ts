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
    heading: 'From a Generic STRIDE Category to a Named, Checkable Technique',
    points: [
      'The main page\'s own "STRIDE Analysis" codeTab lists threat T1 as: category <code>Spoofing</code>, description "Attacker uses stolen JWT to impersonate a legitimate user." That is accurate, but it is also generic — "Spoofing" covers everything from phishing to IP spoofing to session hijacking, and the listed mitigation ("short JWT expiry + refresh rotation + device fingerprint") is reasonable but not tied to any SPECIFIC, documented attacker behaviour.',
      'The QnA names MITRE ATT&CK as a way to sharpen this — mapping a system\'s components to relevant ATT&CK techniques and using active-exploitation intelligence to prioritise. This subtopic does exactly that for threat T1, using two REAL, verified ATT&CK Enterprise techniques rather than a made-up example.',
    ],
  },
  {
    heading: 'One STRIDE Threat, Two Chained ATT&CK Techniques',
    points: [
      '"Attacker uses a stolen JWT" is actually TWO separate steps an attacker has to complete, and ATT&CK models them as two distinct techniques under two different tactics: <code>T1528 — Steal Application Access Token</code> (Credential Access tactic — HOW the JWT was obtained, e.g. via a phishing page, an XSS payload reading it out of localStorage, or a leaked log file) and <code>T1550.001 — Use Alternate Authentication Material: Application Access Token</code> (Lateral Movement / Defense Evasion — HOW the stolen token is then used to bypass the normal login flow entirely).',
      'This split matters for mitigation design: the main page\'s own T1 mitigation ("short JWT expiry + refresh rotation + device fingerprint") only addresses the SECOND technique (limiting how long a stolen token is useful and making its reuse from a new device detectable) — it does nothing to prevent the FIRST technique (the actual theft). A complete defence needs a mitigation for each technique in the chain, not just the one the generic STRIDE description happened to describe.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'STRIDE Threat, Generic',
    language: 'typescript',
    code: `// The main page's own T1, exactly as listed in the STRIDE Analysis codeTab.
const t1 = {
  id: 'T1',
  category: 'Spoofing',
  description: 'Attacker uses stolen JWT to impersonate a legitimate user',
  mitigation: 'Short JWT expiry (15 min) + refresh token rotation + device fingerprint',
};

// "Spoofing" is accurate but generic -- it tells a reader WHAT KIND of
// threat this is, but nothing about HOW an attacker actually gets a
// stolen JWT in the first place, or what specific attacker behaviour
// the mitigation is (and isn't) defending against.`,
  },
  {
    label: 'Same Threat, Mapped to Two Chained ATT&CK Techniques',
    language: 'typescript',
    code: `// Expanding T1 into the two real, documented steps an attacker
// actually has to complete, each with its own ATT&CK ID, tactic, and
// -- critically -- its own mitigation.
const t1Expanded = {
  id: 'T1',
  category: 'Spoofing',
  chain: [
    {
      step: 1,
      technique: 'T1528',
      name: 'Steal Application Access Token',
      tactic: 'Credential Access',
      description: 'The JWT is obtained in the first place -- e.g. a phishing '
        + 'page that mimics the login form, an XSS payload reading it out of '
        + 'localStorage, or a leaked application log that captured the header.',
      mitigation: 'Store the token in an httpOnly cookie (not readable by JS, '
        + 'closing the XSS-exfiltration path); apply a strict Content-Security-Policy; '
        + 'never log Authorization headers.',
    },
    {
      step: 2,
      technique: 'T1550.001',
      name: 'Use Alternate Authentication Material: Application Access Token',
      tactic: 'Lateral Movement / Defense Evasion',
      description: 'The already-stolen token is replayed directly against the '
        + 'API -- bypassing the normal login flow (and any first-factor check) '
        + 'entirely, since the token alone is treated as sufficient proof of identity.',
      mitigation: 'Short JWT expiry (15 min) + refresh token rotation + device '
        + "fingerprint -- this is the main page's ORIGINAL T1 mitigation, and it "
        + 'genuinely does address this step -- just not step 1.',
    },
  ],
};

// The mitigation gap is now visible: the main page's original T1 entry
// only ever had a mitigation for step 2 of this chain. A stolen-JWT
// threat model that stops at "Spoofing -> short expiry" never asks
// HOW the token was stolen in the first place -- and so never gets a
// mitigation that would have prevented the theft itself.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Threat <code>T3</code> on the main page is "Regular user calls /admin/refund endpoint," category Elevation of Privilege, mitigated by "role-based authorisation check on every endpoint; default-deny." If you had to map this to a specific ATT&CK technique the same way T1 was mapped above, would it need TWO chained techniques (like T1 did), or does a single technique already cover the whole threat?',
  hint: 'Ask the same question this subtopic asked about T1: is there a separate "how did the attacker GET the ability to call this" step, distinct from "the attacker USES that ability"? For T3, what would the attacker even need to steal or obtain first?',
  solution: `// T3 needs only ONE technique, not two -- and that is itself the
// useful finding, not a gap in the exercise.

// T1's stolen-JWT threat genuinely has two SEPARATE steps performed by
// two DIFFERENT means (phishing/XSS to steal, then token replay to use)
// -- which is exactly why ATT&CK models it as two chained techniques
// under two different tactics.

// T3 has no equivalent "obtain access" step at all: the attacker in
// this scenario is ALREADY a legitimate, authenticated regular user --
// nothing was stolen, phished, or exfiltrated. The entire threat is a
// single missing authorization CHECK on the server, which the attacker
// exploits directly by calling an endpoint they were never supposed
// to reach. This maps most closely to a single technique --
// T1548 (Abuse Elevation Control Mechanism) or, more precisely, it
// reflects a missing server-side control rather than an attacker
// TECHNIQUE at all -- ATT&CK catalogues attacker BEHAVIOUR, and "the
// server forgot to check a role" is a defensive gap, not something an
// attacker actively DOES beyond simply making the request.

// The general lesson: not every STRIDE threat decomposes into a chain.
// Whether ATT&CK mapping reveals a hidden multi-step chain (T1) or
// confirms the threat really is a single atomic action (T3) is itself
// useful information -- it tells you whether your mitigation needs to
// cover multiple attacker steps or just one server-side fix.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Mapping a threat to a specific ATT&CK technique ID is really just adding a fancier label on top of the same STRIDE category — it doesn\'t change what mitigation you\'d design.',
    reality: 'It very much can — as this subtopic shows directly: the main page\'s original T1 mitigation only covers HALF of the real attack chain (limiting stolen-token reuse), because "Spoofing" as a category never prompted anyone to separately ask "how would the attacker have obtained that token in the first place?" Naming <code>T1528</code> explicitly forces that second question, and produces a genuinely different, additional mitigation (httpOnly cookies, CSP, log hygiene) the generic category never surfaced on its own.',
  },
  {
    thought: 'Every STRIDE threat should be expanded into a multi-step ATT&CK chain for a thorough analysis.',
    reality: 'The Try It exercise above shows the opposite is also a valid, useful outcome — threat T3 (missing authorization check) genuinely does NOT decompose into a multi-technique chain, because there is no separate "obtain access" step; the entire threat is one missing server-side control. Forcing every threat into an artificial multi-step chain just to look thorough would misrepresent threats that really are atomic — the value of the ATT&CK mapping exercise is in finding out WHICH kind of threat you\'re looking at, not in assuming the answer in advance.',
  },
];

@Component({
  selector: 'app-sec-tm-attck',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mapping-a-stride-threat-to-mitre-attck.html',
  styleUrl: './mapping-a-stride-threat-to-mitre-attck.scss',
})
export class MappingAStrideThreatToMitreAttckSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
