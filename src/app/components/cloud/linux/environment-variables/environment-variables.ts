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
  selector: 'app-linux-environment-variables',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './environment-variables.html',
  styleUrl: './environment-variables.scss'
})
export class LinuxEnvironmentVariables {

  quickRef: QuickRefItem[] = [
    { name: 'export NAME=value', type: 'syntax', desc: 'Set and export variable to child processes' },
    { name: 'env', type: 'syntax', desc: 'Print all environment variables' },
    { name: 'printenv PATH', type: 'syntax', desc: 'Print a specific variable' },
    { name: 'unset NAME', type: 'syntax', desc: 'Remove a variable from the environment' },
    { name: 'VAR=val cmd', type: 'syntax', desc: 'Set variable for one command only' },
    { name: 'source ~/.bashrc / . ~/.bashrc', type: 'syntax', desc: 'Reload config in current shell' },
    { name: '/etc/environment', type: 'keyword', desc: 'System-wide env vars (non-shell, PAM-sourced)' },
    { name: 'direnv allow', type: 'syntax', desc: 'Auto-load .envrc when cd into directory' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Environment vs Shell Variables',
      points: [
        'Shell variables (NAME=value) are local to the current shell. Environment variables (export NAME=value) are inherited by child processes.',
        'export makes a variable available to subprocesses. NAME=value cmd passes a variable to a single command without exporting to the whole session.',
        'env prints all current environment variables. printenv NAME prints a specific one. $NAME or ${NAME} accesses the value.',
        'unset NAME removes a variable. Variables persist for the shell session; they are not written to disk automatically.',
      ],
    },
    {
      heading: 'Startup Files — Where Vars Are Set',
      points: [
        'Login shells read: /etc/profile, then ~/.bash_profile (or ~/.profile). Interactive non-login shells read ~/.bashrc.',
        '/etc/environment is a simple KEY=VALUE file read by PAM (not a shell script) — good for system-wide non-shell variables.',
        '/etc/profile.d/*.sh files are sourced by /etc/profile — the correct place for system-wide shell variables.',
        'For systemd services: use Environment= or EnvironmentFile= in the unit file. Shell startup files are not sourced by systemd.',
      ],
    },
    {
      heading: 'PATH — Command Resolution',
      points: [
        'PATH is a colon-separated list of directories searched for commands. The shell searches left-to-right; first match wins.',
        'Add to PATH: export PATH="$PATH:/new/dir" (append) or export PATH="/new/dir:$PATH" (prepend, takes priority).',
        'type cmd or which cmd shows which binary is found. type -a cmd shows all matches in PATH order.',
        'Avoid . (current directory) in PATH — it is a security risk (attacker can place malicious ls in the current dir).',
      ],
    },
    {
      heading: '.env Files and Secrets',
      points: [
        '.env files store key=value pairs and are loaded by applications (dotenv libraries) or tools like direnv.',
        'Never commit .env files with secrets to git. Add .env to .gitignore. Use .env.example with dummy values.',
        'For production secrets: use environment variables injected at runtime (Docker env, Kubernetes secrets, AWS Secrets Manager).',
        'Secrets in environment variables are visible to all subprocesses of the application and appear in /proc/<PID>/environ (readable by root and the process owner).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Set & Export',
      language: 'bash',
      code: `# Shell variable (local only)
NAME="Alice"
echo $NAME                    # works in this shell
bash -c 'echo $NAME'          # empty — not exported

# Environment variable (inherited)
export NAME="Alice"
bash -c 'echo $NAME'          # Alice — inherited by child

# Set for one command only
NODE_ENV=production node server.js
DEBUG=* npm start             # sets DEBUG just for npm

# Inspect
env                           # all environment variables
env | sort                    # sorted
printenv HOME                 # specific variable
printenv PATH | tr ':' '\\n'   # PATH entries, one per line

# Unset
unset NAME
echo $NAME                    # empty

# Readonly variable
readonly DB_HOST="prod-db.internal"
DB_HOST="other"               # error: readonly variable`,
    },
    {
      label: 'PATH & Startup',
      language: 'bash',
      code: `# View and modify PATH
echo $PATH
echo $PATH | tr ':' '\\n'      # one dir per line

# Add to PATH (in ~/.bashrc or ~/.bash_profile)
export PATH="$HOME/.local/bin:$PATH"        # prepend (higher priority)
export PATH="$PATH:/usr/local/myapp/bin"    # append

# Reload after editing startup file
source ~/.bashrc
# or
. ~/.bashrc

# Which binary is used?
type python3                   # shows path or alias
which python3                  # path only
type -a python                 # all matches

# System-wide variables (/etc/environment — not a script!)
# DATABASE_URL=postgres://db:5432/mydb
# No export, no $(), just KEY=VALUE

# /etc/profile.d/myapp.sh (shell script, sourced at login)
export JAVA_HOME=/usr/lib/jvm/java-17
export PATH="$JAVA_HOME/bin:$PATH"`,
    },
    {
      label: '.env Files',
      language: 'bash',
      code: `# .env file format
# DATABASE_URL=postgres://user:pass@localhost:5432/mydb
# SECRET_KEY=super-secret-value-here
# DEBUG=false
# PORT=3000

# Load .env in bash script
set -a                         # auto-export all vars
source .env                    # or: . .env
set +a                         # stop auto-export

# Or use env command
env $(cat .env | grep -v ^# | xargs) node server.js

# direnv (auto-load .envrc on cd)
# apt install direnv
# Add to ~/.bashrc: eval "$(direnv hook bash)"
# Create .envrc in project: export DATABASE_URL=...
# Allow: direnv allow

# Systemd EnvironmentFile
# In myapp.service:
# [Service]
# EnvironmentFile=/etc/myapp/env
# (file format: KEY=VALUE without export)

# Show env of running process (root or process owner only)
cat /proc/$(pgrep myapp)/environ | tr '\\0' '\\n'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting a variable without export and wondering why subprocesses cannot see it',
      wrong: 'NAME=Alice (then wondering why a child process prints empty)',
      right: 'export NAME=Alice (or export NAME; NAME=Alice)',
      explanation: 'Shell variables without export are local to the current shell. Child processes (subshells, scripts, programs) only inherit exported environment variables.',
    },
    {
      title: 'Adding . (current directory) to PATH',
      wrong: 'export PATH=".:$PATH"',
      right: 'Never add . to PATH; always use ./cmd for current directory',
      explanation: 'If . is in PATH and an attacker can write files to any directory you work in, they can create a malicious "ls" or "make" that runs when you type those commands. Use ./cmd explicitly.',
    },
    {
      title: 'Editing ~/.bashrc but forgetting to source it',
      wrong: 'Edit ~/.bashrc, expect new PATH to work immediately in same terminal',
      right: 'source ~/.bashrc (or open a new terminal) to apply changes',
      explanation: '~/.bashrc is only read when a new interactive shell starts. Editing the file does not affect the running session. source runs the file in the current shell to apply changes immediately.',
    },
    {
      title: 'Using /etc/environment as a shell script',
      wrong: 'export PATH=$PATH:/usr/local/bin in /etc/environment',
      right: 'PATH=/usr/local/bin:/usr/bin:/bin in /etc/environment (no export, no $())',
      explanation: '/etc/environment is not a shell script — it is parsed by PAM. No export keyword, no variable references, no $() substitution. Use /etc/profile.d/*.sh for shell-specific logic.',
    },
  ];

  challenge: Challenge = {
    title: '.env File Parser',
    language: 'typescript',
    description: 'Write a function that parses .env file content and returns a Record of key-value pairs. Handle: inline comments, quoted values, empty lines, and comment-only lines. Values in single or double quotes should have the quotes stripped.',
    hints: [
      'Skip lines starting with # and empty lines',
      'Split on first = only',
      'Strip surrounding quotes from values',
      'Handle inline comments: KEY=value # comment',
    ],
    starterCode: `function parseEnvFile(content: string): Record<string, string> {
  // Parse .env file format: KEY=value, # comments, quoted values
}

const env = \`# Database config
DATABASE_URL=postgres://localhost:5432/mydb
SECRET_KEY='my secret key here'
DEBUG="false"
PORT=3000  # HTTP port
EMPTY=
\`;

console.log(parseEnvFile(env));
// { DATABASE_URL: 'postgres://...', SECRET_KEY: 'my secret key here', DEBUG: 'false', PORT: '3000', EMPTY: '' }`,
    solution: `function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split('\\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Remove inline comments (but not inside quotes)
    if (!val.startsWith("'") && !val.startsWith('"')) {
      val = val.split('#')[0].trim();
    }

    // Strip surrounding quotes
    if ((val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }

    if (key) result[key] = val;
  }

  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which file is read for system-wide environment variables that are NOT shell scripts?',
      options: ['/etc/bashrc', '/etc/profile', '/etc/environment', '/etc/profile.d/'],
      answer: 2,
      explanation: '/etc/environment is a simple KEY=VALUE file read by PAM at login — not a shell script. No export keyword, no variable references. /etc/profile.d/*.sh files ARE shell scripts sourced at login.',
    },
    {
      q: 'What is the difference between NAME=value and export NAME=value?',
      options: [
        'They are identical',
        'NAME=value is local to the shell; export makes it available to child processes',
        'export writes the value to disk permanently',
        'export makes it read-only',
      ],
      answer: 1,
      explanation: 'Without export, a variable exists only in the current shell. export adds it to the environment, making it visible to all child processes (scripts, programs, subshells) spawned from this shell.',
    },
    {
      q: 'How do you set a variable for just one command without affecting the current shell?',
      options: [
        'export VAR=val; cmd; unset VAR',
        'VAR=val cmd',
        'env -i VAR=val cmd',
        'set VAR=val && cmd',
      ],
      answer: 1,
      explanation: 'VAR=val cmd sets the variable in the environment of just that command without modifying the current shell\'s environment. The variable is gone after cmd finishes.',
    },
    {
      q: 'After editing ~/.bashrc, how do you apply changes without opening a new terminal?',
      options: ['restart', 'reload ~/.bashrc', 'source ~/.bashrc', 'exec bash'],
      answer: 2,
      explanation: 'source ~/.bashrc (or . ~/.bashrc) runs the file in the current shell, applying changes immediately. exec bash replaces the current shell with a new one (also works but loses session state).',
    },
    {
      q: 'What is the difference between VAR=value and export VAR=value?',
      options: [
        'No difference; both set variables in the current and child processes',
        'VAR=value sets a shell variable visible only in the current shell; export makes it available to child processes',
        'export is only for system-wide variables in /etc/environment',
        'VAR=value is read-only; export allows modification',
      ],
      answer: 1,
      explanation: 'Without export, a variable is a shell-local variable not inherited by child processes. export marks it for export to the environment of child processes spawned from the current shell.',
    },
    {
      q: 'Which file is the correct place to set environment variables for interactive login shells?',
      options: [
        '~/.bashrc',
        '~/.bash_profile or ~/.profile',
        '/etc/bashrc',
        '~/.bash_history',
      ],
      answer: 1,
      explanation: '~/.bash_profile (or ~/.profile) is sourced for login shells. ~/.bashrc is for interactive non-login shells. Typically .bash_profile sources .bashrc for consistency. /etc/environment sets system-wide variables.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How should I pass secrets to a Docker container or Kubernetes pod?',
      a: 'Docker: docker run -e SECRET_KEY=value or --env-file .env. Kubernetes: use Secrets and mount as env vars via envFrom or env with secretKeyRef. For production: use external secret managers (AWS Secrets Manager, HashiCorp Vault) and inject at runtime. Never bake secrets into Docker images (they appear in image layers).',
    },
    {
      q: 'How do I make environment variables available to a systemd service?',
      a: 'In the unit file [Service] section: Environment=KEY=VALUE for inline vars, or EnvironmentFile=/etc/myapp/env for a file (KEY=VALUE format, no export). The service process will have these in its environment. Shell startup files (~/.bashrc, /etc/profile) are NOT sourced by systemd.',
    },
    {
      q: 'What is the difference between login and non-login shells for variable loading?',
      a: 'Login shells (ssh login, su -, terminal emulator at startup) read /etc/profile then ~/.bash_profile or ~/.profile. Non-login interactive shells (terminal tab, bash command) read ~/.bashrc. Many setups source ~/.bashrc from ~/.bash_profile to ensure both get the same vars. Scripts (non-interactive) read neither by default.',
    },
    {
      q: 'What is the difference between .bashrc and .bash_profile?',
      a: '<strong>.bash_profile</strong> (or .profile) is sourced for login shells (SSH sessions, tty login, su -). <strong>.bashrc</strong> is sourced for interactive non-login shells (new terminal tabs, bash within bash). Typically .bash_profile sources .bashrc so both cases see the same config. Set PATH in .bash_profile; aliases and functions in .bashrc.',
    },
    {
      q: 'How do you view all currently set environment variables?',
      a: '<strong>env</strong> or <strong>printenv</strong> shows all exported environment variables. <strong>set</strong> shows all shell variables (including non-exported). <strong>declare -p</strong> shows all with types. To see a specific variable: <code>echo $VAR</code> or <code>printenv VAR</code>. Unset with <code>unset VAR</code>.',
    },
    {
      q: 'How do you permanently add a directory to PATH?',
      a: 'Add to ~/.bash_profile or ~/.bashrc: <code>export PATH="$HOME/bin:$PATH"</code>. Prepend to add priority before system directories; append ($PATH:$HOME/bin) to add lower priority. Then run <code>source ~/.bash_profile</code> to apply. For system-wide changes, edit <strong>/etc/environment</strong> or add a file to <strong>/etc/profile.d/</strong>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'export makes vars inherit to child processes; /etc/environment for PAM-wide; PATH appended or prepended; source ~/.bashrc to reload; never . in PATH.',
    mustKnow: [
      'Shell var = local; export = inherited by child processes',
      'VAR=val cmd sets var for just one command',
      '/etc/environment: KEY=VALUE only (no export, no shell syntax)',
      '/etc/profile.d/*.sh for shell-level system-wide vars',
      'source ~/.bashrc or . ~/.bashrc to apply changes in current shell',
      'Never add . to PATH — security risk',
    ],
    interviewFocus: [
      'What is the difference between shell variables and environment variables?',
      'How do you pass secrets securely to a production application?',
      'How do you make a variable available to all processes, not just the shell?',
      'Why should you never add the current directory (.) to PATH?',
    ],
  };
}
