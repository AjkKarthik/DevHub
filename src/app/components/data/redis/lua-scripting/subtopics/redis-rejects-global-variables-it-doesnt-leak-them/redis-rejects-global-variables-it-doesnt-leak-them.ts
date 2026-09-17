import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-redis-rejects-global-variables-it-doesnt-leak-them',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './redis-rejects-global-variables-it-doesnt-leak-them.html',
  styleUrl: './redis-rejects-global-variables-it-doesnt-leak-them.scss',
})
export class RedisRejectsGlobalVariablesItDoesntLeakThemSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The mistake block\'s original framing, corrected',
      points: [
        'The main page\'s own mistake block originally described a global-variable assignment as something that "persists between EVAL calls on same server" — a silent, dangerous shared-mutable-state bug. Verified directly against Redis\'s own official Lua API docs: this is backwards.',
        'Redis\'s Lua sandbox actively BLOCKS global variable declaration. Attempting to assign to an undeclared name (i.e. one never prefixed with <code>local</code>) makes the ENTIRE script fail immediately with a named error: "Script attempted to create global variable \'name\'" — confirmed via two independent sources describing the identical error text.',
        'The real consequence of the "wrong" example is not a subtle, hard-to-find bug — it is a hard, loud, immediate crash on the very first execution. Every single call to a script written this way returns an error, every time, with no ambiguity about what went wrong.',
      ],
    },
    {
      heading: 'Why the sandbox exists — and how strict it actually is',
      points: [
        'Per Redis\'s own docs: "the blocking of global variables is in place to ensure that scripts and functions don\'t attempt to maintain any runtime context other than the data stored in Redis" — if you genuinely need state that survives across script calls, store it in a Redis key, not a Lua variable.',
        'The docs are candid that the protection can technically be bypassed with debugging tricks or metatable manipulation — but explicitly note it is "difficult to circumvent the protection by accident," which is exactly the scenario the main page\'s original mistake block was trying to describe (an ordinary, accidental mistake, not a deliberate sandbox-escape attempt).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The sandbox rejection, modeled',
      language: 'typescript',
      code: `// Models the real Lua sandbox behavior: assigning to an undeclared name is
// REJECTED immediately with a named error -- it is never silently allowed.
class LuaSandbox {
  private declaredLocals = new Set<string>();

  declareLocal(name: string) { this.declaredLocals.add(name); }

  assign(name: string): string {
    if (!this.declaredLocals.has(name)) {
      throw new Error(\`Script attempted to create global variable '\${name}'\`);
    }
    return \`\${name} assigned successfully (local)\`;
  }
}

// The main page's original "wrong" example: count = count + 1, with count
// never declared local first.
const sandboxA = new LuaSandbox();
try {
  console.log(sandboxA.assign('count'));
} catch (err) {
  console.log('EVAL result:', (err as Error).message);
}

// The "right" example: local count = redis.call('INCR', KEYS[1])
const sandboxB = new LuaSandbox();
sandboxB.declareLocal('count');
console.log(sandboxB.assign('count'));
// EVAL result: Script attempted to create global variable 'count'
// count assigned successfully (local)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A script has TWO statements: the first one correctly declares <code>local x = 1</code>, and the second one (further down, in a different branch of an if/else) accidentally forgets <code>local</code> and writes <code>y = x + 1</code>. Does the script fail immediately when it is LOADED (SCRIPT LOAD), or only when that specific line actually EXECUTES?',
    hint: 'Redis does not run a full static analysis pass over the whole script before executing it — think about what a Lua interpreter actually does with a script\'s source, line by line, as execution reaches each statement.',
    solution: `Only when that specific line actually executes. SCRIPT LOAD merely compiles and caches the script -- it does not execute it, so a global-variable mistake sitting in a branch that never runs during loading goes completely undetected at load time.

This means a global-variable mistake hiding inside a rarely-taken if/else branch (an edge case, an error-handling path) can sit in production for a long time before it is ever triggered -- the FIRST time execution actually reaches that specific line is the first time the "Script attempted to create global variable" error appears at all. This is a genuine reason to exercise every code path of a script (including its error branches) during testing, not just the common-case path -- the sandbox's protection is real and reliable, but it can only catch what actually gets a chance to run.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A script that accidentally uses a global variable will run fine most of the time, occasionally corrupting shared state between unrelated calls."',
      reality: 'Verified directly against Redis\'s own docs: it does not run "fine most of the time" at all — it fails EVERY single time that line executes, with a clear, named error. There is no silent corruption scenario to worry about; the failure is loud and immediate.',
    },
    {
      thought: '"Using local for every variable in a Lua script is just a style convention, like using const in JavaScript."',
      reality: 'It is a hard requirement enforced by the server, not a style preference. Omitting local on an assignment to an undeclared name makes Redis reject the script\'s execution outright — this is fundamentally different from a linter warning you could safely ignore.',
    },
  ];

  topicLabel = 'Lua Scripting';
  topicRoute = '/redis/lua-scripting';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Since Redis 7.0, Scripts No Longer Need to Be Deterministic',
    route: '/redis/lua-scripting/scripts-no-longer-need-to-be-deterministic',
  };
}
