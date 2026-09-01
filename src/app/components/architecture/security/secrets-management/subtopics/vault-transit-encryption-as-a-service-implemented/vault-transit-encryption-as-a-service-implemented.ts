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
    heading: 'The Quiz Explains Transit in Real Depth — With No Working Call',
    points: [
      'The quiz\'s own answer is specific: "the application submits plaintext to Vault... Vault returns a ciphertext... the encryption keys never leave Vault." This directly connects to the Symmetric Encryption topic\'s own envelope-encryption content, just with Vault performing the cryptographic operation instead of the application\'s own code.',
      'Vault\'s Transit API requires plaintext to be base64-encoded before the request, and returns ciphertext in a specific, versioned format: <code>vault:v1:&lt;base64-encoded-ciphertext&gt;</code> — the <code>v1</code> segment identifies WHICH key version encrypted it, which is what makes key rotation transparent to callers.',
      'The application never sees, stores, or manages an encryption key at all in this pattern — every encrypt/decrypt call is an API request, with Vault\'s own access policies (not the application\'s own code) controlling who can use which named key.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Encrypting Data Through Vault',
    language: 'typescript',
    code: `async function transitEncrypt(
  vaultAddr: string,
  vaultToken: string,
  keyName: string,
  plaintext: string
): Promise<string> {
  // Vault's Transit API requires base64-encoded plaintext in the
  // request body -- this is a real, documented requirement, not
  // optional.
  const base64Plaintext = Buffer.from(plaintext, 'utf8').toString('base64');

  const res = await fetch(\`\${vaultAddr}/v1/transit/encrypt/\${keyName}\`, {
    method: 'POST',
    headers: { 'X-Vault-Token': vaultToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ plaintext: base64Plaintext }),
  });

  const body = await res.json();
  return body.data.ciphertext; // e.g. "vault:v1:XjsPWPjqPrBi1N2Ms2s1QM798YyFWnO4TR4lsFA="
}

// The application's OWN database only ever stores this returned
// string -- the SSN, credit card number, or other sensitive value
// never touches disk in plaintext form, and the application process
// never holds an encryption key at any point.
const ciphertext = await transitEncrypt(
  process.env.VAULT_ADDR!,
  process.env.VAULT_TOKEN!,
  'customer-pii',
  'SSN: 123-45-6789'
);
await db.query('UPDATE customers SET ssn_encrypted = $1 WHERE id = $2', [ciphertext, customerId]);`,
  },
  {
    label: 'Decrypting -- and Why Key Rotation Is Transparent',
    language: 'typescript',
    code: `async function transitDecrypt(
  vaultAddr: string,
  vaultToken: string,
  keyName: string,
  ciphertext: string
): Promise<string> {
  const res = await fetch(\`\${vaultAddr}/v1/transit/decrypt/\${keyName}\`, {
    method: 'POST',
    headers: { 'X-Vault-Token': vaultToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ciphertext }),
  });

  const body = await res.json();
  // The response plaintext is ALSO base64-encoded -- the caller must
  // decode it, symmetrically with the encoding step on the way in.
  return Buffer.from(body.data.plaintext, 'base64').toString('utf8');
}

const { rows } = await db.query('SELECT ssn_encrypted FROM customers WHERE id = $1', [customerId]);
const ssn = await transitDecrypt(
  process.env.VAULT_ADDR!,
  process.env.VAULT_TOKEN!,
  'customer-pii',
  rows[0].ssn_encrypted
);

// If an operator rotates the 'customer-pii' key in Vault (a new key
// VERSION, not a brand-new key name), this decrypt call needs NO
// code change at all -- the ciphertext's own "vault:v1:..." prefix
// tells Vault which key version to use, even for ciphertext encrypted
// months before the rotation happened.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The <code>customer-pii</code> key is rotated in Vault, producing key version 2. A row encrypted BEFORE the rotation still has ciphertext starting with <code>vault:v1:...</code>. Does <code>transitDecrypt()</code> need to know which key version originally encrypted a given row?',
  hint: 'Where does the version identifier actually live — in the application\'s own database schema, or somewhere else entirely?',
  solution: `// No -- the application never needs to track key versions itself at
// all.

// The ciphertext string ITSELF carries the version identifier --
// "vault:v1:..." for data encrypted under version 1, "vault:v2:..."
// for data encrypted after rotation. Vault reads that prefix from
// the ciphertext it's asked to decrypt and automatically uses the
// matching key version, entirely on its own side.

// This is exactly why the theory bullet calls key rotation
// "transparent to callers" -- the SAME transitDecrypt() function,
// with no changes, correctly decrypts both a row encrypted under v1
// and a row encrypted under v2, because the version routing happens
// inside Vault based on the ciphertext's own content, not based on
// anything the calling application tracks or passes in.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Transit engine is just a convenient wrapper around AES-GCM -- the application could implement the same thing itself with <code>crypto.createCipheriv()</code>.',
    reality: 'The mechanically different property is WHERE the encryption key ever exists — with Transit, it never leaves Vault at all, meaning an application-level compromise (a code vulnerability, a leaked application log) cannot expose the key itself, only ciphertext the attacker still can\'t decrypt without separately compromising Vault\'s own access policy.',
  },
  {
    thought: 'Since Transit handles encryption, the application no longer needs to worry about access control for the sensitive data at all.',
    reality: 'Vault\'s own policies control WHO can call <code>transit/encrypt/customer-pii</code> and <code>transit/decrypt/customer-pii</code> in the first place — access control simply moves to Vault\'s policy layer instead of disappearing. A compromised application token with decrypt permission on that key can still decrypt every row, the same way a compromised application with a raw AES key could.',
  },
  {
    thought: 'Rotating a Transit key requires re-encrypting every already-stored ciphertext immediately, the same way rotating a symmetric key normally would.',
    reality: 'Rotation creates a NEW key version without invalidating the old one — existing ciphertext keeps decrypting correctly under its original version indefinitely (the Try It confirms this). Vault separately offers a "rewrap" operation to move old ciphertext onto the latest version when desired, but it\'s optional, not an immediate requirement of rotation itself.',
  },
];

@Component({
  selector: 'app-sec-secrets-transit',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './vault-transit-encryption-as-a-service-implemented.html',
  styleUrl: './vault-transit-encryption-as-a-service-implemented.scss',
})
export class VaultTransitEncryptionAsAServiceImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
