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
    heading: 'The Quiz Names a Target — Never Shows How to Hit It',
    points: [
      'The quiz\'s own explanation is specific: "benchmark on production hardware. Choose a value where one hash takes 100-300ms." That\'s a real, actionable target — but the main page never shows the actual benchmarking code that arrives at a concrete cost-factor number.',
      'The target itself is a genuine trade-off, not an arbitrary number: too fast, and an attacker with a stolen hash database can try billions of guesses; too slow, and every real login (and every legitimate load test) pays that same cost on your own production hardware.',
      '"Production hardware" matters specifically because bcrypt/Argon2id timing is CPU-dependent — a value benchmarked on a developer laptop can be meaningfully faster or slower than the same cost factor running on the actual server hardware handling real logins.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Benchmarking bcrypt Cost Factors',
    language: 'typescript',
    code: `import bcrypt from 'bcrypt';

async function benchmarkBcryptCostFactor(targetMs = 200): Promise<number> {
  const testPassword = 'a-representative-test-password';

  for (let cost = 10; cost <= 15; cost++) {
    const start = process.hrtime.bigint();
    await bcrypt.hash(testPassword, cost);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    console.log(\`cost=\${cost}: \${elapsedMs.toFixed(1)}ms\`);

    if (elapsedMs >= targetMs) {
      // The FIRST cost factor that meets the target -- doubling cost
      // by 1 roughly doubles time (bcrypt's cost is a power-of-two
      // iteration count), so once you cross the target, going one
      // step further would likely overshoot it substantially.
      return cost;
    }
  }

  return 15; // fell through every value tried -- cap at a sane maximum
}

const recommendedCost = await benchmarkBcryptCostFactor(200);
console.log('Recommended bcrypt cost factor:', recommendedCost);
// Run this on the ACTUAL production instance type, not a laptop --
// the whole point is calibrating to the hardware that will really
// run this code.`,
  },
  {
    label: 'The Same Approach for Argon2id',
    language: 'typescript',
    code: `import argon2 from 'argon2';

// Argon2id has THREE tunable parameters (memory, time, parallelism),
// unlike bcrypt's single cost factor -- OWASP's own baseline
// (memoryCost: 19456, timeCost: 2, parallelism: 1) is a reasonable
// starting point to benchmark FROM, not a value to accept blindly.
async function benchmarkArgon2Params(targetMs = 200): Promise<{ memoryCost: number; timeCost: number }> {
  const testPassword = 'a-representative-test-password';
  let memoryCost = 19456; // KiB, OWASP's documented minimum
  let timeCost = 2;

  while (true) {
    const start = process.hrtime.bigint();
    await argon2.hash(testPassword, {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism: 1,
    });
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    console.log(\`memoryCost=\${memoryCost}, timeCost=\${timeCost}: \${elapsedMs.toFixed(1)}ms\`);

    if (elapsedMs >= targetMs) {
      return { memoryCost, timeCost };
    }

    // Prefer raising memoryCost first -- it's specifically what makes
    // GPU/ASIC cracking expensive (the main page's own "memory-hard"
    // property); timeCost alone doesn't carry the same resistance.
    memoryCost *= 2;
  }
}

const params = await benchmarkArgon2Params(200);
console.log('Recommended Argon2id params:', params);`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A team benchmarks bcrypt on a powerful CI runner and gets <code>cost=10</code> for a 200ms target — then deploys that exact cost factor to production servers with noticeably weaker CPUs. What actually happens to real login latency in production?',
  hint: 'The benchmark measured time ON A SPECIFIC MACHINE — does bcrypt\'s own cost-factor-to-time relationship stay fixed across different hardware?',
  solution: `// Real production login latency will be HIGHER than 200ms -- likely
// well above it, since weaker CPUs take longer to perform the same
// number of bcrypt iterations.

// cost=10 doesn't encode "200ms" as an absolute property -- it
// encodes a FIXED ITERATION COUNT (2^10). How long that iteration
// count actually takes is entirely a function of the CPU running it.
// The benchmark's own result is only valid for the EXACT hardware it
// ran on.

// This is exactly why the quiz's own explanation specifies
// "benchmark on production hardware" as a requirement, not a
// suggestion -- a cost factor calibrated on a faster machine silently
// becomes a slower, more expensive-per-login value the moment it
// runs somewhere weaker, degrading real user-facing latency without
// any code change at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A bcrypt cost factor or Argon2id parameter set, once benchmarked correctly, stays correct forever.',
    reality: 'Hardware gets faster over time — the SAME cost factor that took 200ms when originally chosen takes LESS time on newer hardware years later, silently weakening the intended brute-force resistance. The main page\'s own mustKnow bullet on key rotation applies the same principle here: periodically re-benchmark and upgrade the cost factor, rehashing on next login (the same lazy-migration pattern from the hash-migration subtopic).',
  },
  {
    thought: 'Argon2id\'s memoryCost, timeCost, and parallelism are interchangeable ways to reach the same target hash time — pick whichever is convenient to raise.',
    reality: 'They provide DIFFERENT resistance properties. Raising memoryCost specifically is what makes an attacker\'s parallel GPU/ASIC cracking expensive (each parallel attempt needs its own memory allocation); raising timeCost alone doesn\'t carry that same defense, which is why the codeTab above prefers raising memory first.',
  },
  {
    thought: 'The 100-300ms target is a hard rule that applies identically to every application.',
    reality: 'It\'s a reasonable DEFAULT balancing security against user-facing login latency — a system with extremely high login volume, or one with unusually strict latency requirements, might deliberately choose a lower value (trading some brute-force resistance for throughput/latency), while a system protecting especially sensitive data might choose higher. The number is a starting point for the trade-off, not a universal constant.',
  },
];

@Component({
  selector: 'app-sec-hash-benchmark',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './benchmarking-bcrypt-argon2id-to-choose-a-work-factor.html',
  styleUrl: './benchmarking-bcrypt-argon2id-to-choose-a-work-factor.scss',
})
export class BenchmarkingBcryptArgon2idToChooseAWorkFactorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
