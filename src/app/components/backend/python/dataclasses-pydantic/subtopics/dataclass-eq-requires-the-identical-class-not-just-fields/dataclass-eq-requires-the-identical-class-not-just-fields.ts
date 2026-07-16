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
  templateUrl: './dataclass-eq-requires-the-identical-class-not-just-fields.html',
  styleUrl: './dataclass-eq-requires-the-identical-class-not-just-fields.scss'
})
export class DataclassEqRequiresTheIdenticalClassNotJustFieldsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A subclass instance is never == to a parent dataclass instance, even with identical field values',
      points: [
        'The main page\'s own theory describes the generated __eq__ purely in terms of fields: "@dataclass ... generates __init__, __repr__, and __eq__ from class-level type-annotated fields," and the order=True example shows p1 < p2 "compares (x,y) tuples." A natural reading of this is that == likewise just compares field values as a tuple — two dataclasses with the same fields and the same values should be equal.',
        'Python\'s own dataclasses documentation states the actual requirement more precisely: the generated __eq__ "compares the class by comparing each field in order," and "both instances in the comparison must be of the identical type." Type identity is a hard precondition checked BEFORE any field comparison happens at all — not merely "the fields must match."',
        'Concretely: given @dataclass class Base: x: int and @dataclass class Sub(Base): pass (Sub adds no new fields, no new logic — a pure subclass), Base(1) == Sub(1) evaluates to False, purely because Sub is not the identical type as Base — despite both objects genuinely having x=1 and nothing else distinguishing them structurally.',
      ]
    },
    {
      heading: 'Why this is easy to miss and where it actually causes bugs',
      points: [
        'This is the opposite of "duck typing" — the pattern the main page\'s own composition-over-inheritance theory elsewhere praises Python for supporting ("two unrelated classes implementing the same method signature can be used interchangeably"). Dataclass equality deliberately does NOT follow that philosophy; it is strict about type identity by design.',
        'This surfaces as a real, confusing bug in test suites and deduplication logic: a test asserting my_service.get_user(1) == User(name="Alice") can fail even when every field matches, if get_user() happens to return an instance of a subclass (e.g., an ORM-mapped or lazily-loaded variant of User) rather than the exact User class — the mismatch is invisible when printing either object (their __repr__ output can look identical), making this a genuinely hard-to-diagnose failure without knowing this specific rule.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Identical fields, but == is False across a subclass boundary',
      language: 'typescript',
      code: `from dataclasses import dataclass

@dataclass
class Base:
    x: int

@dataclass
class Sub(Base):
    pass   # adds NO new fields — structurally identical to Base

b = Base(1)
s = Sub(1)

print(b.x == s.x)        # True — the field values genuinely match
print(repr(b), repr(s))  # Base(x=1)  Sub(x=1)  — look almost identical

print(b == s)            # False!
print(s == b)             # False!
# Neither direction is True — dataclass __eq__ requires the IDENTICAL
# type, not just matching fields. Sub being a subclass of Base is
# not enough, even though Sub adds nothing new at all.`,
    },
    {
      label: 'Where this actually bites — a test comparing against the wrong exact type',
      language: 'typescript',
      code: `from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: int

@dataclass
class CachedUser(User):   # a variant returned by a caching layer
    pass

def get_user_from_cache(name: str, age: int) -> CachedUser:
    return CachedUser(name, age)   # returns the SUBCLASS

# A test written against the base User type:
result = get_user_from_cache("Alice", 30)
assert result == User("Alice", 30)
# AssertionError — even though every field matches exactly, result
# is a CachedUser, not a User, so dataclass __eq__ returns False.

# The fix: compare against the SAME type the function actually
# returns, or compare fields explicitly rather than relying on ==
# across a type boundary:
assert result == CachedUser("Alice", 30)              # passes
assert (result.name, result.age) == ("Alice", 30)      # also passes`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deduplication function collects Event dataclass instances into a set to remove duplicates, relying on the auto-generated __eq__/__hash__ from @dataclass(frozen=True). Some events in the input come from a LegacyEvent subclass (added later to support an older data format, with no new fields of its own) that get converted to plain Event objects — except one code path was missed, and a few LegacyEvent instances slip through unconverted. The resulting deduplicated set contains what look like duplicate entries — the same field values appearing twice. Explain why, using what this subtopic covers.',
    hint: 'Do a plain Event instance and a LegacyEvent instance with identical field values compare as equal via ==, given what this subtopic\'s theory says about dataclass equality requiring the IDENTICAL type? What does that mean for whether a set correctly recognizes them as duplicates of each other?',
    solution: 'The set contains apparent duplicates because a plain Event instance and a LegacyEvent instance with identical field values are NOT equal to each other, per dataclass\'s own documented equality rule requiring "both instances in the comparison" to be "of the identical type" — LegacyEvent being a subclass of Event, even one adding no new fields, does not satisfy that requirement. Since sets deduplicate using both __eq__ and __hash__ together, and Event(...) != LegacyEvent(...) even when every field matches, the set correctly (from its own perspective) treats a converted Event and an unconverted LegacyEvent with the same field values as two DIFFERENT objects, keeping both — producing what looks like a duplicate entry but is actually two objects of different exact types that happen to look identical when printed. This is not a bug in the deduplication logic\'s use of a set, nor in dataclass\'s __eq__ — it is the direct, documented consequence of dataclass equality requiring type identity. The real fix is upstream: ensuring every LegacyEvent instance is genuinely converted to a plain Event before entering the deduplication set (fixing the missed code path), since no change to the equality/hashing logic itself would correctly treat a LegacyEvent and an Event as interchangeable without breaking the general rule everywhere else it\'s relied upon.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since @dataclass generates __eq__ by comparing field values, any two dataclass instances (even of different, but related, classes in the same inheritance hierarchy) with identical field values should compare as equal via ==, the same way comparing two tuples with identical elements would.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own dataclasses documentation confirms the generated __eq__ requires "both instances... to be of the identical type" as a precondition before any field comparison even happens; a subclass instance is never equal to a parent instance, regardless of field values.'
    },
    {
      thought: 'Since Python generally favors duck typing and structural compatibility (as the main page\'s own composition-over-inheritance section describes), dataclass equality should follow that same philosophy — comparing structure and values rather than exact type.',
      reality: 'This subtopic\'s theory explains the opposite — dataclass __eq__ is a deliberate exception to that general Python philosophy, strictly requiring type identity by design, which is precisely why it is easy to assume incorrectly based on how the rest of the language typically behaves.'
    },
    {
      thought: 'If two dataclass instances print identically via repr() (showing the same class name pattern and field values), that is a reliable indicator they will also compare equal via ==.',
      reality: 'This subtopic\'s second code example shows the opposite — Base(x=1) and Sub(x=1) can look almost identical in their repr() output while still comparing as unequal via ==, since repr() reflects the actual class name (revealing the difference on close inspection) while == additionally enforces exact type identity that isn\'t obvious from casual visual comparison.'
    }
  ];
}
