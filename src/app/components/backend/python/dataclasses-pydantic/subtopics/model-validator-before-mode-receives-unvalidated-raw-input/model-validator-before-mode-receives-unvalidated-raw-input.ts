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
  templateUrl: './model-validator-before-mode-receives-unvalidated-raw-input.html',
  styleUrl: './model-validator-before-mode-receives-unvalidated-raw-input.scss'
})
export class ModelValidatorBeforeModeReceivesUnvalidatedRawInputSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'mode="before" sees raw, untyped input — mode="after" sees a fully validated model instance',
      points: [
        'The main page\'s own code example uses @model_validator(mode="after") — a validator receiving self (a fully-formed User instance) and checking self.age, self.email as normal, already-typed Python attributes. This is the ONLY mode the main page demonstrates, which makes it easy to assume "before" mode works the same way, just running slightly earlier.',
        'Pydantic v2\'s own documentation draws the distinction precisely. For mode="before": these validators "are run before the model is instantiated... they also have to deal with the raw input, which in theory could be any arbitrary object" — not a validated User instance, not even necessarily a dict with the right keys, but literally whatever was passed to the model constructor, completely untouched by any field-level validation or type coercion.',
        'For mode="after", the documentation describes the opposite: these validators "run after the whole model has been validated... defined as instance methods and can be seen as post-initialization hooks" — by the time an "after" validator runs, every field has already been coerced to its declared type, so self.age is genuinely an int, self.email is genuinely a str, exactly like the main page\'s own example relies on.',
      ]
    },
    {
      heading: 'Why treating "before" data like validated data is a real, common bug',
      points: [
        'A mode="before" validator receiving a dict like {"age": "30", "email": "A@B.COM"} sees age as the STRING "30", not the int 30 — field-level coercion to int hasn\'t happened yet at this point in the pipeline. Code inside a "before" validator that assumes self.age (or, more accurately, data["age"] — "before" validators don\'t even get self yet, since the instance doesn\'t exist) behaves as an already-typed int will fail or behave incorrectly on the very first real input it sees, even though it might look fine during quick manual testing with already-correctly-typed test data.',
        'The main page\'s own "adults must provide an email" check, written as an "after" validator, genuinely needs "after" semantics — it relies on self.age already being a comparable int (self.age >= 18). The same check written incorrectly as a "before" validator would need to handle age arriving as a string, an int, or potentially something invalid entirely, since "before" mode receives whatever the caller passed with zero guarantees about its shape or type.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'mode="before" gets raw input; mode="after" gets a validated instance',
      language: 'typescript',
      code: `from pydantic import BaseModel, model_validator

class User(BaseModel):
    name: str
    age: int

    @model_validator(mode="before")
    @classmethod
    def inspect_raw_input(cls, data):
        # 'data' here is whatever was passed to User(...) — raw,
        # untouched by field validation. If called with a dict where
        # age is a string, it is STILL a string right here:
        print(type(data))         # <class 'dict'>
        print(type(data["age"]))  # <class 'str'>  — NOT yet coerced to int!
        return data

    @model_validator(mode="after")
    def inspect_validated_instance(self) -> "User":
        # By now, ALL fields have been validated and coerced —
        # self.age is genuinely an int, guaranteed.
        print(type(self.age))     # <class 'int'>  — coercion already happened
        return self

User(name="Alice", age="30")   # "30" (str) is coerced to 30 (int)
                                 # SOMEWHERE between the two validators —
                                 # specifically, by ordinary field validation,
                                 # which runs after "before" and before "after".`,
    },
    {
      label: 'A real bug: assuming "before" data is already typed',
      language: 'typescript',
      code: `from pydantic import BaseModel, model_validator

class Order(BaseModel):
    quantity: int
    unit_price: float

    @model_validator(mode="before")
    @classmethod
    def reject_bulk_orders(cls, data):
        # WRONG assumption: treating 'data' as if fields are
        # already validated/coerced Python types.
        if data["quantity"] * data["unit_price"] > 10_000:
            #        ^ if quantity/unit_price arrive as STRINGS
            #          (e.g. from a raw JSON body with numeric strings),
            #          this multiplication either raises TypeError
            #          or silently does STRING repetition, not math!
            raise ValueError("Order total exceeds limit")
        return data

# Order.model_validate({"quantity": "5", "unit_price": "2000.0"})
# TypeError: can't multiply sequence by non-int of type 'str'
# — because 'before' mode received raw strings, not coerced numbers.

class OrderFixed(BaseModel):
    quantity: int
    unit_price: float

    @model_validator(mode="after")   # switched to "after"
    def reject_bulk_orders(self) -> "OrderFixed":
        # self.quantity and self.unit_price are GUARANTEED int/float
        # here, since field-level coercion has already completed.
        if self.quantity * self.unit_price > 10_000:
            raise ValueError("Order total exceeds limit")
        return self`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Pydantic model validates that a discount_percent field is between 0 and 100 using a @model_validator(mode="before") that checks 0 <= data["discount_percent"] <= 100. This works fine in the team\'s unit tests (which always construct the model with a Python float directly, e.g. Product(discount_percent=15.0)), but fails with a confusing TypeError in production, where the model is built via Product.model_validate_json(raw_json_body) — and the incoming JSON happens to represent the discount as a numeric string like "15.0" in one particular upstream system. Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'What does a mode="before" validator actually receive as its input — data that has already been coerced to the field\'s declared type (float), or the genuinely raw input exactly as the caller provided it? Does the comparison 0 <= "15.0" <= 100 even work the same way as 0 <= 15.0 <= 100 in Python?',
    solution: 'The TypeError happens because a mode="before" validator receives the genuinely raw, unvalidated input — per Pydantic\'s own documentation, "before" validators "have to deal with the raw input, which in theory could be any arbitrary object," with no field-level coercion having happened yet. In the team\'s unit tests, constructing the model directly with Product(discount_percent=15.0) means data["discount_percent"] happens to already be a Python float, so 0 <= data["discount_percent"] <= 100 works by coincidence — not because the "before" validator did anything to guarantee that type. In production, Product.model_validate_json(raw_json_body) receives a JSON payload where the upstream system happens to represent the discount as a STRING ("15.0"), and since field-level coercion to float hasn\'t run yet at "before" time, data["discount_percent"] is still the string "15.0" when the comparison runs — and comparing a string against int/float with <= raises TypeError: \'<=\' not supported between instances of \'str\' and \'int\' in Python, which is exactly the confusing error observed. The fix is switching the range check to a mode="after" validator instead, which per Pydantic\'s own documentation "run[s] after the whole model has been validated," guaranteeing self.discount_percent is genuinely a float by the time the check runs, regardless of whether the original input arrived as a Python float, a numeric string, or any other Pydantic-coercible representation — removing the dependency on the caller happening to pass an already-correctly-typed value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A @model_validator(mode="before") function receives the same kind of data a mode="after" validator does — a mostly-formed model with fields already coerced to their declared types, just running slightly earlier in the pipeline.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Pydantic\'s own documentation confirms "before" validators receive the genuinely raw input, "which in theory could be any arbitrary object," with none of the field-level type coercion "after" validators can rely on having already happened.'
    },
    {
      thought: 'Since a mode="before" validator worked correctly during manual testing and unit tests, it will behave the same way with any real input the model might ever receive in production.',
      reality: 'This subtopic\'s exercise shows the opposite — a "before" validator\'s behavior depends entirely on the exact raw shape/type of whatever was passed to the constructor, which can differ significantly between hand-constructed test data (already correctly typed) and real-world input like JSON (which may represent numbers as strings), producing bugs that only manifest with specific, untested input shapes.'
    },
    {
      thought: 'Choosing between @model_validator(mode="before") and mode="after") is mostly a stylistic preference, since both eventually run as part of validating the same model and have access to the same field data.',
      reality: 'This subtopic\'s second code example shows this is a substantive, not stylistic, choice — a check that depends on fields already having their declared Python types (comparisons, arithmetic) needs mode="after" specifically to be reliable across every possible caller and input format, not just the ones a developer happened to test with.'
    }
  ];
}
