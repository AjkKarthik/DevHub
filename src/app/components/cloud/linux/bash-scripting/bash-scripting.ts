import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-linux-bash-scripting',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bash-scripting.html',
  styleUrl: './bash-scripting.scss'
})
export class LinuxBashScripting {

  quickRef: QuickRefItem[] = [
    { name: '#!/usr/bin/env bash', type: 'syntax', desc: 'Shebang: use bash from PATH (portable)' },
    { name: 'set -euo pipefail', type: 'syntax', desc: 'Exit on error, undefined vars, pipe failures' },
    { name: '$1 $2 $@', type: 'syntax', desc: 'Positional args; $@ = all args as separate words' },
    { name: '$? $$ $!', type: 'syntax', desc: 'Last exit code; current PID; last background PID' },
    { name: '$(cmd) / `cmd`', type: 'syntax', desc: 'Command substitution (prefer $())' },
    { name: '[[ -f file ]] && echo exists', type: 'syntax', desc: 'Bash conditional test; -f=file, -d=dir, -z=empty' },
    { name: 'for f in *.log; do ... done', type: 'syntax', desc: 'Loop over files matching pattern' },
    { name: 'trap cleanup EXIT', type: 'syntax', desc: 'Run cleanup function on script exit' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Script Structure and Safety',
      points: [
        '#!/usr/bin/env bash is the shebang. /usr/bin/env finds bash on the PATH — more portable than #!/bin/bash (not always present at that path).',
        'set -e: exit on any non-zero exit code. set -u: error on undefined variables. set -o pipefail: a pipe fails if any command in it fails. Use together: set -euo pipefail.',
        'Make scripts executable: chmod +x script.sh. Run with ./script.sh (relative) or bash script.sh (explicit interpreter).',
        'Quoting: "$var" prevents word splitting and glob expansion. Always quote variables in tests and commands.',
      ],
    },
    {
      heading: 'Variables and Expansion',
      points: [
        'Variables: NAME=value (no spaces). Access: $NAME or ${NAME}. ${NAME:-default} = value if NAME is unset or empty.',
        '${#NAME} = string length. ${NAME:0:5} = substring. ${NAME/old/new} = substitution. ${NAME^^} = uppercase.',
        'Command substitution: result=$(command). Arithmetic: $((2 + 3)). Let: ((count++)). Declare: declare -i count=0.',
        'readonly NAME=value makes a variable immutable. local VAR=value inside functions scopes to the function.',
      ],
    },
    {
      heading: 'Control Flow',
      points: [
        '[[ ]] is the bash-specific test command (safer than [ ]). Supports: -f (file), -d (dir), -z (empty string), -n (non-empty), == (string equal), =~ (regex match).',
        'if [[ $name == "alice" ]]; ... elif ...; else ...; fi. Arithmetic: if (( count > 5 )); then ...',
        'for item in list; do ... done. for ((i=0; i<10; i++)); do ... done. while read line; do ... done < file.',
        'case "$var" in pattern) commands ;; *) default ;; esac — cleaner than multiple if/elif for string matching.',
      ],
    },
    {
      heading: 'Functions and Error Handling',
      points: [
        'Functions: function_name() { local var=value; commands; return 0; }. Call with function_name arg1 arg2.',
        'trap "cleanup" EXIT runs a function when the script exits (any exit, including errors). trap "handler" ERR runs on non-zero exit.',
        'Return values via echo: result=$(my_func). Functions can only return integer exit codes (0=success).',
        'Error handling pattern: cmd || { echo "cmd failed" >&2; exit 1; }. The >&2 redirects error to stderr.',
      ],
    },
    {
      heading: 'Error Handling and Defensive Scripting',
      points: [
        'set -euo pipefail at the top of a script is the standard defensive baseline — set -e exits immediately on any command failure, set -u treats unset variables as an error, and set -o pipefail makes a pipeline fail if ANY command in it fails, not just the last one.',
        'Without set -e, a script silently continues executing subsequent commands even after an earlier command failed — this can cause a script to proceed with invalid state (like a failed cd followed by destructive operations in the wrong directory) rather than stopping immediately.',
        'Trapping signals (trap "cleanup_function" EXIT) ensures cleanup code (removing temporary files, releasing locks) runs even if the script exits unexpectedly due to an error or interruption (Ctrl+C), preventing resource leaks from incomplete script runs.',
        'Explicit error messages with context (echo "Error: config file $CONFIG not found" >&2; exit 1) are far more useful for debugging than a script that simply fails silently or with a generic, unhelpful error — always write meaningful error output to stderr, not stdout.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basics',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# Variables
NAME="Alice"
echo "Hello, $NAME"
echo "Length: \${#NAME}"            # 5
echo "Upper: \${NAME^^}"            # ALICE
DEFAULT=\${TIMEOUT:-30}             # use 30 if TIMEOUT unset

# Command substitution
TODAY=$(date +%Y-%m-%d)
FILES=$(ls -1 /tmp/*.log 2>/dev/null | wc -l)

# Arithmetic
COUNT=5
((COUNT++))
echo $((COUNT * 2))   # 12

# Positional parameters
echo "Script: $0"
echo "First arg: $1"
echo "All args: $@"
echo "Arg count: $#"`,
    },
    {
      label: 'Control Flow',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# if / elif / else
if [[ -f /etc/nginx/nginx.conf ]]; then
    echo "Nginx config exists"
elif [[ -d /etc/nginx ]]; then
    echo "Nginx dir exists, no config"
else
    echo "Nginx not installed"
fi

# Arithmetic comparison
SIZE=$(du -sm /var | cut -f1)
if (( SIZE > 1000 )); then
    echo "Warning: /var is over 1 GB"
fi

# for loop
for log in /var/log/*.log; do
    echo "Processing: $log"
done

# while loop with read (process file line by line)
while IFS= read -r line; do
    echo "Line: $line"
done < /etc/hosts

# case
ENV=\${1:-dev}
case "$ENV" in
    prod)    echo "Production mode" ;;
    staging) echo "Staging mode" ;;
    dev)     echo "Development mode" ;;
    *)       echo "Unknown env: $ENV"; exit 1 ;;
esac`,
    },
    {
      label: 'Functions & Traps',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# Cleanup function
TMPDIR=$(mktemp -d)
cleanup() {
    rm -rf "$TMPDIR"
    echo "Cleanup done" >&2
}
trap cleanup EXIT           # runs even on error

# Function with return value
get_container_id() {
    local name="$1"
    docker ps --filter "name=$name" --format "{{.ID}}" | head -1
}

CONTAINER=$(get_container_id "myapp")
if [[ -z "$CONTAINER" ]]; then
    echo "Container not found" >&2
    exit 1
fi

# Error handling
check_disk() {
    local threshold="$1"
    local usage
    usage=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
    if (( usage > threshold )); then
        echo "Disk usage at $usage% — above $threshold%" >&2
        return 1
    fi
}

check_disk 80 || { echo "Disk check failed, aborting" >&2; exit 1; }

# Logging helper
log() { echo "[$(date +%H:%M:%S)] $*" >&2; }
log "Starting deployment"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting quotes around variables',
      wrong: 'if [ $FILE == "config" ]; then',
      right: 'if [[ "$FILE" == "config" ]]; then',
      explanation: 'Unquoted variables with spaces cause word-splitting. "$FILE" preserves whitespace. Also prefer [[ ]] over [ ] in bash — it handles empty strings and special chars safely.',
    },
    {
      title: 'Not using set -euo pipefail',
      wrong: '#!/bin/bash (no set options — errors are silently ignored)',
      right: '#!/usr/bin/env bash\nset -euo pipefail',
      explanation: 'Without set -e, the script continues after a command fails. Without -u, unset variables silently expand to empty. Without pipefail, "cmd1 | cmd2" succeeds even if cmd1 fails.',
    },
    {
      title: 'Using == for arithmetic comparison',
      wrong: 'if [[ $count == 0 ]]; then (string comparison)',
      right: 'if (( count == 0 )); then (or [[ $count -eq 0 ]])',
      explanation: '[[ ]] uses string comparison for ==. "10" == "9" is false (correct), but for numeric logic use (( )) arithmetic or -eq/-gt/-lt operators inside [[ ]].',
    },
    {
      title: 'Using backtick command substitution',
      wrong: 'RESULT=`some_command`',
      right: 'RESULT=$(some_command)',
      explanation: '$() is preferred: it nests cleanly ($( $(inner) )), handles backslashes predictably, and is more readable. Backticks are harder to read and harder to nest.',
    },
  ];

  challenge: Challenge = {
    title: 'Bash Safety Analyser',
    language: 'typescript',
    description: 'Write a function that analyses a bash script string for common safety issues and returns a list of warnings. Check for: missing shebang, missing set -e, unquoted variable use ($VAR without quotes), and use of rm -rf without guard.',
    hints: [
      'Check if the first line starts with #!',
      'Look for "set -e" or "set -euo pipefail" in the first 10 lines',
      'Unquoted $VAR is a simple regex: /(?<!")\\$[A-Za-z_]\\w*/g but exclude lines with quotes',
      'rm -rf with a variable: /rm -rf \\$/ pattern',
    ],
    starterCode: `function analyseScript(script: string): string[] {
  const warnings: string[] = [];
  // Check for common bash issues
  return warnings;
}

const script = \`#!/bin/bash
NAME=world
echo Hello $NAME
rm -rf $TMPDIR
\`;
console.log(analyseScript(script));
// ["Missing set -euo pipefail", "Unquoted variable: $NAME", "rm -rf with variable: $TMPDIR"]`,
    solution: `function analyseScript(script: string): string[] {
  const warnings: string[] = [];
  const lines = script.split('\\n');

  if (!lines[0]?.startsWith('#!')) warnings.push('Missing shebang line');

  const hasPipefail = lines.slice(0, 15).some(l => l.includes('set -') && l.includes('e'));
  if (!hasPipefail) warnings.push('Missing set -euo pipefail');

  lines.forEach((line, i) => {
    if (line.trim().startsWith('#')) return;
    const unquoted = line.match(/(?<!")(\\$[A-Za-z_]\\w*)/g);
    if (unquoted) unquoted.forEach(v => warnings.push(\`Line \${i+1}: Unquoted variable \${v}\`));
    if (/rm -rf \\$/.test(line)) warnings.push(\`Line \${i+1}: rm -rf with variable\`);
  });

  return warnings;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does set -o pipefail do?',
      options: [
        'Makes pipes faster',
        'Makes a pipeline fail if any command in it exits non-zero',
        'Enables debug output for pipes',
        'Allows piping to read-only files',
      ],
      answer: 1,
      explanation: 'Without pipefail, "false | true" exits 0 because only the last command\'s exit code matters. With set -o pipefail, the pipeline exits with the rightmost non-zero exit code.',
    },
    {
      q: 'What does ${VAR:-default} do?',
      options: [
        'Always sets VAR to default',
        'Returns VAR if set and non-empty, otherwise returns default',
        'Removes default from VAR',
        'Errors if VAR is unset',
      ],
      answer: 1,
      explanation: '${VAR:-default} is a parameter expansion: it returns the value of VAR if set and non-empty, or "default" if VAR is unset or empty. Useful for optional parameters with defaults.',
    },
    {
      q: 'How do you capture a function\'s output in bash?',
      options: [
        'result = my_func()',
        'my_func | result',
        'result=$(my_func)',
        'return $(my_func)',
      ],
      answer: 2,
      explanation: 'result=$(my_func) uses command substitution to capture stdout of my_func. Functions communicate output via echo/printf. return only returns exit codes (integers).',
    },
    {
      q: 'Which trap signal runs a cleanup function when the script exits normally or on error?',
      options: ['SIGTERM', 'EXIT', 'ERR', 'QUIT'],
      answer: 1,
      explanation: 'trap "cleanup" EXIT runs the cleanup function whenever the script exits, regardless of exit code or reason (normal exit, Ctrl+C, set -e failure, etc.). It is the standard cleanup pattern.',
    },
    {
      q: 'Which special variable holds the exit code of the last executed command?',
      options: [
        '$0',
        '$?',
        '$#',
        '$@',
      ],
      answer: 1,
      explanation: '$? contains the exit code of the most recently executed command. 0 means success; non-zero means failure. Always check $? or use set -e to exit on error automatically.',
    },
    {
      q: 'What is the key advantage of [[ over [ for conditionals in bash?',
      options: [
        '[[ is POSIX portable; [ is bash-only',
        '[[ is a bash built-in supporting regex, pattern matching, and logical operators without word splitting',
        '[ supports more comparison operators',
        'There is no difference; they are aliases',
      ],
      answer: 1,
      explanation: '[[ is a bash keyword that avoids word splitting and supports =~ for regex matching, == with glob patterns, and && / || without quoting issues. [ is POSIX but more fragile.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I read command-line arguments with defaults in a bash script?',
      a: 'Use positional parameters with default expansion: HOST=${1:-localhost}, PORT=${2:-8080}. For named options, use getopts: while getopts "h:p:" opt; do case $opt in h) HOST=$OPTARG ;; p) PORT=$OPTARG ;; esac; done. For complex CLIs, consider using a dedicated args parser.',
    },
    {
      q: 'How do I create a temporary directory that is cleaned up on exit?',
      a: 'TMPDIR=$(mktemp -d) && trap "rm -rf -- \\"$TMPDIR\\"" EXIT. The mktemp -d creates a unique temp dir. The trap EXIT ensures it is deleted even if the script errors. Quote the variable to handle paths with spaces.',
    },
    {
      q: 'What is the difference between $@ and $* in bash?',
      a: '"$@" expands each positional parameter as a separate quoted word — safe for filenames with spaces. "$*" expands all parameters as a single word joined by IFS (default space). Use "$@" in loops and when passing args to commands: cmd "$@" preserves argument boundaries.',
    },
    {
      q: 'Why should you always quote variables in bash?',
      a: 'Unquoted variables undergo word splitting and glob expansion. <code>rm $file</code> fails dangerously if $file contains spaces or globs. Always quote: <code>rm "$file"</code>. Exception: arithmetic context <code>(( $n + 1 ))</code> and array index notation do not require quotes.',
    },
    {
      q: 'What is the shebang line and why use /usr/bin/env bash?',
      a: 'The shebang (#!) on line 1 tells the OS which interpreter to use. <code>#!/usr/bin/env bash</code> is preferred over <code>#!/bin/bash</code> because env searches PATH for bash, making scripts portable across systems where bash is not at /bin/bash (e.g., macOS with Homebrew bash, NixOS). Always include it — without it, the script runs in /bin/sh which may not be bash.',
    },
    {
      q: 'How do you write a reusable function in bash?',
      a: 'Define with <code>function_name() { ... }</code> or <code>function function_name { ... }</code>. Return values: use <code>return N</code> for exit codes (0-255) or echo/printf to stdout and capture with <code>$( )</code>. Local variables: use <code>local varname</code> to scope them. Functions must be defined before they are called.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '#!/usr/bin/env bash + set -euo pipefail; quote variables; [[ ]] for tests; $() for substitution; trap EXIT for cleanup.',
    mustKnow: [
      'set -euo pipefail: exit on error, fail on undefined var, catch pipe failures',
      'Always quote: "$var" not $var — prevents word splitting and glob expansion',
      '[[ ]] is bash-specific; safer than [ ] for string/file tests',
      '$() preferred over backticks for command substitution',
      '${VAR:-default} = fallback when unset; ((count++)) for arithmetic',
      'trap "cleanup" EXIT runs on any exit — the standard cleanup pattern',
    ],
    interviewFocus: [
      'What is the effect of set -euo pipefail?',
      'Why should variables be quoted in bash?',
      'How do you capture a command\'s output into a variable?',
      'How do you ensure a temp directory is cleaned up even if the script fails?',
    ],
  };
}
