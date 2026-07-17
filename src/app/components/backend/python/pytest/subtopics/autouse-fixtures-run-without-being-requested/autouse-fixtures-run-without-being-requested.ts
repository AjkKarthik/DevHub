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
  templateUrl: './autouse-fixtures-run-without-being-requested.html',
  styleUrl: './autouse-fixtures-run-without-being-requested.scss'
})
export class AutouseFixturesRunWithoutBeingRequestedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A fixture a test never asked for can still run before it',
      points: [
        'The main page\'s own theory describes fixtures entirely through the "injected by name" model: "Fixtures are injected by name: def test_something(my_fixture): — pytest looks for a fixture named my_fixture." That description is accurate for the vast majority of fixtures, but pytest\'s own docs describe a genuinely different mechanism for fixtures marked autouse=True: "\'Autouse\' fixtures are a convenient way to make all tests automatically request them." A test function can be affected by a fixture it never named as a parameter at all.',
        'pytest\'s own docs are explicit about the visibility gap this creates: a test can be influenced by an autouse fixture "even though neither test requested it." The fixture\'s scope (function, class, module, session — the same scopes the main page already covers) still determines how often it re-runs, but WHICH tests it applies to is no longer governed by which tests explicitly list it as a parameter — it is every test within reach of that scope, automatically.',
        'This is not a rare or discouraged pattern — it is the documented, intended way to apply setup/teardown that every test in some scope genuinely needs without forcing every single test function\'s signature to spell it out (resetting a global cache, seeding a random seed, enabling strict warnings-as-errors, starting a test-wide timer). The main page\'s own conftest.py section already explains fixtures there are "available... without importing" — autouse takes that one step further: available AND automatically applied.',
      ]
    },
    {
      heading: 'Documented, precise ordering — and the silent-signal risk that comes with it',
      points: [
        'pytest\'s own fixture reference documents the exact ordering rules across three explicit rules: "Higher-scoped fixtures are executed first" (session before module before class before function); "Autouse fixtures are executed first within their scope" (an autouse fixture runs before a non-autouse fixture at the SAME scope, even one a test explicitly requested); and "fixtures of the same order execute based on dependencies" (a fixture that itself depends on another fixture runs after that dependency).',
        'This ordering is deterministic and documented, not an implementation detail to guess at — a session-scoped autouse fixture is guaranteed to run before a function-scoped one, and any autouse fixture is guaranteed to run before same-scope fixtures a test explicitly asked for by name, regardless of the order those parameters happen to be listed in the test function\'s signature.',
        'The real-world risk this subtopic is built around: an autouse fixture living in conftest.py silently applies to every test in that directory and every subdirectory beneath it, with absolutely no signal in an individual test function\'s own code that it is running at all — reading test_something(some_fixture): tells you exactly what that test depends on, but reading a bare def test_something(): tells you nothing about whatever autouse fixtures from any enclosing conftest.py might still be quietly running around it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An autouse fixture affects a test that never mentions it',
      language: 'typescript',
      code: `import pytest

call_log = []

@pytest.fixture(autouse=True)
def reset_call_log():
    call_log.clear()
    yield
    # (teardown here if needed)

def test_one():
    # This test's signature is EMPTY -- no fixture requested at all --
    # yet reset_call_log() still ran before it, per pytest's own
    # documented autouse behavior: "make all tests automatically
    # request them."
    call_log.append("one")
    assert call_log == ["one"]

def test_two():
    # If reset_call_log were NOT autouse, call_log would still
    # contain ["one"] from the previous test here -- but because it
    # IS autouse, it silently cleared call_log before this test ran
    # too, even though test_two() never asked for it by name.
    call_log.append("two")
    assert call_log == ["two"]

# Nothing in either test's own code signals that reset_call_log
# exists or ran -- this is exactly the visibility gap this subtopic
# is about: reading test_two() alone gives no hint that ANY fixture
# executed before it.`,
    },
    {
      label: 'Documented ordering: scope first, then autouse-before-requested, then dependencies',
      language: 'typescript',
      code: `import pytest

order = []

@pytest.fixture(scope="session", autouse=True)
def session_setup():
    order.append("session_setup")   # runs FIRST -- highest scope

@pytest.fixture(autouse=True)   # function-scoped (default)
def function_autouse():
    order.append("function_autouse")   # runs BEFORE requested_fixture,
                                          # despite being listed AFTER
                                          # it in the code below --
                                          # autouse fixtures run first
                                          # within their own scope.

@pytest.fixture
def requested_fixture():
    order.append("requested_fixture")

def test_ordering(requested_fixture):   # only explicitly requests ONE
    assert order == [
        "session_setup",       # 1. highest scope first
        "function_autouse",    # 2. autouse, same scope, runs before...
        "requested_fixture",   # 3. ...the explicitly-requested one
    ]
    # Confirms all three of pytest's documented ordering rules in a
    # single test: scope-first, autouse-before-requested within a
    # scope, and (implicitly) dependency order for anything chained.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test suite has a conftest.py at the project root with @pytest.fixture(autouse=True, scope="session") def configure_strict_warnings(): warnings.simplefilter("error"). A developer writes a brand-new test file with a test that calls a third-party library function known to emit a harmless DeprecationWarning, and is confused when the test fails with an unrelated-looking exception, since nothing in their own test file mentions warnings at all. Explain what is happening, using what this subtopic covers.',
    hint: 'Does the developer\'s new test need to explicitly request configure_strict_warnings for it to affect the test? Per this subtopic\'s theory, what visibility does a test function\'s own signature give into autouse fixtures defined elsewhere?',
    solution: 'The developer\'s test is being affected by the session-scoped, autouse configure_strict_warnings fixture from the root conftest.py, despite never mentioning it — per this subtopic\'s theory, pytest\'s own documentation states autouse fixtures "make all tests automatically request them," and a conftest.py fixture is automatically available to every test in that directory tree. Since this fixture also happens to be session-scoped, per the documented ordering rules it runs once, before any function-scoped setup, for the ENTIRE test session — turning every DeprecationWarning (and every other warning) into a raised exception via warnings.simplefilter("error"), for every single test in the suite, including the developer\'s brand-new file. The "unrelated-looking exception" is almost certainly the DeprecationWarning itself, now raised as an actual exception instead of just printed, which is why it looks disconnected from anything the developer\'s own test code does — their test never opted into strict-warnings behavior, and nothing in their test file\'s own code gives any hint that this fixture exists or is running, exactly the silent-signal gap this subtopic\'s theory describes. Diagnosing this requires looking OUTSIDE the failing test file entirely — checking the project\'s conftest.py (and any conftest.py files in parent directories of the new test) for autouse fixtures, since pytest\'s own fixture resolution gives no indication in an individual test\'s signature that such a fixture is silently in effect.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A test function\'s parameter list is a complete, reliable inventory of every fixture that runs before that test — if a fixture isn\'t named as a parameter, it doesn\'t affect the test.',
      reality: 'This subtopic\'s theory and first code example show autouse=True fixtures break this assumption entirely — per pytest\'s own documentation, they "make all tests automatically request them," meaning a fixture with zero mention in a test\'s signature can still run before it, with no visible signal in that test\'s own code that it happened.'
    },
    {
      thought: 'Since fixture execution order is generally determined by the order parameters are listed in a test function\'s signature, an autouse fixture and an explicitly-requested fixture at the same scope run in whatever order the test happens to reference them.',
      reality: 'This subtopic\'s second code example shows pytest\'s own documented ordering rules are independent of parameter-listing order — "autouse fixtures are executed first within their scope" is a fixed, documented guarantee, meaning an autouse fixture always runs before a same-scope fixture a test explicitly requested, regardless of which one appears first (or at all) in the test\'s own signature.'
    },
    {
      thought: 'autouse fixtures are a niche or discouraged pytest feature mainly useful for unusual edge cases, since the normal, recommended way to use a fixture is to request it explicitly by name.',
      reality: 'This subtopic\'s theory shows autouse is a documented, intentional pytest mechanism specifically designed for setup/teardown every test in a scope genuinely needs — the trade-off it introduces (reduced visibility in individual test signatures) is a real, worth-knowing cost, not a sign the feature itself is a workaround or an edge case.'
    }
  ];
}
