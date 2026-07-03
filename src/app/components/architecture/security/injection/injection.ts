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

const quickRef: QuickRefItem[] = [
  { name: 'SQL Injection',     type: 'keyword', desc: 'Attacker-supplied SQL fragments alter a query\'s logic — prevented by parameterized queries.' },
  { name: 'Parameterized Query', type: 'keyword', desc: 'Query with placeholders ($1, ?, @p1) — DB driver handles value escaping, no injection possible.' },
  { name: 'ORM',               type: 'keyword', desc: 'Object-Relational Mapper — generates parameterized queries by default (Prisma, Sequelize, TypeORM).' },
  { name: 'Command Injection', type: 'keyword', desc: 'User input passed to shell commands — prevented by avoiding shell execution or using argument arrays.' },
  { name: 'LDAP Injection',    type: 'keyword', desc: 'Unescaped input in LDAP filters — use LDAP-safe encoding or parameterized LDAP libraries.' },
  { name: 'NoSQL Injection',   type: 'keyword', desc: 'Attacker passes objects (MongoDB $where/$ne) to bypass query filters — validate input type strictly.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'SQL Injection — The Classic Attack',
    points: [
      'Injection occurs when user-supplied data is interpreted as code rather than data.',
      'Classic example: `SELECT * FROM users WHERE username = \'' + 'username' + '\'` — if username is `admin\'--`, the query becomes `SELECT * FROM users WHERE username = \'admin\'--\'` — the WHERE clause is bypassed.',
      'Impact: data exfiltration (dump entire tables), authentication bypass, data modification, stored procedure execution, sometimes OS command execution (xp_cmdshell in MSSQL).',
      'Root cause: string concatenation to build queries. The fix is categorical: NEVER concatenate user input into SQL strings.',
    ],
  },
  {
    heading: 'Parameterized Queries — The Fix',
    points: [
      'Parameterized queries (prepared statements) separate the query structure from the data. The database driver handles value escaping — user input can never alter query logic.',
      'PostgreSQL: `SELECT * FROM users WHERE email = $1` — the `$1` is a placeholder; the actual value is passed separately.',
      'The database processes the query template first, compiles it, then substitutes the parameter — even `\' OR 1=1 --` is treated as a literal string value.',
      'ORMs (Prisma, TypeORM, Sequelize) generate parameterized queries by default — using them correctly eliminates SQL injection for CRUD operations. Raw queries with ORMs need the same care.',
    ],
  },
  {
    heading: 'Command Injection',
    points: [
      'Command injection: user input passed to `exec()`, `system()`, or shell calls — attacker appends `; rm -rf /` or `| cat /etc/passwd`.',
      'Example: `exec("ping " + userInput)` — if userInput is `8.8.8.8 && cat /etc/passwd`, both commands run.',
      'Fix: avoid shell execution entirely when possible. Use language-native libraries (Node.js `dns.lookup()` instead of `exec("nslookup")`). If shell is necessary, pass arguments as an array (not a string) — avoids shell parsing.',
      '`child_process.execFile(cmd, [arg1, arg2])` is safer than `exec(cmd + " " + arg1)` — no shell interpretation.',
    ],
  },
  {
    heading: 'NoSQL Injection',
    points: [
      'MongoDB queries accept objects, not just strings. If user input is passed directly as a query object, an attacker can inject operators.',
      'Example: `db.users.findOne({ username: req.body.username, password: req.body.password })`. If body is `{ username: "admin", password: { "$ne": null } }`, the `$ne` operator bypasses password checking.',
      'Fix: validate that string fields are strings before using them in queries. Reject objects where scalars are expected. Use schema validation (Zod, Joi) at the API boundary.',
      'LDAP injection: similar pattern — user input in LDAP filter strings. Use an LDAP library with parameterized filter support or escape special characters (`(`, `)`, `*`, `\\`, `NUL`).',
    ],
  },
  {
    heading: 'Beyond SQL Injection: NoSQL, Command, and LDAP Injection',
    points: [
      'NoSQL injection targets document databases like MongoDB — unsanitized user input passed directly into a query object can inject operators (a login bypass sending { "password": { "$ne": null } } to match any non-null password) that a naive string-concatenation defense would never catch.',
      'OS command injection occurs when user input is passed to a shell command (child_process.exec in Node.js, os.system in Python) without proper escaping — an attacker can append shell metacharacters (;, |, &&) to execute arbitrary commands on the host.',
      'The universal defense across all injection types is the same principle: never build a command, query, or expression by concatenating untrusted input into a string — use parameterized queries, prepared statements, or an ORM/query builder that separates code from data structurally.',
      'Allowlisting valid input patterns (rather than trying to blocklist known-bad characters) is more robust against injection — blocklists are perpetually incomplete, since attackers continuously discover new bypass encodings and edge cases.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Parameterized Queries',
    language: 'typescript',
    code: `import { Pool } from 'pg';
const db = new Pool();

// ── NEVER: string concatenation ──────────────────────────────────────────────
// UNSAFE:
// const rows = await db.query(\`SELECT * FROM users WHERE email = '\${email}'\`);

// ── ALWAYS: parameterized queries ────────────────────────────────────────────
async function getUserByEmail(email: string) {
  const { rows } = await db.query(
    'SELECT id, email, display_name FROM users WHERE email = $1',
    [email] // value passed separately — never concatenated into the SQL string
  );
  return rows[0] ?? null;
}

async function loginUser(email: string, passwordHash: string) {
  const { rows } = await db.query(
    'SELECT id, email FROM users WHERE email = $1 AND password_hash = $2',
    [email, passwordHash]
  );
  return rows[0] ?? null;
}

// ── With Prisma ORM (parameterized by default) ────────────────────────────────
const user = await prisma.user.findFirst({
  where: { email, active: true },
  select: { id: true, email: true, displayName: true },
});

// ── Prisma raw query — still use template literal tag, NOT string concat ──────
// SAFE: Prisma.$queryRaw uses parameterized internally
const results = await prisma.$queryRaw\`SELECT * FROM users WHERE email = \${email}\`;

// ── Search with LIKE — still parameterized ────────────────────────────────────
async function searchUsers(term: string) {
  const { rows } = await db.query(
    'SELECT id, email FROM users WHERE email ILIKE $1',
    [\`%\${term.replace(/[%_\\\\]/g, '\\\\$&')}%\`] // escape LIKE wildcards
  );
  return rows;
}`,
  },
  {
    label: 'Command Injection Prevention',
    language: 'typescript',
    code: `import { execFile } from 'child_process';
import { promisify } from 'util';
import dns from 'dns/promises';

const execFileAsync = promisify(execFile);

// ── NEVER: shell string concatenation ────────────────────────────────────────
// UNSAFE:
// exec('ping ' + userInput); // if userInput = '8.8.8.8 && rm -rf /'

// ── SAFE Option 1: Use language-native APIs ───────────────────────────────────
async function lookupDns(hostname: string): Promise<string[]> {
  // dns.lookup doesn't exec a shell at all
  const addresses = await dns.resolve4(hostname);
  return addresses;
}

// ── SAFE Option 2: execFile with argument array (no shell interpretation) ──────
async function pingHost(hostname: string): Promise<string> {
  // Validate input FIRST — allowlist format
  if (!/^[a-zA-Z0-9.-]{1,253}$/.test(hostname)) {
    throw new Error('Invalid hostname format');
  }

  // execFile passes hostname as a separate argument — shell never sees it
  const { stdout } = await execFileAsync('ping', ['-c', '3', hostname], {
    timeout: 5000,
    maxBuffer: 10 * 1024,
  });
  return stdout;
}

// ── NoSQL injection prevention ────────────────────────────────────────────────
import { z } from 'zod';

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1).max(128),
  // Zod ensures these are strings — attacker cannot send { "$ne": null }
});

app.post('/auth/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password } = parsed.data; // guaranteed to be strings
  const user = await db.users.findOne({ email }); // safe
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'String concatenation in SQL queries',
    wrong: `const rows = await db.query(\`SELECT * FROM users WHERE email = '\${req.body.email}'\`);`,
    right: `const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);`,
    explanation: 'String concatenation in SQL allows any input to alter the query structure. Parameterized queries separate data from query logic — the database driver handles escaping. This is the #1 SQL injection prevention technique.',
  },
  {
    title: 'Using exec() with user-supplied shell strings',
    wrong: `const { exec } = require('child_process');
exec('convert ' + req.body.filename + ' output.pdf'); // command injection`,
    right: `const { execFile } = require('child_process');
execFile('convert', [validatedFilename, 'output.pdf']); // arguments array — no shell`,
    explanation: '`exec()` passes the string to a shell, which interprets special characters (`;`, `&&`, `|`, backticks). `execFile()` with an argument array does NOT invoke a shell — each argument is passed directly to the process.',
  },
  {
    title: 'Not validating MongoDB input types (NoSQL injection)',
    wrong: `// Attacker sends { password: { "$ne": null } } — bypasses check
const user = await User.findOne({ email: req.body.email, password: req.body.password });`,
    right: `// Validate types with Zod before using in queries
const { email, password } = LoginSchema.parse(req.body); // guaranteed strings
const user = await User.findOne({ email, password: hash(password) });`,
    explanation: 'MongoDB operators like `$ne`, `$gt`, `$where` can be injected if user input is not validated to be a string before being used as a query field. Schema validation (Zod, Joi) rejects objects where strings are expected.',
  },
  {
    title: 'Using ORM raw queries with string concatenation',
    wrong: `// Raw query with Prisma — loses injection protection
await prisma.$queryRawUnsafe(\`SELECT * FROM users WHERE role = '\${role}'\`);`,
    right: `// Use tagged template literal — Prisma parameterizes automatically
await prisma.$queryRaw\`SELECT * FROM users WHERE role = \${role}\`;`,
    explanation: 'ORMs like Prisma use parameterized queries for their standard API. When you drop to raw SQL, you must still use parameterized syntax. `$queryRawUnsafe` disables this protection — avoid it. Use the template literal form `$queryRaw\`...\`` which Prisma parameterizes.',
  },
];

const challenge: Challenge = {
  title: 'Safe Query Builder',
  language: 'typescript',
  description: `Implement buildSafeQuery(table: string, filters: Record<string, string | number>): { sql: string; params: (string | number)[] } that:
1. Validates table name against an allowlist: ['users', 'orders', 'products']
2. Builds a parameterized SELECT query with WHERE conditions
3. Returns { sql: 'SELECT * FROM users WHERE email = $1 AND active = $2', params: ['a@b.com', 1] }
4. Throws 'Invalid table' if table not in allowlist`,
  hints: [
    'Build WHERE clauses with $1, $2 placeholders',
    'Push values to params array in the same order',
    'Object.entries() to iterate filters',
  ],
  starterCode: `function buildSafeQuery(table: string, filters: Record<string, string | number>): { sql: string; params: (string | number)[] } {
  const ALLOWED_TABLES = ['users', 'orders', 'products'];
  if (!ALLOWED_TABLES.includes(table)) throw new Error('Invalid table');
  // TODO: build parameterized query
  return { sql: '', params: [] };
}`,
  solution: `function buildSafeQuery(table: string, filters: Record<string, string | number>): { sql: string; params: (string | number)[] } {
  const ALLOWED_TABLES = ['users', 'orders', 'products'];
  if (!ALLOWED_TABLES.includes(table)) throw new Error('Invalid table');

  const params: (string | number)[] = [];
  const conditions: string[] = [];

  for (const [col, val] of Object.entries(filters)) {
    params.push(val);
    conditions.push(\`\${col} = \$\${params.length}\`);
  }

  const where = conditions.length > 0 ? \` WHERE \${conditions.join(' AND ')}\` : '';
  return { sql: \`SELECT * FROM \${table}\${where}\`, params };
}

const q = buildSafeQuery('users', { email: 'a@b.com', active: 1 });
console.log(q.sql);    // SELECT * FROM users WHERE email = $1 AND active = $2
console.log(q.params); // ['a@b.com', 1]`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why do parameterized queries prevent SQL injection?',
    options: [
      'They encrypt the SQL string before sending to the database',
      'The query structure is compiled first; user values are substituted later as data — they cannot alter query logic',
      'They reject all special characters from user input',
      'They use a whitelist of allowed SQL keywords',
    ],
    answer: 1,
    explanation: 'The database engine compiles the query template (with placeholders) before it ever sees user data. When the value is later substituted, the engine treats it as a data value only — even `\' OR 1=1 --` is just a string value, not SQL syntax.',
  },
  {
    q: 'Which Node.js function is safer for executing external programs with user-supplied arguments?',
    options: [
      'exec(command + " " + userArg) — standard shell execution',
      'execFile(command, [userArg]) — passes arguments as an array, no shell interpretation',
      'eval("run " + command)',
      'spawn(command + userArg)',
    ],
    answer: 1,
    explanation: '`execFile()` with an arguments array does not invoke a shell — arguments are passed directly to the process. `exec()` passes the entire string through a shell (`/bin/sh -c`), which interprets special shell characters, enabling command injection.',
  },
  { q: 'What is a second-order SQL injection attack?', options: ['SQL injection in a stored procedure that runs after the initial request completes', 'Input that appears safe when stored but becomes malicious when retrieved and used in a subsequent SQL query', 'A SQL injection targeting a secondary read replica database', 'An injection attack that occurs after two authentication checks have passed'], answer: 1, explanation: 'Second-order injection: the attacker submits input that looks harmless and is stored in the database. The application escapes it correctly at input time. Later, a different query retrieves the stored value and uses it in another SQL query without parameterization, triggering the injection. Example: a user registers with the username admin--. The registration uses parameterized queries, so the value is stored safely. Later, a password-change feature retrieves the stored username and builds a query: UPDATE users SET password=... WHERE username= + storedUsername. The attacker stored admin-- which comments out the WHERE clause. Defense: parameterize ALL queries that use data from the database, even if that data was originally safely stored.' },
  { q: 'What is LDAP injection and how does it differ from SQL injection?', options: ['LDAP injection targets authentication cookies; SQL injection targets database queries', 'LDAP injection manipulates LDAP filter syntax to bypass authentication or extract directory data; similar to SQL injection but targets directory services instead of relational databases', 'LDAP injection is a read-only attack; SQL injection can modify data', 'LDAP injection only affects Windows Active Directory; SQL injection affects all databases'], answer: 1, explanation: 'LDAP injection targets LDAP directory queries. Example: a login form constructs: (&(uid=INPUT)(userPassword=PASS)). Attacker enters uid: *))(uid=* to produce: (&(uid=*))(&(uid=*))(userPassword=PASS). The first filter (&(uid=*)) matches all users, bypassing authentication. Defense: use an LDAP library that supports parameterized filters. Validate input to allow only expected characters (alphanumeric). Encode special LDAP characters: (, ), *, \, /, NUL before interpolating into filters. Use an LDAP framework that handles encoding automatically.' },
  { q: 'What is command injection and what is the safest way to call external programs?', options: ['Injecting shell metacharacters into OS commands; safest fix is input validation with a denylist', 'Injecting shell metacharacters into OS command strings, causing arbitrary command execution; safest approach is to avoid shell strings entirely by passing arguments as an array to exec APIs', 'Injecting malicious data into log files that are later processed by scripts', 'A type of injection that overwrites PATH to redirect command execution to malicious binaries'], answer: 1, explanation: 'Command injection: the application builds OS command strings with user input. The shell interprets metacharacters: ; & |  ` \\n. Input: filename.txt; rm -rf / causes the shell to execute rm -rf / after the original command. Safe patterns: never pass user input through a shell. Use exec-without-shell APIs that accept argument arrays: Python subprocess.run([cmd, arg1, arg2]) instead of subprocess.run(cmd + userInput, shell=True). In Node.js: child_process.execFile(cmd, [arg1]) instead of exec(cmd + userInput). If a shell is unavoidable, use strict allowlist validation and escaping appropriate to the specific shell.' },
  { q: 'What is XML injection and how do XXE (XML External Entity) attacks work?', options: ['Injecting SQL through XML API parameters that are internally converted to database queries', 'Injecting malicious XML that defines external entity references; the XML parser fetches the referenced URL or file and includes the content in the response, exposing server files or enabling SSRF', 'A denial-of-service attack using deeply nested XML to exhaust the XML parser', 'Injecting JavaScript into XML attributes to trigger XSS when the XML is rendered as HTML'], answer: 1, explanation: 'XXE (XML External Entity): an attacker submits XML with an entity definition: <!DOCTYPE root [<!ENTITY xxe SYSTEM file:///etc/passwd>]><root>&xxe;</root>. The XML parser fetches /etc/passwd and includes its content in the parsed document, which the application may return in the response. Impact: arbitrary file read, SSRF (using http:// entity to probe internal services), denial-of-service (billion laughs entity expansion). Defense: disable external entity processing in the XML parser: in Java, set XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES to false. In Python, use defusedxml. Use JSON instead of XML when external entity features are not needed.' },
];

const qna: QnaItem[] = [
  {
    q: 'Can an ORM completely eliminate SQL injection risk?',
    a: 'ORMs eliminate SQL injection for their standard query API (which uses parameterized queries internally). Risks remain when: <ol><li>Using raw query methods (<code>$queryRawUnsafe</code>, <code>sequelize.query()</code> with string concatenation)</li><li>Building dynamic column names or ORDER BY clauses — these cannot be parameterized; use an allowlist of valid column names instead</li><li>Passing untrusted data to <code>where</code> clauses with operators in ORMs that allow object operators (Mongoose <code>$where</code>)</li></ol>ORMs reduce but do not eliminate the risk — validate input types and avoid raw string concatenation even with an ORM.',
  },
  {
    q: 'Why does a code review or automated scanner often miss second-order SQL injection even when it correctly flags first-order injection?',
    a: 'Most static analysis and manual review focus on tracing user input directly from an HTTP request parameter to a query string within the SAME request/function — a well-known, easily-traced data flow. Second-order injection breaks that trace: the tainted value enters the system via one code path (registration, a safe parameterized INSERT) and re-emerges as dangerous input in a COMPLETELY DIFFERENT, later code path (an admin report, a batch job) that a reviewer or scanner analyzing either function in isolation has no reason to suspect is receiving attacker-controlled data — the "taint" needs to be tracked across the database round-trip and across unrelated code paths, which most simple input-to-query tracing tools and quick code reviews do not do.',
  },
  { q: 'What is NoSQL injection and what types of databases are vulnerable?', a: 'NoSQL injection attacks document-oriented, key-value, and graph databases using their query mechanisms. MongoDB example: a login query: db.users.find({ username: req.body.username, password: req.body.password }). An attacker sends: { username: admin, password: { $ne: null } }. The $ne (not-equal) operator causes the query to find the admin user where password is not null (i.e., any password), bypassing authentication. Vulnerable: MongoDB ($where, $ne, $gt operators), CouchDB (JavaScript query functions), Neo4j (Cypher injection). Defense: use typed input validation (reject non-string values for username/password). Use the ORM query builder instead of raw query objects. Sanitize inputs to strip MongoDB operator keys starting with $.' },
  { q: 'How do you prevent template injection vulnerabilities?', a: 'Template injection: user input is embedded directly into a server-side template that is then evaluated. The template engine executes the injected code with server-side privileges. Example: a Python Flask endpoint: render_template_string(Hello + request.args.get(name)). Input: {{config}} renders the Flask application config including the secret key. Or: {{7*7}} returns 49, confirming the template is evaluated. Defense: never concatenate user input into template strings. Pass user data as template context variables (render_template(template.html, name=name)), not as part of the template itself. Use sandboxed template engines that restrict access to sensitive objects. If user-defined templates are a feature, use a sandbox (Jinja2 SandboxedEnvironment) and thoroughly review what objects are accessible.' },
  { q: 'What is XPath injection and how is it mitigated?', a: 'XPath injection: applications that authenticate or query data against XML using XPath expressions with unvalidated user input. Example: //users/user[username/text()=INPUT and password/text()=PASS]. Input: admin or 1=1 or (1=1. The resulting XPath becomes: //users/user[username/text()=admin or 1=1 or (1=1 and ...] which matches any user. Mitigation: use parameterized XPath queries. In Java, use XPathVariableResolver to bind variables rather than string concatenation. Input validation: allow only expected characters in username and password fields. Principle of least privilege: the XML file or service account should be read-only if write access is not needed.' },
  { q: 'What is ReDoS and how can regex patterns be vulnerable to it?', a: 'ReDoS (Regular Expression Denial-of-Service): certain regular expressions exhibit exponential backtracking on inputs designed to trigger worst-case behavior. Vulnerable pattern: (a+)+ — the nested quantifier causes the regex engine to try every possible combination of groupings as it backtracks. Input: aaaaaaaaaaaaaaab causes exponential backtracking, consuming all CPU. Attack: if a web application uses a vulnerable regex to validate user-submitted input, an attacker submits a crafted string that causes the regex to run for minutes, blocking the event loop (Node.js) or the thread. Mitigations: use linear-time regex engines (RE2 in Go, or re2 binding in Node.js). Avoid nested quantifiers (a+)+ and alternations with overlapping matches. Set regex timeout limits. Validate input length before applying complex regexes.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Injection = user input treated as code — prevent SQL injection with parameterized queries, command injection with argument arrays, NoSQL injection with type validation.',
  mustKnow: [
    'SQL injection: NEVER concatenate user input into SQL — always use parameterized queries ($1, ?, @p)',
    'Parameterized queries: query compiled first, data substituted later — injection impossible',
    'Command injection: exec() with strings is dangerous; execFile() with argument arrays is safe',
    'NoSQL injection: validate input is a string before using as a MongoDB filter field',
    'ORM raw queries: still need parameterized syntax — $queryRawUnsafe is dangerous',
    'Second-order injection: data from DB can also be unsafe if later used in string-concatenated queries',
  ],
  interviewFocus: [
    'Why do parameterized queries prevent SQL injection?',
    'What is the difference between exec() and execFile() for security?',
    'How can MongoDB queries be vulnerable to injection?',
  ],
};

@Component({
  selector: 'app-sec-injection',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './injection.html',
  styleUrl: './injection.scss',
})
export class SecInjection {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
