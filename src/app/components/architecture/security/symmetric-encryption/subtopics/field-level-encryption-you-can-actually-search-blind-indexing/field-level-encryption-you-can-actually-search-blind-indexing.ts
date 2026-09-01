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
    heading: 'The Real Problem: AES-GCM Ciphertext Can\'t Be Queried',
    points: [
      'The main page\'s own <code>encrypt()</code> function generates a fresh random IV every call — exactly correct for security, but it means encrypting the SAME plaintext twice produces two COMPLETELY DIFFERENT ciphertexts. A SQL <code>WHERE email_encrypted = ?</code> lookup can never work against it.',
      'The main page\'s own separate QnA names two fixes in one sentence: deterministic encryption (AES-SIV) or "store a hash of the value for lookup." The hash approach — a blind index — is the one built out here: it needs no unusual cipher mode, works with the exact same AES-256-GCM already established on this page, and is the pattern real field-level-encryption libraries (CipherSweet, and Stripe\'s own described approach) actually use.',
      'A blind index is a SEPARATE column: an HMAC of the plaintext, computed with its own dedicated key (never the AES encryption key), stored alongside the AEAD-encrypted value. Equality queries run against the blind-index column; the actual sensitive value stays behind AES-GCM in its own column.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Encrypting a Field + Computing Its Blind Index',
    language: 'typescript',
    code: `import crypto from 'crypto';

// A SEPARATE key from the AES-GCM encryption key -- reusing the same
// key for both encryption and the blind index would let an attacker
// who recovers one derive information about the other.
const BLIND_INDEX_KEY = crypto.randomBytes(32); // store in KMS, same as the AES key

function computeBlindIndex(plaintext: string): string {
  // Deterministic BY DESIGN -- the same input always produces the
  // same HMAC, which is exactly what makes equality lookup possible.
  // Normalize first (lowercase, trim) so "Bob@Example.com" and
  // "bob@example.com" produce the SAME index.
  const normalized = plaintext.trim().toLowerCase();
  return crypto
    .createHmac('sha256', BLIND_INDEX_KEY)
    .update(normalized)
    .digest('hex');
}

// Reuses the main page's own encrypt() function unchanged --
// AES-256-GCM, fresh random IV per call, non-deterministic.
async function storeEmail(userId: string, email: string) {
  const encryptedEmail = encrypt(email, aesKey); // main page's own function
  const emailBlindIndex = computeBlindIndex(email);

  await db.query(
    'INSERT INTO users (id, email_encrypted, email_blind_index) VALUES ($1, $2, $3)',
    [userId, encryptedEmail, emailBlindIndex]
  );
}`,
  },
  {
    label: 'Querying by the Blind Index',
    language: 'typescript',
    code: `async function findUserByEmail(email: string) {
  // Compute the SAME deterministic index for the search term --
  // this is the one lookup a plain AES-GCM column can never support.
  const searchIndex = computeBlindIndex(email);

  const { rows } = await db.query(
    'SELECT id, email_encrypted FROM users WHERE email_blind_index = $1',
    [searchIndex]
  );

  if (rows.length === 0) return null;

  // Decrypt only AFTER the row is found -- the blind index found the
  // row; the actual email value still only ever exists in plaintext
  // after this explicit decrypt step.
  const email = decrypt(rows[0].email_encrypted, aesKey); // main page's own function
  return { id: rows[0].id, email };
}

// Two DIFFERENT encrypt() calls for the SAME email produce two
// DIFFERENT email_encrypted values (fresh random IV each time) --
// but computeBlindIndex() always produces the SAME hex string for
// that same email, which is exactly why the WHERE clause above works
// at all.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A blind index is computed as <code>HMAC-SHA256(BLIND_INDEX_KEY, email)</code> with NO normalization step. A user registers with <code>"Bob@Example.com"</code>. Later, someone searches for <code>"bob@example.com"</code> (all lowercase). Does the lookup find the row?',
  hint: 'HMAC is deterministic for identical INPUT bytes — are <code>"Bob@Example.com"</code> and <code>"bob@example.com"</code> identical inputs?',
  solution: `// No -- the lookup finds nothing, even though the same email
// "matches" in every ordinary sense.

// HMAC-SHA256 is deterministic for identical byte sequences, but
// "Bob@Example.com" and "bob@example.com" are DIFFERENT byte
// sequences -- different case produces a completely different hash,
// with no relationship between the two outputs at all.

// This is exactly why the codeTab above normalizes (trim + lowercase)
// BEFORE computing the blind index, not after -- both the STORAGE
// path and the QUERY path must apply the identical normalization, or
// the same logical email value silently produces two different,
// unrelated blind-index entries that can never match each other.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The blind index should be computed using the same key as the AES-256-GCM encryption.',
    reality: 'They must use SEPARATE keys. Reusing the encryption key for the blind index creates a cryptographic relationship between the two values that isn\'t present when the keys are independent — a well-established key-separation principle, not just a style preference.',
  },
  {
    thought: 'A blind index leaks nothing about the underlying data, since it\'s "just a hash."',
    reality: 'Because it\'s DETERMINISTIC (the same input always produces the same output), it leaks FREQUENCY — an attacker with database access can see which rows share the same blind-index value, revealing which encrypted values are duplicates, even without ever decrypting anything. This is a real, documented trade-off of the technique, not a flaw unique to this implementation.',
  },
  {
    thought: 'Since the blind index makes equality search possible, it also enables range queries (e.g. <code>WHERE age_encrypted &gt; 18</code>) on encrypted columns.',
    reality: 'A blind index only supports EXACT equality — the deterministic hash of one value has no ordering relationship to the hash of another. Range queries on encrypted data need a fundamentally different technique (order-preserving encryption, or decrypting into an application-level filter), not a blind index.',
  },
];

@Component({
  selector: 'app-sec-symkey-blind-index',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './field-level-encryption-you-can-actually-search-blind-indexing.html',
  styleUrl: './field-level-encryption-you-can-actually-search-blind-indexing.scss',
})
export class FieldLevelEncryptionYouCanActuallySearchBlindIndexingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
