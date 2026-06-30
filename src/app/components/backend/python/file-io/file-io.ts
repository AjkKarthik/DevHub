import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-python-file-io',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './file-io.html',
  styleUrl: './file-io.scss'
})
export class PythonFileIo {
  readingTime = 20; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'; since = 'Python 3.4+';
  route = 'py-file-io'; nextRoute = '/python/oop'; nextLabel = 'OOP in Python';

  quickRef: QuickRefItem[] = [
    { name: 'Path(p).read_text()', type: 'method', desc: 'Read entire file as string. Add encoding="utf-8". Raises FileNotFoundError if missing.' },
    { name: 'Path(p).write_text(s)', type: 'method', desc: 'Write string to file (overwrites). Path.write_bytes() for binary. Returns bytes written.' },
    { name: 'Path(p).glob("**/*.py")', type: 'method', desc: 'Recursive glob. Returns generator of Path objects. Use rglob("*.py") as a shortcut for **/*.py.' },
    { name: 'open(f, mode, encoding)', type: 'function', desc: 'Open file. Modes: r, w, a, rb, wb, x (exclusive create). Always specify encoding="utf-8" for text.' },
    { name: 'json.dump / json.load', type: 'function', desc: 'Serialise/deserialise JSON to/from a file object. json.dumps/loads work on strings.' },
    { name: 'csv.DictReader(f)', type: 'class', desc: 'Iterate CSV rows as dicts. DictWriter(f, fieldnames=[...]) writes dicts as rows.' },
    { name: 'Path.exists() / is_file()', type: 'method', desc: 'Check existence. is_dir(), is_symlink(), stat().st_size also available.' },
    { name: 'Path.mkdir(parents=True)', type: 'method', desc: 'Create directory and all parents. exist_ok=True avoids FileExistsError.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'pathlib.Path — The Modern Way',
      points: [
        'pathlib.Path (introduced in Python 3.4) replaces os.path string manipulation with an object-oriented API. Path objects know their parent, name, suffix, and stem. Path("/home/user/data.csv").name → "data.csv"; .stem → "data"; .suffix → ".csv"; .parent → Path("/home/user").',
        'Path / operator joins paths: base = Path("/data"); full = base / "subdir" / "file.txt". This replaces os.path.join and is readable on all platforms. Path objects normalise separators automatically on Windows.',
        'Path.read_text(encoding="utf-8") reads the whole file in one call. Path.write_text(content, encoding="utf-8") writes (overwrites) in one call. For large files, iterate: for line in path.open(encoding="utf-8"): — this streams line by line without loading the whole file.',
        'Path.glob() and Path.rglob() return generators of matching paths. path.glob("*.py") matches in the current directory; path.rglob("*.py") is equivalent to path.glob("**/*.py") and searches recursively. Always check .is_file() on glob results if you only want files.',
      ]
    },
    {
      heading: 'open() and Context Managers',
      points: [
        'Always use open() as a context manager: with open(path, "r", encoding="utf-8") as f: ... — this guarantees the file is closed on exit, even if an exception is raised. Never call f.close() manually.',
        'Text mode (default "r"/"w"/"a"): reads/writes str. Binary mode ("rb"/"wb"): reads/writes bytes. Universal newline handling is automatic in text mode — you almost never need to use os.linesep or "\\r\\n" on Windows.',
        'Mode "x" (exclusive creation) raises FileExistsError if the file already exists — use it when you want to create a file and explicitly reject overwriting. Mode "a" appends to existing files. Mode "r+" opens for reading and writing without truncating.',
        'For large files, iterate the file object directly: for line in f: — this reads one line at a time (O(1) memory). f.readline() reads one line; f.readlines() reads all lines into a list (avoid for large files).',
      ]
    },
    {
      heading: 'JSON, CSV, and YAML',
      points: [
        'json.dumps(obj) → str; json.loads(s) → object. json.dump(obj, f) → writes to file; json.load(f) → reads from file. Use indent=2 in dump() for human-readable output. json.dump does not support datetime — use obj.isoformat() to convert first, or the Pydantic model serialiser.',
        'csv.DictReader(file) iterates rows as dicts keyed by the header row. csv.DictWriter(file, fieldnames=[...]) writes dicts. Always open CSV files with newline="" and encoding="utf-8-sig" (BOM) if Excel compatibility is needed: open(path, "r", newline="", encoding="utf-8").',
        'For YAML, use PyYAML (pip install pyyaml): yaml.safe_load(f) for reading (NOT yaml.load — it executes arbitrary Python). yaml.dump(obj, f) for writing. Use for config files; avoid YAML for data exchange (the format has too many edge cases).',
        'For .env files, use python-dotenv: from dotenv import load_dotenv; load_dotenv(). This loads KEY=value pairs from .env into os.environ. Never hardcode secrets — read from environment variables via os.environ["KEY"] or os.getenv("KEY", default).',
      ]
    },
    {
      heading: 'Binary I/O and Temporary Files',
      points: [
        'Binary files: open(path, "rb") returns bytes. Seek with f.seek(offset, whence): whence 0=start, 1=current, 2=end. f.tell() returns current position. Read a fixed number of bytes: f.read(1024). struct.pack/unpack converts between Python values and binary data formats.',
        'tempfile.NamedTemporaryFile() creates a temp file that is deleted on close. tempfile.TemporaryDirectory() creates a temp directory. Both work as context managers. Use delete=False on NamedTemporaryFile if you need the file to persist after closing (e.g. to pass the path to a subprocess).',
        'shutil provides high-level file operations: shutil.copy(src, dst) copies a file with metadata; shutil.copytree(src, dst) copies a directory tree; shutil.move(src, dst) moves; shutil.rmtree(path) deletes a directory tree. For reading and writing archives, shutil.make_archive() and shutil.unpack_archive().',
        'io.StringIO and io.BytesIO create in-memory file-like objects. Use them when an API requires a file but you have a string or bytes: buf = io.StringIO(); csv.writer(buf).writerows(data); content = buf.getvalue(). Useful in tests to avoid touching the filesystem.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'pathlib & JSON',
      language: 'typescript',
      code: `from pathlib import Path
import json

base = Path("data")
base.mkdir(parents=True, exist_ok=True)

# Write JSON
config = {"version": 1, "debug": True, "limits": [10, 100]}
(base / "config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

# Read JSON
loaded = json.loads((base / "config.json").read_text(encoding="utf-8"))

# Glob — all Python files recursively
src = Path("src")
py_files = [p for p in src.rglob("*.py") if p.is_file()]
print(f"{len(py_files)} Python files found")

# Path operations
p = Path("/home/user/projects/app/main.py")
print(p.name)        # main.py
print(p.stem)        # main
print(p.suffix)      # .py
print(p.parent)      # /home/user/projects/app
print(p.parts)       # ('/', 'home', 'user', 'projects', 'app', 'main.py')

# Build sibling path
config_path = p.with_name("config.yaml")  # /home/user/projects/app/config.yaml
versioned = p.with_stem("main_v2")        # /home/user/projects/app/main_v2.py

# Check existence
if not (base / "output.txt").exists():
    (base / "output.txt").write_text("hello", encoding="utf-8")`
    },
    {
      label: 'open() & CSV',
      language: 'typescript',
      code: `import csv
import json
from pathlib import Path

# Write CSV with DictWriter
data = [
    {"name": "Alice", "age": 30, "city": "London"},
    {"name": "Bob",   "age": 25, "city": "Paris"},
]
csv_path = Path("people.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "age", "city"])
    writer.writeheader()
    writer.writerows(data)

# Read CSV with DictReader
with open(csv_path, "r", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
# rows = [{'name':'Alice','age':'30','city':'London'}, ...]
# Note: all values are strings! Convert explicitly: int(row['age'])

# Stream a large file line by line (O(1) memory)
log_path = Path("server.log")
error_count = 0
if log_path.exists():
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:             # reads one line at a time
            if "ERROR" in line:
                error_count += 1

# Append to log
with open("app.log", "a", encoding="utf-8") as f:
    f.write("2024-01-01 INFO: Server started\\n")

# In-memory file (no disk I/O — good for tests)
import io
buf = io.StringIO()
csv.writer(buf).writerows([["a", 1], ["b", 2]])
content = buf.getvalue()   # "a,1\\r\\nb,2\\r\\n"`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Opening files without specifying encoding',
      wrong: `with open("data.txt", "r") as f:   # uses platform default
    content = f.read()  # fails on Windows if file is UTF-8`,
      right: `with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()`,
      explanation: 'Without encoding, open() uses locale.getpreferredencoding() — which is cp1252 on Windows English. If the file was written with UTF-8 (the de facto web standard), reading it on Windows without encoding="utf-8" may raise UnicodeDecodeError or silently corrupt non-ASCII characters. Always specify encoding="utf-8" for text files.'
    },
    {
      title: 'Loading entire large file into memory',
      wrong: `lines = open("huge.log").readlines()   # loads 1 GB into RAM
errors = [l for l in lines if "ERROR" in l]`,
      right: `errors = []
with open("huge.log", encoding="utf-8") as f:
    for line in f:               # streams: O(1) memory
        if "ERROR" in line:
            errors.append(line)`,
      explanation: 'readlines() reads the entire file into a list of strings. For a 1 GB log file, this allocates ~1 GB of RAM. Iterating the file object directly yields one line at a time, keeping memory usage at O(1). The generator pipeline pattern (read_lines → filter → aggregate) extends this to complex processing chains.'
    },
    {
      title: 'Using yaml.load instead of yaml.safe_load',
      wrong: `import yaml
config = yaml.load(open("config.yaml"))   # executes arbitrary Python!`,
      right: `import yaml
with open("config.yaml", encoding="utf-8") as f:
    config = yaml.safe_load(f)`,
      explanation: 'yaml.load with the default Loader can execute arbitrary Python code embedded in YAML using !! tags. This is a critical security vulnerability if the YAML comes from user input. yaml.safe_load restricts to safe basic types. Always use safe_load for external config.'
    },
    {
      title: 'Using os.path instead of pathlib for new code',
      wrong: `import os
path = os.path.join(base_dir, "sub", "file.txt")
parent = os.path.dirname(path)
os.makedirs(os.path.dirname(path), exist_ok=True)`,
      right: `from pathlib import Path
path = Path(base_dir) / "sub" / "file.txt"
parent = path.parent
parent.mkdir(parents=True, exist_ok=True)`,
      explanation: 'os.path works with plain strings and has a cluttered API. pathlib.Path provides object-oriented path manipulation with cleaner syntax. The / operator for joining, direct attributes for parts, and methods like mkdir, read_text, glob are all more readable. os.path is still used in legacy code and some third-party APIs — know both, prefer pathlib for new code.'
    },
  ];

  challenge: Challenge = {
    title: 'Log File Analyser',
    language: 'typescript',
    description: 'Write a function analyse_log(log_path: str) that reads a log file line by line (streaming — do not load the whole file), counts lines by level (INFO, WARNING, ERROR, DEBUG), and returns a dict with counts. Then write summarise_directory(dir_path: str) that finds all .log files in a directory (recursively) and returns a dict mapping filename → level counts.',
    hints: [
      'Use Path.rglob("*.log") to find log files recursively',
      'Iterate the file object for streaming: for line in f',
      'Use a defaultdict(int) or Counter for counting',
    ],
    starterCode: `from pathlib import Path
from collections import defaultdict

def analyse_log(log_path: str) -> dict[str, int]:
    """Stream log_path and count lines by level."""
    pass

def summarise_directory(dir_path: str) -> dict[str, dict[str, int]]:
    """Find all .log files recursively and return filename → level counts."""
    pass`,
    solution: `from pathlib import Path
from collections import defaultdict

LEVELS = {"INFO", "WARNING", "ERROR", "DEBUG"}

def analyse_log(log_path: str) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    with open(log_path, encoding="utf-8") as f:
        for line in f:
            for level in LEVELS:
                if level in line:
                    counts[level] += 1
                    break
    return dict(counts)

def summarise_directory(dir_path: str) -> dict[str, dict[str, int]]:
    result = {}
    for log_file in Path(dir_path).rglob("*.log"):
        if log_file.is_file():
            result[log_file.name] = analyse_log(str(log_file))
    return result`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Path("a") / "b" / "c.txt" produce?', options: ['A string "a/b/c.txt"', 'A Path object for "a/b/c.txt"', 'A TypeError — Path does not support /', 'A URL'], answer: 1, explanation: 'The / operator on Path objects calls Path.__truediv__, which returns a new Path with the components joined. This is cross-platform: on Windows it uses backslash internally but still accepts forward slash input. The result is always a Path object, not a string.' },
    { q: 'Why should you always use open() with newline="" when reading CSV files?', options: ['To enable UTF-8 decoding', 'To prevent double newline translation — csv module handles newlines itself', 'To read binary mode', 'There is no reason — it makes no difference'], answer: 1, explanation: 'On Windows, Python\'s universal newline mode translates \\r\\n to \\n in text mode. The csv module expects to handle \\r\\n itself. Without newline="", Windows files get double-processed, causing blank rows between data rows. newline="" disables translation, passing raw bytes to csv.' },
    { q: 'What is the difference between json.dump and json.dumps?', options: ['dump is faster', 'dump writes to a file object; dumps returns a string', 'dumps writes to a file; dump returns a string', 'They are identical'], answer: 1, explanation: 'json.dump(obj, file_obj) serialises obj and writes to a file. json.dumps(obj) serialises to a string (the "s" = string). Similarly json.load(f) reads from a file; json.loads(s) parses a string. The pattern: dump/load for files, dumps/loads for strings.' },
    { q: 'When should you use tempfile.NamedTemporaryFile(delete=False)?', options: ['When you want the file deleted immediately after close', 'When you need to pass the file path to another process after closing it', 'When you want to write to memory only', 'Never — delete=False is always wrong'], answer: 1, explanation: 'By default, NamedTemporaryFile is deleted when closed. If a subprocess or external tool needs to open the file by path, you must close the temp file first (to flush it), then pass the path to the subprocess, so delete=False keeps it on disk. Remember to delete it manually afterward: Path(f.name).unlink().' },
    { q: 'What is the difference between "r", "rb", and "rt" modes in open()?', options: ['"r" reads bytes; "rb" reads text; "rt" is invalid', '"r" and "rt" both read text (default encoding); "rb" reads raw bytes without decoding', '"rb" reads faster than "r"', '"rt" requires specifying encoding explicitly'], answer: 1, explanation: '"r" is shorthand for "rt" (read text). Both decode bytes using the platform encoding (UTF-8 on most systems). "rb" opens in binary mode — returns bytes objects, no decoding, no newline translation. Use "rb" for images, zip files, pickled data, or any binary format. Always specify encoding="utf-8" explicitly in text mode to avoid platform-specific encoding surprises.' },
    { q: 'What does pathlib.Path.glob("**/*.py") do?', options: ['Finds only .py files in the immediate directory', 'Recursively finds all .py files under the Path directory', 'Finds .py files two levels deep', 'Raises an error — glob does not support **'], answer: 1, explanation: '** in a glob pattern means "any number of directories". Path(".").glob("**/*.py") yields all .py files recursively. Equivalent to rglob("*.py") which is a convenience method. Use glob() with ** instead of os.walk() for simple recursive file searches — it returns Path objects with full path methods rather than strings.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between Path.read_text() and open() with f.read()?', a: 'Path.read_text(encoding="utf-8") is a one-liner convenience method that opens the file, reads all content, and closes it. open() with a context manager is more flexible: you can iterate line by line (memory-efficient for large files), seek, or do partial reads. For small config files or scripts, read_text() is cleaner. For large files or streaming, use open() with for line in f.' },
    { q: 'How do you safely handle files that might not exist?', a: 'Two approaches: (1) LBYL (Look Before You Leap): if path.exists(): ... else: ... — check before opening. (2) EAFP (Easier to Ask Forgiveness than Permission): try: content = path.read_text() except FileNotFoundError: content = default — catch the exception. Python style prefers EAFP for file operations because it avoids TOCTOU (time-of-check-to-time-of-use) race conditions between checking and opening. Use path.exists() when you need to branch on existence without reading.' },
    { q: 'How do you read a file in chunks for very large binary files?', a: 'Use open() in binary mode and read in fixed-size chunks: with open(path, "rb") as f: while chunk := f.read(8192): process(chunk). The walrus operator (:=) assigns and checks in one step. This is the standard pattern for hashing large files (hashlib.md5), uploading streams, or processing binary formats without loading everything into memory.' },
    { q: 'Why does using the with statement (with open(path) as f:) matter for file handling, beyond just convenience?', a: 'The with statement guarantees the file is properly closed (via the context manager\'s __exit__) even if an exception is raised while reading or writing — without it, a forgotten f.close() call, or an exception that skips past it, leaves the file handle open, which can leak file descriptors (eventually hitting OS limits on a long-running process) and risks data not being flushed to disk for write operations. with open(...) as f: is the idiomatic, exception-safe pattern that should be used for essentially all file I/O in Python.' },
    { q: 'What is the difference between opening a file in text mode versus binary mode, and when does it matter?', a: 'Text mode (the default, "r" or "w") automatically decodes bytes to str using a specified or platform-default encoding (typically UTF-8) and handles newline translation across platforms (converting \\r\\n to \\n on read). Binary mode ("rb" or "wb") returns raw bytes objects with no decoding or newline translation at all. Binary mode is required for non-text files (images, compiled binaries, serialized data formats) and is also safer for any file where encoding is uncertain or where you need byte-exact control, since text mode\'s automatic decoding will raise a UnicodeDecodeError on bytes that do not match the assumed encoding.' },
    { q: 'Why is explicitly specifying encoding="utf-8" recommended even though Python has a default encoding?', a: 'Python\'s default text encoding is platform-dependent (often UTF-8 on Linux/macOS but historically cp1252 or similar on Windows in some configurations), meaning code that omits the encoding argument can behave correctly on a developer\'s machine but fail or silently produce mojibake (corrupted text) when run on a different OS or in a different locale. Explicitly passing encoding="utf-8" to every open() call removes this platform ambiguity entirely, making file I/O behavior consistent and predictable across all environments — Python 3.15+ is moving toward UTF-8 as a true universal default (PEP 686), but explicit is still safer for code targeting earlier versions.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Use pathlib.Path for all path operations, always specify encoding="utf-8", stream large files with iteration, and json.dump/load vs dumps/loads for files vs strings.',
    mustKnow: [
      'Path / operator joins paths; .parent, .name, .stem, .suffix are attributes.',
      'Always encoding="utf-8" with open() and Path.read_text/write_text.',
      'Iterate file object for streaming (O(1) memory): for line in f.',
      'csv: newline="" prevents double newline translation on Windows.',
      'json.dump/load for files; json.dumps/loads for strings.',
      'yaml.safe_load, never yaml.load — prevents code execution attacks.',
    ],
    interviewFocus: [
      'How do you process a 10 GB log file without running out of memory?',
      'Why is yaml.load a security risk?',
      'Explain the EAFP vs LBYL approach for file handling.',
    ]
  };
}
