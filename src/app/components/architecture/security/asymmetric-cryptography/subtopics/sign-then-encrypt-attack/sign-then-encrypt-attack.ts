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
    heading: 'The QnA Names a Real, Historical Attack — With No Code',
    points: [
      'The main page\'s own QnA explains "sign-then-encrypt" precisely: sign the plaintext first, then encrypt the (signature + plaintext) bundle together for the recipient. It also explains exactly why this ordering is risky — but never runs the attack.',
      'This is a well-documented, named vulnerability class (sometimes called "surreptitious forwarding" or "selective forwarding") — a malicious or compromised RECIPIENT can decrypt a sign-then-encrypt message, then RE-ENCRYPT the exact same (signature, plaintext) pair for a completely different third party, who has no way to tell it wasn\'t addressed to them.',
      'The root cause: a signature over the plaintext proves WHO wrote the message, but says nothing about WHO it was intended for. Re-encrypting the same signed content for a new recipient doesn\'t invalidate the original signature at all — it still verifies correctly, because nothing about the signed bytes changed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Sign-then-Encrypt: The Vulnerable Order',
    language: 'typescript',
    code: `import crypto from 'crypto';

// The (message + signature) bundle is small, but a base64 RSA-2048
// signature alone already exceeds RSA-OAEP's own ~190-byte payload
// limit -- exactly the mistake the main page's own mistake block
// warns against. So the bundle is hybrid-encrypted, the same pattern
// the main page's own codeTabs already establish for anything beyond
// a tiny payload.
function hybridEncrypt(plaintext: string, recipientPublicKey: string) {
  const aesKey = crypto.randomBytes(32);
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const wrappedKey = crypto.publicEncrypt(
    { key: recipientPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  );
  return { wrappedKey, iv, ciphertext, tag };
}

// Reusing the main page's own RSA sign/verify pattern exactly.
function signThenEncrypt(message: string, signerPrivateKey: string, recipientPublicKey: string) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message, 'utf8');
  sign.end();
  const signature = sign.sign({
    key: signerPrivateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }, 'base64');

  // The signature + message bundle is what gets encrypted TOGETHER.
  const bundle = JSON.stringify({ message, signature });
  return hybridEncrypt(bundle, recipientPublicKey);
}

// Alice signs, then encrypts, a message she intends ONLY for Bob (her bank):
const message = 'I, Alice, authorize a $10,000 transfer to account #7788';
const forBob = signThenEncrypt(message, alicePrivateKey, bobPublicKey);`,
  },
  {
    label: 'The Attack: Bob Re-Encrypts the Same Signed Bundle for Charlie',
    language: 'typescript',
    code: `function hybridDecrypt(payload: ReturnType<typeof hybridEncrypt>, recipientPrivateKey: string): string {
  const aesKey = crypto.privateDecrypt(
    { key: recipientPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    payload.wrappedKey
  );
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, payload.iv);
  decipher.setAuthTag(payload.tag);
  return Buffer.concat([decipher.update(payload.ciphertext), decipher.final()]).toString('utf8');
}

// Bob decrypts what Alice sent him -- entirely normal so far.
const decryptedBundle = hybridDecrypt(forBob, bobPrivateKey);
const { message: recoveredMessage, signature: recoveredSignature } = JSON.parse(decryptedBundle);

// Bob -- malicious, or his account is compromised -- now RE-ENCRYPTS
// the EXACT SAME (message, signature) pair for Charlie (a different
// bank), without ever touching Alice's original signature at all.
function forwardBundle(message: string, signature: string, newRecipientPublicKey: string) {
  const bundle = JSON.stringify({ message, signature }); // UNCHANGED
  return hybridEncrypt(bundle, newRecipientPublicKey);
}

const forCharlie = forwardBundle(recoveredMessage, recoveredSignature, charliePublicKey);
const charlieDecrypted = hybridDecrypt(forCharlie, charliePrivateKey);
const { message: charlieMsg, signature: charlieSig } = JSON.parse(charlieDecrypted);

// Charlie decrypts, and verifies Alice's signature over the message:
const verify = crypto.createVerify('RSA-SHA256');
verify.update(charlieMsg, 'utf8');
verify.end();
const signatureValid = verify.verify(
  { key: alicePublicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST },
  charlieSig,
  'base64'
);
console.log('Charlie sees a VALID Alice signature:', signatureValid); // true

// Charlie has no way to know this "authorization" was never actually
// sent to him by Alice -- the signature only ever covered the
// MESSAGE TEXT, never who it was encrypted for.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'If Alice had used ENCRYPT-then-SIGN instead — encrypt the message for Bob first, then sign the CIPHERTEXT — could Bob still forward the same encrypted bundle to Charlie and have it verify as a message legitimately intended for Charlie?',
  hint: 'What does Bob actually possess that he could re-sign with — and whose key would a verification check need to succeed against?',
  solution: `// No -- encrypt-then-sign closes exactly this attack.

// With encrypt-then-sign, the SIGNATURE is over the ciphertext Alice
// produced specifically FOR BOB (encrypted with Bob's public key).
// If Bob forwards that exact ciphertext to Charlie, Charlie would
// need to decrypt it -- but it was encrypted with BOB's public key,
// not Charlie's, so Charlie's private key cannot decrypt it at all.

// Bob COULD re-encrypt the plaintext for Charlie after decrypting it
// himself, but then he would need to produce a NEW signature over
// that new ciphertext -- and Bob doesn't have Alice's private key, so
// he cannot forge a signature that verifies as coming from Alice.
// Whatever Bob signs would correctly show up as signed BY BOB, not by
// Alice, which is precisely the distinction Charlie needs to detect
// the forwarding attempt.

// This is exactly why the main page's own QnA recommends encrypt-
// then-sign as the safer default, with the caveat that in practice,
// authenticated encryption (AES-GCM) already provides this property
// more directly -- sign the ciphertext only when attribution beyond
// the AEAD's own authentication is specifically needed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The vulnerability is that Bob can somehow forge or alter Alice\'s signature.',
    reality: 'Bob never touches the signature at all — he forwards it completely UNCHANGED. The attack works BECAUSE the signature remains perfectly valid; the vulnerability is that a valid signature over the message says nothing about who the message was addressed to, which sign-then-encrypt never binds together.',
  },
  {
    thought: 'Encrypting the (signature + message) bundle together, instead of sending the signature in the clear, protects against this attack — since an outside eavesdropper can\'t see the signature.',
    reality: 'The attacker in this scenario isn\'t an outside eavesdropper — it\'s the LEGITIMATE recipient (Bob) who was always meant to decrypt the bundle. Encryption protects against outsiders; it does nothing to stop an authorized recipient from doing exactly what decryption entitles them to do with the plaintext they legitimately received.',
  },
  {
    thought: 'This attack requires a cryptographic weakness in RSA signing or RSA encryption specifically.',
    reality: 'Both the signature and the encryption operations behave exactly as designed throughout the attack — RSA signing correctly proves authorship, RSA encryption correctly protects confidentiality in transit. The vulnerability is purely structural (which data gets signed relative to which data gets encrypted, and in what order), not a flaw in either primitive itself.',
  },
];

@Component({
  selector: 'app-sec-asym-signenc',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sign-then-encrypt-attack.html',
  styleUrl: './sign-then-encrypt-attack.scss',
})
export class SignThenEncryptAttackSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
