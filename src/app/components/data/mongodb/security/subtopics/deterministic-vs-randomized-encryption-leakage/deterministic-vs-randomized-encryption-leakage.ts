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
    heading: 'A Quiz Explanation, Turned Into Real, Runnable Code',
    points: [
      'One of the main page\'s own quiz questions explains, in real technical detail, why <strong>Deterministic</strong> CSFLE encryption can leak information even though an attacker without the key cannot decrypt the actual values — but no codeTab anywhere on the page demonstrates the property directly.',
      'The core property: a deterministic scheme maps the SAME plaintext to the SAME ciphertext every time, so two records sharing a plaintext value (like two people with the same SSN) are directly visible as sharing an encrypted value too — an observer with database access can detect this EQUALITY without ever learning what the underlying value actually is.',
      'A <strong>randomized</strong> scheme (a fresh random value mixed in on every encryption) produces a DIFFERENT ciphertext each time, even for the identical plaintext — no equality signal leaks at all, at the cost of losing the ability to query that field for equality server-side.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Demonstrating Pattern Leakage',
    language: 'typescript',
    code: `import { createHmac, randomBytes, createCipheriv } from 'crypto';

// Illustrative simulation of the CORE PROPERTY real CSFLE deterministic
// vs randomized modes have (real CSFLE deterministic mode uses AES-SIV
// internally, not HMAC -- this demonstrates the same same-plaintext-in
// -> same-ciphertext-out behavior with a simpler, illustrative scheme).
const key = randomBytes(32);

function deterministicEncrypt(plaintext: string): string {
  return createHmac('sha256', key).update(plaintext).digest('hex');
}

function randomizedEncrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
}

const ssnAlice = '123-45-6789';
const ssnBob = '123-45-6789'; // Bob happens to share Alice's SSN value

console.log('--- Deterministic mode ---');
const detAlice = deterministicEncrypt(ssnAlice);
const detBob = deterministicEncrypt(ssnBob);
console.log('Alice ciphertext === Bob ciphertext:', detAlice === detBob);
// -> true: an observer with DB access (but no key) can see these two
// records share the same encrypted value -- revealing they have the
// same SSN, without ever learning the actual SSN itself.

console.log('--- Randomized mode ---');
const randAlice = randomizedEncrypt(ssnAlice);
const randBob = randomizedEncrypt(ssnBob);
console.log('Alice ciphertext === Bob ciphertext:', randAlice === randBob);
// -> false: no equality signal leaks at all, even though the underlying
// plaintext is identical -- but this also means this field can no
// longer be queried for equality server-side with real CSFLE.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A hospital wants to query patients by SSN (e.g., "find the patient whose SSN is X") using a CSFLE-encrypted SSN field, while minimizing pattern leakage as much as possible. Given the deterministic-vs-randomized trade-off demonstrated above, which mode MUST they use, and what specific leakage do they still accept as the cost?',
  hint: 'Think about which mode actually supports server-side equality queries at all — the trade-off is not "pick the safest option," it is "pick the only option that supports the required query."',
  solution: `// They must use DETERMINISTIC encryption for the SSN field --
// randomized encryption cannot be queried for equality server-side at
// all (the whole point of a fresh random value per encryption is that
// identical plaintexts never produce a matching ciphertext to query
// against).
//
// The cost they accept: anyone with database access (but without the
// encryption key) can still detect which OTHER records share the same
// SSN as a given patient, even without ever learning any actual SSN
// value -- exactly the "pattern leakage" the main page's own quiz
// question describes. This is a genuine, deliberate trade-off: query
// capability vs. the strongest possible confidentiality, not a bug to
// be avoided.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'If an attacker cannot decrypt a deterministically-encrypted field without the key, the field is fully protected — pattern leakage is a theoretical concern with no real-world consequence.',
    reality: 'Pattern leakage is a genuine, exploitable signal on its own, independent of ever recovering the plaintext. Detecting that two specific patient records share the same encrypted SSN can itself be sensitive information (e.g. revealing a family relationship, a duplicate/fraudulent record, or correlating a person across otherwise-separated datasets) — the main page\'s own quiz explanation treats this as a real trade-off precisely because it has real consequences.',
  },
  {
    thought: 'A team should always default to randomized encryption for maximum security, and only use deterministic encryption as a rare, deliberate exception.',
    reality: 'The choice is dictated entirely by whether the field needs to be QUERIED for equality server-side, not by a general security-maximizing default. A field that never needs an equality query (e.g., free-text notes) should use randomized encryption; a field that must support "find by exact value" (like the SSN lookup in the exercise above) has NO choice but deterministic encryption, since randomized ciphertext cannot be matched at all.',
  },
];

@Component({
  selector: 'app-mongo-sec-deterministic-vs-randomized',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './deterministic-vs-randomized-encryption-leakage.html',
  styleUrl: './deterministic-vs-randomized-encryption-leakage.scss',
})
export class DeterministicVsRandomizedEncryptionLeakageSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
