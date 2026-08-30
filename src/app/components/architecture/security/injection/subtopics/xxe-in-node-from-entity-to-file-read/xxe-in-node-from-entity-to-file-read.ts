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
    heading: 'The Quiz Names XXE Precisely — Here It Is Working',
    points: [
      'The main page\'s own quiz explains XXE in real detail — an entity declared with <code>SYSTEM</code> pointing at a local file, expanded into the parsed document — but no codeTab anywhere on the page shows a parser actually vulnerable to it, or the fix.',
      '<code>libxmljs2</code>, a common Node.js binding to libxml2, exposes exactly the parse options that decide whether this attack works: <code>noent</code> controls whether entities are substituted at all, and <code>dtdload</code>/<code>nonet</code> control whether the parser fetches an external DTD or resource over the network.',
      'Critically, <code>libxmljs2</code> disables external entity substitution by DEFAULT — the vulnerability only exists when a call site explicitly opts in with <code>{ noent: true }</code>, usually because a DTD-validation feature was needed and the option was copied from an example without realizing what it also enables.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable: noent Enabled',
    language: 'typescript',
    code: `import libxmljs from 'libxmljs2';

// A common reason a team ends up here: they needed DTD validation for
// an uploaded XML file, followed an example that enabled { noent:
// true } to make validation work correctly, and never revisited it.
function parseUploadedXml(xmlString: string): string {
  const doc = libxmljs.parseXml(xmlString, {
    noent: true,   // <-- substitutes entities, including external ones
    dtdload: true, // <-- allows loading an external DTD at all
    nonet: false,  // <-- allows network access for external entities
  });
  return doc.root()!.text();
}

// Attacker-supplied XML:
const payload = \`<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<data>&xxe;</data>\`;

console.log(parseUploadedXml(payload));
// Prints the CONTENTS of /etc/passwd -- the parser resolved the SYSTEM
// entity, read the local file, and substituted it into the document
// text, exactly like the main page's own quiz explanation describes.`,
  },
  {
    label: 'Fixed: Explicit, Safe Parse Options',
    language: 'typescript',
    code: `import libxmljs from 'libxmljs2';

function parseUploadedXml(xmlString: string): string {
  const doc = libxmljs.parseXml(xmlString, {
    noent: false,  // never substitute entities into the document
    dtdload: false, // never load an external DTD at all
    nonet: true,   // never let the parser make a network request
  });
  return doc.root()!.text();
}

// The SAME payload from before, parsed with these options:
const payload = \`<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<data>&xxe;</data>\`;

console.log(parseUploadedXml(payload));
// Prints "&xxe;" literally -- the entity reference is left as plain
// text in the document rather than resolved and substituted, because
// noent:false tells the parser not to touch entity references at all.

// If DTD validation is genuinely required, validate against a KNOWN,
// trusted, locally-stored schema -- never against a DTD the document
// itself supplies, and never with dtdload/nonet left permissive "just
// to make validation work."`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A parser is configured with <code>{ noent: false, dtdload: true, nonet: true }</code> — DTD loading allowed, but entity substitution disabled and network access blocked. Does the file-read attack from the vulnerable example above still work against this config?',
  hint: 'Which single option actually controls whether an entity reference gets RESOLVED and substituted into the document, independent of whether a DTD can be loaded at all?',
  solution: `// No -- the attack does not work.

// <!ENTITY xxe SYSTEM "file:///etc/passwd"> still gets DECLARED (the
// DTD containing it can still be loaded, since dtdload: true), but
// noent: false means the parser never SUBSTITUTES any entity
// reference into the document text -- &xxe; stays as the literal
// four characters "&xxe;" in the output, exactly like the fully-safe
// configuration.

// This isolates the one option that actually matters for THIS
// specific attack: noent controls entity SUBSTITUTION specifically.
// dtdload/nonet matter for other XXE variants (like using an external
// DTD to trigger an out-of-band network request, aka blind XXE / SSRF
// via XML), which is why the fully-safe config disables all three --
// but for the direct file-read-and-print attack shown here, noent:
// false alone is what breaks it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'XXE is inherent to XML itself — any XML parser is vulnerable by default.',
    reality: '<code>libxmljs2</code> specifically disables external entity substitution by DEFAULT — the vulnerability requires a call site to explicitly opt in with <code>noent: true</code>, usually while trying to enable an unrelated feature like DTD validation.',
  },
  {
    thought: 'Disabling network access (<code>nonet: true</code>) alone is enough to stop the file-read attack shown here.',
    reality: 'The file-read attack uses a local <code>file://</code> URI, not a network request — <code>nonet</code> blocks OUT-OF-BAND variants (an entity pointing at an attacker-controlled http:// URL), but <code>noent: false</code> is what actually stops entity substitution for a local file read.',
  },
  {
    thought: 'Switching from XML to JSON is the only real fix for XXE.',
    reality: 'It genuinely removes the attack surface entirely if XML isn\'t actually needed — the main page\'s own QnA suggests exactly this — but when XML is a real requirement (a legacy integration, a required file format), safe parser configuration is a complete fix on its own; JSON migration is a scope reduction, not the only valid defense.',
  },
];

@Component({
  selector: 'app-sec-injection-xxe',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './xxe-in-node-from-entity-to-file-read.html',
  styleUrl: './xxe-in-node-from-entity-to-file-read.scss',
})
export class XxeInNodeFromEntityToFileReadSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
