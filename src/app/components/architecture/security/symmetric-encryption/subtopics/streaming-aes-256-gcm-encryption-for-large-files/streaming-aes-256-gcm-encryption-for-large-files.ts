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
    heading: 'Why the Main Page\'s Own encrypt() Function Doesn\'t Scale to Large Files',
    points: [
      'The main page\'s own <code>encrypt()</code> function calls <code>Buffer.concat([cipher.update(plaintext, \'utf8\'), cipher.final()])</code> — this requires the ENTIRE plaintext to already be in memory as one string/Buffer before encryption even starts, and produces one complete output Buffer at the end.',
      'The QnA\'s own numbered list describes the fix (generate a DEK, create a cipher, "pipe the file through" it) but never shows the actual Node.js stream code — a genuinely different shape from the main page\'s own buffer-based function, not just the same function called on bigger input.',
      'A <code>Cipheriv</code> object IS already a Node.js <code>Transform</code> stream — the main page\'s own <code>cipher.update()</code>/<code>cipher.final()</code> calls are the manual, buffer-based way of driving it; <code>.pipe()</code> drives the exact same object in streaming mode instead.',
    ],
  },
  {
    heading: 'The Auth Tag Timing Gotcha',
    points: [
      'GCM\'s authentication tag is only available AFTER the entire ciphertext has been produced — <code>cipher.getAuthTag()</code> must be called after the stream has finished emitting data, never before or during.',
      'For a piped stream, that means waiting for the write stream\'s own <code>\'finish\'</code> event (everything has been written to disk) before calling <code>getAuthTag()</code> — calling it any earlier throws, since GCM has not finished computing the tag until the last byte of ciphertext has been produced.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Streaming Encrypt',
    language: 'typescript',
    code: `import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

async function encryptFileStreaming(inputPath: string, outputPath: string, key: Buffer) {
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const input  = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  // Write the IV as a fixed-size header FIRST -- the decrypt side
  // needs to read exactly 12 bytes before it can construct its own
  // decipher stream, the streaming equivalent of the main page's own
  // "IV (12) + ciphertext + authTag (16)" layout.
  output.write(iv);

  // Cipheriv is a real Transform stream -- pipeline() drives it the
  // same way it would drive any other stream, no special-casing.
  await pipeline(input, cipher, output);

  // Only safe to call NOW -- after pipeline() has resolved, meaning
  // every byte has been written and the stream has fully finished.
  const authTag = cipher.getAuthTag();

  // Append the 16-byte tag as a fixed-size footer.
  await fs.promises.appendFile(outputPath, authTag);
}

// Resulting file layout on disk: IV (12) | ciphertext (streamed) | authTag (16)
// -- the exact same three-part shape as the main page's own in-memory
// Buffer layout, just written incrementally instead of concatenated.`,
  },
  {
    label: 'Streaming Decrypt',
    language: 'typescript',
    code: `import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

async function decryptFileStreaming(inputPath: string, outputPath: string, key: Buffer) {
  const stat = await fs.promises.stat(inputPath);

  // Read the fixed-size IV header and authTag footer directly, by
  // absolute byte position -- this is why fixed-size headers/footers
  // matter for streaming: the tag has to be known BEFORE decryption
  // starts (setAuthTag must be called before any decipher.update()),
  // but it's physically stored at the END of the file.
  const iv  = await readBytes(inputPath, 0, 12);
  const tag = await readBytes(inputPath, stat.size - 16, 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag); // must be set BEFORE piping any ciphertext through

  const ciphertextLength = stat.size - 12 - 16;
  const input  = fs.createReadStream(inputPath, { start: 12, end: 12 + ciphertextLength - 1 });
  const output = fs.createWriteStream(outputPath);

  // Throws (rejecting the pipeline) if the auth tag doesn't match --
  // GCM's tamper-detection works identically in streaming mode.
  await pipeline(input, decipher, output);
}

function readBytes(path: string, start: number, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path, { start, end: start + length - 1 });
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(c as Buffer));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A teammate "simplifies" <code>decryptFileStreaming</code> by calling <code>decipher.setAuthTag(tag)</code> AFTER the <code>pipeline(input, decipher, output)</code> call resolves, instead of before it starts. What happens?',
  hint: 'GCM decryption verifies the auth tag as ciphertext is processed — can it verify against a value that hasn\'t been provided yet?',
  solution: `// The pipeline call throws (or the stream errors) -- GCM decryption
// needs the auth tag BEFORE it can process any ciphertext at all,
// because verification happens incrementally as data flows through,
// not as one final check at the very end.

// This is the mirror image of the ENCRYPT side's own timing rule
// (getAuthTag() only works AFTER the stream finishes) -- decryption
// has the opposite requirement (setAuthTag() must happen BEFORE the
// stream starts), which is exactly why the decrypt function reads the
// tag from its known, fixed file position FIRST, then constructs and
// configures the decipher completely, and only THEN begins piping any
// ciphertext through it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Streaming encryption needs a fundamentally different cipher API than the main page\'s own buffer-based <code>encrypt()</code>/<code>decrypt()</code> functions.',
    reality: '<code>crypto.createCipheriv()</code>/<code>createDecipheriv()</code> return the exact same kind of object either way — a Node.js Transform stream. The main page\'s own functions just drive it manually via <code>.update()</code>/<code>.final()</code>; <code>.pipe()</code> or <code>pipeline()</code> drives the identical object in streaming mode.',
  },
  {
    thought: '<code>cipher.getAuthTag()</code> can be called any time after <code>createCipheriv()</code>, since the tag is tied to the cipher instance.',
    reality: 'It only becomes available once EVERY byte of ciphertext has been produced — calling it before the stream (or the equivalent <code>cipher.final()</code> call) has fully completed throws, since GCM has not finished computing the tag yet.',
  },
  {
    thought: 'The IV and auth tag can be stored anywhere convenient in the encrypted file, as long as both sides agree on SOME format.',
    reality: 'They need to be at FIXED, KNOWN byte positions specifically because streaming decrypt has to read the auth tag (stored at the end) before it can even construct a working decipher for the ciphertext (stored in the middle) — an ad-hoc or variable-length format would make it impossible to locate the tag without already having decrypted the file.',
  },
];

@Component({
  selector: 'app-sec-symkey-streaming',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './streaming-aes-256-gcm-encryption-for-large-files.html',
  styleUrl: './streaming-aes-256-gcm-encryption-for-large-files.scss',
})
export class StreamingAes256GcmEncryptionForLargeFilesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
