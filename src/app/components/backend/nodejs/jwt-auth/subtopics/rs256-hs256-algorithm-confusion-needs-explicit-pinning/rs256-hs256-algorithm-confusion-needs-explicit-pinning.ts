import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './rs256-hs256-algorithm-confusion-needs-explicit-pinning.html',
  styleUrl: './rs256-hs256-algorithm-confusion-needs-explicit-pinning.scss'
})
export class Rs256Hs256AlgorithmConfusionNeedsExplicitPinningSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory says "never accept \'none\' algorithm, validate the alg header matches expected" in one sentence — worth knowing the specific, historically real attack this general advice is defending against, and the precise library-level fix',
      points: [
        'In an RS256 setup, the server verifies tokens using a PUBLIC key — and a public key is, by definition, not secret; anyone can obtain it. A JWT library that reads the alg field from the token being verified (rather than pinning to an expected algorithm ahead of time) can be tricked: an attacker forges a token with alg: "HS256" and signs it using the server\'s own known RS256 PUBLIC key as if it were an HMAC shared secret. If the verifying code passes that public key to a naive verify() call with no algorithm restriction, the library dutifully runs HS256 verification with "the key it was given" — and the forged signature checks out.',
        'This is not a hypothetical — it is a well-documented, real vulnerability class first written up publicly around 2015, which affected multiple JWT libraries across several languages, including early versions of the very jsonwebtoken package the main page\'s own code samples use.',
        'The documented fix: explicitly restrict which algorithms verify() will accept via the algorithms option — jwt.verify(token, publicKey, { algorithms: ["RS256"] }) — rather than relying on the token\'s own self-reported alg header (which is exactly what an attacker controls) to determine how it gets checked.',
      ]
    },
    {
      heading: 'A precision worth being exact about — this isn\'t a live, unpatched hole in every jsonwebtoken install today',
      points: [
        'jsonwebtoken shipped a real fix for the underlying default-safety gap: as of v9.0.0 (December 2022, addressing CVE-2022-23540), the library inspects the actual cryptographic TYPE of the key you pass in and automatically restricts accepted algorithms to match it — an RSA key auto-restricts to RS*/PS* algorithms, an EC key to ES* algorithms, a plain secret string to HS* — even if you never pass the algorithms option at all.',
        'This means the classic version of this attack no longer works against current jsonwebtoken versions purely by omission. Explicitly passing algorithms: ["RS256"] is still the recommended, defense-in-depth best practice (it is more explicit, and matters if you ever need to intentionally restrict to a SUBSET of what a key type would otherwise allow), but the framing should be "still best practice" rather than "the only thing standing between you and this exact CVE" for a modern, up-to-date dependency.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The historical vulnerability — no algorithm restriction at all',
      language: 'typescript',
      code: `import jwt from 'jsonwebtoken';
import fs from 'node:fs';

const publicKey = fs.readFileSync('rsa-public.pem'); // NOT secret — safe to expose

// VULNERABLE against pre-v9 jsonwebtoken (or any library with the
// same historical default-safety gap): no algorithm restriction at
// all — the verify call trusts whatever "alg" the TOKEN claims.
function verifyTokenUnsafe(token) {
  return jwt.verify(token, publicKey);
  // An attacker who knows this public key (trivial — it's public by
  // design) can forge a token with alg: "HS256" and sign it using
  // this SAME public key string as an HMAC secret. A verify() call
  // with no algorithm restriction can be tricked into treating the
  // public key as an HMAC secret and accepting the forged signature.
}`,
    },
    {
      label: 'Explicit pinning — the recommended, defense-in-depth fix',
      language: 'typescript',
      code: `import jwt from 'jsonwebtoken';
import fs from 'node:fs';

const publicKey = fs.readFileSync('rsa-public.pem');

// Explicit algorithm pinning — the recommended fix, and still best
// practice even on jsonwebtoken v9+ (which auto-restricts by key
// type as a default safety net, but explicit pinning is more
// intentional and required if you want a NARROWER allow-list than
// the key type alone would permit).
function verifyTokenSafe(token) {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'], // ONLY RS256 is accepted — an HS256-signed
                            // forgery using the public key as an HMAC
                            // secret is rejected outright, regardless
                            // of what "alg" the token itself claims.
    issuer:   'devhub-api',
    audience: 'devhub-client',
  });
}

// Note: as of jsonwebtoken v9.0.0 (fixing CVE-2022-23540), the
// library ALSO auto-restricts allowed algorithms based on the actual
// cryptographic TYPE of the key passed in, even without this option
// — but explicit pinning remains the clearer, more defensive choice.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security auditor reviewing an older codebase (pinned to jsonwebtoken@8.x, before the v9.0.0 safety fix) finds a verify call written as `jwt.verify(token, RSA_PUBLIC_KEY)` — no algorithms option specified anywhere. Using the documented algorithm-confusion vulnerability, explain the specific risk this exact code has on this specific library version, and why the same code might be considered lower-risk (though still not best practice) on a current jsonwebtoken version.',
    hint: 'Did jsonwebtoken always auto-restrict accepted algorithms based on the key\'s actual type, or was that a specific version-level fix? What CVE addressed this, and in which released version?',
    solution: 'On jsonwebtoken@8.x (before the v9.0.0 fix for CVE-2022-23540), this exact code is genuinely vulnerable to the classic RS256/HS256 algorithm confusion attack: since no algorithms option restricts what verify() will accept, and the library at that version does not yet auto-restrict based on the key\'s actual cryptographic type, an attacker who obtains the RSA public key (trivial, since it is meant to be public) can forge a token with alg: "HS256," sign it using that same public key string as an HMAC secret, and have it pass verification — a genuine authentication bypass. On a current jsonwebtoken version (v9.0.0+), the SAME code is meaningfully lower-risk (though still not best practice) because the library itself now inspects the actual type of the key being passed in and automatically restricts accepted algorithms to match — an RSA key auto-restricts to RS*/PS* algorithms regardless of whether the algorithms option is explicitly set, closing the specific hole this attack relies on by default. The auditor\'s correct recommendation is still to add explicit algorithms: ["RS256"] regardless of version — it is defense-in-depth, more intentional, and doesn\'t rely on the library\'s internal default behavior — but the SEVERITY of flagging this specific finding differs meaningfully depending on which jsonwebtoken version is actually installed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The RS256/HS256 algorithm confusion attack is purely a theoretical, academic vulnerability that was never a real, practical exploit against actual production JWT libraries.',
      reality: 'This subtopic\'s theory shows the opposite — this is a well-documented, real vulnerability class from a widely-cited 2015 write-up that affected multiple production JWT libraries across several languages, including early versions of the jsonwebtoken package this hub\'s own code samples use.'
    },
    {
      thought: 'Since jsonwebtoken v9.0.0 auto-restricts accepted algorithms based on the key\'s actual type, explicitly passing algorithms: ["RS256"] to jwt.verify() is now unnecessary and can be safely omitted.',
      reality: 'This subtopic\'s theory clarifies explicit pinning remains the recommended, defense-in-depth best practice even on current versions — the automatic key-type restriction is a valuable safety net, but explicit pinning is more intentional and is required if you need a narrower allow-list than the key type alone permits.'
    },
    {
      thought: 'Every currently-deployed application using the jsonwebtoken library is protected from this attack by default, regardless of which version of the library is actually installed.',
      reality: 'This subtopic\'s exercise shows this protection is version-specific — the automatic key-type-based algorithm restriction was introduced specifically in v9.0.0 (December 2022) to fix CVE-2022-23540; an application still pinned to an older jsonwebtoken version without explicit algorithms restriction remains genuinely vulnerable to this exact attack.'
    }
  ];
}
