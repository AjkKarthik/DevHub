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
    heading: 'The Main Page Shows Half of Key Wrapping',
    points: [
      'The main page\'s own mistake block ("Using RSA to encrypt large data directly") shows exactly ONE line of key wrapping — <code>crypto.publicEncrypt({ key: publicKey, padding: RSA_OAEP }, dataKey)</code> — the WRAP step. The corresponding UNWRAP step (recovering the DEK with the private key) never appears anywhere on the page.',
      'The quiz\'s own separate question defines key wrapping precisely — "encrypting a cryptographic key with another key (KEK) so it can be safely stored or transmitted" — and names the hierarchical pattern (root keys wrap intermediate keys, which wrap data keys) the codeTabs never build out.',
      'This connects directly to this hub\'s own Symmetric Encryption topic, which already covers ENVELOPE ENCRYPTION using a KMS-managed KEK — RSA-based key wrapping is the SAME idea, just using an asymmetric key pair as the KEK instead of a KMS API call.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Wrap: Encrypting a DEK With the Public Key',
    language: 'typescript',
    code: `import crypto from 'crypto';

// The KEK: an RSA key pair. The PUBLIC half can be distributed
// freely to anywhere that needs to wrap a new DEK; the PRIVATE half
// stays in exactly one place (a KMS, an HSM, a tightly-controlled
// service) and is the only thing that can ever unwrap one.
const { publicKey: kekPublic, privateKey: kekPrivate } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function wrapKey(dek: Buffer, kekPublicKey: string): Buffer {
  // The DEK (32 bytes for AES-256) is FAR smaller than RSA-2048's own
  // ~190-byte OAEP limit -- key wrapping is exactly the "small
  // payload" case hybrid encryption exists for, applied to a key
  // instead of a full message.
  return crypto.publicEncrypt(
    { key: kekPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    dek
  );
}

const dek = crypto.randomBytes(32); // a fresh AES-256 data key
const wrappedDek = wrapKey(dek, kekPublic);

// wrappedDek is what actually gets stored/transmitted alongside the
// AES-GCM-encrypted data -- the plaintext dek itself is never
// persisted anywhere, matching the main page's own envelope-
// encryption principle from the Symmetric Encryption topic.`,
  },
  {
    label: 'Unwrap: Recovering the DEK With the Private Key',
    language: 'typescript',
    code: `function unwrapKey(wrappedDek: Buffer, kekPrivateKey: string): Buffer {
  // Only the holder of kekPrivate can ever reverse this -- exactly
  // the property that makes the KEK a meaningful access-control
  // boundary, independent of how many places hold a copy of
  // wrappedDek itself (which is safe to store/copy freely).
  return crypto.privateDecrypt(
    { key: kekPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    wrappedDek
  );
}

const recoveredDek = unwrapKey(wrappedDek, kekPrivate);
console.log('DEK round-trip matches:', dek.equals(recoveredDek)); // true

// ── Using the unwrapped DEK to decrypt the actual data ────────────────
function decryptWithDek(payload: Buffer, dek: Buffer): string {
  const iv  = payload.subarray(0, 12);
  const tag = payload.subarray(payload.length - 16);
  const ciphertext = payload.subarray(12, payload.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// A full envelope-decryption flow: unwrap the DEK with the RSA
// private key, THEN use the recovered DEK to decrypt the actual
// AES-GCM ciphertext -- two separate decryption steps, each using a
// different key, chained together.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A new "intermediate" RSA key pair is introduced: the ROOT private key wraps the INTERMEDIATE\'s public key material, and the INTERMEDIATE\'s own private key wraps individual DEKs. If the intermediate key pair is rotated (a new one generated), do already-wrapped DEKs from BEFORE the rotation still unwrap correctly?',
  hint: 'Which specific key pair performed the original <code>wrapKey()</code> call on those existing DEKs — the root, or the (now-rotated) intermediate?',
  solution: `// No -- not with the NEW intermediate key pair. Those existing
// wrapped DEKs were encrypted with the OLD intermediate's public key,
// so only the OLD intermediate's private key can unwrap them.

// This is exactly why a real key hierarchy either (a) keeps the OLD
// intermediate private key available specifically for decrypting
// pre-rotation data (common: old key versions retained for read-only
// use), or (b) performs an explicit RE-WRAP step during rotation --
// unwrap each existing DEK with the OLD intermediate private key,
// then immediately re-wrap it with the NEW intermediate's public key.

// The hierarchy itself (root wraps intermediate, intermediate wraps
// DEK) doesn't automatically propagate a rotation down to
// already-wrapped material -- each wrap is a snapshot tied to the
// SPECIFIC key pair used at that moment, not a live reference to
// "whichever intermediate key is currently active."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Key wrapping and envelope encryption (from the Symmetric Encryption topic\'s own KMS example) are two different, unrelated techniques.',
    reality: 'They\'re the SAME underlying idea — a KEK encrypts a DEK — just with a different KEK implementation. The Symmetric Encryption topic\'s KMS calls the cloud provider\'s API to wrap/unwrap; this subtopic uses a locally-held RSA key pair as the KEK instead. The DEK/ciphertext structure and the "never persist the plaintext DEK" principle are identical either way.',
  },
  {
    thought: 'Once a DEK is wrapped, it can be unwrapped by ANY holder of a valid RSA private key.',
    reality: 'Only the SPECIFIC private key whose matching public key performed the wrap can unwrap it — <code>crypto.privateDecrypt()</code> with a different (even otherwise valid) RSA private key fails, since RSA-OAEP decryption is tied to the exact key pair used for encryption, not RSA keys in general.',
  },
  {
    thought: 'Rotating the KEK (the RSA key pair) automatically re-wraps all previously-wrapped DEKs to use the new key.',
    reality: 'Rotation only affects wraps performed AFTER the new key pair exists — every DEK wrapped under the OLD key pair still needs that OLD private key (or an explicit unwrap-then-rewrap migration step) to ever be recovered, exactly as the Try It traces.',
  },
];

@Component({
  selector: 'app-sec-asym-keywrap',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './key-wrapping-and-unwrapping-end-to-end.html',
  styleUrl: './key-wrapping-and-unwrapping-end-to-end.scss',
})
export class KeyWrappingAndUnwrappingEndToEndSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
