import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-python-oop',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './oop.html',
  styleUrl: './oop.scss'
})
export class PythonOop {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.x';
  route = 'py-oop'; nextRoute = '/python/dataclasses-pydantic'; nextLabel = 'Dataclasses & Pydantic';

  quickRef: QuickRefItem[] = [
    { name: '__init__(self)', type: 'method', desc: 'Constructor. Called after __new__. Use for per-instance state initialisation.' },
    { name: '__repr__(self)', type: 'method', desc: 'Official string representation for developers. Used in debugger and REPL. Return eval-able string if possible.' },
    { name: '__str__(self)', type: 'method', desc: 'User-friendly string representation. Called by print() and str(). Falls back to __repr__ if absent.' },
    { name: '__eq__(self, other)', type: 'method', desc: 'Equality check. Define alongside __hash__ if using in sets/dicts. Defining __eq__ sets __hash__ to None by default.' },
    { name: 'super()', type: 'function', desc: 'Returns a proxy to the parent class. Follows MRO in multiple inheritance. Always use super() instead of ClassName.method(self).' },
    { name: '@classmethod', type: 'decorator', desc: 'Receives cls as first argument. Alternative constructors (e.g. from_dict, from_json). Inherited by subclasses.' },
    { name: '@staticmethod', type: 'decorator', desc: 'No self or cls. A utility function logically grouped with the class. Does not access class or instance state.' },
    { name: '@property', type: 'decorator', desc: 'Computed attribute. Getter without (). Pair with @prop.setter and @prop.deleter.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Classes, Instances, and Dunder Methods',
      points: [
        'Python classes are objects themselves — instances of the metaclass type. When you define class Foo: pass, Python calls type("Foo", (object,), {}) internally. Everything in Python is an object: classes, functions, modules.',
        'Dunder (double underscore) methods — __init__, __repr__, __str__, __len__, __iter__, __getitem__ etc. — implement the Python data model. They let your objects work with built-in functions and operators. __len__ enables len(obj); __iter__ enables for x in obj; __getitem__ enables obj[key].',
        '__repr__ should return a string that, when passed to eval(), recreates the object (or at minimum identifies it for debugging). __str__ is for end-users. If __str__ is not defined, Python falls back to __repr__. Always define __repr__; define __str__ only when the user-facing representation differs significantly.',
        '__eq__ defines ==. When you define __eq__, Python sets __hash__ to None, making the class unhashable (cannot be used in sets/dicts) — because mutable objects should not be hashable. If you need an instance in a set, define __hash__ too: __hash__ = object.__hash__ (use with caution for mutable objects).',
      ]
    },
    {
      heading: 'Inheritance and the MRO',
      points: [
        'Python supports multiple inheritance: class C(A, B): pass. Method resolution order (MRO) determines which method is called when multiple parents define the same method. Python uses the C3 linearisation algorithm, which ensures a consistent, predictable ordering. View it with C.__mro__ or C.mro().',
        'Always use super() for calling parent methods — never call the parent explicitly (Base.method(self)) in a class hierarchy that may use multiple inheritance. super() follows the MRO, ensuring each parent is called exactly once in cooperative multiple inheritance.',
        'Mixins are a common Python pattern: small classes that add a specific capability (LogMixin, JsonSerializableMixin) without being intended for standalone instantiation. A mixin does not call super().__init__() with arguments it doesn\'t know about — it relies on cooperative multiple inheritance to pass them along.',
        'Abstract base classes (ABC): from abc import ABC, abstractmethod. Classes with @abstractmethod cannot be instantiated directly — subclasses must implement all abstract methods. ABCs enforce interfaces without the rigidity of Java-style interfaces.',
      ]
    },
    {
      heading: 'Properties, Descriptors, and Class/Static Methods',
      points: [
        '@property turns a method into a computed attribute. obj.value calls the getter (no parentheses). @value.setter enables obj.value = x. @value.deleter enables del obj.value. Properties enforce encapsulation without changing the calling code — replace a public attribute with a property without breaking callers.',
        '@classmethod receives the class (cls) as its first argument. The canonical use is alternative constructors: @classmethod def from_dict(cls, d): return cls(**d). Subclasses that inherit from_dict() will instantiate themselves (cls refers to the subclass), not the base class.',
        '@staticmethod is a plain function that lives in the class namespace. It has no self or cls. Use it for utility functions logically related to the class but not needing instance or class state: Point.distance_between(a, b). Prefer module-level functions when the function does not logically belong to the class.',
        'Descriptors implement __get__, __set__, and/or __delete__. They power the property decorator, classmethod, and staticmethod under the hood. Custom descriptors enable attribute validation, lazy loading, and type coercion at the class level — the same descriptor instance is shared across all instances.',
      ]
    },
    {
      heading: 'Slots, __dict__, and Memory',
      points: [
        'By default, each instance stores its attributes in a __dict__ (a per-instance dictionary). This is flexible but uses more memory. __slots__ = ["x", "y"] replaces the dict with a fixed set of slots, reducing memory by ~30–50% for many small instances.',
        'When using __slots__, you cannot add arbitrary attributes to instances, and the class loses its __dict__ (unless you include "__dict__" in __slots__). Inheritance with __slots__ requires all classes in the hierarchy to define __slots__ — one class without __slots__ reintroduces __dict__ for the entire chain.',
        'Dataclasses (@dataclass from Python 3.7) auto-generate __init__, __repr__, and __eq__ from class-level type-annotated fields. @dataclass(frozen=True) adds __hash__ and makes the instance immutable. @dataclass(slots=True) (Python 3.10+) combines dataclass convenience with __slots__ efficiency.',
        'Object identity vs equality: is checks identity (same object in memory); == calls __eq__ (logical equality). None is always checked with is None (not == None) because None is a singleton and __eq__ can be overridden to return unexpected values.',
      ]
    },
    {
      heading: 'Composition Over Inheritance in Python',
      points: [
        'Deep inheritance hierarchies tightly couple subclasses to their parent\'s implementation details, making changes to a base class risk breaking distant subclasses in unexpected ways — a well-known object-oriented design pitfall often summarized as "favor composition over inheritance."',
        'Composition (a class holding a reference to another class as a field and delegating to it) achieves code reuse without the tight coupling of inheritance, and is generally more flexible since composed components can be swapped at runtime, unlike a fixed inheritance relationship determined at class definition.',
        'Python\'s support for multiple inheritance (and the Method Resolution Order that governs it) makes deep or wide inheritance hierarchies especially prone to the "diamond problem" and unexpected method resolution — a reason many Python style guides recommend preferring composition or mixins with a single clear purpose.',
        'Duck typing ("if it walks like a duck and quacks like a duck") means Python code often does not need formal inheritance at all to achieve polymorphism — two unrelated classes implementing the same method signature can often be used interchangeably without sharing any common base class.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Class fundamentals',
      language: 'typescript',
      code: `from abc import ABC, abstractmethod

class Animal(ABC):
    def __init__(self, name: str, sound: str) -> None:
        self.name = name
        self._sound = sound     # convention: "protected" (not enforced)
        self.__secret = "hidden"  # name-mangled: _Animal__secret

    def __repr__(self) -> str:
        return f"{type(self).__name__}(name={self.name!r})"

    def __str__(self) -> str:
        return self.name

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Animal):
            return NotImplemented   # allow other type to try
        return self.name == other.name

    @abstractmethod
    def speak(self) -> str: ...

    @property
    def sound(self) -> str:
        return self._sound

    @sound.setter
    def sound(self, value: str) -> None:
        if not value:
            raise ValueError("Sound cannot be empty")
        self._sound = value

    @classmethod
    def from_dict(cls, data: dict) -> "Animal":
        return cls(data["name"], data["sound"])

    @staticmethod
    def is_valid_name(name: str) -> bool:
        return bool(name and name.isalpha())


class Dog(Animal):
    def __init__(self, name: str, breed: str) -> None:
        super().__init__(name, "Woof")   # super() follows MRO
        self.breed = breed

    def speak(self) -> str:
        return f"{self.name} says {self.sound}!"

    def __repr__(self) -> str:
        return f"Dog(name={self.name!r}, breed={self.breed!r})"

fido = Dog("Fido", "Labrador")
print(fido)          # "Fido" (str)
print(repr(fido))    # Dog(name='Fido', breed='Labrador') (repr)
print(fido.speak())  # "Fido says Woof!"
fido.sound = "Bark"  # property setter`
    },
    {
      label: 'MRO & Mixins',
      language: 'typescript',
      code: `# Multiple inheritance + MRO
class A:
    def greet(self): return "A"

class B(A):
    def greet(self): return "B -> " + super().greet()

class C(A):
    def greet(self): return "C -> " + super().greet()

class D(B, C):
    def greet(self): return "D -> " + super().greet()

# MRO: D -> B -> C -> A
print(D.__mro__)   # (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
print(D().greet()) # "D -> B -> C -> A"  — each super() moves along the MRO

# Mixin pattern
class JsonMixin:
    def to_json(self) -> str:
        import json
        return json.dumps(self.__dict__)

    @classmethod
    def from_json(cls, s: str):
        import json
        return cls(**json.loads(s))

class LogMixin:
    def log(self, msg: str) -> None:
        print(f"[{type(self).__name__}] {msg}")

class User(JsonMixin, LogMixin):
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

u = User("Alice", 30)
u.log("created")          # [User] created
print(u.to_json())        # {"name": "Alice", "age": 30}
u2 = User.from_json('{"name":"Bob","age":25}')

# Slots for memory efficiency
class Point:
    __slots__ = ("x", "y")   # no __dict__ — saves ~50% memory

    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

p = Point(1.0, 2.0)
# p.z = 3.0  # AttributeError — slots are fixed`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutable default argument in __init__',
      wrong: `class Stack:
    def __init__(self, items=[]):    # WRONG — shared across all instances!
        self.items = items`,
      right: `class Stack:
    def __init__(self, items=None):
        self.items = items if items is not None else []`,
      explanation: 'Default argument values are evaluated once when the function is defined. If the default is mutable (list, dict, set), all instances share the SAME object. Appending to stack1.items would modify stack2.items. The idiomatic fix is to use None as the default and create a new mutable object in the body.'
    },
    {
      title: 'Calling parent method directly instead of super()',
      wrong: `class Dog(Animal):
    def speak(self):
        return Animal.speak(self)   # breaks with multiple inheritance`,
      right: `class Dog(Animal):
    def speak(self):
        return super().speak()   # follows MRO correctly`,
      explanation: 'Calling Animal.speak(self) hard-codes the parent class and bypasses the MRO. In a diamond inheritance, this can cause the grandparent __init__ to be called twice (or the correct intermediate classes to be skipped). Always use super() for method delegation in a class hierarchy.'
    },
    {
      title: 'Returning True/False from __eq__ instead of NotImplemented',
      wrong: `def __eq__(self, other):
    return self.value == other.value   # AttributeError if other has no .value`,
      right: `def __eq__(self, other):
    if not isinstance(other, type(self)):
        return NotImplemented   # let the other type try
    return self.value == other.value`,
      explanation: 'Returning NotImplemented (not False!) signals to Python that this type does not know how to compare itself with the other type. Python then tries the reflected operation on the other object. Returning False means "not equal", which can cause subtle bugs when comparing your object with a different type that might define equality.'
    },
    {
      title: 'Forgetting __hash__ when defining __eq__',
      wrong: `class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other): return (self.x, self.y) == (other.x, other.y)

s = {Point(1, 2)}   # TypeError: unhashable type 'Point'`,
      right: `class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other): return (self.x, self.y) == (other.x, other.y)
    def __hash__(self): return hash((self.x, self.y))`,
      explanation: 'When you define __eq__, Python automatically sets __hash__ = None, making instances unhashable (cannot be used in sets or as dict keys). If Point is logically immutable (x and y never change after creation), define __hash__ as a tuple hash of the fields. If the class is mutable, reconsider whether it should be hashable at all.'
    },
  ];

  challenge: Challenge = {
    title: 'Shape Hierarchy with ABC',
    language: 'typescript',
    description: 'Implement a Shape ABC with an abstract method area() and perimeter(). Subclass Circle, Rectangle, and Triangle. Add a classmethod from_dict(data) to each. Implement __repr__, __eq__ (compare by area), and __lt__ (for sorting). Test: sorted([Circle(3), Rectangle(2, 4), Circle(2)]) should order by area.',
    hints: [
      'Use from abc import ABC, abstractmethod',
      'import math for math.pi',
      'Define __lt__ to enable sorted() without a key',
    ],
    starterCode: `from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...
    @abstractmethod
    def perimeter(self) -> float: ...

class Circle(Shape):
    pass

class Rectangle(Shape):
    pass`,
    solution: `from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...
    @abstractmethod
    def perimeter(self) -> float: ...

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Shape): return NotImplemented
        return abs(self.area() - other.area()) < 1e-9

    def __lt__(self, other: "Shape") -> bool:
        return self.area() < other.area()

class Circle(Shape):
    def __init__(self, radius: float) -> None:
        self.radius = radius
    def area(self) -> float: return math.pi * self.radius ** 2
    def perimeter(self) -> float: return 2 * math.pi * self.radius
    def __repr__(self) -> str: return f"Circle(radius={self.radius})"
    @classmethod
    def from_dict(cls, d: dict) -> "Circle": return cls(d["radius"])

class Rectangle(Shape):
    def __init__(self, w: float, h: float) -> None:
        self.w, self.h = w, h
    def area(self) -> float: return self.w * self.h
    def perimeter(self) -> float: return 2 * (self.w + self.h)
    def __repr__(self) -> str: return f"Rectangle({self.w}, {self.h})"
    @classmethod
    def from_dict(cls, d: dict) -> "Rectangle": return cls(d["w"], d["h"])

shapes = [Circle(3), Rectangle(2, 4), Circle(2)]
print(sorted(shapes))   # sorted by area`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Python\'s MRO determine?', options: ['Method return type order', 'Which parent\'s method is called first in multiple inheritance', 'Memory allocation order for class attributes', 'Module import order'], answer: 1, explanation: 'The Method Resolution Order (MRO) is the order in which Python looks up methods in a class hierarchy. Python uses C3 linearisation. In D(B, C) where B and C both inherit from A, the MRO is D → B → C → A. super() follows this order, ensuring each class in the hierarchy is visited exactly once.' },
    { q: 'What is the difference between __str__ and __repr__?', options: ['__repr__ is faster', '__str__ is for end users (print); __repr__ is for developers (debugger/REPL)', '__str__ is called by repr(); __repr__ is called by str()', 'They are identical — Python uses whichever is defined first'], answer: 1, explanation: '__repr__ is the canonical representation for debugging — called by repr(), in the REPL, and as a fallback when __str__ is not defined. __str__ is for user-facing output — called by print() and str(). If only __repr__ is defined, Python uses it for both. If only __str__ is defined, repr() uses the default object representation.' },
    { q: 'Why does defining __eq__ make a class unhashable?', options: ['Python removes __hash__ to prevent memory leaks', 'Mutable equal objects in a set would break invariants if their hash changed', 'Python cannot compute hash of custom objects', 'It does not — __eq__ has no effect on __hash__'], answer: 1, explanation: 'Sets and dicts rely on the invariant that if a == b, then hash(a) == hash(b). If you define __eq__ without __hash__, Python cannot guarantee this (because you might define equality based on mutable state). Python sets __hash__ = None as a safety measure. If your class is effectively immutable, define __hash__ explicitly.' },
    { q: 'When should you use @classmethod vs @staticmethod?', options: ['They are interchangeable', '@classmethod when you need cls (e.g. alternative constructors); @staticmethod when you need neither self nor cls', '@staticmethod when you need cls; @classmethod for utilities', '@classmethod is only for private methods'], answer: 1, explanation: '@classmethod receives cls as the first argument — useful for factory methods (from_dict, from_json) that create instances, since cls refers to the actual class (including subclasses). @staticmethod receives no implicit first argument — it\'s a plain utility function namespaced inside the class. If you need to create an instance, use @classmethod.' },
    { q: 'What is the MRO (Method Resolution Order) in Python?', options: ['The order methods are defined in a class', 'The order Python searches base classes for a method — computed by the C3 linearisation algorithm', 'The order of decorator application', 'The order of __init__ calls'], answer: 1, explanation: 'Python uses the C3 linearisation algorithm to determine MRO for multiple inheritance. For class D(B, C): Python searches D → B → (B\'s bases) → C → (C\'s bases) → object, without revisiting. View with D.__mro__ or D.mro(). Super() follows MRO, not the directly named parent class — critical for cooperative multiple inheritance patterns.' },
    { q: 'What is the difference between __new__ and __init__ in Python?', options: ['__new__ initialises the instance; __init__ creates it', '__new__ creates and returns the instance; __init__ initialises it after creation', 'They are aliases for the same operation', '__init__ is called before __new__'], answer: 1, explanation: '__new__(cls) is called first — creates and returns a new instance. __init__(self) is called second — receives the instance and sets it up. Override __new__ when you need to control instance creation: singletons, immutable types (subclassing str/int where attributes must be set before __init__), or metaclass-like behaviour. Most code only needs __init__.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between a class variable and an instance variable?', a: 'Class variables are defined in the class body (not inside methods) and are shared across all instances. Instance variables are set on self inside methods (__init__ typically) and are unique to each instance. Accessing a class variable via self.attr checks the instance dict first, then falls back to the class — so self.class_var = x creates a new instance variable that shadows (but does not modify) the class variable. Use cls.class_var to modify class state from a classmethod.' },
    { q: 'How does Python\'s property decorator work under the hood?', a: 'property is a descriptor class. @property creates a property object with a __get__ method. When you access obj.value, Python calls the descriptor\'s __get__, which calls the getter function. @value.setter calls property.setter(fn), which returns a new property with the setter attached. Descriptors are more general: any class with __get__/__set__/__delete__ methods, when stored as a class attribute, intercepts attribute access on all instances.' },
    { q: 'What is the use of __slots__ and when should you avoid it?', a: '__slots__ replaces the per-instance __dict__ with a fixed set of named slots, reducing memory by ~30–50% per instance — significant when creating millions of small objects. Avoid __slots__ when: (1) you need to add arbitrary attributes dynamically; (2) you use multiple inheritance and not all classes define __slots__; (3) you use some libraries that expect __dict__ (e.g. pickle with custom reduce). For dataclasses, use @dataclass(slots=True) (Python 3.10+) which handles the slot generation automatically.' },
    { q: 'What is the difference between method resolution order (MRO) in single inheritance versus multiple inheritance?', a: 'In single inheritance, method lookup is straightforward — child, then parent, then grandparent. With multiple inheritance, Python uses the C3 linearization algorithm to compute a consistent, predictable Method Resolution Order across all base classes, viewable via ClassName.__mro__ or ClassName.mro(). This ensures that even with diamond-shaped inheritance hierarchies (two classes inheriting from a common base, then a third class inheriting from both), method lookups always resolve in a consistent, well-defined order rather than ambiguously.' },
    { q: 'What is the difference between composition and inheritance, and when should you prefer composition?', a: 'Inheritance models an "is-a" relationship (a Dog is an Animal) and tightly couples subclasses to their parent\'s implementation details, making changes to the base class risk breaking all subclasses. Composition models a "has-a" relationship (a Car has an Engine) by holding a reference to another object and delegating to it, which is more flexible — you can swap the composed object at runtime and avoid deep, fragile inheritance hierarchies. The common guidance "favor composition over inheritance" applies when the relationship is not a true behavioral specialization, or when you need to combine multiple independent behaviors without multiple inheritance complexity.' },
    { q: 'What is the purpose of dunder methods like __repr__, __eq__, and __hash__, and how do they interact?', a: '__repr__ defines the unambiguous, developer-facing string representation of an object (shown in the REPL and in debugger output) — distinct from __str__ which is for user-facing display. __eq__ defines value equality (a == b), and if you override it, you should also define __hash__ consistently — Python\'s default rule is that objects considered equal must have the same hash, since using a custom __eq__ without updating __hash__ can make instances unusable as dict keys or set members because Python provides an inconsistent default hash (object identity) that contradicts your equality logic.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Python OOP uses dunder methods to integrate with the language; super() follows MRO; @classmethod for factory constructors; @property for encapsulated attributes.',
    mustKnow: [
      '__repr__ for debugging; __str__ for users; Python falls back from __str__ to __repr__.',
      'Defining __eq__ sets __hash__ = None — define both if you need hashability.',
      'super() follows MRO — never call Parent.method(self) in a hierarchy.',
      '@classmethod receives cls (for factory methods); @staticmethod receives neither.',
      '@property turns a method into a computed attribute without changing callers.',
      '__slots__ replaces __dict__ for memory-efficient many-instance patterns.',
    ],
    interviewFocus: [
      'Explain Python\'s MRO and the diamond problem.',
      'Why does __eq__ make a class unhashable?',
      'When would you use @classmethod vs @staticmethod?',
    ]
  };
}
