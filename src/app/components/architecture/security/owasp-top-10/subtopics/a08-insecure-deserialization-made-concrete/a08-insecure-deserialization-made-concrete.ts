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
    heading: 'A Whole Quiz Question, No Working Example',
    points: [
      'One of the main page\'s own quiz questions explains A08 Software and Data Integrity Failures at length — "insecure deserialization (deserializing untrusted data that contains executable objects — leads to remote code execution)" — but no codeTab on the page ever shows what an insecure-deserialization vulnerability actually looks like in real code, or how to fix it.',
      'This subtopic builds the classic Node.js version of this vulnerability class: a library that deserializes a string into a JavaScript object by actually EXECUTING code embedded in that string, and the safe alternative that never does.',
    ],
  },
  {
    heading: 'Why "Deserializing" Isn\'t Automatically Dangerous',
    points: [
      'Standard <code>JSON.parse()</code> is NOT vulnerable to this — it only ever produces plain data (strings, numbers, booleans, arrays, and object literals), with no mechanism to construct a function, a class instance with methods, or anything EXECUTABLE. This is exactly why the fix in this subtopic\'s codeTab is simply "use <code>JSON.parse()</code>, not a library that reconstructs live functions."',
      'The vulnerability specifically arises from serialization FORMATS that preserve more than plain data — formats that can represent a live function\'s SOURCE CODE, intending to let a trusted process reconstruct a real callback. The danger is treating serialized data from an UNTRUSTED source the same way as data from a trusted one.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Insecure Deserialization — The Vulnerability',
    language: 'typescript',
    code: `// A serialization library that can represent FUNCTIONS, not just
// plain data -- it embeds a function's source code as a string, and
// "deserializing" means literally constructing and RUNNING that code.
import { unserialize } from 'node-serialize';   // illustrative -- a
                                                  // real library with
                                                  // this exact flaw

// A cookie-based "remember me" feature: the server trusts a
// serialized preferences object sent back by the client.
app.post('/preferences', (req, res) => {
  const prefs = unserialize(req.body.serializedPrefs);
  //             ^ if serializedPrefs embeds a function literal,
  //               unserialize() actually EXECUTES it while
  //               reconstructing the object -- remote code execution.
  applyPreferences(prefs);
  res.status(200).send('OK');
});

// An attacker-controlled serializedPrefs value can look like:
//   {"theme":"dark","rce":"_$$ND_FUNC$$_function(){ require('child_process').exec('rm -rf /tmp/x'); }()"}
// unserialize() sees the _$$ND_FUNC$$_ marker and runs the embedded
// function AS PART OF constructing the "deserialized" object --
// the server never chose to call that code; the payload made it.`,
  },
  {
    label: 'Safe Alternative — Plain Data Only',
    language: 'typescript',
    code: `// JSON.parse() can only ever produce plain data -- strings, numbers,
// booleans, null, arrays, and object literals. There is no JSON
// syntax that can represent an executable function at all, so there
// is nothing for a malicious payload to make JSON.parse() RUN.
app.post('/preferences', (req, res) => {
  let prefs: unknown;
  try {
    prefs = JSON.parse(req.body.serializedPrefs);
  } catch {
    return res.status(400).json({ error: 'Invalid preferences payload' });
  }

  // Still validate the SHAPE of what came back -- JSON.parse() being
  // safe from code execution doesn't mean the DATA itself is trusted;
  // an attacker can still send { "theme": "<script>...</script>" }
  // as a plain string, which is a separate concern (output encoding).
  const result = PreferencesSchema.safeParse(prefs);
  if (!result.success) return res.status(400).json({ error: 'Invalid shape' });

  applyPreferences(result.data);
  res.status(200).send('OK');
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The QnA lists "insecure CI/CD pipelines" and "insufficient update verification" as OTHER examples under the SAME A08 category, alongside insecure deserialization. What do all three actually have in common, mechanically?',
  hint: 'Think about what gets TRUSTED and EXECUTED in each case, and where that trust comes from.',
  solution: `// All three share the same underlying shape: something gets
// EXECUTED (a deserialized object's embedded function, a CI/CD
// pipeline step, an auto-installed software update) based on TRUST
// that was never actually verified at the moment of execution.

// Insecure deserialization: trusts that a serialized string came
// from a benign source, and executes whatever function it happens
// to embed.
// Insecure CI/CD: trusts that a pipeline step (a script, a
// dependency install) is what the team intended, without verifying
// it hasn't been tampered with.
// Insufficient update verification: trusts that a downloaded
// "update" is genuinely from the real vendor, without checking a
// cryptographic signature first.

// A08's own name -- "Software and DATA INTEGRITY Failures" -- names
// this precisely: the common failure is executing/trusting something
// whose INTEGRITY (that it is what it claims to be, unmodified) was
// never actually confirmed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '"Deserialization" is inherently a dangerous operation that should be avoided entirely.',
    reality: 'Deserialization itself — turning a stored/transmitted representation back into an in-memory value — is a completely ordinary, safe operation; <code>JSON.parse()</code> does it millions of times a second across the web with no vulnerability class attached to it at all. The danger is specific to formats and libraries that can represent EXECUTABLE code as part of the "data," and to using them on input from an untrusted source.',
  },
  {
    thought: 'Since the fix here is "use JSON.parse() instead," this vulnerability class is basically solved by simply avoiding one specific library.',
    reality: 'The main page\'s own QnA names several DIFFERENT manifestations of the same underlying category (CI/CD pipeline insecurity, update verification, insecure deserialization) — swapping one dangerous serialization library for <code>JSON.parse()</code> only closes the ONE specific channel this subtopic demonstrates. The general principle — never execute something whose integrity/origin hasn\'t been verified — applies far more broadly than any single library choice.',
  },
];

@Component({
  selector: 'app-sec-owasp-a08',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a08-insecure-deserialization-made-concrete.html',
  styleUrl: './a08-insecure-deserialization-made-concrete.scss',
})
export class A08InsecureDeserializationMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
