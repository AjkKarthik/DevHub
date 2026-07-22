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
  templateUrl: './a-test-file-fixture-overrides-conftest-by-name.html',
  styleUrl: './a-test-file-fixture-overrides-conftest-by-name.scss'
})
export class ATestFileFixtureOverridesConftestByNameSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The closest fixture definition wins — same name, different file, no error',
      points: [
        'The main page\'s own theory describes conftest.py fixtures as simply "available to all tests in the same directory and subdirectories without importing" — a one-directional description that leaves out what happens when a test FILE defines its own fixture with the identical name as one already living in conftest.py. pytest\'s own docs describe this directly, under "Override a fixture on a test module level": a fixture "with the same name can be overridden for a certain test module."',
        'This is not a naming collision that raises an error or a warning — it is documented, intentional, resolvable behavior. For tests inside that specific file, the LOCAL definition wins outright; the conftest.py version is completely shadowed for every test in that file, while tests in every OTHER file (that don\'t define their own same-named fixture) continue using the original conftest.py version unaffected.',
        'pytest\'s own docs demonstrate this same principle at multiple levels of the directory hierarchy, not just test-module vs. conftest.py — a conftest.py in a subdirectory can equally override a same-named fixture from a conftest.py in a parent directory, following the same "closest definition wins" pattern consistently at every level.',
      ]
    },
    {
      heading: 'The overriding fixture can still reach back and use the one it\'s shadowing',
      points: [
        'The most useful part of this mechanism, per pytest\'s own docs: "the base or super fixture can be accessed from the overriding fixture easily" — the override doesn\'t have to reimplement everything from scratch. The documented pattern requests the SAME name as its own fixture\'s parameter: def username(username): return "overridden-" + username — pytest resolves that inner username parameter to the NEXT fixture up the hierarchy (the conftest.py one being shadowed), not to itself.',
        'This makes fixture overriding genuinely useful for customization rather than pure replacement — a specific test file can take a shared, conftest.py-level fixture and adjust just the part that file needs different (a different default value, an extra piece of setup, a narrower scope) while still building on top of the original\'s own logic, instead of having to duplicate the whole thing.',
        'The practical trap this creates: a developer reading only the conftest.py file, and seeing a fixture named db_session there, can reasonably assume every test using db_session gets that exact implementation — without realizing a specific test file elsewhere in the suite has silently redefined db_session with different behavior for its own tests, with nothing in the conftest.py itself signaling that an override exists anywhere in the codebase.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A test-file fixture silently shadows the conftest.py version',
      language: 'typescript',
      code: `# conftest.py (shared across the whole test suite)
import pytest

@pytest.fixture
def username():
    return "alice"

# test_default_user.py -- uses the conftest.py version, unmodified
def test_default_username(username):
    assert username == "alice"   # the ORIGINAL conftest.py fixture

# test_admin_flows.py -- defines its OWN 'username' fixture
import pytest

@pytest.fixture
def username():
    # SAME NAME as the conftest.py fixture -- this completely
    # shadows it for every test in THIS file. No error, no warning.
    return "admin_alice"

def test_admin_username(username):
    assert username == "admin_alice"   # the LOCAL override, not
                                          # the conftest.py version --
                                          # pytest's own docs confirm
                                          # a same-named fixture "can
                                          # be overridden for a
                                          # certain test module."

# Both test files import nothing from each other -- the override
# is purely a consequence of fixture NAME resolution, scoped to
# whichever file (or directory) redefines that name.`,
    },
    {
      label: 'The override can build on the shadowed fixture, not just replace it',
      language: 'typescript',
      code: `# conftest.py
import pytest

@pytest.fixture
def username():
    return "alice"

# test_admin_flows.py
import pytest

@pytest.fixture
def username(username):
    # THE KEY PATTERN: requesting a parameter with the SAME NAME as
    # the fixture being defined resolves to the NEXT fixture up the
    # hierarchy -- the conftest.py 'username' being shadowed -- not
    # to this fixture calling itself. pytest's own docs confirm this
    # is the documented way to access "the base or super fixture."
    return "admin_" + username   # builds on top of "alice"

def test_admin_username_builds_on_base(username):
    assert username == "admin_alice"
    # The override customized the ORIGINAL fixture's result rather
    # than reimplementing "return some username string" from scratch
    # -- useful when the override only needs to adjust or extend
    # what the shared, conftest.py-level fixture already provides.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A shared conftest.py defines @pytest.fixture def api_client(): return RealApiClient(base_url=PRODUCTION_URL). A developer investigating a flaky test in tests/integration/test_payments.py discovers that file defines its own api_client fixture returning a MockApiClient instance instead. The developer, confused, asks why tests in that one file behave completely differently from every other test file that uses api_client. Explain what is happening, using what this subtopic covers, and describe how to confirm this is the actual cause before assuming something else is wrong.',
    hint: 'Does defining a fixture with the same name as a conftest.py fixture, inside one specific test file, require any special syntax, decorator flag, or explicit "override" declaration — or does pytest resolve this purely by name and file location?',
    solution: 'The tests in tests/integration/test_payments.py are using the LOCAL MockApiClient-returning api_client fixture defined in that file, not the shared conftest.py version returning a real, production-pointed client — per this subtopic\'s theory, pytest\'s own documentation confirms a fixture "with the same name can be overridden for a certain test module," and this override requires no special syntax, flag, or declaration beyond simply defining a fixture with the identical name in that file. Since fixture resolution is purely name-and-location-based, every test inside test_payments.py that requests api_client as a parameter automatically receives the LOCAL, file-specific MockApiClient version — completely shadowing the conftest.py definition for that file only, while every OTHER test file in the suite continues receiving the original RealApiClient unaffected. This is exactly why the developer sees "completely different behavior" scoped to just that one file: it is not a bug or inconsistency in pytest, it is the intended, documented override mechanism working correctly, just without any visible signal in the conftest.py itself that an override exists anywhere in the suite. To confirm this is the actual cause before assuming something else is wrong, the developer should specifically search the test_payments.py file itself (and any conftest.py files in tests/integration/, which would apply more narrowly than the root conftest.py) for a fixture named exactly api_client — pytest\'s own --fixtures command-line flag (pytest --fixtures tests/integration/test_payments.py) is also a documented, reliable way to see exactly which fixture definition pytest actually resolves for a given test location, confirming definitively which version (local override vs. conftest.py original) is actually in effect there.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Defining a fixture with the same name as an existing conftest.py fixture, inside a specific test file, causes a naming conflict — pytest would raise an error, or the behavior would be undefined/unreliable.',
      reality: 'This subtopic\'s theory and first code example show this is documented, intentional pytest behavior with a specific, reliable resolution rule — pytest\'s own docs confirm a same-named fixture "can be overridden for a certain test module," with the local definition winning cleanly for that file\'s tests, no error or warning involved.'
    },
    {
      thought: 'Once a test file overrides a conftest.py fixture with its own same-named version, the override has no way to reuse or build on the original conftest.py implementation — it must fully reimplement the fixture\'s logic from scratch.',
      reality: 'This subtopic\'s theory and second code example show pytest documents a specific, supported pattern for exactly this — an overriding fixture can request a parameter with the SAME NAME as itself, which pytest resolves to the NEXT fixture up the hierarchy (the one being shadowed), letting the override extend or customize the original\'s result rather than reimplementing it entirely.'
    },
    {
      thought: 'A developer can reliably understand what a given test receives from a fixture named X by reading the conftest.py file where X is defined, since that is the fixture\'s canonical, single source of truth.',
      reality: 'This subtopic\'s exercise shows this assumption can be actively misleading — any test file (or more-local conftest.py) in the hierarchy may have silently overridden that same-named fixture for its own tests, with nothing in the original conftest.py definition itself signaling that an override exists anywhere else in the codebase; pytest\'s own --fixtures flag, not just reading conftest.py, is the reliable way to confirm what a specific test actually receives.'
    }
  ];
}
