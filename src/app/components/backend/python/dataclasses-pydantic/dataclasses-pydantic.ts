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
  selector: 'app-python-dataclasses-pydantic',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dataclasses-pydantic.html',
  styleUrl: './dataclasses-pydantic.scss'
})
export class PythonDataclassesPydantic {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'Python 3.7+ / Pydantic v2';
  route = 'py-dataclasses-pydantic'; nextRoute = '/python/decorators-context-managers'; nextLabel = 'Decorators & Context Managers';

  quickRef: QuickRefItem[] = [
    { name: '@dataclass', type: 'decorator', desc: 'Auto-generates __init__, __repr__, __eq__. Options: frozen=True (immutable + hashable), order=True (adds comparison), slots=True (Python 3.10+).' },
    { name: 'field(default_factory=list)', type: 'function', desc: 'Mutable default for dataclass fields. field(default=0, repr=False, compare=False, init=False) for fine control.' },
    { name: 'BaseModel (Pydantic)', type: 'class', desc: 'Pydantic v2 model. Validates and coerces data from dicts/JSON. model_validate(dict), model_dump(), model_json_schema().' },
    { name: 'model.model_validate(data)', type: 'method', desc: 'Parse and validate a dict into a Pydantic model. Raises ValidationError on type or constraint violations.' },
    { name: 'model.model_dump()', type: 'method', desc: 'Serialise model to dict. model_dump_json() → JSON string. exclude_none=True skips None fields.' },
    { name: 'Field(gt=0, le=100)', type: 'function', desc: 'Pydantic field metadata: gt, ge, lt, le, min_length, max_length, pattern for validation constraints.' },
    { name: 'BaseSettings (pydantic-settings)', type: 'class', desc: 'Load config from env vars / .env files with type validation. Subclass and declare fields with type annotations.' },
    { name: 'NamedTuple', type: 'class', desc: 'Immutable, typed tuple subclass. Lighter than dataclass — no mutability, smaller memory footprint.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: '@dataclass — Auto-Generated Boilerplate',
      points: [
        '@dataclass (Python 3.7) generates __init__, __repr__, and __eq__ from class-level type-annotated fields. It eliminates repetitive constructor boilerplate: instead of def __init__(self, name: str, age: int): self.name = name; self.age = age, you write name: str and age: int at the class level.',
        '@dataclass(frozen=True) makes instances immutable (raises FrozenInstanceError on attribute assignment) and generates __hash__ from the fields — making instances usable in sets and as dict keys. frozen=True is the right choice for value objects (coordinates, config entries) that should not change after creation.',
        '@dataclass(order=True) generates __lt__, __le__, __gt__, __ge__ by comparing instances as tuples of fields in definition order — enabling sorted() and comparisons without extra code. Combine with frozen=True for a fully featured immutable value type.',
        'Mutable defaults: you cannot write items: list = [] in a dataclass (Python raises an error at class definition time). Use field(default_factory=list) instead — dataclass calls the factory for each new instance, giving each its own list. For immutable defaults (int, str, tuple), simple assignment works.',
      ]
    },
    {
      heading: 'Pydantic v2 — Validation and Serialisation',
      points: [
        'Pydantic v2 (2023+) is a data validation library built on Rust core (pydantic-core). Classes that inherit from BaseModel validate input automatically: User(name=123, age="thirty") will coerce 123 to "123" (str) or raise ValidationError if coercion is impossible. This is runtime validation, unlike type checkers (mypy) which are static.',
        'model_validate(data) parses a dict into a model instance. model_dump() serialises back to a dict. model_dump_json() produces a JSON string. These replace the Pydantic v1 parse_obj and dict() methods. model_json_schema() generates a JSON Schema (useful for API docs and form validation).',
        'Field() adds metadata and constraints: Field(gt=0, le=100) (greater-than, less-or-equal); Field(min_length=3, max_length=50) for strings; Field(pattern=r"^\\w+$") for regex. Validators: @field_validator("email") @classmethod def check_email(cls, v): ... for custom logic. @model_validator(mode="after") validates the whole model.',
        'Pydantic models are immutable by default in v2 (model_config = ConfigDict(frozen=True)). For mutable models, set frozen=False. Pydantic integrates with FastAPI for automatic request body parsing and response serialisation — this is its most common production use.',
      ]
    },
    {
      heading: 'BaseSettings — Config from Environment',
      points: [
        'pydantic-settings provides BaseSettings, a Pydantic model that reads from environment variables (os.environ) and .env files. Field names are matched case-insensitively. DATABASE_URL in the environment maps to database_url: str on the model.',
        'Precedence order (highest first): env vars > .env file > field defaults. Pass env_file=".env" in model_config: model_config = SettingsConfigDict(env_file=".env"). Instantiate once: settings = Settings() and import the singleton throughout the app.',
        'Nested settings: model_config with env_nested_delimiter="__" allows APP__DB__HOST to map to settings.app.db.host. This is common in Docker/K8s where all config is passed as flat env vars.',
        'BaseSettings automatically validates types: PORT: int will raise if PORT=abc is set in the environment, not just if it is missing. This catches deployment config errors at startup rather than at the point of use.',
      ]
    },
    {
      heading: 'NamedTuple and dataclass vs Pydantic',
      points: [
        'typing.NamedTuple creates immutable, typed tuple subclasses with field access by name. class Point(NamedTuple): x: float; y: float. Instances are tuples — they support tuple unpacking, index access, and are lighter than dataclasses. Use for small, immutable coordinate or record types.',
        'Dataclass vs Pydantic: dataclass is a standard library class generator with no validation. Pydantic validates data at creation time and coerces types. Use dataclass for internal models where the data comes from trusted code. Use Pydantic for external data (API requests, file parsing, user input) where validation is needed.',
        'Dataclass(frozen=True) is structurally similar to a Pydantic frozen model but without validation. Pydantic v2 models are ~5–10× faster than v1 due to the Rust core, but still slower than plain dataclasses which do no validation.',
        'Pydantic models support model_validate_json(json_string) — parse directly from a JSON string, which is faster than json.loads(s) followed by Model.model_validate(d) because Pydantic\'s Rust core handles JSON parsing internally.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '@dataclass',
      language: 'typescript',
      code: `from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class User:
    name: str
    age: int
    tags: list[str] = field(default_factory=list)  # mutable default
    _id: int = field(default=0, repr=False, compare=False)  # hidden from repr/eq
    ROLE: ClassVar[str] = "user"   # class variable — not a field

    def __post_init__(self) -> None:
        if self.age < 0:
            raise ValueError(f"age must be >= 0, got {self.age}")
        self.name = self.name.strip()


@dataclass(frozen=True, order=True)  # immutable + comparison
class Point:
    x: float
    y: float

p1, p2 = Point(1.0, 2.0), Point(3.0, 4.0)
print(p1 < p2)          # True (compares (x,y) tuples)
print(sorted([p2, p1])) # [Point(x=1.0, y=2.0), Point(x=3.0, y=4.0)]
# p1.x = 5              # FrozenInstanceError

alice = User("Alice", 30, ["admin"])
bob   = User("Bob", 25)
print(alice)      # User(name='Alice', age=30, tags=['admin'])
print(alice == User("Alice", 30, ["admin"]))  # True (compares fields)

# __post_init__ for derived fields
@dataclass
class Rectangle:
    width: float
    height: float
    area: float = field(init=False)  # not in __init__

    def __post_init__(self) -> None:
        self.area = self.width * self.height`
    },
    {
      label: 'Pydantic v2',
      language: 'typescript',
      code: `from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Annotated

class Address(BaseModel):
    street: str
    city: str
    country: str = "UK"

class User(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    age:  Annotated[int, Field(ge=0, lt=150)]
    email: str
    address: Address | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("must contain @")
        return v.lower()

    @model_validator(mode="after")
    def check_adult_has_email(self) -> "User":
        if self.age >= 18 and not self.email:
            raise ValueError("adults must provide an email")
        return self

# Parse from dict
user = User.model_validate({
    "name": "Alice", "age": 30, "email": "ALICE@EXAMPLE.COM",
    "address": {"street": "1 Main St", "city": "London"}
})
print(user.email)               # alice@example.com (lowercased)
print(user.model_dump())        # {"name":"Alice","age":30,"email":"alice@example.com",...}
print(user.model_dump_json())   # JSON string

# BaseSettings — read from env / .env
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)
    database_url: str = "sqlite:///./app.db"
    debug: bool = False
    port: int = 8000
    secret_key: str

# Usage: settings = Settings()
# PORT=9000 python app.py → settings.port == 9000`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using mutable default in dataclass',
      wrong: `@dataclass
class Cart:
    items: list[str] = []   # TypeError at class definition!`,
      right: `@dataclass
class Cart:
    items: list[str] = field(default_factory=list)`,
      explanation: 'Python raises a ValueError at class definition time if you use a mutable default (list, dict, set) directly in a dataclass. The dataclass decorator explicitly checks for this. Use field(default_factory=list) — it calls list() for each new instance, giving each its own list.'
    },
    {
      title: 'Confusing Pydantic model dict() with model_dump()',
      wrong: `user = User(name="Alice", age=30, email="a@b.com")
data = user.dict()   # Pydantic v1 API — raises AttributeError in v2`,
      right: `data = user.model_dump()        # Pydantic v2
json = user.model_dump_json()   # Pydantic v2`,
      explanation: 'Pydantic v2 renamed dict() → model_dump(), json() → model_dump_json(), and parse_obj() → model_validate(). If you see AttributeError: \'User\' object has no attribute \'dict\', you\'re using v2 syntax from v1 docs (or vice versa). Check pydantic.__version__ and refer to the correct docs.'
    },
    {
      title: 'Not using @classmethod decorator on field_validator',
      wrong: `class User(BaseModel):
    email: str

    @field_validator("email")
    def validate_email(cls, v):   # missing @classmethod!
        return v.lower()`,
      right: `class User(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.lower()`,
      explanation: 'Pydantic v2 requires @classmethod on @field_validator methods. Without it, Pydantic raises a PydanticUserError at class definition time. The decorator order must be @field_validator first (outer), @classmethod second (inner) — this matches how stacked decorators are applied (bottom-up).'
    },
    {
      title: 'Using @dataclass for external data that needs validation',
      wrong: `@dataclass
class UserRequest:
    age: int   # no validation — User(age="thirty") silently stores "thirty"`,
      right: `from pydantic import BaseModel
class UserRequest(BaseModel):
    age: int   # validates and coerces — "30" → 30; "thirty" → ValidationError`,
      explanation: 'Dataclass type annotations are only hints — Python does not validate or coerce values at runtime. A User(age="thirty") dataclass will happily store "thirty" as a string without error. Pydantic validates and coerces input at construction time. For external data (API requests, file parsing), use Pydantic; for internal trusted data, dataclass is fine.'
    },
  ];

  challenge: Challenge = {
    title: 'Product Catalogue with Pydantic',
    language: 'typescript',
    description: 'Create a Product Pydantic model with: name (str, 1–100 chars), price (float, > 0), category (Literal["electronics", "clothing", "food"]), tags (list[str], default empty). Add a field_validator to ensure all tags are lowercase. Add a model_validator to raise if price > 1000 and category is "food". Write a function load_products(data: list[dict]) that returns valid products and logs invalid ones.',
    hints: [
      'Use Annotated[str, Field(min_length=1)] or Field() directly in the annotation',
      'Literal["a", "b"] from typing restricts to those values',
      'Catch pydantic.ValidationError in the loader function',
    ],
    starterCode: `from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Literal

class Product(BaseModel):
    pass

def load_products(data: list[dict]) -> list[Product]:
    pass`,
    solution: `from pydantic import BaseModel, Field, field_validator, model_validator, ValidationError
from typing import Literal, Annotated

class Product(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    price: Annotated[float, Field(gt=0)]
    category: Literal["electronics", "clothing", "food"]
    tags: list[str] = []

    @field_validator("tags")
    @classmethod
    def lowercase_tags(cls, v: list[str]) -> list[str]:
        return [t.lower() for t in v]

    @model_validator(mode="after")
    def check_food_price(self) -> "Product":
        if self.category == "food" and self.price > 1000:
            raise ValueError("food items cannot cost more than 1000")
        return self

def load_products(data: list[dict]) -> list[Product]:
    valid = []
    for i, item in enumerate(data):
        try:
            valid.append(Product.model_validate(item))
        except ValidationError as e:
            print(f"Row {i} invalid: {e.error_count()} error(s)")
    return valid`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why do dataclasses forbid mutable defaults like items: list = []?', options: ['Python lists cannot be used as class attributes', 'All instances would share the same list object, causing unexpected mutations', 'Lists require field() wrapping for type safety', 'It is only forbidden in frozen dataclasses'], answer: 1, explanation: 'Class-level defaults are evaluated once and shared. If items: list = [] were allowed, all instances of the dataclass would reference the same list object. Modifying instance1.items would modify instance2.items too. Dataclass explicitly raises ValueError for mutable defaults to prevent this bug.' },
    { q: 'What is the difference between a Pydantic model and a dataclass?', options: ['Dataclasses are faster in all cases', 'Pydantic validates and coerces input; dataclass only stores values with no validation', 'Pydantic requires Python 3.11+', 'They are identical — just different syntax'], answer: 1, explanation: 'A dataclass is a class generator — it creates __init__ and related methods from annotations but performs no runtime validation. Assigning a string to an int field silently stores the string. Pydantic validates types and constraints at model creation time and coerces compatible values (e.g. "30" → 30 for an int field).' },
    { q: 'When would you use @dataclass(frozen=True)?', options: ['When you need mutable fields', 'For value objects that should be immutable and hashable (usable in sets/dicts)', 'To improve performance', 'When the class has no fields'], answer: 1, explanation: 'frozen=True makes all fields read-only (raises FrozenInstanceError on assignment) and generates __hash__ from the fields. This makes instances usable as dict keys or set members — useful for coordinates, config entries, or any value object. Without frozen=True, dataclasses with __eq__ are unhashable (Python sets __hash__ = None).' },
    { q: 'What does BaseSettings from pydantic-settings do?', options: ['Saves application settings to a file', 'Reads config from environment variables / .env files and validates types', 'Generates settings UI components', 'Replaces the standard library configparser'], answer: 1, explanation: 'BaseSettings is a Pydantic model that reads field values from environment variables (by matching field names case-insensitively) and optionally from .env files. It validates and coerces types — if PORT: int is defined and the env var PORT=abc is set, it raises a validation error at startup rather than later when the value is first used.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should you use NamedTuple vs dataclass?', a: 'Use NamedTuple when: (1) you need an immutable, tuple-compatible record (tuple unpacking, index access, len()); (2) memory is critical — NamedTuples are lighter than dataclasses since they are just tuples; (3) you are using it as a dict key or set member (tuples are hashable). Use dataclass when: (1) you need mutability or complex __post_init__ logic; (2) you need optional fields or derived computed fields (field(init=False)); (3) the class has methods beyond simple attribute access.' },
    { q: 'How does Pydantic v2 differ from v1?', a: 'Pydantic v2 rewrote the validation core in Rust (pydantic-core), making it 5–50× faster. API changes: dict() → model_dump(), json() → model_dump_json(), parse_obj() → model_validate(), parse_raw() → model_validate_json(). Validators now require @classmethod on @field_validator. Model config moved to model_config = ConfigDict(...) instead of a nested Config class. BaseSettings moved to a separate package: pydantic-settings. Most Pydantic v1 code needs a migration pass — check pydantic.__version__ and consult the v2 migration guide.' },
    { q: 'Can you inherit from a Pydantic model?', a: 'Yes. class AdminUser(User): role: str = "admin" inherits all fields from User and adds role. model_validate works for AdminUser and includes all inherited fields. You can override field definitions in subclasses. For abstract base models with shared validators, use a base class without some fields and subclass it with the concrete fields. Note: multiple inheritance from two Pydantic models with conflicting fields is allowed but can cause unexpected field ordering — test carefully.' },
  ];

  revision: RevisionSummary = {
    oneLiner: '@dataclass generates boilerplate; Pydantic validates external data; BaseSettings reads typed config from environment variables.',
    mustKnow: [
      'Mutable dataclass defaults need field(default_factory=list) — not bare [].',
      '@dataclass(frozen=True): immutable + hashable (safe in sets/dicts).',
      'Pydantic validates/coerces at construction time; dataclass does not validate.',
      'Pydantic v2: model_validate(), model_dump(), model_dump_json() — not dict()/json().',
      '@field_validator requires @classmethod in Pydantic v2.',
      'BaseSettings reads from env vars with type validation at startup.',
    ],
    interviewFocus: [
      'Why can\'t you use a mutable default in a dataclass?',
      'When would you choose Pydantic over @dataclass?',
      'How does BaseSettings differ from os.environ.get()?',
    ]
  };
}
