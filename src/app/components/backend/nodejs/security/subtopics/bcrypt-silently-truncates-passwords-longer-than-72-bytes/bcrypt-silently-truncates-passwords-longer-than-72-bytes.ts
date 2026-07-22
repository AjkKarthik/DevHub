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
  templateUrl: './bcrypt-silently-truncates-passwords-longer-than-72-bytes.html',
  styleUrl: './bcrypt-silently-truncates-passwords-longer-than-72-bytes.scss'
})
export class BcryptSilentlyTruncatesPasswordsLongerThan72BytesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own registerSchema caps password length with z.string().min(8).max(128) — a reasonable-looking upper bound that, per bcrypt\'s own documented algorithm behavior, is actually far larger than the amount of the password bcrypt will ever actually use',
      points: [
        'bcrypt, as an algorithm (this is a property of bcrypt itself, not a quirk of any one library\'s implementation), only processes the first 72 BYTES of its input — any bytes beyond the 72nd are silently ignored entirely. The npm bcrypt package\'s own README states this directly: "Per bcrypt implementation, only the first 72 bytes of a string are used. Any extra bytes are ignored when matching passwords."',
        'The critical, easy-to-miss detail: this is 72 BYTES, not 72 characters. A UTF-8-encoded string containing multi-byte characters — emoji, accented letters, non-Latin scripts — can exceed 72 bytes in far fewer than 72 characters, since a single emoji alone can be 4 bytes. The main page\'s own max(128) validation constrains CHARACTER count (JavaScript string length), which does not correspond 1:1 to byte count for anything outside plain ASCII.',
        'The practical, concrete consequence: two DIFFERENT passwords that happen to share an identical first-72-byte prefix but differ only in bytes AFTER that point will hash to the exact SAME bcrypt output — and both would successfully authenticate against that one stored hash. This is not a hypothetical edge case; it follows directly and unavoidably from bytes past the 72nd never entering the hash computation at all.',
      ]
    },
    {
      heading: 'Why this matters in practice, and how the modern alternative differs',
      points: [
        'For the vast majority of real-world passwords (well under 72 bytes even generously, since most password policies cap length well below that anyway), this limitation never surfaces at all — it becomes a real, practical concern specifically for very long passphrases, passphrase-manager-generated strings, or any input containing enough multi-byte characters to cross the 72-byte line without the application realizing it. OWASP\'s own Password Storage guidance explicitly recommends enforcing a maximum password length of 72 BYTES specifically because of this bcrypt limitation, rather than trusting an arbitrary, larger character-count limit to be safe.',
        'The main page\'s own theory mentions "Argon2id is the modern alternative and winner of the Password Hashing Competition" without detailing why beyond that credential — one concrete, verifiable reason: Argon2\'s own specification supports inputs far larger than bcrypt\'s 72-byte ceiling (up to 2^32−1 bytes), meaning it does not share this specific truncation limitation at all. This is one of several reasons OWASP\'s current guidance lists Argon2id as its primary recommendation, with bcrypt positioned as an acceptable fallback specifically when Argon2id is unavailable.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two different passwords, one identical bcrypt hash',
      language: 'typescript',
      code: `import bcrypt from 'bcrypt';

// A 72-byte prefix shared by both passwords, followed by DIFFERENT
// suffixes. Since bcrypt only processes the first 72 bytes, the
// suffix is completely irrelevant to the resulting hash.
const prefix72Bytes = 'a'.repeat(72); // exactly 72 ASCII bytes

const passwordA = prefix72Bytes + 'this-part-is-ignored-by-bcrypt';
const passwordB = prefix72Bytes + 'a-totally-different-ending-here';

const hashA = await bcrypt.hash(passwordA, 12);

// passwordB is a DIFFERENT string, but bcrypt only ever looks at
// its first 72 bytes — which are identical to passwordA's:
const matches = await bcrypt.compare(passwordB, hashA);
console.log(matches); // true — passwordB successfully "authenticates"
                        // against a hash that was created from a
                        // DIFFERENT password, purely because both
                        // share the same first-72-byte prefix.

// The main page's own max(128) CHARACTER limit does nothing to
// prevent this — both passwordA and passwordB are well under 128
// characters, yet both exceed bcrypt's 72-BYTE processing window.`,
    },
    {
      label: 'The 72-byte, not 72-character, distinction with multi-byte input',
      language: 'typescript',
      code: `import bcrypt from 'bcrypt';

// A password with emoji — each emoji can be 4 bytes in UTF-8,
// so this string crosses 72 BYTES in far fewer than 72 CHARACTERS.
const password = '🔒'.repeat(20); // 20 characters, but 80 bytes
                                    // (4 bytes per emoji × 20)

console.log(password.length);                        // 40 (JS counts
                                                        // UTF-16 code
                                                        // units, not bytes)
console.log(Buffer.byteLength(password, 'utf8'));     // 80 — exceeds
                                                        // bcrypt's 72-byte
                                                        // limit despite
                                                        // looking short

// The main page's own z.string().max(128) validation, which checks
// JS string .length, would happily accept this — it's nowhere near
// 128 characters — while bcrypt silently truncates the last 8 bytes
// of it before hashing, without any error or warning.

// The correct validation checks byte length, not character length:
const passwordSchema = z.string()
  .refine(pw => Buffer.byteLength(pw, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes (UTF-8 encoded)',
  });`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security-conscious user sets an unusually long passphrase — 90 characters of plain ASCII text — on a signup form using the main page\'s own z.string().min(8).max(128) validation, which happily accepts it. Months later, they change just the LAST FEW characters of that same passphrase (keeping the first 75 characters identical) expecting their old password to stop working. Using bcrypt\'s documented 72-byte behavior, what actually happens when they try to log in with their OLD passphrase after the change?',
    hint: 'Since this passphrase is plain ASCII, does its character count and byte count differ? Does bcrypt "notice" any of the characters past the 72nd byte at all, when hashing OR when comparing?',
    solution: 'The user\'s OLD passphrase would STILL successfully log them in, even after they believe they\'ve changed their password — because for plain ASCII text, character count and byte count are identical, meaning this 90-character passphrase is also 90 bytes, well past bcrypt\'s 72-byte processing limit. Since the user only changed characters AFTER position 75 (beyond the 72-byte mark bcrypt actually uses), and bcrypt silently ignores everything past byte 72 for BOTH the original hash computation and every later comparison, the new bcrypt hash generated from their "changed" password is mathematically IDENTICAL to the old hash — both were computed from the same first-72-byte prefix. This means their supposedly-retired old passphrase continues to authenticate successfully indefinitely, which is exactly the kind of silent, non-obvious security gap this subtopic describes: nothing in the application ever throws an error, logs a warning, or otherwise signals that the "password change" had no actual effect on what credentials the account will accept. The fix at the application layer is enforcing a byte-length limit (via Buffer.byteLength(password, \'utf8\') <= 72) at validation time, so a password long enough to hit this behavior is rejected outright rather than silently truncated.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'bcrypt processes a password of any length correctly, the same way a general-purpose cryptographic hash function like SHA-256 does — longer passwords simply produce more secure hashes.',
      reality: 'This subtopic\'s theory and first code example both show bcrypt genuinely only processes the first 72 BYTES of its input, silently ignoring everything beyond that — two different passwords sharing that same 72-byte prefix produce the identical hash and both successfully authenticate.'
    },
    {
      thought: 'The main page\'s own z.string().max(128) password validation is sufficient to keep passwords within any length limit bcrypt actually cares about.',
      reality: 'This subtopic\'s second code example shows this checks CHARACTER count (JavaScript string .length), not BYTE count — a password well under 128 characters, especially one containing multi-byte UTF-8 characters like emoji, can still exceed bcrypt\'s 72-BYTE limit and be silently truncated.'
    },
    {
      thought: 'Argon2id is recommended over bcrypt purely because it won a naming competition ("Password Hashing Competition") — a credential, not a concrete technical difference relevant to real applications.',
      reality: 'This subtopic\'s theory identifies a specific, verifiable technical difference — Argon2\'s specification supports inputs up to 2^32−1 bytes, meaning it does not share bcrypt\'s 72-byte truncation limitation at all, which is one of the concrete reasons OWASP\'s current guidance lists it as the primary recommendation.'
    }
  ];
}
