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
    heading: 'A Precisely-Described Attack, No Vulnerable Endpoint on the Page',
    points: [
      'The quiz explains path traversal in real detail: "user input controls part of a file path... <code>../../etc/passwd</code> navigates up the directory tree... URL-encoded variants: <code>%2e%2e%2f</code>... double-encoding: <code>%252e%252e%252f</code>." It also names the exact fix — "resolve the path, check that it starts with the expected base directory string, reject if the normalized path escapes it." Nothing on the main page ever builds the vulnerable endpoint or the fix in code.',
      'This subtopic builds exactly that: a Node.js file-download endpoint that concatenates user input directly into a file path (vulnerable), and the fixed version applying the quiz\'s own resolve-and-check technique.',
    ],
  },
  {
    heading: 'Why "Reject Any Filename Containing .." Is Not Enough',
    points: [
      'The obvious-looking fix — check <code>if (filename.includes(\'..\')) reject()</code> — is a DENYLIST, the exact pattern the main page\'s own mistakes block warns against ("attacker finds encoding bypass"). The quiz names two of the classic encoding bypasses directly: a URL-encoded <code>%2e%2e%2f</code> arrives at the Express route handler ALREADY DECODED (Express decodes URL-encoded path segments before your handler ever sees the string), so a naive <code>.includes(\'..\')</code> check that runs on the raw undecoded string can be bypassed entirely, and a DOUBLE-encoded <code>%252e%252e%252f</code> can slip past a check that only decodes once.',
      'The quiz\'s own fix sidesteps encoding entirely by not caring how the traversal was ENCODED at all — it resolves the FINAL, fully-decoded path and checks the RESULT against an allowlisted base directory. It doesn\'t matter how many times or which way the attacker encoded <code>../</code> — <code>path.resolve()</code> normalizes all of it before the check ever runs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable — Raw Concatenation',
    language: 'typescript',
    code: `import path from 'node:path';
import fs from 'node:fs/promises';

const UPLOADS_DIR = '/var/app/uploads';

// A file-download endpoint: GET /files/:filename
app.get('/files/:filename', async (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  const content = await fs.readFile(filePath);   // no check on where filePath actually points
  res.send(content);
});

// GET /files/../../../../etc/passwd
// path.join('/var/app/uploads', '../../../../etc/passwd')
// -> '/etc/passwd'  -- path.join() normalizes ".." segments, but does
// NOT stop the result from escaping UPLOADS_DIR entirely. The server
// happily reads and returns the system's password file.`,
  },
  {
    label: 'Fixed — Resolve and Check the Base Directory',
    language: 'typescript',
    code: `import path from 'node:path';
import fs from 'node:fs/promises';

const UPLOADS_DIR = '/var/app/uploads';

app.get('/files/:filename', async (req, res) => {
  // Resolve to an ABSOLUTE path -- this collapses every ".." segment,
  // however it was encoded, before any comparison happens.
  const requestedPath = path.resolve(UPLOADS_DIR, req.params.filename);

  // The quiz's own fix: check that the resolved path still starts
  // with the expected base directory. path.sep is appended to
  // UPLOADS_DIR so that a sibling directory sharing the same PREFIX
  // (e.g. "/var/app/uploads-backup") can never pass this check --
  // a common, subtle bug in a naive startsWith() check on its own.
  const base = UPLOADS_DIR + path.sep;
  if (!requestedPath.startsWith(base)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  const content = await fs.readFile(requestedPath);
  res.send(content);
});

// The SAME attack now: GET /files/../../../../etc/passwd
// path.resolve('/var/app/uploads', '../../../../etc/passwd') -> '/etc/passwd'
// '/etc/passwd'.startsWith('/var/app/uploads/') -> false -- rejected
// with a 400, regardless of how the ".." was encoded on the wire.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose <code>UPLOADS_DIR</code> is <code>/var/app/uploads</code>, and a sibling directory <code>/var/app/uploads-backup</code> exists on the same server, containing sensitive backup files. Would the fixed version above correctly reject a request trying to reach a file inside <code>uploads-backup</code>? Trace through the <code>startsWith()</code> check carefully.',
  hint: 'The fixed code appends <code>path.sep</code> ("/") to <code>UPLOADS_DIR</code> before calling <code>startsWith()</code>. Check what happens WITHOUT that trailing separator first, then confirm the fix with it.',
  solution: `// Yes -- the fixed version correctly rejects it, specifically
// BECAUSE of the trailing path.sep appended to the base directory.

// Without the trailing separator, this check would be a real bug:
// '/var/app/uploads-backup/secret.txt'.startsWith('/var/app/uploads')
// -> TRUE -- the string "/var/app/uploads-backup/secret.txt" really
// does start with the literal characters "/var/app/uploads", even
// though "uploads-backup" is a COMPLETELY DIFFERENT, sibling
// directory that was never meant to be reachable through this
// endpoint at all. A naive prefix check without the separator is
// vulnerable to this "directory name is itself a prefix of another
// directory name" trap.

// WITH the trailing separator:
// '/var/app/uploads-backup/secret.txt'.startsWith('/var/app/uploads/')
// -> FALSE -- the character right after "uploads" in the requested
// path is "-", not "/", so it no longer matches the base string
// (which now requires a "/" at that exact position) -- correctly
// rejected.

// The general lesson: a base-directory allowlist check is only as
// safe as ensuring the comparison happens on a directory BOUNDARY,
// not a raw string prefix -- a one-character omission (the trailing
// separator) is the difference between a correct fix and a fix that
// LOOKS correct but still leaks an entire sibling directory.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Checking <code>if (filename.includes(\'..\')) reject()</code> before building the file path is a sufficient fix for path traversal.',
    reality: 'This is a denylist, and — exactly like the main page\'s own denylist-vs-allowlist mistake block warns — an attacker can bypass it with encoding tricks the check never anticipated: a URL-encoded <code>%2e%2e%2f</code>, backslashes on Windows-hosted servers (<code>..\\\\</code>), or a double-encoded <code>%252e%252e%252f</code> that only becomes literal <code>..</code> after a SECOND decoding pass the check never performs. Resolving the final path and checking it against an allowlisted base directory (as the fixed codeTab does) sidesteps every encoding variant at once, because it never needs to recognize the STRING <code>..</code> in the first place — only where the resolved path actually ends up.',
  },
  {
    thought: '<code>path.join()</code> alone is a safe way to build a file path from user input, since it normalizes <code>..</code> segments.',
    reality: 'The vulnerable codeTab above uses <code>path.join()</code> and is still fully exploitable — <code>path.join()</code> normalizes <code>..</code> segments WITHIN the resulting path string, but it does nothing at all to stop the FINAL result from escaping the intended base directory. Normalizing a path and confining it to a directory are two completely different guarantees; only the second one (an explicit base-directory check on the resolved, absolute path) actually prevents traversal.',
  },
];

@Component({
  selector: 'app-sec-sc-path-traversal',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './path-traversal-vulnerable-endpoint-and-fix.html',
  styleUrl: './path-traversal-vulnerable-endpoint-and-fix.scss',
})
export class PathTraversalVulnerableEndpointAndFixSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
