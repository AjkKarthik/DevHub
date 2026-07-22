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
  templateUrl: './wraps-silently-skips-metadata-missing-from-a-partial.html',
  styleUrl: './wraps-silently-skips-metadata-missing-from-a-partial.scss'
})
export class WrapsSilentlySkipsMetadataMissingFromAPartialSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'functools.partial objects have no __name__ — wrapping one with @wraps doesn\'t crash, it silently copies less',
      points: [
        'The main page\'s own theory covers functools.wraps (copies __name__, __doc__, and other metadata onto a decorator\'s wrapper) and functools.partial (pre-fills arguments) as two separate, unrelated tools — but doesn\'t address what happens if the two are combined: using @functools.wraps(some_partial) to wrap a decorator around something that is itself a functools.partial object rather than a plain function.',
        'Python\'s own functools documentation is explicit about what attributes a partial object actually has: func, args, and keywords — nothing else. A partial object is not a function; it has no __name__, no __doc__, no __qualname__ of its own, because partial() returns an instance of the partial class, not something produced by a def statement.',
        'It would be reasonable to guess this causes @wraps to raise an AttributeError when it can\'t find __name__ to copy — but Python\'s own documentation for functools.update_wrapper (which wraps() uses internally) states directly: "Any attributes named in assigned or updated that are missing from the object being wrapped are ignored" — with a changelog note confirming this explicitly: "Missing attributes no longer trigger an AttributeError." So @wraps(a_partial) does not crash; it silently copies whatever attributes the partial DOES have (which doesn\'t include __name__/__doc__/etc.) and leaves the wrapper\'s own pre-existing values for whatever is missing.',
      ]
    },
    {
      heading: 'Why "silently incomplete" can be more confusing to debug than a crash would be',
      points: [
        'A loud AttributeError would at least point directly at the problem. Because the actual behavior is silent, wrapping a partial with @wraps produces a wrapper function that still has ITS OWN generic __name__ (typically "wrapper," matching exactly the broken state the main page\'s own "Forgetting @functools.wraps" mistake describes) — the @wraps call appeared to run successfully, giving false confidence that metadata copying worked, when in practice it copied nothing useful for the attributes that matter most for introspection and debugging.',
        'The practical takeaway generalizes past just partial objects: @functools.wraps is only as good as what the thing being wrapped actually HAS to copy — wrapping a partial, a lambda missing a custom __doc__, or any other callable that lacks the usual function metadata will all silently produce an incompletely-labeled wrapper, with no error to signal it, which is worth checking directly (inspecting wrapper.__name__ after decorating) rather than assuming @wraps always fully succeeds just because it didn\'t raise.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'partial has no __name__ — @wraps silently copies nothing useful',
      language: 'typescript',
      code: `import functools

def multiply(x, y):
    return x * y

double = functools.partial(multiply, y=2)   # a partial object, not a function

print(hasattr(double, '__name__'))   # False — partial objects don't have one
print(double.func, double.args, double.keywords)   # these ARE documented attrs

def logged(fn):
    @functools.wraps(fn)   # fn here is the partial 'double'
    def wrapper(*args, **kwargs):
        print("calling...")
        return fn(*args, **kwargs)
    return wrapper

logged_double = logged(double)
# No AttributeError was raised — wraps() silently SKIPPED __name__,
# __doc__, and __qualname__ because 'double' doesn't have them.
print(logged_double.__name__)   # still "wrapper" — nothing was copied
                                  # for the attributes that matter most,
                                  # even though @wraps "succeeded."`,
    },
    {
      label: 'The safe pattern — check what actually got copied',
      language: 'typescript',
      code: `import functools

def multiply(x, y):
    return x * y

double = functools.partial(multiply, y=2)

def logged(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper

logged_double = logged(double)

# Don't assume @wraps fully succeeded just because no error occurred —
# for anything that isn't a plain function, check directly:
if logged_double.__name__ == "wrapper":
    print("Warning: metadata copy likely incomplete — "
          "the wrapped object may not have had a __name__ to copy.")

# A more robust fix: give the partial an explicit name before wrapping,
# since partial itself never assigns one automatically.
double.__name__ = "double"
double.__doc__ = "Multiplies x by 2."
logged_double2 = logged(double)
print(logged_double2.__name__)   # "double" — now genuinely copied`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A codebase builds a small plugin registry where each plugin is created via functools.partial(handler, config=cfg) and then wrapped with a @audit_log decorator (which uses @functools.wraps internally, following the main page\'s own recommended pattern). Later, a debugging tool that prints plugin.__name__ for every registered plugin shows every single one labeled "wrapper" instead of a distinguishing name. A teammate insists this must mean @functools.wraps is broken, since "it\'s supposed to copy the name." Evaluate this claim using what this subtopic covers.',
    hint: 'Does a functools.partial object have a __name__ attribute of its own to copy in the first place? What does functools.update_wrapper\'s own documentation say happens when an attribute it tries to copy is missing from the source object — does it raise an error, or silently skip it?',
    solution: '@functools.wraps is not broken — it is behaving exactly as documented, and the actual root cause is upstream of the decorator entirely: each plugin was created via functools.partial(handler, config=cfg), and a partial object genuinely has no __name__ attribute of its own (Python\'s own docs confirm a partial object only exposes func, args, and keywords) — there was never a meaningful name for @wraps to copy in the first place. Per functools.update_wrapper\'s own documentation, which @wraps uses internally, "any attributes named in assigned or updated that are missing from the object being wrapped are ignored" — so when @wraps tried to copy __name__ from each partial and found it missing, it silently skipped that attribute rather than raising an error, leaving every wrapper with its own generic "wrapper" name. This is precisely why every plugin shows the identical, unhelpful "wrapper" label — the failure is silent and uniform, not a bug specific to any one plugin. The fix has nothing to do with @functools.wraps itself: each partial needs an explicit __name__ (and ideally __doc__) assigned before it gets wrapped — e.g., handler_partial = functools.partial(handler, config=cfg); handler_partial.__name__ = "handler_for_x" — so that when @wraps later looks for __name__ to copy, it actually finds something meaningful there.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since functools.partial() creates something that behaves like a function (it\'s callable, takes arguments, and is commonly used interchangeably with a lambda or a def), it must have all the same standard function attributes a regular function does, including __name__.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation lists only func, args, and keywords as functools.partial\'s attributes; a partial object is an instance of the partial class, not something produced by def, and simply has no __name__/__doc__/__qualname__ of its own.'
    },
    {
      thought: 'If @functools.wraps(some_object) runs without raising an error, that means it successfully copied all the metadata (__name__, __doc__, __qualname__, etc.) from that object onto the wrapper.',
      reality: 'This subtopic\'s first code example shows the opposite — @wraps can complete without any error while having silently copied NOTHING useful, because Python\'s own update_wrapper documentation confirms missing source attributes are simply skipped rather than causing a failure; "no error" does not mean "fully succeeded."'
    },
    {
      thought: 'A wrapper function still showing its own generic __name__ (like "wrapper") after being decorated with @functools.wraps must indicate the @wraps call itself was forgotten or written incorrectly, matching the main page\'s own "Forgetting @functools.wraps" mistake pattern exactly.',
      reality: 'This subtopic\'s exercise shows a second, distinct root cause that produces the identical symptom — @wraps can be present and correctly used, yet still fail to copy a meaningful name if the object it wraps (like a functools.partial) never had one to begin with, which needs a completely different fix than simply adding @wraps.'
    }
  ];
}
