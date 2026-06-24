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
