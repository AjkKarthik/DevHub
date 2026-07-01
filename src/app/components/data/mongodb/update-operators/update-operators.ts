import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-mongo-update-operators',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './update-operators.html',
  styleUrl: './update-operators.scss',
})
export class MongoUpdateOperators {
  quickRef: QuickRefItem[] = [
    { type: 'operator', name: '$set',        desc: 'Set specific fields. Adds field if it doesn\'t exist.' },
    { type: 'operator', name: '$unset',      desc: 'Remove a field from the document: { $unset: { field: "" } }.' },
    { type: 'operator', name: '$inc',        desc: 'Increment/decrement a number atomically: { $inc: { count: 1 } }.' },
    { type: 'operator', name: '$mul',        desc: 'Multiply a numeric field: { $mul: { price: 1.1 } } → 10% increase.' },
    { type: 'operator', name: '$min',        desc: 'Update field only if new value is LESS than current.' },
    { type: 'operator', name: '$max',        desc: 'Update field only if new value is GREATER than current.' },
    { type: 'operator', name: '$rename',     desc: 'Rename a field: { $rename: { oldName: "newName" } }.' },
    { type: 'operator', name: '$setOnInsert', desc: 'Only applies on upsert insert (not on update).' },
    { type: 'operator', name: '$currentDate', desc: 'Set field to current date/timestamp: { $currentDate: { updatedAt: true } }.' },
    { type: 'operator', name: '$push',       desc: 'Append element to an array.' },
    { type: 'operator', name: '$pull',       desc: 'Remove elements matching condition from array.' },
    { type: 'operator', name: '$addToSet',   desc: 'Push to array only if element is not already present (dedup).' },
    { type: 'operator', name: '$pop',        desc: 'Remove first (-1) or last (1) element of an array.' },
    { type: 'operator', name: '$each',       desc: 'Push/addToSet multiple values: { $push: { tags: { $each: ["a","b"] } } }.' },
    { type: 'operator', name: '$slice',      desc: 'Trim array to last N elements during $push: { $push: { log: { $each:[e], $slice:-10 } } }.' },
    { type: 'operator', name: '$',           desc: 'Positional — updates first matching array element: { "items.$.qty": 5 }.' },
    { type: 'operator', name: '$[]',         desc: 'All positional — updates ALL array elements.' },
    { type: 'operator', name: '$[<id>]',     desc: 'Filtered positional — updates array elements matching arrayFilters.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Field Update Operators',
      points: [
        '<code>$set</code> is the most common update operator. It sets one or more fields to new values without touching other fields. If the field does not exist, it is created. Use dot notation for nested fields: <code>{ $set: { "address.city": "Paris" } }</code>.',
        '<code>$unset</code> removes a field entirely from the document: <code>{ $unset: { temporaryField: "" } }</code>. The value in $unset doesn\'t matter — empty string "" is conventional. After $unset, the field doesn\'t appear in the document at all (different from setting it to null).',
        '<code>$inc</code> atomically adds to a numeric field. Negative values decrement. If the field doesn\'t exist, $inc creates it starting at the increment value. Atomic — no read/modify/write cycle needed for counters.',
        '<code>$min</code> and <code>$max</code> only update if the new value is lower/higher than the existing value. Use case: tracking the minimum price ever seen, or maximum score achieved. If the field doesn\'t exist, the operator sets it to the provided value.',
        '<code>$currentDate</code> sets a field to the server\'s current date: <code>{ $currentDate: { lastModified: true } }</code>. Setting to <code>{ $type: "timestamp" }</code> gives a BSON timestamp instead of Date. Using server time avoids clock skew between application servers.',
      ],
    },
    {
      heading: 'Array Update Operators',
      points: [
        '<code>$push</code> appends an element to the end of an array. To add multiple elements at once, use <code>$each</code>: <code>{ $push: { tags: { $each: ["new", "featured"] } } }</code>. Combined with <code>$slice</code> and <code>$sort</code>, you can maintain a bounded sorted array (e.g., top-10 scores).',
        '<code>$addToSet</code> pushes an element only if it\'s not already in the array, maintaining uniqueness. Unlike a unique index, it works per-array element: <code>{ $addToSet: { roles: "editor" } }</code>. Combines with $each for multiple values.',
        '<code>$pull</code> removes array elements matching a condition: <code>{ $pull: { items: { productId: "abc" } } }</code>. The condition can be a value (exact match) or a query expression. <code>$pullAll</code> removes all matching values from an array of specific values.',
        '<code>$pop</code> removes the first (<code>-1</code>) or last (<code>1</code>) element: <code>{ $pop: { queue: -1 } }</code>. Useful for simple queue/stack operations. Unlike $pull, $pop has no condition — it always removes from the end/beginning.',
        '<code>$push</code> with <code>$slice: -10</code> keeps only the last 10 elements after the push — ideal for capped activity logs: <code>{ $push: { recentViews: { $each: [newView], $slice: -10, $sort: { viewedAt: -1 } } } }</code>.',
      ],
    },
    {
      heading: 'Positional Operators (Array Element Updates)',
      points: [
        'The <strong>positional <code>$</code> operator</strong> references the first array element matched by the query filter: <code>updateOne({ "items.productId": "x" }, { $set: { "items.$.qty": 5 } })</code>. The <code>$</code> acts as a placeholder for the matched element\'s index. Only works on the first match.',
        'The <strong>all-positional <code>$[]</code> operator</strong> updates ALL elements in an array, regardless of value: <code>{ $inc: { "scores.$[]": 10 } }</code> adds 10 to every score in the array.',
        'The <strong>filtered positional <code>$[id]</code> operator</strong> with <code>arrayFilters</code> updates only elements matching a condition: <code>updateOne(filter, { $set: { "items.$[elem].status": "sold" } }, { arrayFilters: [{ "elem.qty": { $lt: 0 } }] })</code>. Most powerful for nested array updates.',
        'Positional operators require the array field to appear in the query filter (for <code>$</code>) so MongoDB knows which element index to use. If the filter doesn\'t include the array field, MongoDB cannot determine the position.',
        'Nested array updates (arrays within arrays) are not supported by the positional <code>$</code> operator — use <code>$[id]</code> with nested <code>arrayFilters</code> instead.',
      ],
    },
    {
      heading: 'Atomic Update Operators for Counters and Sets',
      points: [
        '$inc atomically increments (or decrements, with a negative value) a numeric field — critical for correctly maintaining counters (a view count, an inventory quantity) under concurrent updates, since reading a value, incrementing it in application code, and writing it back is vulnerable to lost updates when multiple requests run concurrently.',
        '$mul atomically multiplies a field by a given value, useful for proportional adjustments (applying a discount percentage, scaling a value) without needing to read the current value first — like $inc, this avoids the read-modify-write race condition inherent in doing the calculation in application code.',
        '$addToSet adds a value to an array only if it does not already exist, providing set-like uniqueness semantics for array fields — distinct from $push, which always appends regardless of whether the value is already present, potentially creating duplicate entries.',
        '$currentDate atomically sets a field to the current server date/time at the moment the update executes — more reliable than setting a timestamp from application code, since it avoids clock skew issues between the application server and the database server, and executes exactly at write time.',
      ],
    },
    {
      heading: 'Upserts and Conditional Update Patterns',
      points: [
        'The upsert option (upsert: true) on an update operation inserts a new document if no document matches the filter, or updates the existing one if a match is found — a common atomic pattern for "create or update" logic (like recording a user\'s latest login) that avoids a separate existence check before deciding whether to insert or update.',
        '$setOnInsert specifies fields that should only be set when an upsert actually creates a NEW document, not when it updates an existing one — useful for initializing fields like createdAt that should be set once at creation and never overwritten by subsequent updates to the same document.',
        'findOneAndUpdate() atomically finds a document, applies an update, and returns either the pre-update or post-update version of the document (controlled by the returnDocument option) — essential for patterns like atomically claiming a task from a queue, where you need both the update to happen and the resulting document returned in one atomic operation.',
        'Conditional updates using $expr within the filter allow comparing a document\'s current field values before deciding whether to apply an update (only increment a counter if it is below a maximum threshold) — implementing optimistic concurrency control patterns directly within a single atomic update operation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Field Operators',
      language: 'typescript',
      code: `const users = db.collection('users');

// $set — set fields (create if not exist)
await users.updateOne(
  { _id: userId },
  { $set: { name: 'Alice', 'address.city': 'London', updatedAt: new Date() } }
);

// $unset — remove fields
await users.updateOne({ _id: userId }, { $unset: { tempToken: '', expiredAt: '' } });

// $inc — atomic increment/decrement
await users.updateOne({ _id: userId }, { $inc: { loginCount: 1, credits: -5 } });

// $mul — multiply
await products.updateMany({ category: 'sale' }, { $mul: { price: 0.9 } }); // 10% off

// $min / $max — conditional set
await users.updateOne({ _id: userId }, { $min: { lowestScore: 45 } }); // only set if 45 < current
await users.updateOne({ _id: userId }, { $max: { highScore: 99 } });   // only set if 99 > current

// $rename — rename a field
await users.updateMany({}, { $rename: { 'fullName': 'name' } });

// $currentDate — set to server time
await users.updateOne({ _id: userId }, { $currentDate: { lastLogin: true } });

// $setOnInsert — only on upsert insert
await users.updateOne(
  { email: 'new@example.com' },
  { $set: { name: 'Bob' }, $setOnInsert: { createdAt: new Date(), credits: 100 } },
  { upsert: true }
);`,
    },
    {
      label: 'Array Operators',
      language: 'typescript',
      code: `const posts = db.collection('posts');

// $push — append one element
await posts.updateOne({ _id: postId }, { $push: { tags: 'mongodb' } });

// $push $each — append multiple
await posts.updateOne({ _id: postId }, { $push: { tags: { $each: ['nosql', 'database'] } } });

// $push with $slice — keep only last 5 items (rolling log)
await posts.updateOne(
  { _id: postId },
  { $push: { recentViews: { $each: [{ userId, viewedAt: new Date() }], $slice: -5 } } }
);

// $addToSet — add only if not present (set semantics)
await posts.updateOne({ _id: postId }, { $addToSet: { likedBy: userId } });
await posts.updateOne({ _id: postId }, { $addToSet: { tags: { $each: ['nosql', 'mongodb'] } } });

// $pull — remove elements matching condition
await posts.updateOne({ _id: postId }, { $pull: { likedBy: userId } } as any);

// $pull by value
await posts.updateOne({ _id: postId }, { $pull: { tags: 'draft' } } as any);

// $pop — remove first or last
await posts.updateOne({ _id: postId }, { $pop: { history: 1 } });  // remove last
await posts.updateOne({ _id: postId }, { $pop: { queue: -1 } });   // remove first`,
    },
    {
      label: 'Positional Operators',
      language: 'typescript',
      code: `const orders = db.collection('orders');

// Positional $ — update FIRST matching array element
await orders.updateOne(
  { _id: orderId, 'items.productId': 'PROD-001' },      // filter must include array field
  { $set: { 'items.$.status': 'shipped', 'items.$.shippedAt': new Date() } }
);

// $[] — update ALL elements in array
await orders.updateMany(
  { status: 'processing' },
  { $set: { 'items.$[].processed': true } }
);

// $[id] with arrayFilters — update elements matching condition
await orders.updateMany(
  { status: 'active' },
  { $set: { 'items.$[item].discount': 0.1 } },
  { arrayFilters: [{ 'item.price': { $gt: 100 } }] }  // only items over $100
);

// Multiple arrayFilters
await db.collection('courses').updateOne(
  { _id: courseId },
  {
    $set: {
      'modules.$[mod].lessons.$[lesson].completed': true
    }
  },
  {
    arrayFilters: [
      { 'mod._id': moduleId },
      { 'lesson._id': lessonId }
    ]
  }
);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using $push without $each to add multiple values',
      wrong: `// Pushes the entire array as a single nested element
await col.updateOne(filter, { $push: { tags: ['a', 'b', 'c'] } });
// Result: { tags: [['a', 'b', 'c']] } — array inside array!`,
      right: `await col.updateOne(filter, { $push: { tags: { $each: ['a', 'b', 'c'] } } });
// Result: { tags: ['a', 'b', 'c'] } — three separate elements`,
      explanation: '$push appends its value as a single element. To add multiple elements, use $each. Without $each, pushing an array creates a nested array (array-within-array), which is usually not what you want.',
    },
    {
      title: 'Missing array field in filter when using positional $ operator',
      wrong: `// $ operator has no index reference — MongoDB can't determine which element to update
await col.updateOne({ _id: id }, { $set: { 'items.$.status': 'done' } });`,
      right: `// Filter MUST include the array field for $ to work
await col.updateOne(
  { _id: id, 'items.productId': 'PROD-001' },
  { $set: { 'items.$.status': 'done' } }
);`,
      explanation: 'The positional $ operator references the index of the array element matched by the query filter. If the query doesn\'t match on the array field, MongoDB doesn\'t know which element to target and throws an error.',
    },
    {
      title: 'Using $pull with wrong value type (object vs scalar)',
      wrong: `// Tries to pull the string 'user-123' from an array of objects
await col.updateOne(filter, { $pull: { likedBy: 'user-123' } });
// likedBy contains: [{ userId: 'user-123', date: Date }] — no match`,
      right: `// Match on the object structure
await col.updateOne(filter, { $pull: { likedBy: { userId: 'user-123' } } as any });
// Or if likedBy is an array of strings ['user-123']:
await col.updateOne(filter, { $pull: { likedBy: 'user-123' } as any });`,
      explanation: '$pull removes elements that match the given condition. If your array contains objects, $pull condition must match the object structure (MongoDB evaluates it as a query). If the array contains primitives, pass the primitive value directly.',
    },
    {
      title: 'Confusing $set on an array field with $push',
      wrong: `// This REPLACES the entire tags array with ['sale']
await col.updateOne(filter, { $set: { tags: ['sale'] } });`,
      right: `// To add 'sale' to existing tags array:
await col.updateOne(filter, { $push: { tags: 'sale' } });
// To replace the entire array (intentional):
await col.updateOne(filter, { $set: { tags: ['sale'] } }); // this is correct if intentional`,
      explanation: '$set on an array field replaces the entire array, not appending to it. Use $push (append), $addToSet (append unique), or $pull (remove) to modify individual array elements. Only use $set on an array when you intend to replace the whole array.',
    },
  ];

  challenge: Challenge = {
    title: 'Leaderboard with Bounded History',
    language: 'typescript',
    description: 'Implement a game leaderboard: recordScore(playerId, score) that atomically updates the player\'s max score ($max), increments their game count ($inc), adds the score to a bounded history array (keep only last 10 scores with $slice), and timestamps the last play. If the player doesn\'t exist, create them (upsert).',
    hints: [
      'Combine multiple operators in one update: $max, $inc, $push with $each/$slice, $currentDate.',
      'Use upsert: true so new players are created automatically.',
      '$setOnInsert for fields that should only be set on first insert (e.g., joinedAt).',
      'Test with the same player multiple times and verify scoreHistory never exceeds 10 entries.',
    ],
    starterCode: `import { MongoClient } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('game');
const leaderboard = db.collection('leaderboard');

async function recordScore(playerId: string, score: number) {
  // TODO: update leaderboard entry with:
  // - maxScore: only update if new score is higher
  // - gameCount: increment by 1
  // - scoreHistory: push score, keep only last 10
  // - lastPlayedAt: server current date
  // - upsert: true
  // - joinedAt: only on insert
}`,
    solution: `import { MongoClient } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('game');
const leaderboard = db.collection('leaderboard');

async function recordScore(playerId: string, score: number) {
  await leaderboard.updateOne(
    { playerId },
    {
      $max: { maxScore: score },
      $inc: { gameCount: 1 },
      $push: {
        scoreHistory: {
          $each: [{ score, playedAt: new Date() }],
          $slice: -10,
        },
      },
      $currentDate: { lastPlayedAt: true },
      $setOnInsert: { joinedAt: new Date() },
    },
    { upsert: true }
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does { $inc: { stock: -3 } } do?',
      options: ['Sets stock to -3', 'Decrements stock by 3 atomically', 'Sets stock to the minimum of current and -3', 'Throws an error — negative values not allowed'],
      answer: 1,
      explanation: '$inc adds the given value to the field. A negative value decrements. { $inc: { stock: -3 } } subtracts 3 from the stock field atomically, without a read-modify-write cycle.',
    },
    {
      q: 'Which operator removes an element from an array only if it already exists (set semantics)?',
      options: ['$push', '$pull', '$addToSet', '$pop'],
      answer: 2,
      explanation: '$addToSet adds an element to an array only if it is not already present — array behaves like a mathematical set. $push always appends regardless of duplicates.',
    },
    {
      q: 'What is { $slice: -5 } in a $push modifier?',
      options: [
        'Removes the last 5 elements from the array',
        'After the push, keeps only the last 5 elements',
        'Pushes 5 copies of the element',
        'Splits the array into 5 parts',
      ],
      answer: 1,
      explanation: '$slice with a negative number keeps the last N elements after the $push. { $slice: -5 } maintains a rolling window of the 5 most recent entries. Positive $slice keeps the first N elements.',
    },
    {
      q: 'Which update operator only executes during an upsert INSERT, not on update?',
      options: ['$set', '$setOnInsert', '$insertOnly', '$ifNew'],
      answer: 1,
      explanation: '$setOnInsert sets fields only when the updateOne/updateMany creates a new document (upsert insert). When a matching document is found and updated, $setOnInsert is ignored. Perfect for createdAt timestamps.',
    },
    {
      q: 'You want to update a specific product in an orders.items array. Which operator targets one array element by condition?',
      options: ['$set with array index', 'Positional $ operator', 'Positional $[] operator', '$pull then $push'],
      answer: 1,
      explanation: 'The positional $ operator updates the first array element matched by the query filter. The filter must include a condition on the array field to establish which element $ refers to.',
    },
    { q: 'What is the difference between the $set and $unset update operators in MongoDB?', options: ['$set and $unset both modify field values — $set to a provided value and $unset to null, which keeps the field but makes it null', '$set adds or updates specified fields to the given values without affecting other fields; $unset removes the specified fields from the document entirely, unlike setting to null which keeps the field', '$unset is the legacy name for $set with a null value — they are functionally identical in all MongoDB versions above 4.0', '$set replaces the entire document with the provided object while $unset only modifies individual fields specified'], answer: 1, explanation: '$set: { $set: { status: "active", updatedAt: new Date() } } — sets status and updatedAt. If they exist, they are overwritten. If they do not exist, they are created. Other fields in the document are unchanged. Nested field: { $set: { "address.city": "NYC" } } — sets only the city within the address object. Other address fields (street, zip) are untouched. $unset: { $unset: { temporaryFlag: "", internalNotes: "" } } — removes both fields from the document. The value in $unset is ignored (conventionally "" or 1). After $unset, the field no longer exists in the document. It does not appear in the output of find() or exists queries. Null vs unset: { status: null } — the field exists but has a null value. Matches { status: null } and { status: { $exists: true } }. After $unset: the field does not exist. Does NOT match { status: null }. Does match { status: { $exists: false } }. Use cases: $set for any value update or field addition. $unset to clean up obsolete fields during schema migration or to remove optional fields when they are no longer applicable.' },
    { q: 'How do $push with $each, $slice, and $sort modifiers work together in MongoDB?', options: ['$push with $each adds multiple elements to an array; $slice and $sort cannot be combined with $push and must be applied as separate update operations', '$push with $each adds each element in the given array to the field array; $slice limits the array to N elements after the push; $sort sorts elements before slicing — enabling a capped, sorted array in a single atomic update', 'The $each modifier duplicates each element N times in the array; $slice then selects only the unique elements; $sort alphabetizes the result', '$push with $each can only be used for arrays of primitive values — arrays of objects require $addToSet instead'], answer: 1, explanation: '$each: adds multiple elements in a single push operation. Without $each: { $push: { scores: [90, 85, 92] } } pushes the entire array as a single nested element. With $each: { $push: { scores: { $each: [90, 85, 92] } } } adds each number as a separate element. $sort: sorts the array after inserting the new elements. { $push: { scores: { $each: [90], $sort: -1 } } } — insert 90 then sort descending. For arrays of objects: { $push: { reviews: { $each: [newReview], $sort: { rating: -1 } } } } — sort by rating. $slice: limits the array to N elements after sorting. Positive N: keep the first N elements. Negative N: keep the last N elements. Combined use case — maintain a top-10 leaderboard: { $push: { topPlayers: { $each: [newPlayer], $sort: { score: -1 }, $slice: 10 } } }. This adds the new player, sorts by score descending, and keeps only the top 10 — all atomically. $position: also available — inserts at a specific array index instead of the end.' },
    { q: 'What is the difference between $addToSet and $push in MongoDB updates?', options: ['$addToSet adds elements to a set collection type that enforces uniqueness at the database level; $push adds to a regular array', '$addToSet adds an element only if it does not already exist in the array, preventing duplicates; $push always appends the element regardless of whether it is already present', '$addToSet is equivalent to $push followed by a deduplication step that removes all other duplicates from the array; $push only appends without any deduplication', '$addToSet only works for arrays of strings and numbers; $push handles all BSON types including embedded objects'], answer: 1, explanation: '$push: always appends the element to the array. { $push: { tags: "mongodb" } } — adds "mongodb" even if it is already in tags. Result: ["databases", "mongodb", "mongodb"] if run twice. $addToSet: checks if the element already exists before adding. { $addToSet: { tags: "mongodb" } } — adds "mongodb" only if not already present. If "mongodb" exists, the update is a no-op (no modification, no error). Result: ["databases", "mongodb"] regardless of how many times run. Equality check for objects: $addToSet uses strict equality for objects. Two objects { a: 1, b: 2 } and { b: 2, a: 1 } are considered different (key order matters in BSON comparison). $addToSet with $each: { $addToSet: { tags: { $each: ["mongodb", "nosql"] } } } — adds each element only if not present. $addToSet with array values: if you push an array as a single element, $addToSet checks if that exact array already exists as an element. When to use: $addToSet for tag lists, permission sets, unique subscriber lists. $push for ordered lists, duplicate-allowed arrays (scores, events), or when checking before pushing is done at the application layer.' },
    { q: 'How do arrayFilters work in MongoDB update operations?', options: ['arrayFilters are a query syntax shorthand that applies the same filter to every array in the document simultaneously with a single $filter expression', 'arrayFilters identify specific array elements to update based on a condition — enabling targeted updates of one or more matching elements within an array without replacing the entire array', 'arrayFilters are only applicable to the $pull operator and allow specifying which array elements to remove based on a complex condition', 'arrayFilters replace the $elemMatch operator inside update queries and only work when all array elements match the filter condition'], answer: 1, explanation: 'arrayFilters: used with the positional $[identifier] operator to target specific array elements. Without arrayFilters (positional $): updates only the FIRST matching array element. db.orders.updateOne({ "items.sku": "ABC" }, { $set: { "items.$.qty": 10 } }) — updates only the first item with sku ABC. With arrayFilters (all matches): db.orders.updateOne({ _id: orderId }, { $set: { "items.$[item].qty": 10 } }, { arrayFilters: [{ "item.sku": "ABC" }] }). Updates ALL items where sku is ABC, not just the first. Syntax: $[identifier] in the update — identifier matches a name in arrayFilters. arrayFilters: an array of filter conditions, one per identifier. Multiple identifiers: update nested arrays: db.courses.updateOne({ _id: courseId }, { $set: { "grades.$[student].scores.$[score].grade": "A" } }, { arrayFilters: [{ "student.name": "Alice" }, { "score.exam": "final" }] }). This targets the final exam score for Alice within nested arrays. Use cases: update all items in an order with a specific SKU. Mark all comments by a user as reviewed. Change the status of all pending tasks in a task list.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between $pull and $pop?',
      a: '<code>$pull</code> removes array elements that match a given condition or value — it\'s condition-based and can remove multiple elements in one operation. <code>$pop</code> removes the first (<code>-1</code>) or last (<code>1</code>) element regardless of its value — it\'s position-based. Use $pull to remove by value (e.g., remove a specific tag); use $pop to implement a FIFO queue (remove first) or stack (remove last).',
    },
    {
      q: 'Can I combine multiple update operators in a single updateOne call?',
      a: 'Yes — you can combine multiple operators in one update document: <code>{ $set: { name: "X" }, $inc: { views: 1 }, $push: { log: entry }, $currentDate: { updatedAt: true } }</code>. MongoDB applies all operators atomically in a single operation. However, the same field cannot appear in two different operators in the same update.',
    },
    {
      q: 'How does $min/$max work when the field doesn\'t exist?',
      a: 'If the field doesn\'t exist, both <code>$min</code> and <code>$max</code> create the field and set it to the provided value (since any value is greater than the absence of a value, and any value is less than the absence of a value — effectively treating a missing field as the maximum/minimum). This makes $min/$max safe for initialisation: first call always sets the value, subsequent calls only update if the condition is met.',
    },
    {
      q: 'What is the filtered positional operator $[id] and when do I use it?',
      a: '<code>$[id]</code> (filtered positional) works with <code>arrayFilters</code> to update array elements matching a condition. Unlike <code>$</code> (which updates the first element matched by the query filter), <code>$[id]</code> can update multiple elements and works on nested arrays. Use it when: (1) you need to update more than one element per array, (2) the matching condition isn\'t in the main query filter, or (3) you\'re updating nested arrays (arrays within arrays).',
    },
    {
      q: 'How do I remove a specific element at a known index from an array?',
      a: 'MongoDB has no "delete by index" operator. The idiomatic approach is a two-step operation: (1) <code>$unset</code> the element to null: <code>{ $unset: { "arr.2": "" } }</code>, then (2) <code>$pull</code> the null value: <code>{ $pull: { arr: null } }</code>. Alternatively, read the document, modify the array in application code, and write back the modified array using <code>$set</code> — acceptable for non-concurrent scenarios.',
    },
    { q: 'How does $inc differ from $set for numeric field updates in MongoDB?', a: '$set for numbers: { $set: { viewCount: 100 } } — sets viewCount to exactly 100, overwriting any existing value. Not safe for concurrent updates — if two clients both read viewCount = 50 and set to 51, one update is lost (lost update problem). $inc: { $inc: { viewCount: 1 } } — atomically increments viewCount by 1. MongoDB applies the increment server-side. No race condition — both concurrent $inc operations are applied sequentially, final result is 52 (both increments counted). Decrement: { $inc: { stock: -1 } } — decrement stock by 1 (pass a negative value). Multiple fields: { $inc: { viewCount: 1, clickCount: 1, score: 5 } } — all three increments happen atomically in one operation. Float increment: { $inc: { rating: 0.5 } } — works for floating point values. Negative start: { $inc: { debt: 500 } } — if debt starts at 0, result is 500. Works with any numeric starting value. $mul: multiply instead of add: { $mul: { price: 1.1 } } — increase price by 10%. Use cases for $inc: view counters, download counts, stock management, score tracking, version counters (optimistic locking). When to use $set for numbers: when you are setting an absolute value (e.g., resetting a counter to 0, or setting a computed value from application logic that already handles the race condition).' },
    { q: 'What is the difference between $pull and $pop for removing array elements in MongoDB?', a: '$pop: removes an element from either end of an array. { $pop: { scores: 1 } } — removes the LAST element. { $pop: { scores: -1 } } — removes the FIRST element. Does not consider element values — always removes from a position. Use case: when the array is used as a queue (pop from front) or stack (pop from back). $pull: removes all elements that match a specified condition. { $pull: { tags: "outdated" } } — removes all elements equal to "outdated" (not just the first). { $pull: { scores: { $lt: 50 } } } — removes all scores below 50. { $pull: { items: { status: "cancelled" } } } — removes all items where status is "cancelled". Pulls all matches: unlike $pop, $pull removes ALL matching elements in one operation. $pullAll: removes all occurrences of each value in a provided list. { $pullAll: { tags: ["old", "deprecated", "legacy"] } } — removes all elements that are any of these values. Equivalent to $pull: { tags: { $in: [...] } }. Choosing between them: pop from ends (queue/stack pattern) → $pop. Remove specific value(s) → $pull or $pullAll. Remove elements matching a condition (e.g., all expired items) → $pull with a query condition. Atomicity: all of these are atomic — concurrent modifications are safe.' },
    { q: 'How do you update a specific element in an array by its index in MongoDB?', a: 'Direct index update: { $set: { "items.2.qty": 10 } } — updates the third element (index 2) of the items array. The index must be known at update time. Simple but brittle — if the array order changes between read and write, you update the wrong element. Positional $ operator: { $set: { "items.$.qty": 10 } } — updates the FIRST element in items that matched the query condition. Requires the array field to be part of the query: db.col.updateOne({ "items.sku": "ABC" }, { $set: { "items.$.qty": 10 } }). The $ is a placeholder for the index of the first matching element. Limitation: updates only the first match, not all matching elements. arrayFilters (all matching elements): as described above — use $[identifier] to update all matching elements. Find the element and use its index: application reads the document, finds the index of the desired element, then uses a direct index update with a versioned filter to prevent lost updates. Optimistic locking: include the current value in the query to detect concurrent modifications: db.col.updateOne({ _id: id, "items.2.qty": currentQty }, { $set: { "items.2.qty": newQty } }). If another client modified items.2.qty between your read and update, matchedCount is 0 and you can retry. Best practice: use the positional $ or arrayFilters operators rather than hardcoded indexes for resilience to array reordering.' },
    { q: 'What is the difference between updateOne/updateMany and findOneAndUpdate in MongoDB?', a: 'updateOne: db.col.updateOne(filter, update, options). Updates the first document matching the filter. Returns: { acknowledged, matchedCount, modifiedCount, upsertedId }. Does NOT return the modified document. Use when you need to update and do not need the document back. updateMany: updates ALL documents matching the filter. Returns: { acknowledged, matchedCount, modifiedCount }. Use for bulk updates. findOneAndUpdate: db.col.findOneAndUpdate(filter, update, { returnDocument: "after", sort: ..., projection: ... }). Returns the document. returnDocument: "before": returns the document as it was BEFORE the update (default in older drivers). returnDocument: "after": returns the document as it is AFTER the update. Atomic: the find and update happen atomically — no other operation can modify the document between the find and the update. Use cases for findOneAndUpdate: implementing a queue: findOneAndUpdate({ status: "pending" }, { $set: { status: "processing" } }, { sort: { priority: -1 }, returnDocument: "after" }) — atomically claims the highest-priority pending task. Counter with return value: increment a counter and get the new value atomically. Upsert with returned document: create or update and always get the resulting document. Performance: findOneAndUpdate has slightly more overhead than updateOne (must return the document). Use updateOne when the result document is not needed.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB update operators modify documents atomically: $set/$unset for fields, $inc/$mul for numbers, $push/$pull/$addToSet for arrays.',
    mustKnow: [
      '$set modifies specific fields; bare object replaces the entire document',
      '$inc is atomic — safe for counters without transactions',
      '$addToSet deduplicates; $push always appends; $pull removes by condition',
      '$push with $each + $slice maintains bounded arrays (e.g., rolling logs)',
      'Positional $: updates first matched array element (filter must include array field)',
      '$[] updates ALL array elements; $[id] with arrayFilters targets specific elements',
      '$setOnInsert runs only on upsert-insert, not on update',
    ],
    interviewFocus: [
      '$inc atomicity vs application-level read/modify/write',
      '$addToSet vs $push (set semantics vs always append)',
      'Positional operators: $, $[], $[id] — when to use each',
      '$push with $slice for bounded activity logs',
      'Combining multiple operators in one atomic update',
    ],
  };
}
