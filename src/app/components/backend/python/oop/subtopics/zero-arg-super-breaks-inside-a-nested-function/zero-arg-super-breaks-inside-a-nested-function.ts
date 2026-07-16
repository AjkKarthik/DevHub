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
  templateUrl: './zero-arg-super-breaks-inside-a-nested-function.html',
  styleUrl: './zero-arg-super-breaks-inside-a-nested-function.scss'
})
export class ZeroArgSuperBreaksInsideANestedFunctionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Bare super() is compiler magic tied to the method body — not a portable expression you can use anywhere',
      points: [
        'The main page\'s own theory recommends "always use super() instead of ClassName.method(self)" without explaining what makes the zero-argument form of super() — just super(), with no arguments — actually work. It isn\'t ordinary runtime lookup; it depends on the compiler having done something special ahead of time.',
        'Python\'s own documentation for the super() built-in states this directly: "When called directly within an ordinary method of a class, both arguments may be omitted... the compiler fills in the necessary details to correctly retrieve the class being defined, as well as accessing the current instance." Concretely, the compiler injects a hidden __class__ closure cell into any method whose body references super() or __class__ — that cell is what zero-arg super() reads from at call time.',
        'Because this is compiler-level, tied specifically to the method\'s own top-level body, the same documentation states the limitation plainly: "zero-argument super() will not work as expected within nested functions, including generator expressions, which implicitly create nested functions." Calling bare super() from inside a lambda, a nested def, or a generator expression defined INSIDE a method — rather than directly in the method body itself — is a genuinely different scope, and does not automatically get the same __class__ cell treatment.',
      ]
    },
    {
      heading: 'What actually happens, and how to fix it',
      points: [
        'In practice, calling bare super() from a nested function/lambda that lacks the __class__ cell raises RuntimeError: super(): __class__ cell not found — a genuinely confusing error for anyone unaware of the underlying mechanism, since the code looks like it\'s "inside a method" and should work exactly like every other super() call in the main page\'s own examples.',
        'The fix is using the explicit two-argument form, super(ClassName, self), inside the nested function/lambda specifically — this doesn\'t rely on the compiler-injected __class__ cell at all, since both arguments are supplied directly, making it safe to use from any scope, nested or not, at the cost of being slightly more verbose and hardcoding the class name (losing the automatic-subclass-awareness the main page\'s own MRO examples rely on bare super() for).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Bare super() inside a nested function raises RuntimeError',
      language: 'typescript',
      code: `class Base:
    def greet(self):
        return "Base"

class Derived(Base):
    def greet(self):
        return "Derived -> " + super().greet()   # works fine — this
                                                    # IS the method's
                                                    # own top-level body

    def greet_all(self, names):
        # A nested function defined INSIDE this method:
        def format_one(name):
            return f"{name}: " + super().greet()
            # RuntimeError: super(): __class__ cell not found
            # — this nested function does NOT get the compiler's
            # __class__ cell treatment the same way greet() itself did.
        return [format_one(n) for n in names]

d = Derived()
print(d.greet())        # "Derived -> Base" — fine
d.greet_all(["a", "b"])  # raises RuntimeError`,
    },
    {
      label: 'The fix — explicit super(ClassName, self) inside the nested scope',
      language: 'typescript',
      code: `class Base:
    def greet(self):
        return "Base"

class Derived(Base):
    def greet(self):
        return "Derived -> " + super().greet()   # bare form is fine here

    def greet_all(self, names):
        def format_one(name):
            # Explicit two-argument form — does not depend on the
            # compiler-injected __class__ cell, so it works safely
            # from inside a nested function.
            return f"{name}: " + super(Derived, self).greet()
        return [format_one(n) for n in names]

d = Derived()
print(d.greet_all(["a", "b"]))
# ["a: Base", "b: Base"] — works correctly`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A logging mixin defines a decorator INSIDE one of its own methods, and that decorator\'s inner wrapper function calls super().log_context() to build on the parent class\'s logging context. This raises RuntimeError: super(): __class__ cell not found the first time the decorated method actually runs, even though the exact same bare super().log_context() pattern works fine everywhere else in the class\'s other, non-nested methods. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'Is the wrapper function that calls super() the method\'s own top-level body, the same way this subtopic\'s other successful super() calls are — or is it a function defined INSIDE another function, one level further nested?',
    solution: 'The RuntimeError happens because the wrapper function is a NESTED function — defined inside a decorator that is itself defined inside the outer method — and per Python\'s own super() documentation, bare super() "will not work as expected within nested functions," precisely because the compiler-injected __class__ closure cell that zero-argument super() depends on is only reliably set up for the method\'s own top-level body, not for functions nested further inside it. Every OTHER method in the class that calls bare super() works fine because those calls sit directly in each method\'s own top-level body — exactly the case the compiler magic is documented to support — while the wrapper function here is one (or two) scope levels removed from that, which is why it alone fails despite looking like ordinary code inside a class method. The fix is switching the wrapper function\'s call to the explicit two-argument form, super(MixinClassName, self).log_context() — since this form supplies both arguments directly rather than relying on the compiler-injected __class__ cell, it works correctly from any nested scope, including inside a decorator\'s own wrapper function, at the cost of hardcoding the class name explicitly rather than letting the compiler resolve it automatically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Bare super() (with no arguments) works identically no matter where inside a class\'s method it is called from — a nested function, a lambda, or a generator expression defined inside that method should all behave exactly the same as calling it directly in the method\'s own top-level body.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation explicitly states zero-argument super() "will not work as expected within nested functions, including generator expressions," because the compiler-injected __class__ cell it depends on is tied specifically to the method\'s own top-level body.'
    },
    {
      thought: 'A RuntimeError: super(): __class__ cell not found error must indicate a bug in the class hierarchy itself (a broken MRO, a missing parent class method, or similar) rather than something about WHERE in the code super() was called from.',
      reality: 'This subtopic\'s exercise shows the opposite — this specific error is purely about the SCOPE bare super() was called from (a nested function lacking the compiler-injected __class__ cell), completely independent of whether the class hierarchy and MRO are otherwise perfectly correct.'
    },
    {
      thought: 'The explicit two-argument form, super(ClassName, self), is only an older, deprecated way of calling super() that Python 3\'s zero-argument form has fully replaced — modern code should never need to use it.',
      reality: 'This subtopic\'s second code example shows a real, current use case for the explicit form — it is specifically needed (not merely stylistic) inside nested functions/lambdas where the zero-argument form genuinely does not work, making both forms actively relevant in modern Python code depending on the calling scope.'
    }
  ];
}
