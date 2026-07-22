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
  templateUrl: './slots-and-a-class-level-default-value-conflict.html',
  styleUrl: './slots-and-a-class-level-default-value-conflict.scss'
})
export class SlotsAndAClassLevelDefaultValueConflictSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A class-level default value for a slotted attribute raises ValueError at class creation, not instance creation',
      points: [
        'The main page\'s own theory introduces __slots__ = ["x", "y"] as a memory-saving replacement for a per-instance __dict__, without mentioning what happens if you try to give one of those slotted names a default value the ordinary way — writing it as a plain class-level assignment, the same way you might set a class variable.',
        'Each name listed in __slots__ is implemented as a class-level descriptor (a slot descriptor with its own __get__/__set__), not a plain attribute — Python\'s own data model documentation explains the reasoning directly: a class attribute of the same name "would overwrite the descriptor assignment." Since a slot descriptor and a plain class-level value can\'t both occupy the same name in the class namespace, defining both is a genuine conflict, not just redundant.',
        'This isn\'t a silent, tolerated overwrite — CPython raises ValueError: \'x\' in __slots__ conflicts with class variable the moment the class body finishes executing, well before any instance of the class is ever created. The class itself fails to be defined at all.',
      ]
    },
    {
      heading: 'Where this actually surfaces and how to give a slotted attribute a real default',
      points: [
        'This most often bites when refactoring an ordinary class (with plain class-level default values) into a __slots__-based one purely for the memory savings the main page\'s own theory describes, without also restructuring how defaults are provided — code that compiled fine as a regular class fails immediately once __slots__ is added, with an error message that doesn\'t obviously connect "conflicts with class variable" to "I just wanted a default value."',
        'The correct way to give a slotted attribute a default is inside __init__, exactly the same pattern used for any other instance attribute: self.x = default_value — __slots__ only reserves the NAME and the storage layout for the attribute; it never provides default-value semantics of its own, unlike a dataclass field or a plain class-level assignment on a non-slotted class.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The conflict — ValueError at class creation',
      language: 'typescript',
      code: `class Point:
    __slots__ = ("x", "y")
    x = 0   # looks like a reasonable default — it is NOT allowed

# ValueError: 'x' in __slots__ conflicts with class variable
#
# This error happens the moment Python finishes executing the class
# BODY — before any Point() instance is ever created. The class
# itself never successfully gets defined.`,
    },
    {
      label: 'The correct way to give a slotted attribute a default',
      language: 'typescript',
      code: `class Point:
    __slots__ = ("x", "y")

    def __init__(self, x: float = 0, y: float = 0) -> None:
        self.x = x   # default provided via __init__'s own parameter
        self.y = y   # default, same pattern as any non-slotted class

p1 = Point()          # x=0, y=0
p2 = Point(3, 4)       # x=3, y=4

# __slots__ only reserves the NAME and storage layout — it has no
# default-value mechanism of its own. Defaults always come from
# __init__'s parameter defaults, exactly as they would without
# __slots__ at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team refactors a plain Python class (with several class-level default values like retry_count = 3) into a __slots__-based version purely to save memory across the millions of instances the application creates, listing the same attribute names in __slots__ without changing anything else. The class now fails to even be defined, with ValueError: \'retry_count\' in __slots__ conflicts with class variable. A teammate is confused, since "the class worked fine before — we only added __slots__." Explain what actually went wrong, and describe the fix.',
    hint: 'What does a name listed in __slots__ actually become at the class level — a plain attribute, or something more specific? Can a class-level plain value and that specific thing coexist under the same name?',
    solution: 'The class fails to be defined because each name listed in __slots__ becomes a slot DESCRIPTOR at the class level — not a plain attribute — and Python\'s own data model documentation explains that a class-level value of the same name "would overwrite the descriptor assignment," which is exactly why the two cannot coexist under one name. Before the refactor, retry_count = 3 was a perfectly ordinary class-level attribute with no conflict, because the class had no __slots__ declaration at all. Adding __slots__ = (..., "retry_count", ...) turned retry_count into a slot descriptor — and the pre-existing retry_count = 3 class-level assignment, left unchanged during the refactor, now collides directly with that descriptor under the same name, which CPython detects and rejects immediately when the class body finishes executing (ValueError: \'retry_count\' in __slots__ conflicts with class variable), before any instance is ever created. The fix is removing the class-level retry_count = 3 assignment entirely and instead providing the default through __init__\'s own parameter default: def __init__(self, retry_count: int = 3): self.retry_count = retry_count — this is the only way a slotted attribute can have a meaningful default, since __slots__ itself provides no default-value mechanism of its own, unlike a plain class-level assignment on a non-slotted class.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a class-level assignment like x = 0 normally works fine to give an attribute a default value in Python, the same pattern should work equally well for an attribute name that is also listed in __slots__ — __slots__ should just add memory efficiency on top without changing how defaults work.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — a name listed in __slots__ becomes a slot descriptor at the class level, and Python\'s own data model documentation confirms a class-level value of the same name conflicts with that descriptor, raising ValueError at class-creation time rather than silently coexisting.'
    },
    {
      thought: 'The ValueError raised by a __slots__/class-variable name conflict happens when an instance of the class is first created, the same way many other attribute-related errors surface only at instance-creation or attribute-access time.',
      reality: 'This subtopic\'s first code example shows the opposite — the conflict is detected and the error raised the moment the class BODY finishes executing, meaning the class itself never successfully gets defined at all; no instance creation is ever reached.'
    },
    {
      thought: 'Refactoring an existing plain class into a __slots__-based one for memory efficiency is normally just a matter of adding the __slots__ declaration listing the same attribute names — the rest of the class body can stay unchanged.',
      reality: 'This subtopic\'s exercise shows a real, common pitfall this over-simplification causes — any pre-existing class-level default value assignments for names now also listed in __slots__ must be removed and moved into __init__\'s own parameter defaults, or the refactor breaks the class entirely.'
    }
  ];
}
