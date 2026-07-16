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
  templateUrl: './why-is-sometimes-works-for-small-ints-and-strings.html',
  styleUrl: './why-is-sometimes-works-for-small-ints-and-strings.scss'
})
export class WhyIsSometimesWorksForSmallIntsAndStringsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'CPython caches small integers and interns identifier-like strings — this is why is can look like it "works" for them',
      points: [
        'The main page\'s own Q&A warns "never use is to compare strings or integers (Python may or may not intern them, making results unpredictable)" but doesn\'t explain WHY is sometimes appears to work anyway. The reason is a real, documented CPython implementation detail: CPython\'s own C API documentation states it "keeps an array of integer objects for all integers between -5 and 256. When you create an int in that range you actually just get back a reference to the existing object." So a = 100; b = 100; a is b returning True isn\'t a coincidence — both names are bound to the exact same pre-allocated object.',
        'CPython also commonly interns identifier-like string literals (short strings that look like Python names) as a byproduct of compilation — Python\'s own sys.intern() documentation confirms "the names used in Python programs are automatically interned." This is why a = "hello"; b = "hello"; a is b often (not always) returns True in casual testing.',
        'Python\'s own language reference is explicit that none of this is a language guarantee: "after a = 1; b = 1, a and b may or may not refer to the same object with the value one, depending on the implementation... This behaviour depends on the implementation used, so should not be relied upon." The Python FAQ adds directly: "identity tests should not be used to check constants such as int and str which aren\'t guaranteed to be singletons." Modern CPython even emits a SyntaxWarning for is comparisons written directly against literals, specifically because this boundary was never meant to be programmed against.',
      ]
    },
    {
      heading: 'Why this makes is comparisons on ints/strings a real, sneaky bug source',
      points: [
        'Code that happens to test correctly during development — using small literal integers or short string literals that get cached/interned — can pass every test locally, then fail unpredictably once real data involves larger numbers or dynamically constructed strings (e.g., string concatenation or formatting results, which are NOT guaranteed to be interned the same way literals are).',
        'The main page\'s own recommended fix generalizes cleanly here: is is correct only for singleton checks (is None, is True, is False) where there really is exactly one object that could ever exist — for anything with more than one possible equal-but-distinct object (any int, any str), == is the only comparison that reliably checks what the code actually means: "do these have the same value," not "do these happen to be the same cached object right now."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Small ints and short strings — is "works" by accident',
      language: 'typescript',
      code: `a = 100
b = 100
print(a is b)   # True — both reference CPython's cached int object for 100

c = 1000
d = 1000
print(c is d)   # Often False — 1000 is outside the -5..256 cached range,
                # so a and b may be genuinely separate int objects
                # (the exact outcome depends on context/optimization).

s1 = "hello"
s2 = "hello"
print(s1 is s2)   # Often True — "hello" looks like an identifier,
                   # so CPython commonly interns it during compilation.

s3 = "".join(["hel", "lo"])
s4 = "hello"
print(s3 is s4)   # Often False — s3 was built at runtime, not from
                   # a literal, so it isn't guaranteed to be interned
                   # the same way, even though s3 == s4 is True.`,
    },
    {
      label: 'The reliable fix — never use is for value comparison',
      language: 'typescript',
      code: `# WRONG — relies on an unguaranteed CPython implementation detail
if user_input_count is 1000:
    apply_bulk_discount()   # may silently fail to trigger — 1000
                             # is not guaranteed to be cached/shared

# RIGHT — == checks VALUE equality, unaffected by caching/interning
if user_input_count == 1000:
    apply_bulk_discount()

# is remains CORRECT for singleton checks — there is genuinely only
# ONE None object, ONE True object, and ONE False object ever.
if result is None:
    handle_missing_result()`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test suite has a test that asserts response_code is 200 (using is, not ==) and it passes reliably in CI. A teammate changes the code so response_code is now computed as int(str(response.status)) instead of being read directly as an int literal from a dict, and the same test starts failing intermittently — even though print(response_code) still shows 200. Explain what is actually happening, using what this subtopic covers.',
    hint: 'Is 200 inside CPython\'s documented small-integer caching range (-5 to 256)? Does that caching guarantee that EVERY int with the value 200, constructed however it was constructed, is the exact same object — or does it only apply reliably to certain construction paths?',
    solution: 'The test was already relying on an unguaranteed implementation detail, and the refactor just exposed it — 200 IS inside CPython\'s documented small-integer cache range (-5 to 256), which is why response_code is 200 happened to pass reliably when response_code came from a plain int literal or a simple computation that CPython\'s optimizer resolved to the shared cached object. Once the value is constructed via int(str(response.status)), it goes through a different code path (string conversion followed by int parsing) — Python\'s own documentation is explicit that even within the cached range, "a and b may or may not refer to the same object... depending on the implementation," so there is no guarantee that int(str(200)) returns the exact same cached object reference every time it is constructed this way, even though its VALUE is still unambiguously 200 (confirmed by print(response_code) showing 200, and response_code == 200 would have passed reliably throughout). The fix is changing the assertion to response_code == 200, which checks value equality and is completely unaffected by how the int was constructed or whether CPython happened to reuse a cached object for it — is should be reserved for singleton checks like is None, never for comparing int or str values, regardless of whether the specific values involved happen to fall inside a range that makes is "usually" work.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a is b reliably returns True for small integers like a = 5; b = 5 in casual testing, this must mean Python guarantees that equal small integers are always the same object — it is just large integers and strings that are unreliable.',
      reality: 'This subtopic\'s theory and first code example both show this is backwards — Python\'s OWN language reference explicitly states this caching "depends on the implementation used, so should not be relied upon," even within the documented -5 to 256 range; it happening to work reliably in casual testing does not make it a language guarantee.'
    },
    {
      thought: 'String interning means any two Python strings with the same characters are always the same object, the same way None always is the same object — so s1 is s2 is a safe way to compare any two strings for equality.',
      reality: 'This subtopic\'s first code example shows the opposite — interning applies inconsistently, commonly to identifier-like literals compiled directly into code, but NOT reliably to strings built at runtime (via concatenation, formatting, or user input), even when their final values are identical.'
    },
    {
      thought: 'Because is happens to give the correct answer for the specific small integers or short strings used during development and testing, it is safe to keep using is for that comparison in production, since "it works."',
      reality: 'This subtopic\'s exercise shows exactly how this assumption breaks — code that passes reliably during development because of implementation-specific caching for small/literal values can start failing unpredictably the moment the exact same logical values are constructed through a different code path, or fall outside the cached range, in production.'
    }
  ];
}
