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
  templateUrl: './e2e-encryption-hint-skipped-the-double-ratchet.html',
  styleUrl: './e2e-encryption-hint-skipped-the-double-ratchet.scss'
})
export class E2eEncryptionHintSkippedTheDoubleRatchetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Encrypts with recipient\'s public key" describes RSA, not the Signal Protocol',
      points: [
        'The main page\'s Challenge solution originally described E2E encryption as: "A fetches B\'s public key → encrypts message locally → sends ciphertext" — every message encrypted directly with the recipient\'s (static) public key. Verified against Signal\'s own published specification: this is NOT how the Signal Protocol (used by WhatsApp, the app the Challenge is explicitly modeled on) actually works. The page has been corrected.',
        'Repeatedly encrypting with the SAME static public key for every message has a real security weakness the original wording glossed over: if that key (or its matching private key) is ever compromised, EVERY past message encrypted with it becomes readable — there is no protection for messages sent before the compromise.',
      ]
    },
    {
      heading: 'What the Signal Protocol actually does: X3DH once, then the Double Ratchet forever',
      points: [
        'Initial key agreement (X3DH — Extended Triple Diffie-Hellman) happens ONCE, when A first messages B: A fetches B\'s identity key, a signed pre-key, and a one-time pre-key from a key server, then combines several Diffie-Hellman computations to derive a shared initial secret. This is already more involved than "fetch a public key and encrypt with it."',
        'From that point on, EVERY message uses the Double Ratchet algorithm to derive a brand-new symmetric key from the previous one — the two parties\' key material keeps "ratcheting" forward with each message sent, so no two messages are ever encrypted with the same key.',
        'This design gives forward secrecy (a compromised key from message #50 cannot decrypt messages #1-49, since earlier keys cannot be recomputed from later ones) and post-compromise security (the ratchet continuing to advance means the parties recover security even after a temporary compromise) — properties that repeatedly reusing one static public key cannot provide.',
      ]
    },
    {
      heading: 'What E2E encryption does and doesn\'t protect, even done correctly',
      points: [
        'Even with the Double Ratchet correctly implemented, the server still needs to see and act on plaintext METADATA to route messages at all — sender ID, recipient ID, conversation ID, timestamp, and (per the rest of this page\'s own design) the sequence number. E2E encryption protects the message CONTENT, not the fact that A is messaging B, or when, or how often.',
        'This is a genuinely useful thing to call out explicitly in a system design answer: claiming "E2E encrypted" without acknowledging what metadata the server still necessarily handles can come across as either imprecise or as missing a real privacy tradeoff worth discussing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Repeated public-key encryption vs. the Double Ratchet',
      language: 'typescript',
      code: `// The ORIGINAL (inaccurate) description: every message encrypted
// with the same static public key.
function encryptWrong(message: string, recipientPublicKey: PublicKey): Ciphertext {
  return publicKeyEncrypt(message, recipientPublicKey);
  // Every message uses the SAME key -- if this key (or its private
  // counterpart) is ever compromised, EVERY past message is readable.
}

// What the Signal Protocol actually does (simplified):
interface RatchetState {
  rootKey: Uint8Array;     // updated on each DH ratchet step
  chainKey: Uint8Array;    // advances with every message sent
}

function sendMessage(state: RatchetState, message: string): { ciphertext: Ciphertext; newState: RatchetState } {
  // Derive a NEW message key from the current chain key -- never reused.
  const messageKey = kdf(state.chainKey, 'message-key');
  const ciphertext = symmetricEncrypt(message, messageKey);

  // Advance the chain key so the NEXT message uses a different key.
  const newChainKey = kdf(state.chainKey, 'chain-advance');

  return { ciphertext, newState: { ...state, chainKey: newChainKey } };
  // Forward secrecy: messageKey cannot be recomputed from newChainKey,
  // so a future compromise of newChainKey can't decrypt THIS message.
}

// Initial key agreement (X3DH) happens ONCE, establishing state.rootKey
// and the first chainKey -- not repeated per message. Only after that
// one-time setup does the per-message ratcheting above take over.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system design write-up describes end-to-end encryption for a WhatsApp-like chat app as: "A fetches B\'s public key → encrypts message locally → sends ciphertext" for every message sent. What is inaccurate about this description of the Signal Protocol, and what actually happens instead?',
    hint: 'If A used the exact same key to encrypt every message to B, and that key were ever leaked, how many of A\'s past messages to B would become readable?',
    solution: 'The description conflates the ONE-TIME initial key agreement with what happens on every subsequent message. In reality, A and B perform X3DH (Extended Triple Diffie-Hellman) once to establish a shared initial secret — not a simple "fetch a public key and encrypt with it" step. From then on, every message is encrypted with the Double Ratchet algorithm, which derives a NEW symmetric key for each message from the previous one. If A had literally reused B\'s static public key for every message (as the original description implied), a single key compromise would make every past message readable. Because the Double Ratchet derives a fresh key per message that cannot be recomputed from later keys, a compromise only exposes messages from that point forward at most — this property is called forward secrecy, and it is the entire reason Signal-style protocols use a ratchet instead of repeated public-key encryption.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'End-to-end encryption in apps like WhatsApp works by the sender repeatedly encrypting each message with the recipient\'s public key, similar to a simple RSA-encrypted email.',
      reality: 'Per this subtopic\'s theory, the Signal Protocol (which WhatsApp uses) performs a one-time key agreement (X3DH) and then derives a brand-new symmetric key for every single message via the Double Ratchet — no two messages are ever encrypted with the same key, unlike repeated public-key encryption.'
    },
    {
      thought: 'As long as messages are described as "end-to-end encrypted," the exact mechanism (public-key encryption vs. a ratcheting scheme) is a low-level implementation detail that doesn\'t affect the security properties in a meaningful way.',
      reality: 'Per this subtopic\'s theory, the mechanism directly determines forward secrecy — repeatedly encrypting with one static key means a single key compromise exposes every past message, while a ratcheting scheme like Signal\'s Double Ratchet limits exposure even after a compromise, a materially different and stronger security property.'
    },
    {
      thought: 'A correctly-implemented end-to-end encryption scheme hides everything about a conversation from the server, including who is messaging whom and when.',
      reality: 'Per this subtopic\'s theory, E2E encryption protects message CONTENT only — the server still necessarily sees plaintext metadata (sender, recipient, conversation ID, timestamp, sequence number) in order to route messages at all, a real and worth-stating limitation even when the encryption itself is implemented correctly.'
    }
  ];
}
