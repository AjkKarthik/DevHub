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
  templateUrl: './update-validators-are-off-by-default-need-runvalidators.html',
  styleUrl: './update-validators-are-off-by-default-need-runvalidators.scss'
})
export class UpdateValidatorsAreOffByDefaultNeedRunvalidatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory says "Mongoose validates before every save — invalid documents throw a ValidationError without hitting the database" — accurate for .save(), but this specific guarantee does NOT extend to update operations',
      points: [
        'Per Mongoose\'s own documentation, validation is implemented as a pre("save") hook, registered by default on every schema — so document.save() (and Model.create(), which calls .save() internally) always validates before persisting, exactly as the main page describes.',
        'Model.updateOne(), Model.updateMany(), and Model.findOneAndUpdate() are a genuinely SEPARATE code path — they do not go through .save() at all, and Mongoose\'s documentation states directly: "update validators are off by default." This is a deliberate design default, not an oversight — these methods will happily write data that violates schema constraints (a required field being unset, a value outside a min/max range) unless told otherwise.',
        'The fix is explicit, per-call opt-in: pass { runValidators: true } as an options argument to updateOne()/updateMany()/findOneAndUpdate(). Only with that flag do these methods run the schema\'s validators against the fields actually being changed.',
      ]
    },
    {
      heading: 'Two precision details that matter once you turn runValidators on',
      points: [
        'Inside an update validator, this refers to the QUERY object, not the document being updated — Mongoose\'s own docs state this explicitly. A custom validator function written assuming this is the full document (a pattern that works fine in a normal .save()-triggered validator) behaves differently here, and current Mongoose versions default to treating this as query context automatically — no extra configuration flag is needed for that specific behavior.',
        'Update validators only run against the paths actually present in the update operation, and only for a specific set of update operators — $set, $unset, $push, $addToSet, $pull, $pullAll. A field left untouched by the update is not re-validated, even with runValidators: true — this is validation of what\'s CHANGING, not a full-document re-check.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent gap: updateOne() writes invalid data with no error',
      language: 'typescript',
      code: `const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  age:   { type: Number, min: 0, max: 150 },
});
const User = model('User', userSchema);

// .save() DOES validate — this correctly throws a ValidationError:
const user = new User({ email: 'a@b.com', age: 200 }); // over max
await user.save(); // throws — age exceeds max: 150

// updateOne() does NOT validate by default — this SUCCEEDS silently,
// writing age: 200 to the database despite the schema's max: 150
// constraint, because updateOne() never runs the validator at all:
await User.updateOne({ _id: someId }, { age: 200 }); // no error, no validation`,
    },
    {
      label: 'Fixed: explicit runValidators opt-in',
      language: 'typescript',
      code: `// Passing { runValidators: true } makes updateOne() validate the
// fields actually being changed, matching .save()'s behavior for
// those specific paths:
await User.updateOne(
  { _id: someId },
  { age: 200 },
  { runValidators: true } // now THROWS — age exceeds max: 150
);

// Custom validators referencing "this" behave differently here —
// this refers to the QUERY, not the document (current Mongoose
// versions handle this automatically, no extra flag needed):
const schema = new Schema({
  age: {
    type: Number,
    validate: {
      validator: function (value) {
        // "this" is the Query object in an update-validator context,
        // NOT the full document — a validator written assuming
        // access to sibling document fields via "this.otherField"
        // needs to be written with that distinction in mind.
        return value >= 0;
      },
      message: 'Age must be non-negative',
    },
  },
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s API has a PATCH /users/:id endpoint that calls User.findOneAndUpdate({ _id: id }, req.body) directly, with no explicit options argument. A tester manually sends a malformed request setting age to -5 (violating the schema\'s min: 0 constraint) and is surprised the request succeeds with a 200 response instead of a validation error. Using Mongoose\'s documented default behavior, explain why.',
    hint: 'Does findOneAndUpdate() go through the same pre("save") validation hook that .save() uses, or is it a separate code path with its own default settings for validation?',
    solution: 'This succeeds because findOneAndUpdate() is a separate code path from .save() — it does not go through the pre("save") hook where Mongoose registers validation by default, and Mongoose\'s own documentation states plainly that "update validators are off by default." Since this endpoint calls findOneAndUpdate() with no options argument at all, the update runs with its default settings — meaning no validation occurs, and the invalid age: -5 value is written to the database without any error being thrown, exactly matching the -5 the tester sent. The fix is passing { runValidators: true } as the options argument: User.findOneAndUpdate({ _id: id }, req.body, { runValidators: true }) — this enables validation for the fields present in req.body, matching the same schema constraints that .save() would have enforced, and would correctly reject the -5 age value with a validation error instead of silently persisting it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Mongoose "validates before every save," per the main page\'s own theory, this guarantee applies uniformly to every way of modifying a document, including updateOne() and findOneAndUpdate().',
      reality: 'This subtopic\'s theory and first code example both show the opposite — Mongoose\'s own documentation states update validators are OFF by default, a deliberate design choice specific to update operations, which are a genuinely separate code path from .save().'
    },
    {
      thought: 'A custom validator function that reads sibling fields via "this.otherField" (assuming "this" is the full document) works identically whether triggered by .save() or by an update operation with runValidators: true.',
      reality: 'This subtopic\'s theory clarifies "this" refers to the QUERY object, not the document, inside an update-validator context — a real, documented difference from the .save()-triggered validator context the main page\'s own pre-save examples use.'
    },
    {
      thought: 'Passing { runValidators: true } to an update operation causes Mongoose to re-validate the ENTIRE document against the schema, the same as .save() would.',
      reality: 'This subtopic\'s theory clarifies update validators only check the paths actually present in the update operation (and only for specific operators like $set/$unset) — fields left untouched by the update are not re-validated, even with runValidators: true.'
    }
  ];
}
