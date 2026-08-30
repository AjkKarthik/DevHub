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
    heading: 'Precisely Described, Never Shown in Code',
    points: [
      'The quiz explains passkeys with real precision: "a FIDO2/WebAuthn credential consisting of a key pair... the public key is stored on the server... the private key stays on the device and never leaves it... the device uses the private key to sign the challenge... the server verifies with the public key." Every one of the main page\'s own codeTabs is still password-based (bcrypt hashing, HaveIBeenPwned checks) — nothing demonstrates what a passkey flow actually looks like in browser and server code.',
      'This subtopic builds a simplified (but API-accurate) sketch of both halves of a passkey flow using the real Web Authentication API: <code>navigator.credentials.create()</code> for registration, <code>navigator.credentials.get()</code> for login — verified against the current WebAuthn spec and MDN before publishing, not invented.',
    ],
  },
  {
    heading: 'Why the Server Never Sees Anything Secret',
    points: [
      'In the password flow on the main page\'s own "Hashing with bcrypt" codeTab, the server receives the plaintext password over the wire on every single login (then immediately discards it after hashing/comparing) — it is a genuine secret the server briefly handles. In the passkey flow, the private key is generated ON THE DEVICE, stored in secure hardware, and by design NEVER transmitted anywhere, not even once during registration.',
      'What the server stores instead is a PUBLIC key — useless to an attacker for impersonation, since a public key alone cannot produce a valid signature for the server\'s challenge. A full database breach of passkey public keys is a fundamentally different, far less severe event than a breach of password hashes, which at least invites offline cracking attempts.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Registration — navigator.credentials.create()',
    language: 'typescript',
    code: `// ── Server: generate a registration challenge ────────────────────────────────
app.post('/passkey/register/options', requireLoggedInUser, async (req, res) => {
  const challenge = crypto.randomBytes(32);   // fresh, random, single-use
  await db.pendingChallenges.create({ userId: req.user.id, challenge, expires: Date.now() + 5 * 60_000 });

  res.json({
    challenge: base64url(challenge),
    rp: { name: 'DevHub', id: 'devhub.example.com' },     // the Relying Party -- your own domain
    user: {
      id: base64url(Buffer.from(req.user.id)),
      name: req.user.email,
      displayName: req.user.displayName,
    },
    // -7 = ES256, -257 = RS256 -- the algorithms this server accepts
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
  });
});

// ── Browser: create the passkey (this is the actual WebAuthn API call) ───────
async function registerPasskey(options: PublicKeyCredentialCreationOptionsJSON) {
  const credential = await navigator.credentials.create({
    publicKey: {
      ...options,
      challenge: base64urlDecode(options.challenge),
      user: { ...options.user, id: base64urlDecode(options.user.id) },
    },
  }) as PublicKeyCredential;

  // The PRIVATE key never leaves the device's secure hardware -- only the
  // PUBLIC key and an attestation are sent back to the server.
  await fetch('/passkey/register/verify', {
    method: 'POST',
    body: JSON.stringify({ credentialId: credential.id, publicKey: /* extracted from credential.response */ '...' }),
  });
}`,
  },
  {
    label: 'Login — navigator.credentials.get()',
    language: 'typescript',
    code: `// ── Server: generate a login challenge ────────────────────────────────────────
app.post('/passkey/login/options', async (req, res) => {
  const challenge = crypto.randomBytes(32);
  await db.pendingChallenges.create({ challenge, expires: Date.now() + 5 * 60_000 });

  res.json({
    challenge: base64url(challenge),
    rpId: 'devhub.example.com',
    userVerification: 'preferred',   // ask for biometric/PIN if the device supports it
  });
});

// ── Browser: sign the challenge with the ON-DEVICE private key ───────────────
async function loginWithPasskey(options: PublicKeyCredentialRequestOptionsJSON) {
  const assertion = await navigator.credentials.get({
    publicKey: { ...options, challenge: base64urlDecode(options.challenge) },
  }) as PublicKeyCredential;

  // assertion contains a SIGNATURE produced by the private key -- the
  // private key itself is never included anywhere in this response.
  const res = await fetch('/passkey/login/verify', {
    method: 'POST',
    body: JSON.stringify({
      credentialId: assertion.id,
      signature: /* extracted from assertion.response */ '...',
    }),
  });
  const { token } = await res.json();
}

// ── Server: verify the signature against the STORED PUBLIC key ───────────────
app.post('/passkey/login/verify', async (req, res) => {
  const { credentialId, signature } = req.body;
  const stored = await db.passkeys.findByCredentialId(credentialId);

  // Cryptographic verification: does "signature" prove possession of the
  // private key matching "stored.publicKey", over the challenge this
  // server itself issued? No plaintext secret is compared anywhere.
  const valid = verifySignature(stored.publicKey, signature, /* the original challenge */);
  if (!valid) return res.status(401).json({ error: 'Invalid credential' });

  res.json({ token: issueJwt(stored.userId) });
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A phishing site clones the login page pixel-for-pixel at <code>devhub-secure-login.com</code> (a different domain than the real <code>devhub.example.com</code>) and tricks a user into visiting it. If the user tries to log in with their passkey on the FAKE site, what happens — and why does this differ fundamentally from what would happen if they typed a real password into that same fake site?',
  hint: 'Look at the <code>rpId</code> field passed into <code>navigator.credentials.get()</code> — the browser itself enforces something about where that value is allowed to come from.',
  solution: `// The passkey login SILENTLY FAILS -- the browser itself refuses to
// even offer a matching credential, before any server is involved at
// all.

// The browser's own WebAuthn implementation binds every passkey to
// the ORIGIN it was created on (devhub.example.com), and enforces
// that navigator.credentials.get() can only be called with an rpId
// matching the CURRENT page's own origin. A phishing page running on
// devhub-secure-login.com has no way to request a credential scoped
// to devhub.example.com -- the browser simply won't hand one over,
// regardless of how convincing the page LOOKS to the human viewing it.

// This is the fundamental difference from a real password: a human
// can be tricked into typing a correct password into a
// convincing-looking fake page, because the human is the one deciding
// whether the page "looks right." A passkey's origin check is
// enforced by the BROWSER, based on the actual URL, not by human
// judgment -- which is exactly why the quiz calls passkeys "resilient
// to... phishing (private key never transmitted, bound to origin)."
// The phishing attack that works perfectly against a password fails
// completely against a passkey, for a structural reason, not because
// the user was more careful this time.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A passkey is just a very long, randomly-generated password that the browser remembers for you.',
    reality: 'A passkey is a cryptographic key PAIR, not a secret string at all — the server never stores anything resembling a password, hashed or otherwise; it stores a PUBLIC key, which is not secret and reveals nothing useful to an attacker who steals it. The verification mechanism (a challenge-response signature) is fundamentally different from a stored-secret comparison, which is why passkeys sidestep entire categories of password-specific attacks (credential stuffing, password reuse, database-breach cracking) rather than just making the "password" longer.',
  },
  {
    thought: 'Since the passkey flow above still involves a server-generated <code>challenge</code> and a server-side <code>/verify</code> endpoint, it\'s not meaningfully different from a password flow with extra steps.',
    reality: 'The challenge exists specifically to prevent REPLAY attacks (an attacker capturing and resending a previous valid login) — it plays a completely different role from a password. A captured password can be reused indefinitely until it\'s changed; a captured signature over an already-used, expired challenge is worthless, because the server will only ever accept a signature over the ONE specific challenge it just issued and is still waiting on.',
  },
];

@Component({
  selector: 'app-sec-ps-passkey',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-simplified-passkey-registration-and-login-flow.html',
  styleUrl: './a-simplified-passkey-registration-and-login-flow.scss',
})
export class ASimplifiedPasskeyRegistrationAndLoginFlowSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
