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
  templateUrl: './pytest-raises-matches-subclasses-too.html',
  styleUrl: './pytest-raises-matches-subclasses-too.scss'
})
export class PytestRaisesMatchesSubclassesTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'pytest.raises() matches like a real except clause — subclasses included',
      points: [
        'The main page\'s own theory describes pytest.raises() simply: "Assert an exception is raised. with pytest.raises(ValueError) as exc: ..." — framed as checking for one specific exception type. pytest\'s own documentation is explicit that the match is broader than that framing suggests: "Note that pytest.raises will match the exception type or any subclasses (like the standard except statement)."',
        'The phrase "like the standard except statement" is the precise mechanism: this is the exact same subclass-inclusive behavior Python\'s own except ValueError: clause already has — an except ValueError: block catches a ValueError AND any subclass of it, and pytest.raises(ValueError) inherits that identical semantic, confirmed directly in pytest\'s own source via a literal isinstance(exception, expected_type) check.',
        'pytest\'s own docs give a concrete, worked example of the consequence: a with pytest.raises(RuntimeError): block succeeds "even though the function raises NotImplementedError, because NotImplementedError is a subclass of RuntimeError." The test passes — genuinely, correctly, by design — even though the exception that was actually raised is a more specific type than the one written in the pytest.raises() call.',
      ]
    },
    {
      heading: 'The real risk: a broad exception class can mask the wrong specific exception being raised',
      points: [
        'This subclass-matching behavior is exactly right for tests that genuinely want to assert "some exception in this family was raised, and I don\'t care exactly which one" — but it becomes a real hazard when a test author writes pytest.raises(Exception) (or any other broad base class) intending to check for one SPECIFIC failure mode, since pytest.raises(Exception) will pass for essentially any exception at all, including a completely unrelated bug that happens to also raise some exception somewhere in the code path.',
        'A test written this way can pass even after a refactor accidentally changes WHICH exception a function raises — from the intended, documented ValueError to an accidental, unhandled TypeError from a typo elsewhere in the function — with the test giving no signal that anything changed, since both are still "some Exception."',
        'pytest\'s own docs describe the fix directly: "If you want to check if a block of code is raising an exact exception type, you need to check that explicitly" — with the documented pattern of asserting the captured exception\'s exact type after the with block: assert excinfo.type is RuntimeError. This adds precise, exact-type verification on top of pytest.raises()\'s own broader, subclass-inclusive catch, for the specific tests where exact type actually matters.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A broad pytest.raises() call passes for the wrong specific exception',
      language: 'typescript',
      code: `import pytest

def validate_age(age: int) -> None:
    if age < 0:
        raise NotImplementedError("negative ages not supported yet")
    if age > 150:
        raise ValueError("age too large")

# THE BUG THIS TEST FAILS TO CATCH:
# The test author intended to verify that validate_age(-1) raises
# ValueError specifically -- but wrote the broader RuntimeError,
# and never noticed the mismatch, because the test still PASSES.
def test_negative_age_rejected():
    with pytest.raises(RuntimeError):
        validate_age(-1)
    # PASSES -- NotImplementedError IS a subclass of RuntimeError,
    # per pytest's own documented "match the exception type or any
    # subclasses (like the standard except statement)" behavior.
    # The test author never learns that the ACTUAL exception raised
    # (NotImplementedError) doesn't match what they probably meant
    # to assert (ValueError) -- the test is green either way.

def test_this_would_also_pass():
    # Demonstrating how broad the match really is:
    with pytest.raises(Exception):   # matches almost ANYTHING
        validate_age(-1)
    # Still passes. pytest.raises(Exception) provides essentially
    # no specificity at all -- any bug that raises any exception
    # in this code path would make this assertion pass.`,
    },
    {
      label: 'The documented fix: assert the exact type when it matters',
      language: 'typescript',
      code: `import pytest

def validate_age(age: int) -> None:
    if age < 0:
        raise NotImplementedError("negative ages not supported yet")
    if age > 150:
        raise ValueError("age too large")

def test_negative_age_correctly_checked():
    with pytest.raises(RuntimeError) as exc_info:
        validate_age(-1)

    # THE FIX -- pytest's own documented pattern for exact-type
    # verification on top of the broader subclass-inclusive catch:
    assert exc_info.type is NotImplementedError
    # This now correctly documents and verifies that the SPECIFIC
    # exception raised is NotImplementedError -- not just "some
    # RuntimeError or subclass of it." If a future refactor changes
    # validate_age() to raise a different RuntimeError subclass
    # instead, THIS assertion fails immediately, catching exactly
    # the kind of silent drift the broader pytest.raises() alone
    # would have let through unnoticed.

def test_prefer_the_narrowest_class_when_possible():
    # An even simpler alternative for this specific case: just use
    # the narrowest exception class the test actually cares about
    # directly in pytest.raises() itself, rather than a broad parent
    # class plus a separate exact-type assertion:
    with pytest.raises(NotImplementedError):
        validate_age(-1)
    # This test would correctly FAIL if validate_age() were changed
    # to raise plain RuntimeError or ValueError instead -- exactly
    # the specificity the broader RuntimeError version lacked.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test suite has with pytest.raises(ValueError): parse_config(bad_input) protecting a config parser. During a refactor, a developer accidentally changes parse_config() so that a specific malformed-input case now raises a bare ValueError subclass, ConfigSyntaxError(ValueError), instead of the plain ValueError it used to raise — a behavior change nobody intended or noticed in code review. Explain what the existing test does when run against the refactored code, using what this subtopic covers, and whether this is a problem worth fixing.',
    hint: 'Is ConfigSyntaxError a subclass of ValueError in this scenario? Per this subtopic\'s theory, does pytest.raises(ValueError) require an EXACT match, or does it accept any subclass too?',
    solution: 'The existing test with pytest.raises(ValueError): parse_config(bad_input) continues to pass without any change or warning, because ConfigSyntaxError is defined as a subclass of ValueError, and per this subtopic\'s theory, pytest.raises() "will match the exception type or any subclasses (like the standard except statement)" — the exact same behavior a plain except ValueError: clause would have, which is precisely why the test never flags this as a change at all. In this specific case, this is likely NOT a problem worth fixing, and is actually the CORRECT, intended behavior of pytest.raises() working as designed — if the test\'s actual concern is "does this input correctly get rejected as invalid via a ValueError-family exception," then the refactor (a more specific ValueError subclass replacing the generic one) is arguably an IMPROVEMENT that the test correctly continues to validate, since callers catching except ValueError: elsewhere in the codebase would still correctly catch this new, more specific exception too. This scenario is different from the exercise\'s implicit contrast case (the previous code example\'s NotImplementedError-vs-ValueError situation) specifically because ConfigSyntaxError and the ORIGINAL ValueError are genuinely, deliberately related by inheritance — this is a case where broad, subclass-inclusive matching is exactly the right, forgiving behavior for a test to have. The distinction worth drawing from this subtopic\'s theory is judgment-based, not mechanical: broad matching is appropriate when a test genuinely only cares about "some exception in this family," and becomes a real risk specifically when the test author actually intended to pin down one exact exception type but wrote a broader class either out of habit or without realizing pytest.raises() would let related-but-different exceptions through undetected.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'pytest.raises(SomeExceptionType) only passes if the code under test raises that EXACT exception type — if a subclass of it is raised instead, the test should fail, since the types don\'t match precisely.',
      reality: 'This subtopic\'s theory and first code example show pytest\'s own documentation states the opposite as the intended, designed behavior — pytest.raises() "will match the exception type or any subclasses (like the standard except statement)," meaning a test passes for the specified type OR any of its subclasses, exactly mirroring how a plain Python except clause already behaves.'
    },
    {
      thought: 'Writing pytest.raises(Exception) (or another very broad exception class) is a safe, conservative choice for a test that just wants to confirm "something goes wrong here," since it will catch any failure mode without needing to know the exact exception type in advance.',
      reality: 'This subtopic\'s theory and first code example show this broad-matching approach provides essentially no real specificity — pytest.raises(Exception) passes for almost any bug that raises any exception at all in that code path, meaning the test would still pass even after a completely unrelated bug started raising a different, unintended exception, providing far less protection than a test author might assume.'
    },
    {
      thought: 'If a test needs to verify the exact exception type raised (not just a matching parent class), the only option is to abandon pytest.raises() and write a manual try/except block with isinstance() checks instead.',
      reality: 'This subtopic\'s second code example shows pytest itself documents a built-in pattern for this — capturing the exception info with the as exc_info clause, then asserting exc_info.type is ExactExceptionType after the with block — combining pytest.raises()\'s normal subclass-inclusive catching with an explicit, exact-type verification step, without needing to abandon pytest.raises() at all.'
    }
  ];
}
