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
  templateUrl: './unset-removes-a-variable-var-only-empties-it.html',
  styleUrl: './unset-removes-a-variable-var-only-empties-it.scss'
})
export class UnsetRemovesAVariableVarOnlyEmptiesItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats "empty" and "unset" as interchangeable, without ever contrasting them',
      points: [
        'The main page\'s own theory states plainly: "unset NAME removes a variable." This is accurate, but the page never draws a distinction between removing a variable entirely and simply assigning it an empty value (<code>VAR=</code>) — both LOOK the same when checked with <code>echo $VAR</code> (nothing prints either way), which is exactly why the difference tends to go unnoticed until it causes a real bug.',
      ]
    },
    {
      heading: 'Two genuinely different states that produce the same echo output',
      points: [
        '<code>unset VAR</code> removes the variable from the shell\'s environment entirely — it no longer exists, has no value, and does not appear in <code>env</code> or <code>declare -p</code> output at all.',
        '<code>VAR=</code> (or <code>export VAR=</code>) does something different: it KEEPS the variable defined (and still exported, if it already was), just with an empty string as its value. The variable still exists — it shows up in <code>env</code>/<code>declare -p</code> output as <code>VAR=</code> — it simply holds no characters.',
        'The classic check <code>[[ -z "$VAR" ]]</code> ("is VAR empty?") returns TRUE for both cases equally — an unset variable and an explicitly-emptied variable both expand to nothing inside that test, making <code>-z</code> completely unable to distinguish "this was deliberately cleared" from "this was never set at all."',
      ]
    },
    {
      heading: 'The fix: parameter expansion or the -v test, when the distinction actually matters',
      points: [
        'When a script genuinely needs to tell "unset" and "set-but-empty" apart — a very real scenario: distinguishing "the user never provided this optional config value" (unset, use a sensible default) from "the user explicitly set this to empty on purpose" (set, respect that as intentional) — the POSIX-portable check is <code>${VAR+x}</code>: this expands to nothing if VAR is unset, and to the literal <code>x</code> if VAR is set to ANYTHING, including an empty string.',
        'On bash 4.2+, the more direct and readable equivalent is <code>[[ -v VAR ]]</code>, which tests specifically whether a variable is SET (regardless of its value) — <code>[[ ! -v VAR ]]</code> reads naturally as "if VAR is not set."',
        'This distinction directly matters for the main page\'s own recommended <code>.env</code>/config patterns: a line like <code>OPTIONAL_FEATURE_FLAG=</code> in a .env file (present, but deliberately left blank) behaves completely differently from that line being ABSENT entirely, once a script actually checks with <code>${VAR+x}</code> or <code>-v</code> rather than the more common (but less precise) <code>-z</code> check.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming echo can\'t tell the two states apart',
      language: 'bash',
      code: `# Two genuinely different starting states:
unset FEATURE_A                # FEATURE_A does not exist at all
export FEATURE_B=""            # FEATURE_B exists, but is empty

# Both LOOK identical with a plain echo check:
echo "A: [$FEATURE_A]"
echo "B: [$FEATURE_B]"
# A: []
# B: []                        <-- indistinguishable from the above

# ...and both look the same with the common -z ("is it empty?")
# test too:
[[ -z "$FEATURE_A" ]] && echo "A is empty (per -z)"
[[ -z "$FEATURE_B" ]] && echo "B is empty (per -z)"
# A is empty (per -z)
# B is empty (per -z)          <-- -z genuinely cannot tell them apart

# But they ARE different, confirmed via env/declare:
env | grep FEATURE
# FEATURE_B=                   <-- FEATURE_A doesn't appear at all;
#                                   FEATURE_B is present, just empty`,
    },
    {
      label: 'The fix: ${VAR+x} and [[ -v VAR ]] actually distinguish them',
      language: 'bash',
      code: `unset FEATURE_A
export FEATURE_B=""

# POSIX-portable check: \${VAR+x} expands to "x" if SET (even if
# empty), and to nothing at all if UNSET
[[ -n "\${FEATURE_A+x}" ]] && echo "A is set" || echo "A is UNSET"
[[ -n "\${FEATURE_B+x}" ]] && echo "B is set" || echo "B is UNSET"
# A is UNSET
# B is set                     <-- correctly distinguished now

# Bash 4.2+: more direct and readable
if [[ -v FEATURE_A ]]; then echo "A is set"; else echo "A is UNSET"; fi
if [[ -v FEATURE_B ]]; then echo "B is set"; else echo "B is UNSET"; fi
# A is UNSET
# B is set

# Practical use: distinguish "never configured, use default" from
# "explicitly configured to empty, respect that"
if [[ ! -v OPTIONAL_FEATURE_FLAG ]]; then
    OPTIONAL_FEATURE_FLAG="default-value"   # never set -- apply default
fi
# If OPTIONAL_FEATURE_FLAG="" was explicitly set (e.g. in .env),
# this branch is correctly skipped -- the deliberate empty value
# is respected instead of being silently overwritten.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script reads a config value with `if [[ -z "$MAX_RETRIES" ]]; then MAX_RETRIES=3; fi` to apply a sensible default when the value isn\'t configured. A team explicitly sets `MAX_RETRIES=` (intentionally empty) in their .env file to signal "retries disabled entirely" for their environment — following the main page\'s own .env conventions. After deployment, retries are NOT disabled; the script silently applies the default of 3 instead. Why did this happen, and what single change to the check would respect the team\'s explicit empty value?',
    hint: 'Check what the -z test actually verifies — whether a variable exists at all, or only whether its current value happens to be empty — and whether those are the same thing here.',
    solution: 'The `-z` test only checks whether a variable\'s VALUE is empty — it cannot distinguish "this variable was never set" from "this variable was explicitly set to an empty string." Since `MAX_RETRIES=` (present but empty) and an entirely unset `MAX_RETRIES` both expand to nothing inside `[[ -z "$MAX_RETRIES" ]]`, the script treats the team\'s deliberate "disable retries" signal exactly the same as "never configured," silently overwriting it with the default of 3. The fix is switching the check to something that tests for SET-NESS rather than emptiness: `if [[ ! -v MAX_RETRIES ]]; then MAX_RETRIES=3; fi` (bash 4.2+), or the POSIX-portable equivalent `if [[ -z "${MAX_RETRIES+x}" ]]; then MAX_RETRIES=3; fi` — either correctly applies the default ONLY when MAX_RETRIES was never set at all, and leaves an explicitly-set empty value (`MAX_RETRIES=`) untouched, respecting the team\'s actual intent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'unset VAR and VAR= (assigning an empty value) produce the same result — a variable that reads as empty.',
      reality: 'Per this subtopic\'s theory, these are genuinely different states: unset removes the variable entirely (it no longer exists), while VAR= keeps it defined with an empty value — the variable still appears in env/declare -p output, just with no characters.'
    },
    {
      thought: 'The common [[ -z "$VAR" ]] check reliably detects whether a variable was ever set.',
      reality: 'Per this subtopic\'s theory, -z only tests whether the CURRENT VALUE is empty — it returns true for both an unset variable and an explicitly-emptied one, making it unsuitable whenever the actual distinction between "never configured" and "deliberately set to empty" matters.'
    },
    {
      thought: 'There\'s no practical difference between distinguishing "unset" from "empty" — a script can just always apply a default when a value looks empty.',
      reality: 'Per this subtopic\'s theory, this distinction matters for exactly the kind of config pattern the main page\'s own .env conventions rely on — a deliberately empty value meant to signal "explicitly disabled" gets silently overwritten by a default when the script only checks -z instead of ${VAR+x} or [[ -v VAR ]].'
    }
  ];
}
