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
  selector: 'app-linux-essential-commands',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './essential-commands.html',
  styleUrl: './essential-commands.scss'
})
export class LinuxEssentialCommands {

  quickRef: QuickRefItem[] = [
    { name: 'ls -lah', type: 'syntax', desc: 'List all files with human-readable sizes and hidden files' },
    { name: 'find . -name "*.log" -mtime -7', type: 'syntax', desc: 'Find .log files modified in the last 7 days' },
    { name: 'grep -rn "pattern" dir/', type: 'syntax', desc: 'Recursive grep with line numbers' },
    { name: 'sed -i "s/old/new/g" file', type: 'syntax', desc: 'In-place substitution (all occurrences)' },
    { name: "awk '{print $2}' file", type: 'syntax', desc: 'Print the second whitespace-delimited field' },
    { name: 'tar -czf out.tar.gz dir/', type: 'syntax', desc: 'Create gzip-compressed tar archive' },
    { name: 'tar -xzf archive.tar.gz', type: 'syntax', desc: 'Extract a .tar.gz archive' },
    { name: 'xargs -I{} cmd {}', type: 'syntax', desc: 'Run cmd for each line from stdin, substituting {}' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Navigation and File Operations',
      points: [
        'ls -l shows permissions, owner, size, and modification time. -a includes hidden files (starting with .). -h makes sizes human-readable.',
        'cp -r copies directories recursively. cp -p preserves timestamps and permissions. cp -a = -dR --preserve=all (archive mode).',
        'mv renames or moves files. On the same filesystem it is instant (just updates directory entry). Across filesystems it copies then deletes.',
        'rm -rf deletes recursively without prompting. There is no recycle bin — deletion is permanent.',
        'mkdir -p creates parent directories as needed without error if they exist.',
      ],
    },
    {
      heading: 'find — Filesystem Search',
      points: [
        '-name is case-sensitive; -iname is case-insensitive. Use quotes to prevent shell glob expansion.',
        '-type f = files, -type d = directories, -type l = symlinks.',
        '-mtime -7 = modified less than 7 days ago; -mtime +30 = more than 30 days ago. -newer file = newer than a reference file.',
        '-exec cmd {} \\; runs cmd once per result. -exec cmd {} + batches results into one invocation (much faster).',
        '-size +100M finds files over 100 MB. -empty finds empty files or directories.',
      ],
    },
    {
      heading: 'grep, sed, awk — Text Processing',
      points: [
        'grep filters lines matching a pattern. -v inverts (non-matching). -c counts matches. -l lists matching files only. -E enables extended regex.',
        'sed is a stream editor. s/pattern/replacement/g = global substitution. d = delete lines matching pattern. p = print (with -n, only matching).',
        "awk processes fields. NR = current line number, NF = number of fields, $0 = whole line, $1..$n = fields. FS sets field separator (-F',').",
        'Pipelines chain tools: grep "ERROR" app.log | awk \'{print $1, $5}\' | sort | uniq -c | sort -rn',
      ],
    },
    {
      heading: 'Archiving and Compression',
      points: [
        'tar itself does not compress — combine with -z (gzip), -j (bzip2), -J (xz). -c = create, -x = extract, -t = list, -v = verbose, -f = file.',
        'gzip compresses a single file and replaces it. gunzip decompresses. gzip -k keeps the original. gzip -9 = max compression.',
        'zip/unzip create .zip archives (cross-platform compatible). zip -r archive.zip dir/ recurses.',
        'rsync -avz src/ dest/ synchronises directories, transferring only changed files. --delete removes files not in source.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Navigation',
      language: 'bash',
      code: `# Listing
ls -lah              # long + hidden + human-readable
ls -lt               # sort by modification time (newest first)
ls -lS               # sort by size (largest first)
ls -R                # recursive listing
tree -L 2            # directory tree, 2 levels deep (needs tree installed)

# Copy and move
cp -av src/ dest/                    # verbose + archive mode
cp --backup=numbered file dest/      # numbered backups
mv file{,.bak}                       # rename file → file.bak (brace expansion)

# Delete safely
rm -i *.txt          # prompt for each file
find . -name "*.tmp" -delete         # delete without shell glob limit`,
    },
    {
      label: 'find & grep',
      language: 'bash',
      code: `# find examples
find /var/log -name "*.log" -mtime -7 -size +1M
find . -type f -newer /tmp/ref -exec ls -lh {} +
find /home -empty -type f -delete           # remove empty files
find . -type f | wc -l                      # count files

# grep examples
grep -rn "TODO" src/                        # recursive, line numbers
grep -v "^#" /etc/ssh/sshd_config           # exclude comment lines
grep -E "^(ERROR|WARN)" app.log             # extended regex alternation
grep -c "404" access.log                    # count matching lines
grep -A3 -B1 "Exception" app.log            # 3 after, 1 before context
zgrep "pattern" file.log.gz                 # grep inside gzip files`,
    },
    {
      label: 'sed & awk',
      language: 'bash',
      code: `# sed
sed -i 's/localhost/0.0.0.0/g' config.yaml  # in-place replace
sed -n '10,20p' file                         # print lines 10-20
sed '/^$/d' file                             # delete blank lines
sed 's/^/# /' file                           # prepend # to every line

# awk
awk '{print $1}' access.log                  # first field (IP)
awk -F: '{print $1, $3}' /etc/passwd         # user and UID
awk 'NR==1 || /ERROR/' app.log               # header + ERROR lines
awk '{sum += $5} END {print sum}' log        # sum column 5

# tar + compression
tar -czf backup.tar.gz /etc/nginx/           # create
tar -tzf backup.tar.gz                       # list contents
tar -xzf backup.tar.gz -C /tmp/restore/     # extract to dir
# xz (better compression, slower)
tar -cJf backup.tar.xz large-dir/`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running rm -rf without checking the path',
      wrong: 'rm -rf $DIR/',
      right: 'echo "Will delete: $DIR" && [[ -n "$DIR" ]] && rm -rf "$DIR"',
      explanation: 'If $DIR is unset or empty, rm -rf / or rm -rf "" can delete everything. Always validate the variable is non-empty before deleting.',
    },
    {
      title: 'Using grep without -E for multiple patterns',
      wrong: 'grep "ERROR|WARN" file',
      right: 'grep -E "ERROR|WARN" file  # or grep -e ERROR -e WARN file',
      explanation: 'In basic regex (BRE), | is a literal pipe. You need -E (extended regex) or \\| to use alternation.',
    },
    {
      title: 'Forgetting quotes around find -name patterns',
      wrong: 'find . -name *.log',
      right: 'find . -name "*.log"',
      explanation: 'Without quotes, the shell expands *.log before find sees it. If there are matching files in the current dir, find gets literal filenames, not a pattern.',
    },
    {
      title: 'Using cat to parse structured files with awk/sed',
      wrong: 'cat file | awk ...',
      right: "awk '...' file",
      explanation: 'Useless use of cat (UUOC). Most text tools (awk, sed, grep, sort) accept filenames directly. Eliminating the cat reduces a process and makes intent clearer.',
    },
    {
      title: 'Forgetting -i backup suffix with sed on macOS',
      wrong: "sed -i 's/old/new/' file  # works on Linux, fails on macOS",
      right: "sed -i '' 's/old/new/' file  # macOS requires empty string after -i",
      explanation: "BSD sed (macOS) requires an extension argument after -i, even if empty ('').  GNU sed (Linux) does not. Use sed -i.bak for cross-platform compatibility.",
    },
  ];

  challenge: Challenge = {
    title: 'Log Line Parser',
    language: 'typescript',
    description: 'Write a function that parses nginx access log lines and extracts the IP, HTTP method, path, and status code. Return null for lines that do not match the pattern.',
    hints: [
      'nginx combined log format: IP - - [date] "METHOD /path HTTP/1.1" STATUS bytes ...',
      'Use a regex to capture the groups',
      'Return null for non-matching lines',
    ],
    starterCode: `interface LogEntry { ip: string; method: string; path: string; status: number; }

function parseNginxLog(line: string): LogEntry | null {
  // Parse: 192.168.1.1 - - [01/Jan/2024] "GET /api/users HTTP/1.1" 200 512
}

const line = '192.168.1.1 - - [01/Jan/2024:10:00:00 +0000] "GET /api/users HTTP/1.1" 200 512';
console.log(parseNginxLog(line));
// { ip: '192.168.1.1', method: 'GET', path: '/api/users', status: 200 }`,
    solution: `interface LogEntry { ip: string; method: string; path: string; status: number; }

function parseNginxLog(line: string): LogEntry | null {
  const re = /^(\\S+) \\S+ \\S+ \\[[^\\]]+\\] "(\\w+) (\\S+) [^"]*" (\\d+)/;
  const m = line.match(re);
  if (!m) return null;
  return { ip: m[1], method: m[2], path: m[3], status: parseInt(m[4], 10) };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which find option executes a command once per result file?',
      options: ['-exec cmd {} +', '-exec cmd {} \\;', '-run cmd {}', '-do cmd {}'],
      answer: 1,
      explanation: '-exec cmd {} \\; runs cmd once per found file. -exec cmd {} + batches all results into a single invocation (faster when processing many files).',
    },
    {
      q: 'What does grep -v do?',
      options: ['Verbose output', 'Invert match (show non-matching lines)', 'Case-insensitive match', 'Show version'],
      answer: 1,
      explanation: '-v inverts the match: grep -v "^#" filters OUT lines starting with #, showing only lines that do NOT match.',
    },
    {
      q: 'Which tar flags create a gzip-compressed archive?',
      options: ['-cjf', '-czf', '-cZf', '-cxf'],
      answer: 1,
      explanation: '-c = create, -z = gzip compression, -f = file. So -czf archive.tar.gz creates a gzip-compressed archive. -j = bzip2, -J = xz.',
    },
    {
      q: 'In awk, what does NR represent?',
      options: ['Number of fields', 'Current record (line) number', 'Non-recursive flag', 'Newline regex'],
      answer: 1,
      explanation: 'NR is the current line/record number. NF is the number of fields on the current line. $0 is the whole line, $1..$NF are individual fields.',
    },
    {
      q: 'What is the difference between > and >> for output redirection?',
      options: [
        '> appends to a file; >> overwrites it',
        '> overwrites (truncates) a file; >> appends to it',
        '> redirects stderr; >> redirects stdout',
        'Both overwrite; the difference is only in the file descriptor used',
      ],
      answer: 1,
      explanation: '> redirects stdout to a file, truncating it first. >> appends to the file without truncating. Use 2> for stderr, 2>&1 to redirect stderr to the same destination as stdout.',
    },
    {
      q: 'How does xargs differ from piping to a command?',
      options: [
        'xargs passes stdin as a file argument; pipe passes it as stdin',
        'xargs converts stdin lines into command arguments; pipe passes data as stdin to the next command',
        'xargs is only for the find command',
        'There is no functional difference',
      ],
      answer: 1,
      explanation: 'A pipe passes stdin to the next command. xargs reads stdin and converts it to command-line arguments — useful when commands do not accept stdin (e.g., rm, mkdir). Example: find . -name *.tmp | xargs rm.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use find -exec vs xargs?',
      a: 'Use -exec {} + (batched) for simple cases — it\'s built into find and handles filenames with spaces safely. Use xargs when you need xargs-specific options (-P for parallelism, -I{} for substitution). Pipe to xargs -0 when combined with find -print0 to handle filenames with special characters safely.',
    },
    {
      q: 'What is the difference between awk and sed?',
      a: 'sed is optimised for line-by-line text substitution and deletion (s//, d, p commands). awk is a full programming language for field-based processing — it understands columns/fields and supports variables, arrays, arithmetic, and control flow. For simple substitutions use sed; for column extraction or aggregation use awk.',
    },
    {
      q: 'How do I search inside compressed log files?',
      a: 'Use zgrep for .gz files, bzgrep for .bz2, or zcat file.gz | grep pattern. For arbitrary formats, zstdcat / lzcat / xzcat | grep work similarly. journalctl handles its own compression transparently.',
    },
    {
      q: 'How do you recursively find files by name?',
      a: '<code>find /path -name "*.log"</code> finds files matching the pattern. Key options: <code>-type f</code> (files only), <code>-type d</code> (directories), <code>-mtime -7</code> (modified in last 7 days), <code>-size +100M</code> (larger than 100MB). Combine with <code>-exec cmd {} \;</code> or <code>-exec cmd {} +</code> (batched) to act on results.',
    },
    {
      q: 'What does the tee command do?',
      a: '<strong>tee</strong> reads from stdin and writes to both stdout and one or more files simultaneously. Example: <code>cmd | tee output.log</code> shows output in terminal and saves it. <code>tee -a</code> appends instead of overwriting. Useful in pipelines where you want to both see output and save it.',
    },
    {
      q: 'How do you search for text across multiple files recursively?',
      a: '<code>grep -r "pattern" /path</code> or <code>grep -rn "pattern" /path</code> (with line numbers). Options: <code>-l</code> (filenames only), <code>-i</code> (case-insensitive), <code>-E</code> (extended regex). Modern alternative: <strong>ripgrep</strong> (rg) is faster and respects .gitignore. <code>grep -r --include="*.py" "pattern" .</code> filters by extension.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Linux core tools: find (locate files), grep (search text), sed (transform streams), awk (field processing), tar (archive).',
    mustKnow: [
      'find . -name "*.log" -mtime -7 — find by name and age',
      '-exec {} + batches results; -exec {} \\; runs once per file',
      'grep -rn -E "pattern" — recursive, line numbers, extended regex',
      'sed -i s/old/new/g — in-place substitution (all occurrences)',
      "awk -F: '{print $1}' — field splitting with custom delimiter",
      'tar -czf = create+gzip; -xzf = extract; -tzf = list',
    ],
    interviewFocus: [
      'How do you find files larger than 500 MB modified in the last 24 hours?',
      'Write a one-liner to count unique IPs in an nginx access log',
      'How does find -exec {} + differ from -exec {} \\;?',
      'How would you replace a string in 100 files at once?',
    ],
  };
}
