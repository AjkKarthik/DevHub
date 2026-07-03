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
  selector: 'app-python-pytest',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pytest.html',
  styleUrl: './pytest.scss'
})
export class PythonPytest {
  readingTime = 22; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'pytest 7+';
  route = 'py-pytest'; nextRoute = '/python/packaging'; nextLabel = 'Python Packaging & venv';

  quickRef: QuickRefItem[] = [
    { name: '@pytest.fixture', type: 'decorator', desc: 'Reusable setup. Scopes: function (default), class, module, session. yield for teardown.' },
    { name: '@pytest.mark.parametrize', type: 'decorator', desc: 'Run one test with multiple input/output combinations. @pytest.mark.parametrize("x,y", [(1,2),(3,4)]).' },
    { name: 'monkeypatch.setattr', type: 'method', desc: 'Patch object attributes/functions. monkeypatch.setenv for env vars. Reverted after test.' },
    { name: 'pytest.raises(ExcType)', type: 'function', desc: 'Assert an exception is raised. with pytest.raises(ValueError) as exc: ... exc.value for the exception.' },
    { name: 'tmp_path', type: 'keyword', desc: 'Built-in fixture: provides a temporary directory as pathlib.Path, unique per test, auto-cleaned.' },
    { name: 'capsys.readouterr()', type: 'method', desc: 'Capture stdout/stderr. capsys is a built-in fixture. capsys.readouterr() → (out, err) strings.' },
    { name: '@pytest.mark.asyncio', type: 'decorator', desc: 'From pytest-asyncio. Runs async test functions. Configure with asyncio_mode="auto" in pytest.ini.' },
    { name: 'pytest -x --lf -k "name"', type: 'keyword', desc: '-x stop on first failure; --lf rerun last failed; -k filter by name/keyword; -v verbose; -s show prints.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'pytest Basics — Fixtures and Assertions',
      points: [
        'pytest discovers tests by looking for functions named test_* in files named test_*.py or *_test.py. Tests are plain functions (or methods in a TestCase class for unittest compatibility). Use assert for all assertions — pytest introspects the assert statement and provides detailed failure messages without assertRaises boilerplate.',
        '@pytest.fixture creates reusable test setup. Fixtures are injected by name: def test_something(my_fixture): — pytest looks for a fixture named my_fixture. Fixtures can yield instead of return: code before yield is setup; code after yield is teardown (guaranteed to run even if the test fails).',
        'Fixture scopes: function (default — new fixture per test), class (once per test class), module (once per module), session (once per entire test run). Use broader scopes for expensive setup (DB connection, Docker container). Scoped fixtures still have teardown — the code after yield runs at the end of the scope.',
        'conftest.py is a special file where shared fixtures live. pytest automatically loads conftest.py files in the test directory and all parent directories. Fixtures in conftest.py are available to all tests in the same directory and subdirectories without importing.',
      ]
    },
    {
      heading: 'Parametrize and Markers',
      points: [
        '@pytest.mark.parametrize("arg1,arg2", [(v1,v2),(v3,v4),...]) runs the test function once for each set of arguments, with clear names in the output: test_add[1-2] and test_add[3-4]. Indirect parametrize: @pytest.mark.parametrize("fixture_name", [value], indirect=True) passes values to a fixture instead of the test.',
        'Custom markers: @pytest.mark.slow, @pytest.mark.integration. Register in pytest.ini or pyproject.toml: [tool.pytest.ini_options] markers = ["slow: mark test as slow"]. Run specific marks: pytest -m slow; skip all others: pytest -m "not slow". Marks can be combined: -m "slow and integration".',
        '@pytest.mark.skip(reason="...") unconditionally skips. @pytest.mark.skipif(condition, reason="...") skips based on a condition. @pytest.mark.xfail(reason="...") marks an expected failure — the test passes if it fails (XFAIL) and fails if it passes (XPASS). strict=True makes XPASS a failure.',
        'pytest-randomly randomises test execution order to catch order-dependent tests. pytest-cov integrates coverage reporting: pytest --cov=mymodule --cov-report=term-missing. pytest-timeout: pytest --timeout=5 kills tests that run longer than 5 seconds.',
      ]
    },
    {
      heading: 'Mocking and Patching',
      points: [
        'monkeypatch (built-in fixture) patches attributes, functions, env vars, and dict items — automatically restored after the test. monkeypatch.setattr(module, "function_name", mock_fn). monkeypatch.setenv("KEY", "value"). monkeypatch.delenv("KEY"). monkeypatch.setitem(dict, key, value).',
        'unittest.mock.patch can be used as a decorator or context manager: with patch("mymodule.requests.get") as mock_get: mock_get.return_value = Mock(status_code=200, json=lambda: {"ok": True}). patch() targets the import location — patch where the name is used, not where it is defined.',
        'MagicMock auto-creates methods and attributes. mock.return_value sets what the mock returns when called. mock.side_effect sets an exception to raise or a function to call. mock.assert_called_once_with(arg) verifies the mock was called exactly once with specific args.',
        'pytest-mock (pip install pytest-mock) provides a mocker fixture: mocker.patch("module.fn"). It is a more pytest-idiomatic alternative to unittest.mock.patch — avoids the decorator/context-manager boilerplate and integrates with pytest\'s teardown.',
      ]
    },
    {
      heading: 'Async Testing and Integration Tests',
      points: [
        'pytest-asyncio enables testing async code. Mark async test functions with @pytest.mark.asyncio, or configure asyncio_mode = "auto" in pytest.ini to auto-detect async tests. Async fixtures also work: @pytest.fixture async def async_client(): async with AsyncClient(...) as c: yield c.',
        'Testing FastAPI with AsyncClient: use httpx.AsyncClient(app=app, base_url="http://test") inside an async pytest function. Override FastAPI dependencies for testing: app.dependency_overrides[get_db] = lambda: test_db. Clear overrides in a fixture\'s teardown.',
        'Database integration tests: use pytest-django\'s db fixture (marks test as needing DB access) or create a SQLite in-memory DB per test: @pytest.fixture def db_session(): engine = create_engine("sqlite:///:memory:"); Base.metadata.create_all(engine); session = SessionLocal(); yield session; session.close(). Transactions: begin a transaction before the test, rollback after — keeps the DB clean.',
        'pytest-factory-boy and faker: factory_boy generates test fixture objects (User factories, Post factories) from model definitions. It integrates with Django ORM and SQLAlchemy. faker generates realistic fake data (names, emails, addresses) for property-based tests and fixtures.',
      ]
    },
    {
      heading: 'Fixtures and Test Isolation in pytest',
      points: [
        'pytest fixtures provide reusable setup (and automatic teardown, via yield) that can be shared across many tests without copy-pasting setup code — declaring a fixture as a function parameter injects it automatically, and pytest resolves fixture dependencies transitively.',
        'Fixture scope (function, class, module, session) controls how often a fixture is re-created — a function-scoped fixture guarantees complete test isolation (each test gets a fresh instance) at the cost of re-running potentially expensive setup, while a session-scoped fixture trades some isolation for significant speed on expensive resources like a database connection.',
        'Tests that share mutable state (through a module or session-scoped fixture without careful reset logic) can produce order-dependent failures — a test passing in isolation but failing when run after another test is a strong signal of an isolation bug, usually traced to state leaking through an improperly-scoped fixture.',
        'Parametrized tests (@pytest.mark.parametrize) run the same test logic against multiple input/expected-output pairs without duplicating the test function, both reducing boilerplate and making it trivial to add a new edge case to an existing test\'s coverage.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fixtures & parametrize',
      language: 'typescript',
      code: `import pytest
from pathlib import Path

# ---- The code under test ----
class Stack:
    def __init__(self): self._data = []
    def push(self, item): self._data.append(item)
    def pop(self): return self._data.pop()
    def peek(self): return self._data[-1]
    @property
    def is_empty(self): return len(self._data) == 0

# ---- Fixture with teardown ----
@pytest.fixture
def stack():
    s = Stack()
    yield s
    # teardown: nothing needed for Stack, but shows the pattern

# ---- Basic test using fixture ----
def test_push_pop(stack):
    stack.push(1)
    stack.push(2)
    assert stack.pop() == 2
    assert stack.pop() == 1
    assert stack.is_empty

def test_peek_does_not_remove(stack):
    stack.push(42)
    assert stack.peek() == 42
    assert not stack.is_empty   # still there

def test_pop_empty_raises(stack):
    with pytest.raises(IndexError):
        stack.pop()

# ---- Parametrize: test many inputs at once ----
@pytest.mark.parametrize("items,expected_top", [
    ([1], 1),
    ([1, 2, 3], 3),
    (["a", "b"], "b"),
])
def test_push_many(stack, items, expected_top):
    for item in items:
        stack.push(item)
    assert stack.peek() == expected_top

# ---- Module-scoped expensive fixture ----
@pytest.fixture(scope="module")
def heavy_resource():
    print("\\nSetting up heavy resource...")
    resource = {"db": "connected"}   # simulated
    yield resource
    print("\\nTearing down heavy resource...")

# ---- tmp_path built-in fixture ----
def test_file_writing(tmp_path):
    p = tmp_path / "output.txt"
    p.write_text("hello pytest", encoding="utf-8")
    assert p.read_text() == "hello pytest"

# ---- capsys: capture output ----
def test_prints(capsys):
    print("hello world")
    out, err = capsys.readouterr()
    assert "hello world" in out`
    },
    {
      label: 'Mocking & async tests',
      language: 'typescript',
      code: `import pytest
from unittest.mock import patch, MagicMock, AsyncMock

# ---- Code under test ----
import requests as requests_lib

def fetch_user(user_id: int) -> dict:
    resp = requests_lib.get(f"https://api.example.com/users/{user_id}")
    resp.raise_for_status()
    return resp.json()

# ---- monkeypatch: patch in-process ----
def test_fetch_user_success(monkeypatch):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"id": 1, "name": "Alice"}
    mock_resp.raise_for_status.return_value = None

    monkeypatch.setattr(requests_lib, "get", lambda url: mock_resp)
    result = fetch_user(1)
    assert result["name"] == "Alice"

# ---- patch: context manager style ----
def test_fetch_user_http_error():
    with patch("requests.get") as mock_get:
        mock_get.return_value.raise_for_status.side_effect = Exception("404")
        with pytest.raises(Exception, match="404"):
            fetch_user(999)

# ---- Async tests with pytest-asyncio ----
import asyncio

async def async_double(n: int) -> int:
    await asyncio.sleep(0)   # simulated I/O
    return n * 2

@pytest.mark.asyncio
async def test_async_double():
    result = await async_double(5)
    assert result == 10

# ---- FastAPI async test ----
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

app = FastAPI()

@app.get("/hello")
def hello():
    return {"msg": "hello"}

@pytest.mark.asyncio
async def test_fastapi_hello():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/hello")
    assert resp.status_code == 200
    assert resp.json() == {"msg": "hello"}

# conftest.py (shared fixtures):
# @pytest.fixture(scope="session")
# def anyio_backend(): return "asyncio"
# @pytest.fixture async def async_db(): async with AsyncSession(...) as s: yield s`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not using yield for fixture teardown',
      wrong: `@pytest.fixture
def db_session():
    session = create_session()
    return session    # no teardown! session never closed on test failure`,
      right: `@pytest.fixture
def db_session():
    session = create_session()
    try:
        yield session
    finally:
        session.close()   # always runs, even on test failure`,
      explanation: 'Returning from a fixture provides no teardown. If the test fails, cleanup code after the return is never reached. Yield fixtures have an implicit try/finally: the yield pauses the fixture, the test runs, and then execution resumes after yield — in a finally block for guaranteed cleanup. This is the correct pattern for resources (DB sessions, file handles, temp files).'
    },
    {
      title: 'Patching at the definition site instead of the use site',
      wrong: `# In requests.py: def get(url): ...
# In mymodule.py: from requests import get
with patch("requests.get") as mock:   # wrong — patches original, not the imported name
    result = mymodule.fetch()`,
      right: `# Patch where the name is USED:
with patch("mymodule.get") as mock:   # patches the 'get' name in mymodule's namespace
    result = mymodule.fetch()`,
      explanation: 'When you do from requests import get, mymodule now has its own reference to the get function. Patching requests.get replaces it in the requests module, but mymodule.get still points to the original. Patch the target module\'s attribute: monkeypatch.setattr(mymodule, "get", mock_fn) or patch("mymodule.get").'
    },
    {
      title: 'Using mutable default in fixture or sharing state between tests',
      wrong: `results = []   # module-level list — shared across ALL tests!

def test_one():
    results.append(1)
    assert len(results) == 1

def test_two():
    results.append(2)
    assert len(results) == 1   # FAILS: results has [1, 2] from test_one!`,
      right: `@pytest.fixture
def results():
    return []   # fresh list for each test

def test_one(results):
    results.append(1); assert len(results) == 1

def test_two(results):
    results.append(2); assert len(results) == 1`,
      explanation: 'Module-level state shared between tests causes order-dependent failures — tests pass individually but fail when run together. Each test must start with a clean state. Use fixtures (which create fresh instances per test by default) for any shared state. If you see tests that fail when run in a different order, module-level shared mutable state is usually the cause.'
    },
    {
      title: 'Not registering custom marks — warnings spam',
      wrong: `@pytest.mark.slow
def test_database():
    ...
# PytestUnknownMarkWarning: Unknown pytest.mark.slow`,
      right: `# pyproject.toml:
# [tool.pytest.ini_options]
# markers = [
#     "slow: marks tests as slow",
#     "integration: marks integration tests",
# ]

@pytest.mark.slow
def test_database():
    ...`,
      explanation: 'Unregistered marks cause PytestUnknownMarkWarning. Register custom marks in pyproject.toml under [tool.pytest.ini_options] markers, or in pytest.ini under [pytest] markers. This also enables -m "slow" filtering and provides documentation for what each mark means.'
    },
  ];

  challenge: Challenge = {
    title: 'Cart Service Tests',
    language: 'typescript',
    description: 'Write pytest tests for this Cart class: Cart with add_item(name, price, qty), remove_item(name), total property, and clear(). Tests must include: (1) fixture that provides a Cart with pre-loaded items; (2) @parametrize test for total with multiple item combinations; (3) test for remove_item raising KeyError for missing item; (4) test that clear() empties the cart. All in a conftest.py fixture where appropriate.',
    hints: [
      '@pytest.fixture def cart(): c = Cart(); c.add_item(...); yield c',
      '@pytest.mark.parametrize("items, expected", [...])',
      'with pytest.raises(KeyError): cart.remove_item("nonexistent")',
    ],
    starterCode: `import pytest

class Cart:
    def __init__(self): self._items: dict[str, tuple[float, int]] = {}
    def add_item(self, name: str, price: float, qty: int = 1): self._items[name] = (price, qty)
    def remove_item(self, name: str): del self._items[name]
    def clear(self): self._items.clear()
    @property
    def total(self) -> float:
        return sum(p * q for p, q in self._items.values())

# Write tests below:`,
    solution: `import pytest

class Cart:
    def __init__(self): self._items: dict[str, tuple[float, int]] = {}
    def add_item(self, name: str, price: float, qty: int = 1): self._items[name] = (price, qty)
    def remove_item(self, name: str): del self._items[name]
    def clear(self): self._items.clear()
    @property
    def total(self) -> float:
        return sum(p * q for p, q in self._items.values())

@pytest.fixture
def loaded_cart():
    c = Cart()
    c.add_item("apple", 0.50, 3)   # 1.50
    c.add_item("milk", 1.20, 2)    # 2.40
    yield c
    c.clear()

def test_total(loaded_cart):
    assert loaded_cart.total == pytest.approx(3.90)

@pytest.mark.parametrize("items,expected", [
    ([], 0.0),
    ([("a", 1.0, 2)], 2.0),
    ([("a", 1.0, 1), ("b", 2.0, 3)], 7.0),
])
def test_total_parametrize(items, expected):
    c = Cart()
    for name, price, qty in items:
        c.add_item(name, price, qty)
    assert c.total == pytest.approx(expected)

def test_remove_missing_raises(loaded_cart):
    with pytest.raises(KeyError):
        loaded_cart.remove_item("nonexistent")

def test_clear_empties_cart(loaded_cart):
    loaded_cart.clear()
    assert loaded_cart.total == 0.0`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between return and yield in a pytest fixture?', options: ['return is synchronous; yield is asynchronous', 'return provides setup only; yield enables teardown after the test', 'yield is only for generator fixtures that yield multiple values', 'They are identical for fixtures'], answer: 1, explanation: 'A fixture that returns a value has no teardown — if the test fails, nothing runs after the return. A fixture that yields pauses after yielding, lets the test run, then resumes for teardown (code after yield) — guaranteed even if the test raises an exception. Use yield for any fixture that needs cleanup (close DB session, delete temp files, restore config).' },
    { q: 'What does @pytest.mark.parametrize do?', options: ['Marks a test as slow', 'Runs the test function multiple times with different arguments', 'Groups tests into a class', 'Skips the test conditionally'], answer: 1, explanation: '@pytest.mark.parametrize("arg1,arg2", [(v1,v2),(v3,v4)]) generates multiple test instances from a list of argument tuples. Each combination appears as a separate test in the output (test_fn[v1-v2], test_fn[v3-v4]). If one fails, others still run. It replaces repetitive test functions testing the same logic with different inputs.' },
    { q: 'Where should you define shared fixtures in a pytest project?', options: ['In every test file that needs them', 'In conftest.py files — they are auto-loaded and available to tests in the same directory and below', 'In a fixtures.py file that you import', 'Only in the top-level __init__.py'], answer: 1, explanation: 'conftest.py is automatically discovered by pytest without imports. Fixtures defined there are available to all tests in the same directory and subdirectories. conftest.py files can be nested for more granular sharing. The root conftest.py is for session-wide fixtures; sub-directory conftest.py files scope fixtures to that subtree.' },
    { q: 'How do you patch a function that is imported into a module?', options: ['Patch the original module where the function is defined', 'Patch the module where the function is USED (its local name in the target module)', 'You cannot patch imported functions', 'Patch the function name globally in builtins'], answer: 1, explanation: 'When a module does from requests import get, it creates a local name get in that module\'s namespace. Patching requests.get replaces it in the requests module, but the target module still holds its own reference. You must patch it where it is used: monkeypatch.setattr(mymodule, "get", mock) or patch("mymodule.get").' },
    { q: 'What does pytest.raises() do?', options: ['Skips a test that raises an exception', 'Asserts that a specific exception is raised — the test passes only if the exception occurs', 'Logs exceptions without failing', 'Converts exceptions to warnings'], answer: 1, explanation: 'with pytest.raises(ValueError) as exc_info: fn() asserts that fn() raises ValueError. If no exception is raised or a different exception is raised, the test fails. exc_info.value gives the exception instance; exc_info.match("pattern") checks the exception message with re.search. Use it to explicitly test error paths.' },
    { q: 'What is the scope parameter in @pytest.fixture?', options: ['The test file the fixture applies to', 'How long the fixture instance lives: function (default), class, module, session, or package', 'The visibility of the fixture (public/private)', 'The number of tests the fixture can run concurrently'], answer: 1, explanation: 'scope="function" (default) creates and tears down the fixture for each test. scope="module" creates it once per file, reusing across all tests in that module. scope="session" creates it once for the entire test run — ideal for expensive setup like DB connections or test servers. Higher scope = fewer setups = faster runs, but shared state means tests can influence each other.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do you test code that depends on the current time?', a: 'Inject time as a dependency: instead of calling datetime.now() directly, accept a clock parameter (a callable returning datetime, defaulting to datetime.now). In tests, pass a fixed datetime lambda: lambda: datetime(2024, 1, 15). Alternatively, use freezegun (pip install freezegun): @freeze_time("2024-01-15") def test_something(): assert datetime.now().year == 2024. freezegun patches datetime, time, and calendar modules. monkeypatch.setattr(module, "datetime", FakeDatetime) is a lighter alternative for simple cases.' },
    { q: 'What is the difference between unit tests, integration tests, and end-to-end tests in a Python project?', a: 'Unit tests test one function or class in isolation — all dependencies mocked. Fast, deterministic. Integration tests test that multiple components work together — may use a real DB (SQLite), real HTTP server (TestClient), or real file system. Slower, but catch integration bugs. End-to-end tests test the full system as a user would — real browser (Playwright/Selenium), real DB, real external APIs. Very slow, brittle. Typical ratio: 70% unit, 20% integration, 10% E2E. Use pytest for all three; mark integration tests to run them separately.' },
    { q: 'How do you measure test coverage and what is a good coverage target?', a: 'pytest-cov: pytest --cov=mypackage --cov-report=term-missing. Reports which lines were not executed. 80–90% coverage is typical for well-tested projects. 100% is not always achievable or valuable — focus on covering business logic, edge cases, and error paths. Coverage does not tell you tests are correct, only that the lines were executed. A test that always passes without asserting anything has 100% coverage but zero value. Coverage is a floor (minimum), not a ceiling.' },
    { q: 'What is the difference between pytest fixtures and setUp/tearDown methods from unittest, and why are fixtures considered more powerful?', a: 'unittest\'s setUp/tearDown run before/after every test method in a class with no parameterization or composability — every test in the class gets the exact same setup regardless of what it actually needs. pytest fixtures are explicitly requested by name as test function parameters (only the fixtures a test actually declares are set up), can be composed and depend on each other, support multiple scopes (function, class, module, session) to control how often expensive setup re-runs, and can be parameterized to automatically run the same test multiple times with different fixture values — giving far more flexibility than unittest\'s fixed lifecycle hooks.' },
    { q: 'Can you stack multiple @pytest.mark.parametrize decorators on the same test function, and what does that produce?', a: 'Yes — stacking two @pytest.mark.parametrize decorators produces the CARTESIAN PRODUCT of both parameter sets, not a zipped pairing. @parametrize("a", [1,2]) above @parametrize("b", ["x","y"]) on the same function generates 4 test runs: (1,x), (1,y), (2,x), (2,y). This is useful for testing every combination of two independent input dimensions, but can explode test counts quickly if you stack several multi-value parametrizations, so use it deliberately rather than by habit.' },
    { q: 'What is fixture "finalization order" when multiple fixtures depend on each other, and why does it matter for teardown?', a: 'Fixtures tear down in the REVERSE order they were set up — if fixture B depends on fixture A (requests it as a parameter), A is set up first, then B; on teardown, B\'s cleanup runs first, then A\'s. This matters when teardown has dependencies of its own: a database-session fixture that depends on a connection fixture must close the session (using the still-open connection) before the connection fixture itself closes the connection — pytest\'s reverse-order guarantee makes this safe automatically, without manual ordering code.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'pytest discovers test_* functions, injects @fixture by name, uses yield for teardown, @parametrize for data-driven tests, and monkeypatch for attribute patching.',
    mustKnow: [
      '@fixture with yield: setup before yield, teardown after (always runs).',
      'conftest.py: shared fixtures, auto-loaded, no imports needed.',
      '@parametrize("x,y", [(v1,v2)]): generates one test per row.',
      'monkeypatch.setattr patches the USE site, not the definition site.',
      'pytest.raises(ExcType) asserts an exception. exc.value for details.',
      'pytest-asyncio + @pytest.mark.asyncio for testing async code.',
    ],
    interviewFocus: [
      'What is the difference between return and yield in a fixture?',
      'Why must you patch at the use site, not the definition site?',
      'How do you write parametrised tests for edge cases?',
    ]
  };
}
