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
  selector: 'app-linux-bash-advanced',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bash-advanced.html',
  styleUrl: './bash-advanced.scss'
})
export class LinuxBashAdvanced {

  quickRef: QuickRefItem[] = [
    { name: 'declare -A map; map[key]=val', type: 'syntax', desc: 'Associative array (bash 4+)' },
    { name: 'arr=("a" "b" "c"); echo ${arr[@]}', type: 'syntax', desc: 'Indexed array; expand all elements' },
    { name: 'mapfile -t lines < file', type: 'syntax', desc: 'Read file into array (one element per line)' },
    { name: 'xargs -P4 -I{} cmd {}', type: 'syntax', desc: 'Parallel xargs (4 processes)' },
    { name: 'cmd &; wait $!', type: 'syntax', desc: 'Background process + wait for completion' },
    { name: 'exec 3>&1; exec 1>/tmp/log', type: 'syntax', desc: 'Redirect stdout to log, save original fd' },
    { name: 'SECONDS variable', type: 'keyword', desc: 'Built-in: seconds since script start' },
    { name: "awk 'NR%2==0' file", type: 'syntax', desc: 'Print every other line (even lines)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Arrays',
      points: [
        'Indexed arrays: arr=("a" "b" "c"). Access: ${arr[0]}. All elements: ${arr[@]}. Length: ${#arr[@]}. Append: arr+=("d").',
        'Associative arrays (bash 4+): declare -A map. Assign: map[key]=val. Access: ${map[key]}. Keys: ${!map[@]}.',
        'Loop over array: for item in "${arr[@]}"; do ... done. Quote "${arr[@]}" to handle elements with spaces.',
        'Slice: ${arr[@]:1:3} = elements 1, 2, 3. Delete element: unset arr[2]. Delete all: unset arr.',
      ],
    },
    {
      heading: 'String Manipulation',
      points: [
        '${str#prefix} removes shortest prefix match. ${str##prefix} removes longest. Same with %suffix and %%.',
        '${str/old/new} replaces first match. ${str//old/new} replaces all. ${str^^} uppercases. ${str,,} lowercases.',
        '${str:pos:len} = substring starting at pos with len characters.',
        'printf "%s\\n" "$str" is safer than echo for strings with escape sequences or starting with -.',
      ],
    },
    {
      heading: 'Process Substitution and Here-Docs',
      points: [
        'Process substitution: diff <(cmd1) <(cmd2) compares outputs of two commands without temp files.',
        'Here-doc: cmd << EOF ... EOF — passes multi-line text as stdin. << \'EOF\' prevents variable expansion.',
        'Here-string: cmd <<< "string" — passes a single string as stdin. Avoids echo | cmd subprocess.',
        'Pipe to read avoids subshell issue: while read line; do ... done < <(cmd) (process sub in bash 4).',
      ],
    },
    {
      heading: 'Parallel Execution and Job Control',
      points: [
        'Background jobs with &: cmd1 & cmd2 & wait — runs both in parallel, waits for both.',
        'wait $PID waits for a specific PID. wait with no args waits for all background jobs.',
        'xargs -P N runs N commands in parallel: cat hosts.txt | xargs -P8 -I{} ssh {} "uptime".',
        'GNU parallel (parallel cmd ::: args) handles parallel execution with better control and output ordering.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Arrays',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# Indexed array
SERVERS=("web1" "web2" "db1" "db2")
echo "Count: \${#SERVERS[@]}"          # 4
echo "First: \${SERVERS[0]}"           # web1
echo "All: \${SERVERS[@]}"

for srv in "\${SERVERS[@]}"; do
    echo "Checking: $srv"
done

# Append
SERVERS+=("cache1")

# Read file into array
mapfile -t HOSTS < /etc/hosts
echo "Lines: \${#HOSTS[@]}"

# Associative array (bash 4+)
declare -A PORTS
PORTS[web]=80
PORTS[https]=443
PORTS[ssh]=22

for service in "\${!PORTS[@]}"; do
    echo "$service -> \${PORTS[$service]}"
done`,
    },
    {
      label: 'String & Substitution',
      language: 'bash',
      code: `#!/usr/bin/env bash

# Parameter expansion
FILE="/var/log/nginx/access.log"
echo "\${FILE##*/}"          # access.log (basename)
echo "\${FILE%/*}"           # /var/log/nginx (dirname)
echo "\${FILE%.log}"         # /var/log/nginx/access (strip extension)
echo "\${FILE/nginx/apache}" # /var/log/apache/access.log (replace)

URL="https://api.example.com/v2/users"
echo "\${URL#https://}"      # api.example.com/v2/users
echo "\${URL##*/}"           # users (last path segment)

# Case
NAME="hello world"
echo "\${NAME^^}"            # HELLO WORLD
echo "\${NAME^}"             # Hello world (capitalize first)

# Process substitution — diff without temp files
diff <(sort file1.txt) <(sort file2.txt)

# Here-doc (variable expansion)
cat << EOF
Server: $HOSTNAME
Date: $(date +%Y-%m-%d)
EOF

# Here-doc (no expansion with single quotes)
cat << 'EOF'
This \${variable} won't be expanded
EOF`,
    },
    {
      label: 'Parallel & Advanced',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# Parallel background jobs
check_host() {
    local host="$1"
    if ping -c1 -W1 "$host" &>/dev/null; then
        echo "$host: UP"
    else
        echo "$host: DOWN"
    fi
}

HOSTS=("10.0.0.1" "10.0.0.2" "10.0.0.3")
PIDS=()

for host in "\${HOSTS[@]}"; do
    check_host "$host" &
    PIDS+=($!)
done

for pid in "\${PIDS[@]}"; do
    wait "$pid"
done

# xargs parallel (8 workers)
cat servers.txt | xargs -P8 -I{} ssh {} "uptime"

# Timing
START=$SECONDS
sleep 2
echo "Took $((SECONDS - START)) seconds"

# Redirect stdout to log while also printing to terminal
exec > >(tee /tmp/deploy.log) 2>&1
echo "This goes to both terminal and log"

# Retry logic
retry() {
    local n=3
    local delay=5
    local cmd="$@"
    for ((i=1; i<=n; i++)); do
        if "$@"; then return 0; fi
        echo "Attempt $i failed, retrying in \${delay}s..."
        sleep $delay
    done
    echo "All $n attempts failed"
    return 1
}

retry curl https://api.example.com/health`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Looping over array without double quotes',
      wrong: 'for item in ${arr[@]}; do ...',
      right: 'for item in "${arr[@]}"; do ...',
      explanation: 'Without quotes, elements with spaces are split into multiple items. "${arr[@]}" preserves each element as a single word. This is critical for filenames and paths with spaces.',
    },
    {
      title: 'Using read in a pipe subshell',
      wrong: 'cmd | while read line; do vars="$line"; done; echo $vars (vars lost)',
      right: 'while read line; do vars="$line"; done < <(cmd)',
      explanation: 'In bash, the right side of a pipe runs in a subshell. Variables set inside the while loop are lost after the pipe. Process substitution < <(cmd) runs cmd in the same shell.',
    },
    {
      title: 'Forgetting declare -A for associative arrays',
      wrong: 'MAP[key]=value (without declare -A)',
      right: 'declare -A MAP; MAP[key]=value',
      explanation: 'Without declare -A, bash treats the variable as an indexed array and may silently ignore the key or error. Always declare associative arrays before use.',
    },
    {
      title: 'Not collecting background job PIDs before waiting',
      wrong: 'cmd1 & cmd2 & wait (loses exit codes)',
      right: 'cmd1 & PID1=$!; cmd2 & PID2=$!; wait $PID1; wait $PID2',
      explanation: 'wait with no args waits for all jobs but does not capture individual exit codes. Capturing PIDs with $! lets you check each job\'s exit status with wait $PID.',
    },
  ];

  challenge: Challenge = {
    title: 'Template Renderer',
    language: 'typescript',
    description: 'Write a function that implements basic bash-style variable substitution on a template string. Replace all occurrences of ${VAR} and $VAR with values from a context map. Unresolved variables should remain as-is.',
    hints: [
      'Handle both ${VAR} and $VAR syntax',
      'Use a regex with a callback to look up each variable',
      'Return the original placeholder if the variable is not in the context',
    ],
    starterCode: `function renderTemplate(template: string, context: Record<string, string>): string {
  // Replace \${VAR} and $VAR with values from context
  // Leave unresolved variables as-is
}

const tmpl = "Hello \${NAME}! Server is \${HOST} on port $PORT. Enjoy \${UNKNOWN}.";
const ctx = { NAME: "Alice", HOST: "web1.prod", PORT: "8080" };

console.log(renderTemplate(tmpl, ctx));
// "Hello Alice! Server is web1.prod on port 8080. Enjoy \${UNKNOWN}."`,
    solution: `function renderTemplate(template: string, context: Record<string, string>): string {
  return template
    .replace(/\\$\\{([A-Za-z_]\\w*)\\}/g, (match, name) => context[name] ?? match)
    .replace(/\\$([A-Za-z_]\\w*)/g, (match, name) => context[name] ?? match);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which syntax reads all array elements preserving spaces in each element?',
      options: ['${arr[*]}', '"${arr[*]}"', '"${arr[@]}"', '${arr}'],
      answer: 2,
      explanation: '"${arr[@]}" expands each element as a separate quoted word — correct for filenames with spaces. "${arr[*]}" joins all elements into one string. ${arr[@]} without quotes splits on spaces.',
    },
    {
      q: 'Given FILE="/var/log/app.log", what does ${FILE##*/} produce?',
      options: ['/var/log', 'app.log', '/var/log/app', 'app'],
      answer: 1,
      explanation: '## removes the longest prefix matching */ (everything up to and including the last slash). The result is the basename: "app.log".',
    },
    {
      q: 'What is the purpose of process substitution < <(cmd)?',
      options: [
        'Redirect stderr to a file',
        'Feed cmd output as a file-like input to a command',
        'Run cmd in a subshell silently',
        'Pipe both stdin and stdout of cmd',
      ],
      answer: 1,
      explanation: 'Process substitution < <(cmd) replaces a filename with a temporary FIFO connected to cmd\'s output. Avoids the subshell variable-loss problem that occurs with cmd | while read...',
    },
    {
      q: 'How do you run 4 commands in parallel and wait for all of them?',
      options: [
        'cmd1 && cmd2 && cmd3 && cmd4',
        'cmd1 | cmd2 | cmd3 | cmd4',
        'cmd1 & cmd2 & cmd3 & cmd4 & wait',
        'parallel cmd1 cmd2 cmd3 cmd4',
      ],
      answer: 2,
      explanation: 'The & operator runs each command in the background. wait with no args waits for all background jobs to complete. Capture PIDs with $! and wait individually if you need exit codes.',
    },
    {
      q: 'What does set -euo pipefail do in a bash script?',
      options: [
        'Enables extended glob patterns only',
        'Exits on error, errors on unset variables, and fails the pipeline if any command fails',
        'Disables all error output',
        'Enables errexit but not pipefail',
      ],
      answer: 1,
      explanation: 'set -e exits on error, -u errors on unset variable references, -o pipefail makes the pipeline fail if any command fails not just the last one. Combined they enforce strict error handling.',
    },
    {
      q: 'What is process substitution in bash?',
      options: [
        'Running a process as a background job',
        'Substituting a command output as a named file descriptor using <(cmd) or >(cmd)',
        'Replacing a process with another using exec',
        'Substituting environment variables into a command',
      ],
      answer: 1,
      explanation: 'Process substitution <(cmd) runs cmd and presents its output as a file, allowing it to be used where a filename is expected. Example: diff <(sort file1) <(sort file2).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I run a bash command on multiple servers in parallel?',
      a: 'Use xargs: cat hosts.txt | xargs -P8 -I{} ssh {} "uptime". -P8 runs 8 in parallel. Or use GNU parallel: parallel ssh {} "uptime" ::: $(cat hosts.txt). For production, consider Ansible or Fabric which handle errors, output collection, and connection management more robustly.',
    },
    {
      q: 'How do I capture both stdout and stderr from a command into a variable?',
      a: 'OUTPUT=$(cmd 2>&1) captures both streams. To capture separately: STDOUT=$(cmd 2>/tmp/err); STDERR=$(cat /tmp/err). Or: exec 3>&1; OUTPUT=$(cmd 2>&1 1>&3); captures stderr into OUTPUT while stdout goes to terminal.',
    },
    {
      q: 'What is the difference between declare -a and declare -A in bash?',
      a: 'declare -a creates an indexed array where keys are integers (0, 1, 2...). declare -A creates an associative array where keys can be any string. arr=() creates an indexed array implicitly. Associative arrays require explicit declare -A.',
    },
    {
      q: 'What is the difference between sourcing and executing a script?',
      a: '<strong>source script.sh</strong> (or . script.sh) runs the script in the current shell — variables and functions defined persist in the current session. <strong>./script.sh</strong> spawns a subshell; its environment does not affect the parent. Use source for configuration files (.bashrc) and scripts that set variables you need after they run.',
    },
    {
      q: 'How does trap work in bash?',
      a: '<strong>trap</strong> registers a handler to run when the script receives a signal or exits. Example: <code>trap cleanup EXIT</code> ensures cleanup() runs on exit (normal or error). <code>trap - INT</code> resets the SIGINT handler. Useful for cleaning temp files, releasing locks, or printing diagnostic info on failure.',
    },
    {
      q: 'What are the common pitfalls with arrays in bash?',
      a: 'Common pitfalls: (1) Always quote array expansions: use <code>"" </code> not <code>${arr[*]}</code> to preserve elements with spaces. (2) Iterate with <code>for item in ""</code>. (3) Get length with <code>${#arr[@]}</code>. (4) Arrays are 0-indexed. (5) Avoid associative arrays in scripts that must be POSIX-portable.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Arrays with "${arr[@]}"; ${str##*/} for basename; process substitution < <(cmd) for subshell-safe reads; parallel with & + wait.',
    mustKnow: [
      '"${arr[@]}" — quote to preserve elements with spaces',
      '${str##*/} = basename, ${str%/*} = dirname, ${str//old/new} = replace all',
      'declare -A for associative arrays (bash 4+)',
      'Process substitution < <(cmd) avoids subshell variable-loss in while-read loops',
      'cmd & PID=$!; wait $PID — capture PIDs for exit code checking',
      'xargs -P N for parallel execution with N workers',
    ],
    interviewFocus: [
      'How do you iterate over an array of filenames that may contain spaces?',
      'Why do variables set inside a while-read pipe get lost?',
      'How would you run a check on 100 servers in parallel from a bash script?',
      'What is the difference between ${str#prefix} and ${str##prefix}?',
    ],
  };
}
