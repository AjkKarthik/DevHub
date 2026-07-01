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
  selector: 'app-python-packaging',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './packaging.html',
  styleUrl: './packaging.scss'
})
export class PythonPackaging {
  readingTime = 20; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'; since = 'Python 3.8+';
  route = 'py-packaging'; nextRoute = '/python/debugging-profiling'; nextLabel = 'Debugging & Profiling';

  quickRef: QuickRefItem[] = [
    { name: 'python -m venv .venv', type: 'keyword', desc: 'Create a virtual environment. Activate: .venv\\Scripts\\activate (Win) / source .venv/bin/activate (Unix).' },
    { name: 'uv venv && uv pip install', type: 'keyword', desc: 'uv (Astral): Rust-based pip replacement. 10–100× faster. uv pip install -r requirements.txt.' },
    { name: 'pyproject.toml', type: 'keyword', desc: 'PEP 517/518 standard. Defines build system, dependencies, dev tools (black, mypy, pytest) in one file.' },
    { name: 'pip install -e .', type: 'keyword', desc: 'Install package in editable mode (development install). Changes to src/ take effect without reinstall.' },
    { name: 'poetry add / poetry install', type: 'keyword', desc: 'Poetry: dependency resolver + lockfile + publish. poetry.lock pins all transitive deps.' },
    { name: 'python -m build', type: 'keyword', desc: 'Build wheel + sdist. Creates dist/ folder. Requires build package. Used before publishing to PyPI.' },
    { name: 'twine upload dist/*', type: 'keyword', desc: 'Publish to PyPI. twine check dist/* validates first. Use twine upload --repository testpypi for testing.' },
    { name: '__all__ in __init__.py', type: 'keyword', desc: 'Controls what from package import * exports. Also documents the public API of a module.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Virtual Environments — Isolation',
      points: [
        'A virtual environment is an isolated Python installation with its own site-packages. Without one, all projects share the system Python\'s packages — installing packageA==1.0 for one project breaks another project that needs packageA==2.0. Virtual environments solve this: each project gets its own package directory.',
        'python -m venv .venv creates a virtual environment in the .venv folder. Activate it: source .venv/bin/activate (macOS/Linux) or .venv\\Scripts\\activate (Windows). The activated shell prefixes the prompt with (.venv). pip install now installs into .venv. Deactivate with deactivate.',
        'uv (pip install uv) is a Rust-based Python package manager from Astral that replaces pip + virtualenv. It is 10–100× faster due to parallel downloads and a smarter resolver. uv venv; uv pip install fastapi — the commands are familiar but much faster. uv also manages Python versions: uv python install 3.12.',
        '.gitignore .venv/: never commit the virtual environment — it is not portable (absolute paths inside). Commit requirements.txt or pyproject.toml instead. Other developers recreate the environment with pip install -r requirements.txt or poetry install.',
      ]
    },
    {
      heading: 'pyproject.toml — The Modern Standard',
      points: [
        'pyproject.toml (PEP 517/518) replaces setup.py, setup.cfg, MANIFEST.in, and .cfg files. It is the single file for all Python project metadata, dependencies, build system, and tool configuration (black, mypy, pytest, ruff, isort).',
        '[project] section: name, version, description, requires-python, dependencies = ["fastapi>=0.100", "pydantic>=2"]. Optional dependencies: [project.optional-dependencies] dev = ["pytest>=7", "mypy"]. Install dev extras: pip install -e ".[dev]".',
        '[build-system] section: requires = ["setuptools>=68"] and build-backend = "setuptools.backends.legacy:build". Alternative backends: Hatchling, Flit, PDM. The build backend generates wheel and source distributions. python -m build creates dist/*.whl and dist/*.tar.gz.',
        'Tool configuration in pyproject.toml: [tool.mypy], [tool.pytest.ini_options], [tool.black], [tool.ruff]. This eliminates mypy.ini, .flake8, pytest.ini, .isort.cfg — all in one file. Example: [tool.pytest.ini_options] testpaths = ["tests"] asyncio_mode = "auto".',
      ]
    },
    {
      heading: 'Poetry and Dependency Management',
      points: [
        'Poetry (pip install poetry) manages the full lifecycle: create project (poetry new), add dependencies (poetry add fastapi), install (poetry install), build (poetry build), publish (poetry publish). It generates a poetry.lock file that pins ALL transitive dependencies — reproducible installs across machines.',
        'poetry.lock is crucial for reproducibility: poetry install respects the lockfile exactly. poetry update updates dependencies within the version constraints in pyproject.toml and regenerates the lock. Always commit poetry.lock for applications; for libraries, the convention is to NOT commit the lockfile (libraries should work with a range of dependency versions).',
        'Dependency groups: [tool.poetry.group.dev.dependencies] pytest = "^7" mypy = "^1". Install only production: poetry install --without dev. Install everything: poetry install. This separates runtime from development dependencies.',
        'Semver constraints: ^1.2.3 allows >=1.2.3, <2.0.0 (caret = compatible updates). ~1.2.3 allows >=1.2.3, <1.3.0 (tilde = patch updates only). >=1.2,<2 is explicit range. Poetry recommends ^ for libraries (allows minor updates), = for pinned versions in applications.',
      ]
    },
    {
      heading: 'Package Structure and Publishing',
      points: [
        'src layout vs flat layout: src layout places the package in src/mypackage/ — imports from src work only after pip install -e . or from the src dir. This prevents accidentally importing the local development code instead of the installed version. Flat layout: mypackage/ at the root — simpler but easier to confuse dev and installed code.',
        '__init__.py makes a directory a Python package. An empty __init__.py is fine. Use __init__.py to expose the package\'s public API: from .core import MyClass. __all__ = ["MyClass"] documents the public API and controls from mypackage import * behaviour.',
        'Entry points: console_scripts in pyproject.toml create executable scripts: [project.scripts] mycli = "mypackage.cli:main". After pip install, users run mycli directly from the terminal. plugin_groups enables plugin discovery via pkg_resources or importlib.metadata.',
        'Publishing to PyPI: python -m build creates dist/. twine check dist/* validates. twine upload dist/* publishes (requires PyPI account and API token). Test first with twine upload --repository testpypi. Use GitHub Actions: pypa/gh-action-pypi-publish for automated publishing on version tags.',
      ]
    },
    {
      heading: 'Why Dependency Pinning and Lock Files Matter',
      points: [
        'Specifying a loose version range (requests>=2.0) in requirements.txt allows a future pip install to pull a newer, potentially breaking version of a dependency — this is why production deployments typically pin exact versions or use a lock file to guarantee reproducible installs across environments.',
        'A lock file (generated by Poetry, pip-tools, or similar tools) records the exact resolved version of every dependency AND transitive dependency, ensuring that "works on my machine" translates reliably to "works in production," since the dependency graph is captured precisely rather than re-resolved at install time.',
        'Virtual environments isolate a project\'s dependencies from the system Python installation and from other projects — installing packages globally risks version conflicts between projects requiring different versions of the same library, a problem virtual environments (venv, virtualenv, Poetry\'s built-in env management) solve directly.',
        'pyproject.toml has become the modern standard for defining a Python package\'s metadata and dependencies (replacing the older setup.py-based approach), providing a single, tool-agnostic configuration file that build backends, dependency managers, and linters can all read consistently.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'pyproject.toml',
      language: 'typescript',
      code: `# pyproject.toml — full example

[build-system]
requires = ["setuptools>=68", "setuptools-scm>=7"]
build-backend = "setuptools.backends.legacy:build"

[project]
name = "mypackage"
version = "0.1.0"
description = "A sample Python package"
readme = "README.md"
requires-python = ">=3.9"
license = {text = "MIT"}
authors = [{name = "Alice", email = "alice@example.com"}]
keywords = ["example", "python"]
classifiers = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
]
dependencies = [
    "httpx>=0.27",
    "pydantic>=2.0",
    "SQLAlchemy>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7",
    "pytest-asyncio>=0.23",
    "pytest-cov>=4",
    "mypy>=1.8",
    "ruff>=0.4",
]

[project.scripts]
mycli = "mypackage.cli:main"   # installs a 'mycli' command

[tool.setuptools.packages.find]
where = ["src"]   # src layout

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = ["slow: mark test as slow", "integration: integration tests"]

[tool.mypy]
strict = true
ignore_missing_imports = true

[tool.ruff]
line-length = 88
select = ["E", "F", "I"]

[tool.ruff.lint.isort]
known-first-party = ["mypackage"]`
    },
    {
      label: 'Project structure & Poetry',
      language: 'typescript',
      code: `# Recommended src layout
# mypackage/
# ├── src/
# │   └── mypackage/
# │       ├── __init__.py
# │       ├── core.py
# │       └── cli.py
# ├── tests/
# │   ├── conftest.py
# │   └── test_core.py
# ├── pyproject.toml
# └── README.md

# src/mypackage/__init__.py
# from .core import MyClass, helper_fn
# __all__ = ["MyClass", "helper_fn"]

# --- Poetry commands ---
# poetry new myproject           # scaffold new project
# poetry add fastapi             # add to [tool.poetry.dependencies]
# poetry add --group dev pytest  # add to dev group
# poetry install                 # install from poetry.lock
# poetry install --without dev   # production only
# poetry update                  # update deps + regenerate lock
# poetry build                   # creates dist/*.whl + .tar.gz
# poetry publish                 # upload to PyPI

# --- uv (fast alternative to pip) ---
# uv venv
# uv pip install -r requirements.txt   # reads requirements.txt
# uv pip install -e ".[dev]"           # editable + dev extras
# uv pip freeze > requirements.txt     # snapshot current env

# --- requirements.txt generation from pyproject.toml ---
# pip install pip-tools
# pip-compile pyproject.toml --output-file requirements.txt
# pip-compile --extra dev --output-file requirements-dev.txt

# --- Editable install (development) ---
# pip install -e .    # code changes take effect immediately

# --- Build and publish ---
# pip install build twine
# python -m build          # creates dist/
# twine check dist/*       # validate
# twine upload dist/*      # publish to PyPI
# twine upload --repository testpypi dist/*  # test first`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not using a virtual environment (polluting system Python)',
      wrong: `pip install fastapi   # installs to system Python
pip install flask    # another project may need different versions!`,
      right: `python -m venv .venv
source .venv/bin/activate    # (or .venv\\Scripts\\activate on Windows)
pip install fastapi   # installed to .venv only`,
      explanation: 'Installing packages to the system Python creates version conflicts when projects need different versions of the same package. A virtual environment gives each project its own isolated site-packages. Always create a venv at the start of every project. Add .venv to .gitignore — never commit it.'
    },
    {
      title: 'Committing .venv or omitting requirements.txt',
      wrong: `# .gitignore is missing .venv/
git add .venv/    # 1000+ binary files, ~200 MB, breaks other OSes!
# OR
git add .         # no requirements.txt — others can't reproduce the env`,
      right: `# .gitignore:
# .venv/
# __pycache__/
# *.pyc
# dist/

# Generate requirements.txt:
pip freeze > requirements.txt
git add requirements.txt`,
      explanation: 'Virtual environments contain absolute paths and platform-specific binaries — they are not portable. Always add .venv (or venv) to .gitignore. Share environment specs via requirements.txt (pip freeze > requirements.txt) or pyproject.toml. Other developers recreate the environment: pip install -r requirements.txt.'
    },
    {
      title: 'Using setup.py in new projects instead of pyproject.toml',
      wrong: `# setup.py — the 2010s way
from setuptools import setup
setup(name="mypackage", install_requires=["requests"])`,
      right: `# pyproject.toml — PEP 517/518 standard (2018+)
[project]
name = "mypackage"
dependencies = ["requests>=2.31"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.backends.legacy:build"`,
      explanation: 'setup.py is a Python script — it can execute arbitrary code during pip install (a security risk). pyproject.toml is a declarative format. It also consolidates all tool configuration (mypy, pytest, ruff, black) in one file. PEP 517/518 (2018) made pyproject.toml the standard — new projects should not use setup.py.'
    },
    {
      title: 'Not pinning dependencies in production applications',
      wrong: `# requirements.txt
fastapi
pydantic
sqlalchemy
# No versions! Next pip install may get breaking changes`,
      right: `# requirements.txt (generated with pip freeze or pip-compile)
fastapi==0.111.0
pydantic==2.7.1
sqlalchemy==2.0.30
# All transitive deps pinned too`,
      explanation: 'Without pinned versions, pip install may install newer versions with breaking changes. In production deployments, always pin exact versions (using pip freeze or pip-compile from pip-tools). For libraries published to PyPI, use flexible ranges (>=2.0,<3) so users can install alongside other packages. For applications, pin everything.'
    },
  ];

  challenge: Challenge = {
    title: 'Package a CLI Tool',
    language: 'typescript',
    description: 'Write a Python package with pyproject.toml: (1) package mymath with src layout; (2) src/mymath/core.py containing add(a, b) and multiply(a, b); (3) src/mymath/cli.py with a main() that reads two numbers from command line args and prints their sum; (4) pyproject.toml declaring the package, [project.scripts] entry point, and dev dependencies (pytest); (5) tests/test_core.py with two parametrised tests.',
    hints: [
      'Use src/mymath/ layout with __init__.py importing from core',
      '[project.scripts] calc = "mymath.cli:main"',
      'import sys; args = sys.argv[1:] for CLI args',
    ],
    starterCode: `# File layout to create:
# src/mymath/__init__.py
# src/mymath/core.py
# src/mymath/cli.py
# tests/test_core.py
# pyproject.toml

# src/mymath/core.py:
def add(a: float, b: float) -> float:
    pass

def multiply(a: float, b: float) -> float:
    pass`,
    solution: `# src/mymath/core.py
def add(a: float, b: float) -> float:
    return a + b

def multiply(a: float, b: float) -> float:
    return a * b

# src/mymath/__init__.py
from .core import add, multiply
__all__ = ["add", "multiply"]

# src/mymath/cli.py
import sys
from mymath.core import add

def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: calc <a> <b>")
        sys.exit(1)
    a, b = float(sys.argv[1]), float(sys.argv[2])
    print(f"{a} + {b} = {add(a, b)}")

# pyproject.toml
# [project]
# name = "mymath"; version = "0.1.0"; requires-python = ">=3.9"
# [project.scripts]
# calc = "mymath.cli:main"
# [project.optional-dependencies]
# dev = ["pytest>=7"]
# [build-system]
# requires = ["setuptools>=68"]; build-backend = "setuptools.backends.legacy:build"
# [tool.setuptools.packages.find]
# where = ["src"]

# tests/test_core.py
import pytest
from mymath.core import add, multiply

@pytest.mark.parametrize("a,b,expected", [(1,2,3),(0,-1,-1),(2.5,2.5,5.0)])
def test_add(a, b, expected): assert add(a, b) == pytest.approx(expected)

@pytest.mark.parametrize("a,b,expected", [(3,4,12),(0,5,0),(-2,3,-6)])
def test_multiply(a, b, expected): assert multiply(a, b) == pytest.approx(expected)`
  };

  quiz: QuizQuestion[] = [
    { q: 'What problem do virtual environments solve?', options: ['They speed up Python code', 'They isolate package versions per project, preventing conflicts between projects with different requirements', 'They enable multiprocessing', 'They provide type checking'], answer: 1, explanation: 'Without virtual environments, all projects share the system Python\'s site-packages. Installing requests==2.28 for one project and requests==2.31 for another causes conflicts. Virtual environments give each project its own isolated site-packages directory with independent versions.' },
    { q: 'What is pyproject.toml and what does it replace?', options: ['A type annotation file', 'The PEP 517/518 standard for Python packaging — replaces setup.py, setup.cfg, MANIFEST.in, and separate tool configs', 'A Python cache file', 'A requirements file'], answer: 1, explanation: 'pyproject.toml is the modern standard (PEP 517/518, 2018). The [project] section replaces setup.py/setup.cfg for metadata and dependencies. [build-system] configures the build backend. [tool.mypy], [tool.pytest.ini_options], [tool.ruff] replace separate .ini and .cfg files. Everything in one declarative TOML file.' },
    { q: 'What does pip install -e . (editable install) do?', options: ['Installs the package in read-only mode', 'Links the source code directory into site-packages — changes take effect without reinstalling', 'Encrypts the package', 'Installs only into .venv'], answer: 1, explanation: 'Editable install (-e or --editable) creates a .pth file in site-packages that points to your source directory. Changes to src/ are immediately visible without running pip install again. This is the standard development workflow: install once with -e ., edit code, run tests. Without -e, you\'d need to reinstall after every code change.' },
    { q: 'What is the difference between poetry.lock and pyproject.toml?', options: ['They are the same file in different formats', 'pyproject.toml declares dependency ranges; poetry.lock pins all transitive deps to exact versions', 'poetry.lock is for development; pyproject.toml for production', 'poetry.lock is the compiled wheel file'], answer: 1, explanation: 'pyproject.toml declares your direct dependencies with flexible ranges: "fastapi>=0.100". poetry.lock pins every dependency AND its transitive dependencies to exact versions: "fastapi==0.111.0 sha256=abc...". poetry install uses the lockfile for reproducible installs. Commit poetry.lock for applications (reproducibility); the convention for libraries is to not commit it (allow dependency range flexibility for users).' },
    { q: 'What is the purpose of __all__ in a Python module?', options: ['Defines which names are public API — controls what "from module import *" exports', 'Lists all functions in the module', 'Prevents other modules from importing private names', 'Enables tree-shaking of the module'], answer: 0, explanation: '__all__ = ["public_fn", "PublicClass"] declares the public API. from module import * only imports names in __all__ (if defined). Names not in __all__ are still importable explicitly — __all__ does not make them private. It serves as documentation and protects from accidental pollution of namespace with internal helpers when users do star imports.' },
    { q: 'What does python -m build do for a Python project?', options: ['Runs all unit tests', 'Builds sdist (source distribution) and wheel (.whl) in the dist/ directory', 'Installs the package in editable mode', 'Validates pyproject.toml syntax'], answer: 1, explanation: 'python -m build (from the build package, PEP 517) creates two artefacts in dist/: a .tar.gz source distribution (sdist) containing source code, and a .whl wheel (binary distribution) that can be installed without building. Upload to PyPI with twine upload dist/*. This replaces the older python setup.py sdist bdist_wheel workflow.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the src layout and why is it recommended?', a: 'The src layout places your package under src/mypackage/ instead of mypackage/ at the root. Why: without src layout, running tests from the project root may import the local directory instead of the installed package — masking import errors. With src layout, python -c "import mypackage" fails until you run pip install -e . — ensuring your tests always use the installed version. It also prevents accidentally including test files in the wheel. Most modern Python projects (FastAPI, Pydantic, httpx) use the src layout.' },
    { q: 'What is the difference between uv, pip, Poetry, and pip-tools?', a: 'pip: the standard Python package installer — simple, universal, no lockfile. pip-tools: adds pip-compile (generates pinned requirements.txt from pyproject.toml) and pip-sync (installs exactly what\'s in requirements.txt). Poetry: full tool for dependency management, virtual env, build, and publish — has its own resolver and lockfile. uv: Rust-based drop-in replacement for pip + virtualenv — 10–100× faster, compatible with requirements.txt and pyproject.toml. For teams: uv for speed, Poetry for full lifecycle management, pip-tools for projects already using requirements.txt.' },
    { q: 'How do you specify optional extras in pyproject.toml?', a: '[project.optional-dependencies] dev = ["pytest>=7", "mypy>=1"]; docs = ["sphinx", "myst-parser"]. Users install extras with pip install "mypackage[dev]" or pip install -e ".[dev,docs]". Poetry equivalent: [tool.poetry.group.dev.dependencies]. Extras allow packages to have optional features: mypackage[redis] for Redis support, mypackage[postgres] for PostgreSQL — users only install what they need.' },
    { q: 'What is the difference between requirements.txt and pyproject.toml for managing a Python project\'s dependencies?', a: 'requirements.txt is a flat, simple list of pinned (or unpinned) package versions, traditionally generated via pip freeze, with no metadata about the project itself (name, version, entry points) — it describes an environment, not a distributable package. pyproject.toml (the modern, PEP 621-standardized format) is a structured, tool-agnostic configuration file that describes the actual PROJECT — its metadata, dependencies, build system, and optional dependency groups — usable by modern tools (Poetry, Hatch, pip itself via pip install .) to both install dependencies and build/publish the project as a distributable package, replacing the older combination of setup.py and requirements.txt.' },
    { q: 'What is the difference between activating a virtual environment and just calling its Python binary directly (.venv/bin/python)?', a: 'Activating a venv (source .venv/bin/activate) modifies your shell\'s PATH so that plain `python` and `pip` commands resolve to the venv\'s binaries, and typically changes your shell prompt to show which env is active — a convenience for interactive sessions. Calling .venv/bin/python script.py directly achieves the identical isolation without activating anything, since that specific binary already knows its own site-packages location — this is why CI pipelines, Docker containers, and scripts often skip activation entirely and just invoke the venv\'s python binary by full path.' },
    { q: 'What is the difference between pip-tools (pip-compile) and just running pip install with a loose requirements.txt?', a: 'A loose requirements.txt listing only direct dependencies (e.g., requests>=2.0) does not pin the exact versions of TRANSITIVE dependencies (the dependencies of your dependencies) — running pip install on different days, or on different machines, can resolve to different transitive versions, producing inconsistent, non-reproducible environments. pip-tools\' pip-compile reads a high-level requirements.in file and generates a fully pinned requirements.txt with exact versions for every direct AND transitive dependency, including a hash of each, ensuring that pip install -r requirements.txt produces an identical, reproducible environment every single time, anywhere.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Create a venv per project; pyproject.toml is the modern config standard; use pip install -e . for development; poetry.lock pins all transitive deps for reproducibility.',
    mustKnow: [
      'venv: python -m venv .venv. Activate. Add .venv to .gitignore.',
      'pyproject.toml replaces setup.py, setup.cfg, and all tool .ini/.cfg files.',
      'pip install -e . (editable): source changes take effect without reinstall.',
      'requirements.txt: pin exact versions for reproducible production deployments.',
      'poetry.lock: pins all transitive deps; commit for applications, not for libraries.',
      'uv: drop-in pip replacement; 10–100× faster; use uv pip install or uv venv.',
    ],
    interviewFocus: [
      'What is the purpose of a virtual environment?',
      'Why is src layout preferred over flat layout?',
      'What is the difference between pyproject.toml and poetry.lock?',
    ]
  };
}
