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
  templateUrl: './exec-default-maxbuffer-kills-the-process-not-truncates.html',
  styleUrl: './exec-default-maxbuffer-kills-the-process-not-truncates.scss'
})
export class ExecDefaultMaxbufferKillsTheProcessNotTruncatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page notes exec() "buffers the entire output (OK for small output)" — the failure mode when output is NOT small is more disruptive than it sounds',
      points: [
        'child_process.exec() has a maxBuffer option controlling the largest combined amount of stdout/stderr data it will buffer, defaulting to 1024 * 1024 bytes (1MB) as of Node 8.0.0 — a value that was raised from an even smaller 200KB default in earlier Node versions, precisely because 200KB proved too easy to exceed with ordinary command output.',
        'This is NOT a soft limit that quietly stops collecting extra output while letting the underlying command keep running to completion — exceeding maxBuffer actively KILLS the child process (sending it the configured killSignal, SIGTERM by default) and causes exec()\'s callback (or the Promise from the promisified version) to receive an Error whose message references "maxBuffer exceeded," rather than returning whatever output was captured so far.',
      ]
    },
    {
      heading: 'Why this specific failure mode is easy to miss until it hits real data',
      points: [
        'A command tested locally against small sample data (a short file listing, a handful of log lines) can complete successfully well under the 1MB threshold — the exact same command run in production against a much larger real dataset (a full directory tree, a large log file, verbose build output) can silently cross that threshold and start failing, with no code change on the developer\'s part at all. The bug isn\'t in the command or the exec() call — it\'s a scale mismatch between test data and production data.',
        'The fix depends on the actual need: raise maxBuffer explicitly if the output genuinely needs to be captured in full and is expected to occasionally exceed 1MB (exec(cmd, { maxBuffer: 10 * 1024 * 1024 })); or, for commands that can produce arbitrarily large or unbounded output, switch to spawn() instead of exec() entirely — spawn() streams stdout/stderr as they arrive rather than buffering the whole thing in memory, sidestepping the size-limit problem altogether by never needing a fixed buffer ceiling in the first place.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Works in dev, fails in production — same code, bigger output',
      language: 'typescript',
      code: `import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function listAllFiles(dir) {
  // In local dev, testing against a small directory (a few dozen
  // files), the output is well under 1MB — this works fine.
  //
  // In production, run against a directory with hundreds of
  // thousands of files, the combined stdout output crosses the
  // DEFAULT 1MB maxBuffer threshold. The child process is killed
  // (SIGTERM) and this throws: "Error: stdout maxBuffer length
  // exceeded" — the SAME code, the SAME command, failing purely
  // because of how much data the real directory happens to contain.
  const { stdout } = await execAsync(\`find \${dir} -type f\`);
  return stdout.split('\\n').filter(Boolean);
}`,
    },
    {
      label: 'Two fixes: raise maxBuffer, or switch to spawn() for unbounded output',
      language: 'typescript',
      code: `import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Fix 1: known-large-but-bounded output — raise maxBuffer explicitly
async function listAllFilesFixed(dir) {
  const { stdout } = await execAsync(\`find \${dir} -type f\`, {
    maxBuffer: 50 * 1024 * 1024, // 50MB — sized to the real workload
  });
  return stdout.split('\\n').filter(Boolean);
}

// Fix 2: genuinely unbounded/unknown-size output — use spawn() and
// stream, never buffering the whole output in memory at all
function listAllFilesStreamed(dir, onFile) {
  const proc = spawn('find', [dir, '-type', 'f']);
  let buffer = '';
  proc.stdout.on('data', chunk => {
    buffer += chunk;
    const lines = buffer.split('\\n');
    buffer = lines.pop(); // keep the last, possibly-incomplete line
    lines.forEach(onFile);
  });
  proc.on('close', () => { if (buffer) onFile(buffer); });
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script uses child_process.exec() to run a build command and capture its full log output for archiving. It works reliably in CI for months, then suddenly starts failing with "Error: stdout maxBuffer length exceeded" after a new, more verbose logging library is added to the build tooling — with no changes to the deployment script itself. Explain precisely why a change to an unrelated part of the codebase (build tooling verbosity) broke a script that wasn\'t touched, and describe the two possible fixes.',
    hint: 'Does exec()\'s maxBuffer limit depend on anything about the deployment SCRIPT\'s own code, or purely on how much stdout/stderr data the command it runs happens to produce?',
    solution: 'The deployment script\'s own code never changed, but the volume of output produced by the command IT RUNS did — exec()\'s maxBuffer limit (1MB by default) is a ceiling on the combined stdout/stderr data buffered from whatever command is executed, completely independent of anything in the calling script itself. Once the build tooling started producing more verbose log output, the SAME exec() call started exceeding the SAME 1MB default threshold that it had comfortably stayed under before — crossing it kills the child process and throws the maxBuffer error, rather than returning a truncated but usable log. Two fixes apply here: (1) if the full log output genuinely needs to be captured and archived, and its size is bounded (even if larger than 1MB), explicitly raise maxBuffer to a size that comfortably covers the new, more verbose output; (2) if the log output could grow unpredictably large over time (as build tooling and its dependencies continue to evolve), switch from exec() to spawn() and stream the output incrementally instead — since spawn() never buffers the entire output in memory at once, there is no fixed size ceiling to exceed in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When child_process.exec() output exceeds maxBuffer, Node simply stops collecting additional output and returns whatever was captured up to that point, letting the underlying command finish normally.',
      reality: 'This subtopic\'s theory clarifies exceeding maxBuffer actively kills the child process (via the configured killSignal, SIGTERM by default) and causes an Error rather than a partial, truncated success — the command does NOT get to finish, and no partial output is returned as a usable result.'
    },
    {
      thought: 'A maxBuffer error appearing after months of a script working reliably must indicate a bug was introduced somewhere in the script itself, or a recent Node.js version change.',
      reality: 'This subtopic\'s exercise shows this can happen with zero changes to the script at all — a maxBuffer error is purely a function of how much output the EXECUTED COMMAND happens to produce, which can grow over time due to changes completely unrelated to the exec()-calling code.'
    },
    {
      thought: 'The maxBuffer default (1MB) is generous enough that this limit essentially never matters in practice for typical command-line tool output.',
      reality: 'This subtopic\'s theory notes the default was specifically RAISED from an even smaller 200KB in earlier Node versions because that proved too easy to exceed — 1MB is still readily reachable by verbose build logs, large directory listings, or any command whose output volume scales with real production data rather than small local test data.'
    }
  ];
}
