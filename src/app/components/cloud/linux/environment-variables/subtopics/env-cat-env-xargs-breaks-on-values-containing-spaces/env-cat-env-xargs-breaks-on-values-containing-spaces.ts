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
  templateUrl: './env-cat-env-xargs-breaks-on-values-containing-spaces.html',
  styleUrl: './env-cat-env-xargs-breaks-on-values-containing-spaces.scss'
})
export class EnvCatEnvXargsBreaksOnValuesContainingSpacesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine bug hiding in the main page\'s own .env-loading example',
      points: [
        'The main page\'s own .env Files code tab shows TWO alternative ways to load a .env file, presented as roughly equivalent: <code>set -a; source .env; set +a</code>, and <code>env $(cat .env | grep -v ^# | xargs) node server.js</code>. They are not equivalent — the second one silently breaks on a value type that .env files commonly contain.',
      ]
    },
    {
      heading: 'Why xargs corrupts any value containing a space',
      points: [
        '<code>$(cat .env | grep -v ^# | xargs)</code> is command substitution — bash takes the output of that pipeline and performs WORD SPLITTING on it, breaking the result into separate arguments wherever whitespace (the default IFS: space, tab, newline) appears, before handing those arguments to <code>env</code>.',
        'A .env line like <code>APP_NAME=My Cool App</code> is a single logical KEY=VALUE pair — but word splitting has no concept of that; it sees three space-separated words (<code>APP_NAME=My</code>, <code>Cool</code>, <code>App</code>) and passes them to <code>env</code> as three SEPARATE arguments. <code>env</code> then treats <code>APP_NAME</code> as only <code>My</code>, and treats the bare words <code>Cool</code> and <code>App</code> as if they were meant to be the COMMAND to run (or additional, meaningless KEY=VALUE-less arguments) — the actual intended value is silently mangled, with no error raised anywhere in the pipeline.',
        'This is exactly the class of bug the main page\'s own earlier bash-scripting content warns about generally ("unquoted variables undergo word splitting") — it just wasn\'t caught in this specific example, on this specific page, because a short demo .env with simple, space-free values never happens to trigger it.',
      ]
    },
    {
      heading: 'The fix: use the source-based method, which respects quoting per line',
      points: [
        'The main page\'s OWN first method — <code>set -a; source .env; set +a</code> — does not have this problem at all: <code>source</code> reads the file as actual shell syntax, one line at a time, respecting whatever quoting is present on each line (<code>APP_NAME="My Cool App"</code> is correctly parsed as ONE value, quotes and all) rather than blindly splitting on whitespace across the entire file\'s output.',
        'The practical takeaway: prefer the <code>set -a; source .env; set +a</code> pattern in real scripts, and treat <code>env $(cat .env | xargs)</code> as a demo-only shortcut that only happens to work for the simplest possible .env files — exactly the main page\'s own example, which is why the bug never surfaced there.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the word-splitting corruption',
      language: 'bash',
      code: `# .env file with a value containing a space -- an entirely
# normal, common case (an app name, a display title, etc.)
cat .env
# DATABASE_URL=postgres://localhost:5432/mydb
# APP_NAME=My Cool App
# DEBUG=false

# The main page's own second method:
env $(cat .env | grep -v ^# | xargs) printenv APP_NAME
# My
# -- WRONG. The intended value was "My Cool App" -- word
#    splitting on the command substitution's output chopped it
#    into three separate words, and only "My" ended up attached
#    to APP_NAME. "Cool" and "App" were passed as SEPARATE,
#    meaningless bare arguments to env.

# Confirm exactly what env actually received:
env $(cat .env | grep -v ^# | xargs) env | grep -E "APP_NAME|^Cool|^App"
# APP_NAME=My
# Cool          <-- a bogus environment entry with no '=' at all
# -- (behavior here can vary, but the intended single value is
#    definitely gone either way -- never "My Cool App")`,
    },
    {
      label: 'The fix: source respects quoting, xargs does not',
      language: 'bash',
      code: `# The main page's OWN first method -- correctly handles the
# exact same .env file with no changes needed:
set -a
source .env
set +a

printenv APP_NAME
# My Cool App          <-- correct, because source parses each
#                            line as real shell syntax, respecting
#                            whatever quoting is present

# For it to work reliably, the .env file's values with spaces
# should be quoted (standard .env convention, and what most
# dotenv-writing tools already do by default):
cat .env
# APP_NAME="My Cool App"     <-- quoted, source handles this fine

# General rule: prefer set -a / source / set +a for anything
# beyond the simplest, space-free demo .env file -- env $(cat
# .env | xargs) is a shortcut that only survives values with
# no whitespace at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script uses the main page\'s own second .env-loading method, `env $(cat .env | grep -v ^# | xargs) node server.js`, and it has worked fine for months. A new team member adds `APP_TITLE=Customer Portal` to the .env file for a new feature. After deploying, the running application reports `APP_TITLE` as just `Customer`, and a mysterious, unrelated-looking startup error appears about an unrecognized argument `Portal`. Why did this happen, and what change to the .env-loading command would have prevented it?',
    hint: 'Think about what actually happens to the output of `cat .env | xargs` as it gets substituted into the `env` command line — is a value with a space inside it treated as ONE thing, or as several separate things?',
    solution: 'The `env $(cat .env | grep -v ^# | xargs)` pattern performs command substitution followed by word splitting on the result — bash breaks the pipeline\'s output into separate arguments wherever whitespace appears, with no awareness that `APP_TITLE=Customer Portal` was meant to be ONE key-value pair. `Customer` becomes the value bash actually attaches to `APP_TITLE`, and the bare word `Portal` gets passed along as a completely separate, meaningless argument to `env` — which is exactly the mysterious "unrecognized argument Portal" error, since `env` tried to interpret it as something else entirely (potentially even as the command to run, in place of `node`). This bug was invisible for months only because every prior .env value happened to contain no spaces. The fix is switching to the main page\'s OWN first method — `set -a; source .env; set +a` — which reads the file as real shell syntax and correctly handles a quoted value like `APP_TITLE="Customer Portal"` as a single value, with no word-splitting risk at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'env $(cat .env | grep -v ^# | xargs) and set -a; source .env; set +a are two interchangeable ways to load the same .env file, differing only in style.',
      reality: 'Per this subtopic\'s theory, they behave differently for any value containing whitespace — the xargs-based method word-splits the file\'s content into separate arguments, silently corrupting multi-word values, while source respects each line\'s own shell quoting correctly.'
    },
    {
      thought: 'If a .env-loading command has worked correctly for months without issue, it must be a reliable, generally correct pattern.',
      reality: 'Per this subtopic\'s theory, the env $(cat .env | xargs) pattern only appears reliable because every value tested so far happened to contain no spaces — it silently breaks the moment a value with whitespace is added, with no warning that the underlying approach was ever fragile.'
    },
    {
      thought: 'Quoting a .env value with spaces (APP_NAME="My Cool App") is unnecessary as long as the loading mechanism is simple.',
      reality: 'Per this subtopic\'s theory, quoting only reliably protects a multi-word value when the LOADING method itself respects shell quoting (like source) — the env $(cat .env | xargs) method destroys the intended value regardless of whether it was quoted in the file, since word splitting happens on the already-flattened command substitution output.'
    }
  ];
}
