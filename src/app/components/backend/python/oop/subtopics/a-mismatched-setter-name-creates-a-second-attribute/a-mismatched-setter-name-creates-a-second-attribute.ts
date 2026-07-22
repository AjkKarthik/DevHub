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
  templateUrl: './a-mismatched-setter-name-creates-a-second-attribute.html',
  styleUrl: './a-mismatched-setter-name-creates-a-second-attribute.scss'
})
export class AMismatchedSetterNameCreatesASecondAttributeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '@x.setter with a differently-named function creates a SECOND, separate attribute — silently, with no error',
      points: [
        'The main page\'s own code example shows the correct pattern: @property def sound(self): ... followed by @sound.setter def sound(self, value): ... — the setter function reuses the exact same name, sound, as the getter. Python\'s own property documentation instructs this directly: "be sure to give the additional functions the same name as the original property," but doesn\'t spell out what actually goes wrong if you don\'t.',
        'Two separate, fully documented mechanics combine to produce the actual consequence. First: property\'s own .setter() method "creates a copy of the property with the corresponding accessor function set to the decorated function" — it returns a brand NEW property object, it does not modify the original in place. Second: ordinary decorator syntax — @expr def name(): ... — is equivalent to def name(): ...; name = expr(name), meaning the result is always bound to whatever name follows def, regardless of what name expr itself referenced.',
        'Put together: writing @sound.setter def set_sound(self, value): ... calls sound.setter(set_sound) (correctly building a new property object with both the original getter and the new setter attached) — but then binds that new object to the name set_sound, not sound. The ORIGINAL sound property (still getter-only, no setter) is left completely untouched in the class namespace. No error is raised anywhere in this process — two separate, independently-functioning class attributes now exist.',
      ]
    },
    {
      heading: 'What this actually looks like when it happens',
      points: [
        'The symptom is confusing precisely because nothing about it looks broken at a glance: the class still has a property called sound (readable, exactly as before) AND a new attribute called set_sound that is ALSO a fully working property — readable AND writable, since it carries both the original getter and the new setter. Attempting obj.sound = "new value" still raises AttributeError: property \'sound\' of \'ClassName\' object has no setter, which looks exactly like the setter was simply never added at all, when in fact it was added — just under the wrong name.',
        'This is a real risk whenever a property\'s getter and setter are defined some distance apart in a class body (rather than immediately adjacent, as the main page\'s own compact example shows), or when a getter is renamed during a refactor without updating the corresponding @name.setter/@name.deleter lines below it to match — the mismatch produces no immediate error, only a delayed, confusing AttributeError the first time code actually tries to use the setter through the original property name.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A mismatched setter name silently creates a second attribute',
      language: 'typescript',
      code: `class Animal:
    def __init__(self, sound: str) -> None:
        self._sound = sound

    @property
    def sound(self) -> str:
        return self._sound

    @sound.setter
    def set_sound(self, value: str) -> None:   # WRONG NAME — should be 'sound'
        if not value:
            raise ValueError("Sound cannot be empty")
        self._sound = value

a = Animal("Woof")
print(a.sound)          # "Woof" — the getter still works fine

a.sound = "Bark"
# AttributeError: property 'sound' of 'Animal' object has no setter
# — looks like the setter was never added at all...

print(a.set_sound)      # "Woof" — but 'set_sound' is ALSO a working
                          # property (same getter, PLUS the setter)!
a.set_sound = "Bark"     # ...this actually works — via the WRONG name.
print(a.sound)           # "Bark" — self._sound really was updated`,
    },
    {
      label: 'The correct pattern — matching names throughout',
      language: 'typescript',
      code: `class Animal:
    def __init__(self, sound: str) -> None:
        self._sound = sound

    @property
    def sound(self) -> str:
        return self._sound

    @sound.setter
    def sound(self, value: str) -> None:   # SAME name as the getter
        if not value:
            raise ValueError("Sound cannot be empty")
        self._sound = value

a = Animal("Woof")
a.sound = "Bark"   # works correctly — no separate attribute involved
print(a.sound)     # "Bark"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A class defines @property def balance(self): return self._balance, and further down in a large class body, a teammate adds a setter with @balance.setter def update_balance(self, value): self._balance = value. Code elsewhere in the codebase that does account.balance = new_value raises AttributeError: property \'balance\' of \'Account\' object has no setter, even though the setter was clearly added. Explain what actually happened, using what this subtopic covers, and describe the fix.',
    hint: 'What name does the decorated setter function itself use — is it the same name as the original property (balance), or a different one? Per this subtopic\'s theory, what determines which class attribute name the new property object (with both getter and setter) actually gets bound to?',
    solution: 'The AttributeError happens because the setter function was named update_balance instead of balance, and per how Python\'s decorator syntax and property.setter() actually work together, @balance.setter def update_balance(...) calls balance.setter(update_balance) (correctly producing a new property object combining the original getter with the new setter) — but then binds that new property object to the name update_balance in the class namespace, not balance, since decorator syntax always binds the result to whatever name follows def. The original balance property, defined earlier with only a getter, is left completely unchanged and untouched by this — it still has no setter at all, which is exactly why account.balance = new_value still raises AttributeError: property \'balance\' of \'Account\' object has no setter. Meanwhile, a second, separate, fully-functional property now exists under the name update_balance (with both the getter and the intended setter), which nobody in the codebase is actually calling — account.update_balance = new_value would work, but that\'s not the API anyone is using. The fix is renaming the setter function from update_balance back to balance, matching the original property\'s name exactly, so the decorator correctly overwrites the SAME class attribute rather than creating a second, differently-named one — after the fix, only one balance property exists, with both the getter and setter properly combined under that single name.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The @x.setter decorator automatically finds and updates the property named x in the class namespace, regardless of what name the decorated function itself is given — the function name after def is just a label for the setter method, not something that affects where the setter actually gets attached.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — the function name after def determines the name the resulting NEW property object gets bound to in the class namespace; giving it a different name than the original property creates a completely separate, second attribute rather than updating the original.'
    },
    {
      thought: 'If a @x.setter decorator is used with a mismatched function name, Python would raise an error immediately, since this is clearly not the intended usage of the property/setter pattern.',
      reality: 'This subtopic\'s first code example shows the opposite — no error is raised anywhere in this process; two independently-functioning class attributes are silently created (the original property, still getter-only, and a new one under the mismatched name, with both getter and setter), and the only visible symptom is a delayed AttributeError the first time code tries to use the setter through the ORIGINAL property\'s name.'
    },
    {
      thought: 'An AttributeError stating a property "has no setter" always means the @x.setter decorator was simply forgotten entirely — the setter code was never written at all.',
      reality: 'This subtopic\'s exercise shows a real, distinct alternative cause for the identical error message — the setter WAS written and the decorator WAS used, but under a mismatched function name, leaving the original property untouched while a working (but wrongly-named, unused) setter exists elsewhere in the class.'
    }
  ];
}
