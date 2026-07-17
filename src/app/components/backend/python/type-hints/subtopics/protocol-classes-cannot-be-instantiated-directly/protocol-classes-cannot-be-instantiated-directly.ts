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
  templateUrl: './protocol-classes-cannot-be-instantiated-directly.html',
  styleUrl: './protocol-classes-cannot-be-instantiated-directly.scss'
})
export class ProtocolClassesCannotBeInstantiatedDirectlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A class directly inheriting from Protocol can never be instantiated — even with every method fully implemented',
      points: [
        'The main page\'s own theory introduces Protocol purely through classes that USE it as an interface specification — class Drawable(Protocol): def draw(self) -> None: ... — always paired with a separate concrete class that satisfies it. This makes it easy to assume a Protocol class is just an ordinary class you happen to also use structurally, one that COULD be instantiated directly if you wanted to.',
        'PEP 544, which Python\'s own typing documentation for Protocol explicitly cross-references, states plainly: "Protocols cannot be instantiated, so there are no values whose runtime type is a protocol." This is enforced directly — attempting SomeProtocol() raises TypeError: Protocols cannot be instantiated, regardless of whether every method on the Protocol has a real, non-... body.',
        'This is a meaningfully different rule than an ordinary ABC\'s instantiation restriction. A plain ABC only becomes uninstantiable if it has at least one method still marked @abstractmethod — an ABC where every method has a concrete implementation CAN be instantiated normally. A Protocol class is uninstantiable purely because it directly inherits from Protocol, independent of whether its methods have real bodies or are all just ....',
      ]
    },
    {
      heading: 'Why this restriction makes sense, and what it means in practice',
      points: [
        'A Protocol\'s entire purpose is describing a SHAPE that other, unrelated classes might satisfy structurally — the main page\'s own MyConn example ("does NOT inherit from Closeable") demonstrates this: Closeable itself was never meant to be a real, usable object, only a specification other classes get checked against. Allowing Closeable() to succeed would produce an instance with no meaningful behavior for any of its methods (since Protocol method bodies are ... by convention), which would be confusing and pointless to actually use.',
        'The practical consequence for real code: if a Protocol class needs to ALSO provide default, reusable implementations that concrete classes can inherit (not just a structural specification), that requires a genuinely different design — either a Protocol combined with a separate mixin class providing the shared implementation, or an ordinary ABC (which CAN be instantiated once all abstract methods are implemented) instead of a pure Protocol.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Protocol() raises TypeError, even with a real method body',
      language: 'typescript',
      code: `from typing import Protocol

class Closeable(Protocol):
    def close(self) -> None: ...   # ... body, per the main page's own convention

c = Closeable()
# TypeError: Protocols cannot be instantiated

# Even giving the Protocol method a REAL, working body changes nothing:
class ClosableWithRealBody(Protocol):
    def close(self) -> None:
        print("actually closing something")   # real logic, not ...

c2 = ClosableWithRealBody()
# TypeError: Protocols cannot be instantiated
# — still fails. The restriction is about directly inheriting from
#   Protocol itself, not about whether method bodies are ... or real.`,
    },
    {
      label: 'Contrast: a plain ABC with no abstract methods CAN be instantiated',
      language: 'typescript',
      code: `from abc import ABC, abstractmethod

class Base(ABC):
    @abstractmethod
    def close(self) -> None: ...

b = Base()
# TypeError: Can't instantiate abstract class Base with abstract
# method close   <- different reason: an unimplemented @abstractmethod

class ConcreteBase(ABC):
    def close(self) -> None:   # no @abstractmethod — real implementation
        print("closing")

cb = ConcreteBase()   # Works fine! No abstract methods left unimplemented.
cb.close()             # "closing"

# The Protocol restriction is NOT this same mechanism — a Protocol
# is uninstantiable purely because it inherits from Protocol, full
# stop, regardless of whether any @abstractmethod-style gap exists.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer defines class Cacheable(Protocol): def get(self, key: str) -> str | None: ...; def set(self, key: str, value: str) -> None: ... — intending to use it both as a structural type hint for functions AND, for convenience during quick manual testing, as a throwaway in-memory implementation via Cacheable(). This raises TypeError: Protocols cannot be instantiated. Explain why, using what this subtopic covers, and describe the correct fix for getting a quick, throwaway concrete implementation.',
    hint: 'Per this subtopic\'s theory, does whether a Protocol\'s methods have real, working bodies (rather than just ...) change whether the Protocol class itself can be instantiated? What actually determines whether Cacheable() is allowed to succeed?',
    solution: 'The TypeError happens because Cacheable directly inherits from Protocol, and per PEP 544 (which Python\'s own typing documentation for Protocol explicitly references), "protocols cannot be instantiated" — this restriction applies purely because of the direct Protocol inheritance itself, completely independent of whether Cacheable\'s own methods have real bodies or are just .... Even if the developer had written full, working implementations for get() and set() directly inside the Protocol class body, Cacheable() would still raise the exact same TypeError, because the restriction has nothing to do with whether the methods are "complete" — it\'s a blanket rule for any class directly inheriting from Protocol. The correct fix for a quick, throwaway concrete implementation is defining a SEPARATE, ordinary class that satisfies the Cacheable Protocol structurally (implementing get() and set() with matching signatures) without itself inheriting from Protocol — for example, class DictCache: def get(self, key): return self._data.get(key); def set(self, key, value): self._data[key] = value (with an __init__ setting self._data = {}) — this concrete class can be instantiated normally with DictCache(), and per Protocol\'s own structural-typing design, it satisfies Cacheable for type-checking purposes without ever needing to inherit from it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A class inheriting from Protocol behaves like an ordinary Python class for instantiation purposes — as long as every method has a real, working implementation (not just the ... placeholder shown in typical examples), calling ProtocolClassName() should work fine.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — per PEP 544, "protocols cannot be instantiated" applies purely because of directly inheriting from Protocol, and giving every method a real, working body (instead of ...) changes nothing about this restriction.'
    },
    {
      thought: 'A Protocol class being uninstantiable works the same way, and for the same underlying reason, as a plain ABC being uninstantiable when it still has unimplemented @abstractmethod methods.',
      reality: 'This subtopic\'s second code example shows these are genuinely different mechanisms — an ABC only becomes instantiable once every @abstractmethod is given a concrete implementation, while a Protocol remains permanently uninstantiable simply by virtue of inheriting from Protocol, regardless of its methods\' implementation status.'
    },
    {
      thought: 'If a TypeError is raised when trying to instantiate a class that inherits from Protocol, the fix is adding real, working method bodies (replacing the ... placeholders) so the class becomes "complete" enough to instantiate.',
      reality: 'This subtopic\'s exercise shows this fix would not work — replacing ... with real implementations has no effect on the Protocol instantiation restriction; the actual fix is defining a genuinely separate, ordinary class that structurally satisfies the Protocol, without itself inheriting from Protocol.'
    }
  ];
}
