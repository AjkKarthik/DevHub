import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Pre-Save Hook for a Field the Schema Never Declared',
    points: [
      'The main page\'s own "Mongoose Schema (for comparison)" codeTab defined a <code>pre(\'save\')</code> hook specifically to hash a <code>password</code> field before saving — but the schema object passed to <code>new Schema({...})</code> never declared a <code>password</code> field at all, only <code>email</code>, <code>name</code>, <code>role</code>, <code>createdAt</code>, and <code>lastLogin</code>.',
      'Verified against Mongoose\'s own documentation on strict mode (enabled by default): "values passed to a model constructor that were not specified in the schema do not get saved to the db." Setting <code>this[\'password\']</code> on a document whose schema never declared that path would not persist to MongoDB at all — the entire pre-save hook was hashing and assigning a value that strict mode would silently discard.',
      'The codeTab also called <code>hashPassword(...)</code> — a function never imported or declared anywhere in the same codeTab, an undeclared reference that would fail to compile as written, independent of the missing schema field.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Missing Field, Made Concrete',
    language: 'typescript',
    code: `import mongoose, { Schema, InferSchemaType, model } from 'mongoose';
import bcrypt from 'bcrypt';

// BEFORE -- no 'password' field declared at all:
const brokenSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name:  { type: String, required: true },
  // password field missing entirely
});

// AFTER -- password declared, and hashPassword replaced with a real
// bcrypt call (see the Security & Authentication topic's own subtopic
// on why bcrypt, not plain SHA-256):
const userSchema = new Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  name:     { type: String, required: true, minlength: 2 },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'user', 'viewer'], default: 'user' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this['password'] = await bcrypt.hash(this['password'], 12);
  }
  next();
});

type UserType = InferSchemaType<typeof userSchema>;
const User = model<UserType>('User', userSchema);

// Pure-JS model of Mongoose's own documented strict-mode behavior:
// an undeclared path set on a document is never persisted.
function simulateSave(schemaFields: string[], setFields: Record<string, unknown>) {
  const persisted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(setFields)) {
    if (schemaFields.includes(key)) persisted[key] = value; // strict mode: only declared paths saved
  }
  return persisted;
}

const brokenFields = ['email', 'name']; // password never declared
console.log('Saved with BROKEN schema:', simulateSave(brokenFields, { email: 'a@b.com', password: 'hashed-value' }));
// -> { email: 'a@b.com' } -- password silently dropped, never persisted.

const fixedFields = ['email', 'name', 'password'];
console.log('Saved with FIXED schema:', simulateSave(fixedFields, { email: 'a@b.com', password: 'hashed-value' }));
// -> { email: 'a@b.com', password: 'hashed-value' } -- correctly persisted.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate argues the original codeTab is still "morally correct" — the intent (hash the password before saving) is clear even though the schema never declared the field. Given Mongoose\'s documented strict-mode behavior, would a real application built from this exact codeTab actually store any password at all?',
  hint: 'Trace what happens to the hashed value the pre-save hook computes, given that strict mode only persists fields the schema itself declares.',
  solution: `// No -- a real application built exactly from the original codeTab
// would never store a password at all.
//
// The pre-save hook DOES run, and DOES compute a hashed value (the
// bcrypt/hashPassword call itself has no dependency on the schema).
// But assigning that hashed value to this['password'] on a document
// whose schema never declared a 'password' path means Mongoose's
// default strict mode silently drops it at save time -- the document
// that actually reaches MongoDB has no password field whatsoever.
// A login attempt against this collection would find no passwordHash
// to compare against, for every single user, with no error anywhere
// pointing at the missing schema field as the cause.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A pre-save hook that references this[\'password\'] is safe as long as SOMETHING assigns a value to that property before save() actually persists the document.',
    reality: 'Verified against Mongoose\'s own strict-mode documentation: only paths the SCHEMA itself declares are ever persisted, regardless of what gets assigned to the in-memory document object beforehand. A pre-save hook computing and assigning a value to an undeclared path does real work that is then silently discarded, with no error surfaced anywhere.',
  },
  {
    thought: 'The comparison codeTab is clearly illustrative, so a missing schema field is a harmless simplification rather than something worth fixing.',
    reality: 'The whole point of this specific codeTab is demonstrating Mongoose\'s middleware/hook system via password hashing — the missing field undermines the ONE thing the example exists to show, not an unrelated corner of the snippet. An illustrative example whose central mechanism silently fails is a more misleading teaching aid than no example at all.',
  },
];

@Component({
  selector: 'app-mongo-node-mongoose-missing-password',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mongoose-schema-was-missing-its-own-password-field.html',
  styleUrl: './mongoose-schema-was-missing-its-own-password-field.scss',
})
export class MongooseSchemaWasMissingItsOwnPasswordFieldSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
