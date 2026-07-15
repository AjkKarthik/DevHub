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
  templateUrl: './populate-resolves-a-dangling-reference-to-null.html',
  styleUrl: './populate-resolves-a-dangling-reference-to-null.scss'
})
export class PopulateResolvesADanglingReferenceToNullSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory describes .populate() as loading referenced documents "like a SQL JOIN" — worth knowing exactly where that analogy breaks: a JOIN and populate() handle a missing target row very differently',
      points: [
        'Mongoose\'s own documentation states this directly, using almost exactly this comparison: "Mongoose populate doesn\'t behave like conventional SQL joins. When there\'s no document, story.author will be null. This is analogous to a left join in SQL." For an array-of-references field, the equivalent behavior gives an empty array rather than null.',
        'Concretely: if a Post document has an author field storing an ObjectId reference to a User document, and that User document is later deleted (while the Post\'s author field still holds the now-dangling ObjectId), calling .populate("author") on that Post does NOT throw an error and does NOT omit the field — it silently resolves author to null.',
        'This happens because .populate() is fundamentally just a second query against the referenced collection, filtering by the stored ObjectIds — an ObjectId with no matching document simply returns no result for that ID, exactly the same way any other MongoDB query returns nothing for a filter that matches zero documents. Mongoose doesn\'t validate referential integrity at write time (when the reference is created) OR at read time (when it\'s populated) — a dangling reference is a completely valid, unremarkable state as far as Mongoose is concerned.',
      ]
    },
    {
      heading: 'Why this matters for code that touches a populated field',
      points: [
        'Code that assumes a populated reference field is always a fully-formed document (e.g., post.author.name) will throw a TypeError the moment it encounters a dangling reference, since accessing .name on null fails — this is a genuinely common source of production crashes for any app that allows referenced documents to be deleted independently of the documents referencing them.',
        'The main page\'s own soft-delete pattern (using deletedAt instead of an actual delete) is one common way applications avoid this problem entirely — since the referenced document still physically exists (just marked deleted), populate() continues to resolve it normally, rather than resolving to null. For hard deletes, code touching a populated field needs an explicit null check, or a cleanup process that also removes/updates dangling references when the referenced document is actually deleted.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A dangling reference — no error, just null',
      language: 'typescript',
      code: `const postSchema = new Schema({
  title:  String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
});
const Post = model('Post', postSchema);

// Post created referencing a real, existing User
const post = await Post.create({ title: 'Hello', author: someUserId });

// ...later, that User document is hard-deleted (not soft-deleted):
await User.deleteOne({ _id: someUserId });
// Post.author still holds someUserId — Mongoose has no mechanism
// that automatically cleans this up or prevents it.

// populate() runs without any error at all:
const found = await Post.findById(post._id).populate('author');
console.log(found.author); // null — NOT an error, NOT omitted

// This throws a TypeError if code assumes author is always populated:
console.log(found.author.name); // TypeError: Cannot read properties of null`,
    },
    {
      label: 'Defensive handling for populated fields',
      language: 'typescript',
      code: `const posts = await Post.find({}).populate('author').lean();

const formatted = posts.map(post => ({
  title: post.title,
  // Explicit null check — never assume a populated reference
  // resolved to a real document.
  authorName: post.author?.name ?? 'Deleted user',
}));

// For array-of-references fields, a dangling entry gives an empty
// array rather than a single null — filtering it explicitly can
// still be worthwhile depending on how the data is displayed:
const postWithComments = await Post.findById(id).populate('comments.author');
const activeAuthors = postWithComments.comments
  .map(c => c.author)
  .filter(Boolean); // drop any nulls from deleted comment authors`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production incident report shows an API endpoint crashing with "Cannot read properties of null (reading \'name\')" on post.author.name, only for posts whose author account was deleted months ago through an admin panel that calls User.deleteOne() directly. The endpoint code has no special handling for missing authors and had worked correctly for over a year before this. Using Mongoose\'s documented populate() behavior, explain why this crash only started appearing now, and what class of fix addresses it.',
    hint: 'Does populate() throw an error when the referenced document doesn\'t exist, or does it resolve the field to a specific value that later code might not be checking for?',
    solution: 'This crash is entirely consistent with Mongoose\'s documented populate() behavior — it never throws an error for a dangling reference, it simply resolves the field to null (Mongoose\'s own docs describe this explicitly as "analogous to a left join in SQL"). The endpoint worked correctly for over a year not because the code was actually safe, but because every author reference it encountered during that time happened to point to a User document that still existed — the underlying assumption (that a populated author field is always a real object) was always fragile, it just hadn\'t been exercised by an actual dangling reference until the admin panel\'s hard-delete created one. The class of fix needed is defensive null-checking anywhere a populated field is accessed (post.author?.name instead of post.author.name), or, alternatively, addressing the root cause by switching the User deletion flow to a soft-delete pattern (matching the main page\'s own deletedAt approach) so referenced User documents continue to exist — and populate() continues to resolve them normally — even after being "deleted" from the application\'s perspective.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Mongoose\'s .populate() behaves exactly like a SQL JOIN, including throwing an error or excluding the row entirely if the referenced record doesn\'t exist.',
      reality: 'This subtopic\'s theory quotes Mongoose\'s own documentation stating the opposite — populate() is explicitly compared to a SQL LEFT JOIN, resolving a missing reference to null (or an empty array for array-of-references fields) rather than erroring or omitting the field.'
    },
    {
      thought: 'Mongoose prevents a document from being deleted if other documents still hold a reference to it, similar to a foreign-key constraint in a relational database.',
      reality: 'This subtopic\'s code example shows the opposite — Mongoose has no referential-integrity enforcement at all; a referenced document can be deleted freely while other documents\' ObjectId references to it remain, silently becoming "dangling" references that populate() resolves to null.'
    },
    {
      thought: 'Code that accesses a populated field\'s properties (like post.author.name) is safe as long as .populate() was called correctly in the query.',
      reality: 'This subtopic\'s exercise shows calling .populate() correctly does not guarantee the field resolves to an actual document — a dangling reference still resolves to null, and code accessing properties on it without a null check will throw a TypeError.'
    }
  ];
}
