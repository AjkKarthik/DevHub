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
    heading: 'Named Precisely, Never Shown as Actual Vulnerable Code',
    points: [
      'The quiz explains the mechanism exactly: "the attacker duplicates the SAML assertion, modifies the copy... and moves the signature to reference the original. Parsers that search for the assertion element rather than navigating to the signed element can read the unsigned malicious copy." The main page\'s own mistakes block warns against manual XML parsing for this exact reason — but never shows what the vulnerable lookup actually looks like, or how it differs from the correct one.',
      'This subtopic builds both — verified against real, documented XSW (XML Signature Wrapping) attack mechanics via WebSearch before publishing — using a simplified document model that keeps the STRUCTURAL bug (which element gets read vs. which element got verified) demonstrable without needing a full XML-DSig crypto implementation.',
    ],
  },
  {
    heading: 'The Core Bug: Two Independent Lookups That Can Disagree',
    points: [
      'A SAML response\'s <code>&lt;ds:Signature&gt;</code> element contains a <code>Reference</code> with a URI pointing to the SPECIFIC assertion element (by its <code>ID</code> attribute) that the signature actually covers. A correct verifier follows THAT exact reference to find the element whose contents it should trust.',
      'The vulnerability exists when the code that EXTRACTS claims (email, roles, name) runs a completely SEPARATE query — like "give me the first <code>&lt;Assertion&gt;</code> element in the document" — instead of reusing the specific element the signature verification already located. An attacker who inserts an extra, unsigned assertion earlier in the document can make that separate query return the WRONG element, even though the actual signature check, run against the right element, genuinely passes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable — Two Independent Lookups',
    language: 'typescript',
    code: `interface Assertion { id: string; email: string; roles: string[]; }
interface SamlDocument {
  signatureReferenceId: string;   // the ID the <ds:Reference URI="#..."> actually points to
  assertions: Assertion[];        // every <Assertion> element in document order
}

function verifySignature(doc: SamlDocument): boolean {
  // Simplified stand-in for real XML-DSig verification: finds the
  // REFERENCED element and checks its digest/signature -- this part
  // genuinely, correctly validates.
  const referenced = doc.assertions.find(a => a.id === doc.signatureReferenceId);
  return referenced !== undefined; // (real code also verifies the crypto digest/signature bytes)
}

// VULNERABLE: claims extraction runs a SEPARATE query -- "the first
// assertion in the document" -- instead of reusing the element the
// signature was actually verified against.
function extractClaimsVulnerable(doc: SamlDocument): Assertion {
  return doc.assertions[0];   // <-- does not consult signatureReferenceId at all
}

function loginVulnerable(doc: SamlDocument) {
  if (!verifySignature(doc)) throw new Error('Invalid signature');
  const claims = extractClaimsVulnerable(doc);   // may be a COMPLETELY DIFFERENT element
  return claims;
}`,
  },
  {
    label: 'The Forged Document — Signature Still Passes',
    language: 'typescript',
    code: `// The attacker's crafted response: the ORIGINAL, legitimately-signed
// assertion is left completely untouched (at index 1) -- the signature
// reference still points to it, so verifySignature() genuinely passes.
// A malicious, UNSIGNED assertion is inserted at index 0.
const forgedDoc: SamlDocument = {
  signatureReferenceId: 'original-assertion-id',
  assertions: [
    { id: 'evil-assertion-id', email: 'attacker@evil.com', roles: ['admin'] },   // injected, unsigned
    { id: 'original-assertion-id', email: 'real-user@example.com', roles: ['user'] },  // genuinely signed
  ],
};

console.log('Signature valid?', verifySignature(forgedDoc));              // true -- correctly validates the REAL assertion
console.log('Claims extracted:', extractClaimsVulnerable(forgedDoc));     // { id: 'evil-assertion-id', email: 'attacker@evil.com', roles: ['admin'] }
// The signature check passed against the LEGITIMATE assertion at index 1
// -- but extractClaimsVulnerable() reads index 0, the attacker's own
// unsigned, injected assertion. The application ends up trusting
// "attacker@evil.com" with admin role, despite a signature that
// genuinely, correctly validated something else entirely.

// ── The fix: reuse the SAME reference the signature check used ──────
function extractClaimsFixed(doc: SamlDocument): Assertion {
  const claims = doc.assertions.find(a => a.id === doc.signatureReferenceId);
  if (!claims) throw new Error('Referenced assertion not found');
  return claims;
}
console.log('Fixed extraction:', extractClaimsFixed(forgedDoc));
// -> { id: 'original-assertion-id', email: 'real-user@example.com', roles: ['user'] }
// -- correctly reads the SAME element the signature actually covered.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose the attacker instead crafts the forged document with the malicious assertion placed AFTER the real one (<code>assertions: [{id: \'original-assertion-id\', ...real}, {id: \'evil-assertion-id\', ...fake}]</code>), rather than before it. Does <code>extractClaimsVulnerable</code> (which reads <code>doc.assertions[0]</code>) still produce a successful attack in this ordering?',
  hint: 'Trace exactly what <code>doc.assertions[0]</code> evaluates to when the REAL assertion is listed first instead of second.',
  solution: `// No -- with the malicious assertion placed AFTER the real one,
// doc.assertions[0] evaluates to the REAL assertion, and
// extractClaimsVulnerable() happens to return the correct claims by
// coincidence, not because the code is actually safe.

// This is exactly why "index 0" (or "first matching element") is such
// a dangerous shortcut: whether it produces the right or wrong answer
// depends entirely on where an attacker chooses to PLACE the injected
// element in the document, which the attacker fully controls -- the
// vulnerable code has no way to know it got lucky in one specific
// ordering and would still be exploitable the moment the attacker
// tries the other ordering instead. extractClaimsFixed(), by
// contrast, produces the correct real-user assertion regardless of
// where either assertion is physically positioned in the document,
// because it looks up by the signature's own referenced ID rather
// than by document order at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'If <code>verifySignature()</code> returns <code>true</code>, it\'s safe to assume the SAML response as a whole is trustworthy.',
    reality: 'The forged-document codeTab shows exactly why this assumption is dangerous: signature verification only confirms that ONE SPECIFIC element (the one the <code>Reference</code> URI points to) hasn\'t been tampered with — it says NOTHING about any other content that might also be present in the same document. A document can contain both a genuinely valid, signed element AND an entirely separate, attacker-controlled, unsigned element, and a passing signature check tells you nothing about which one your OWN code goes on to read.',
  },
  {
    thought: 'This vulnerability only matters for hand-rolled XML parsers — a well-maintained library like samlify (the main page\'s own choice) automatically prevents it entirely, with nothing for the developer to get wrong.',
    reality: 'A correct library gets the LOW-LEVEL signature verification right (following the actual Reference URI, checking the cryptographic digest) — but the STRUCTURAL bug in this subtopic exists at the layer immediately above that: what the CALLING code does with the library\'s output. If a codebase takes a validated SAML response object and then runs its OWN separate query for "the assertion" instead of using the specific validated result the library already returned, the same class of mismatch can reappear even with a perfectly correct underlying library — using a good library is necessary but not sufficient if the surrounding application code re-introduces an independent lookup.',
  },
];

@Component({
  selector: 'app-sec-sso-xsw',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-saml-signature-wrapping-attack-demonstrated.html',
  styleUrl: './the-saml-signature-wrapping-attack-demonstrated.scss',
})
export class TheSamlSignatureWrappingAttackDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
