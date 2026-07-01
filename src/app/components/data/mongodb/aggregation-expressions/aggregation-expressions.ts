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
  selector: 'app-mongo-aggregation-expressions',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './aggregation-expressions.html',
  styleUrl: './aggregation-expressions.scss',
})
export class MongoAggregationExpressions {
  quickRef: QuickRefItem[] = [
    { type: 'operator', name: '$add / $subtract',     desc: 'Arithmetic: { $add: ["$price", "$tax"] }. Also adds milliseconds to dates.' },
    { type: 'operator', name: '$multiply / $divide',  desc: 'Multiply or divide: { $multiply: ["$qty", "$price"] }.' },
    { type: 'operator', name: '$mod',                 desc: 'Modulo: { $mod: ["$total", 100] }.' },
    { type: 'operator', name: '$concat',              desc: 'String concat: { $concat: ["$first", " ", "$last"] }.' },
    { type: 'operator', name: '$toUpper / $toLower',  desc: 'Case conversion.' },
    { type: 'operator', name: '$trim / $ltrim / $rtrim', desc: 'Trim whitespace or characters from strings.' },
    { type: 'operator', name: '$substr / $substrCP',  desc: '$substrCP for Unicode-safe substring.' },
    { type: 'operator', name: '$split',               desc: 'Split string: { $split: ["$csv", ","] } → array.' },
    { type: 'operator', name: '$dateToString',        desc: 'Format date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }.' },
    { type: 'operator', name: '$year / $month / $dayOfMonth', desc: 'Extract date parts.' },
    { type: 'operator', name: '$dateDiff',            desc: 'Difference between two dates in a given unit.' },
    { type: 'operator', name: '$cond',                desc: 'Ternary: { $cond: { if: expr, then: val, else: val } }.' },
    { type: 'operator', name: '$ifNull',              desc: 'Default for null/missing: { $ifNull: ["$field", "default"] }.' },
    { type: 'operator', name: '$switch',              desc: 'Multi-branch conditional.' },
    { type: 'operator', name: '$filter',              desc: 'Filter array elements: { $filter: { input: "$arr", cond: expr } }.' },
    { type: 'operator', name: '$map',                 desc: 'Transform each array element: { $map: { input: "$arr", as: "el", in: expr } }.' },
    { type: 'operator', name: '$reduce',              desc: 'Reduce array to single value.' },
    { type: 'operator', name: '$size (expression)',   desc: 'Array length: { $size: "$tags" }.' },
    { type: 'operator', name: '$arrayElemAt',         desc: 'Get element by index: { $arrayElemAt: ["$scores", 0] }.' },
    { type: 'operator', name: '$type',                desc: 'Return BSON type name of a value.' },
    { type: 'operator', name: '$convert / $toInt / $toString', desc: 'Type conversion operators.' },
    { type: 'operator', name: '$$NOW',                desc: 'System variable: current timestamp at pipeline execution.' },
    { type: 'operator', name: '$$ROOT',               desc: 'System variable: the current top-level document.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Expression Syntax',
      points: [
        'Aggregation expressions are <strong>functional</strong> — they take inputs and produce outputs. They appear in $project, $addFields, $group (accumulator arguments), $match ($expr), $lookup pipeline, and other stages.',
        'Field reference: prefix a field name with <code>$</code> to reference its value — <code>"$price"</code>. This is a field path, not a string literal. <code>"price"</code> (no $) is a literal string "price".',
        'System variables use double-dollar: <code>$$NOW</code> (current timestamp), <code>$$ROOT</code> (entire document), <code>$$CURRENT</code> (current document in pipeline), <code>$$REMOVE</code> (exclude a field from the output).',
        'Expressions can be nested arbitrarily: <code>{ $multiply: [{ $subtract: ["$price", "$discount"] }, "$qty"] }</code> computes (price − discount) × qty. The nesting mirrors function composition.',
        'Expressions are evaluated on the server — every document in the pipeline runs the expression. Complex expressions on large collections are CPU-intensive. Use $match to reduce document count before complex $project/$addFields expressions.',
      ],
    },
    {
      heading: 'Arithmetic & String Expressions',
      points: [
        '<code>$add</code> works on numbers AND dates. Adding a number to a date adds that many milliseconds: <code>{ $add: ["$startDate", 7 * 24 * 60 * 60 * 1000] }</code> adds 7 days.',
        'String expressions: <code>$concat</code>, <code>$toUpper</code>/<code>$toLower</code>, <code>$trim</code>, <code>$split</code>, <code>$substrCP</code> (Unicode-safe), <code>$indexOfCP</code> (find substring position), <code>$regexMatch</code>/<code>$regexFind</code>/<code>$regexFindAll</code>.',
        '<code>$strLenCP</code> returns the number of Unicode codepoints in a string. <code>$strLenBytes</code> returns the byte count. Use CP variants for internationalized strings.',
        'Type conversion: <code>$toInt</code>, <code>$toDouble</code>, <code>$toString</code>, <code>$toDate</code>, <code>$toBool</code>. The generic <code>$convert</code> operator lets you specify onError and onNull behaviors. Use these when your collection has mixed types in a field.',
        'Rounding: <code>$round</code>, <code>$floor</code>, <code>$ceil</code>, <code>$trunc</code>, <code>$abs</code>. Example: <code>{ $round: ["$price", 2] }</code> rounds to 2 decimal places.',
      ],
    },
    {
      heading: 'Date Expressions',
      points: [
        'Date extraction: <code>$year</code>, <code>$month</code>, <code>$dayOfMonth</code>, <code>$hour</code>, <code>$minute</code>, <code>$second</code>, <code>$millisecond</code>, <code>$dayOfWeek</code> (1=Sunday), <code>$dayOfYear</code>, <code>$week</code>, <code>$isoWeek</code>, <code>$isoDayOfWeek</code>.',
        '<code>$dateToString</code> formats a date to a string: <code>{ $dateToString: { format: "%Y-%m-%dT%H:%M:%S", date: "$createdAt", timezone: "America/New_York" } }</code>. The <code>timezone</code> option adjusts for local time zones.',
        '<code>$dateDiff</code> computes the difference between two dates: <code>{ $dateDiff: { startDate: "$startDate", endDate: "$$NOW", unit: "day" } }</code>. Units: year, quarter, month, week, day, hour, minute, second, millisecond.',
        '<code>$dateAdd</code> / <code>$dateSubtract</code> add/subtract a duration to a date: <code>{ $dateAdd: { startDate: "$expiry", unit: "month", amount: 1 } }</code>.',
        '<code>$$NOW</code> returns the current timestamp at the moment the pipeline executes. Use it for "age" calculations, expiry checks, and timestamping without passing the time from application code.',
      ],
    },
    {
      heading: 'Array Expressions',
      points: [
        '<code>$filter</code> returns only array elements matching a condition: <code>{ $filter: { input: "$scores", as: "s", cond: { $gte: ["$$s", 80] } } }</code>. Use <code>$$varName</code> to reference the current element.',
        '<code>$map</code> transforms each element: <code>{ $map: { input: "$prices", as: "p", in: { $multiply: ["$$p", 1.1] } } }</code> applies 10% markup to each price.',
        '<code>$reduce</code> folds an array to a single value: <code>{ $reduce: { input: "$nums", initialValue: 0, in: { $add: ["$$value", "$$this"] } } }</code>. <code>$$value</code> is the accumulator; <code>$$this</code> is the current element.',
        '<code>$concatArrays</code> merges arrays: <code>{ $concatArrays: ["$admins", "$editors"] }</code>. <code>$setUnion</code>, <code>$setIntersection</code>, <code>$setDifference</code> for set operations.',
        '<code>$sortArray</code> (MongoDB 5.2+): <code>{ $sortArray: { input: "$items", sortBy: { price: -1 } } }</code> — sort an array inline without $unwind/$sort/$group.',
      ],
    },
    {
      heading: 'Conditional Expressions',
      points: [
        '<code>$cond</code> is the ternary operator: <code>{ $cond: { if: { $gte: ["$score", 90] }, then: "A", else: "B" } }</code>. Short form: <code>{ $cond: [condition, thenValue, elseValue] }</code>.',
        '<code>$switch</code> for multi-branch: <code>{ $switch: { branches: [{ case: { $gte: ["$score", 90] }, then: "A" }, { case: { $gte: ["$score", 80] }, then: "B" }], default: "F" } }</code>.',
        '<code>$ifNull</code> returns a default value when the expression is null or the field is missing: <code>{ $ifNull: ["$middleName", ""] }</code>. Use to avoid null propagation in calculations.',
        '<code>$$REMOVE</code> excludes a field from the output document when used as the value in $project/$addFields: <code>{ $project: { secret: { $cond: [isAdmin, "$secret", "$$REMOVE"] } } }</code>.',
        'Expressions evaluate to null when a referenced field is missing (not an error). Build defensive expressions with <code>$ifNull</code> to handle optional fields.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Arithmetic & String',
      language: 'typescript',
      code: `const orders = db.collection('orders');

await orders.aggregate([
  { $addFields: {
    // Computed total with tax
    total:       { $multiply: ['$subtotal', 1.2] },               // subtotal + 20% VAT
    discount:    { $subtract: ['$price', { $multiply: ['$price', 0.1] }] }, // 10% off
    profit:      { $subtract: ['$revenue', '$cost'] },
    margin:      { $round: [{ $divide: [{ $subtract: ['$revenue', '$cost'] }, '$revenue'] }, 4] },

    // String operations
    fullName:    { $concat: ['$firstName', ' ', '$lastName'] },
    emailLower:  { $toLower: '$email' },
    initials:    { $concat: [{ $substrCP: ['$firstName', 0, 1] }, { $substrCP: ['$lastName', 0, 1] }] },
    nameLength:  { $strLenCP: '$firstName' },
    tags:        { $split: ['$tagsCsv', ','] },  // "a,b,c" → ["a","b","c"]

    // Type conversion
    priceInt:    { $toInt: '$priceStr' },        // "42" → 42
    idStr:       { $toString: '$_id' },          // ObjectId → string
  }},
]).toArray();`,
    },
    {
      label: 'Date Expressions',
      language: 'typescript',
      code: `await db.collection('events').aggregate([
  { $addFields: {
    // Extract date parts
    year:     { $year: '$createdAt' },
    month:    { $month: '$createdAt' },
    day:      { $dayOfMonth: '$createdAt' },
    hour:     { $hour: '$createdAt' },
    weekday:  { $dayOfWeek: '$createdAt' }, // 1=Sun, 7=Sat

    // Format date as string
    dateStr:  { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
    localStr: { $dateToString: { format: '%d/%m/%Y %H:%M', date: '$createdAt', timezone: 'Europe/London' } },

    // Calculate durations
    ageInDays: { $dateDiff: { startDate: '$birthDate', endDate: '$$NOW', unit: 'day' } },
    ageInYears:{ $dateDiff: { startDate: '$birthDate', endDate: '$$NOW', unit: 'year' } },

    // Add/subtract duration
    expiresAt: { $dateAdd: { startDate: '$createdAt', unit: 'month', amount: 12 } },

    // Is it expired?
    isExpired: { $lt: ['$expiresAt', '$$NOW'] },
  }},
  // Group by month
  { $group: {
    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
    count: { $sum: 1 },
  }},
]).toArray();`,
    },
    {
      label: 'Array Expressions',
      language: 'typescript',
      code: `await db.collection('students').aggregate([
  { $addFields: {
    // $filter — keep only passing scores
    passingScores: {
      $filter: { input: '$scores', as: 's', cond: { $gte: ['$$s', 60] } }
    },

    // $map — apply transformation to each element
    discountedPrices: {
      $map: { input: '$prices', as: 'p', in: { $multiply: ['$$p', 0.9] } }
    },

    // $reduce — sum an array
    scoreTotal: {
      $reduce: { input: '$scores', initialValue: 0, in: { $add: ['$$value', '$$this'] } }
    },

    // Array size, first/last element
    numScores:  { $size: '$scores' },
    firstScore: { $arrayElemAt: ['$scores', 0] },
    lastScore:  { $arrayElemAt: ['$scores', -1] },

    // Sort array inline (MongoDB 5.2+)
    sortedScores: { $sortArray: { input: '$scores', sortBy: -1 } },

    // Set operations
    allTags:     { $setUnion: ['$primaryTags', '$secondaryTags'] },
    commonTags:  { $setIntersection: ['$tags', '$requiredTags'] },
  }},
]).toArray();`,
    },
    {
      label: 'Conditional Expressions',
      language: 'typescript',
      code: `await db.collection('orders').aggregate([
  { $addFields: {
    // $cond — ternary
    tier: {
      $switch: {
        branches: [
          { case: { $gte: ['$total', 1000] }, then: 'Gold' },
          { case: { $gte: ['$total', 500] },  then: 'Silver' },
          { case: { $gte: ['$total', 100] },  then: 'Bronze' },
        ],
        default: 'Basic',
      },
    },

    // $ifNull — safe default for missing fields
    discount:    { $ifNull: ['$discountAmount', 0] },
    notes:       { $ifNull: ['$notes', 'No notes'] },

    // $$REMOVE — exclude field conditionally
    internalId: {
      $cond: {
        if:   { $eq: ['$userRole', 'admin'] },
        then: '$internalId',
        else: '$$REMOVE',  // field excluded from result for non-admins
      },
    },

    // Complex: compute label only when field exists
    scoreLabel: {
      $cond: {
        if:   { $gt: [{ $ifNull: ['$score', null] }, null] },
        then: { $concat: ['Score: ', { $toString: '$score' }] },
        else: 'Not scored',
      },
    },
  }},
]).toArray();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using string literals instead of field references in expressions',
      wrong: `// "price" is a literal string, not the field value!
{ $project: { discounted: { $multiply: ["price", 0.9] } } }
// Result: null — "price" × 0.9 = null`,
      right: `// $price (with $) is a field reference
{ $project: { discounted: { $multiply: ["$price", 0.9] } } }`,
      explanation: 'In aggregation expressions, field names must be prefixed with $ to reference the field value. Without $, a string is treated as a literal value (just the text "price"), causing the expression to produce null.',
    },
    {
      title: 'Not handling null/missing fields in arithmetic',
      wrong: `// If 'discount' field is missing, result is null (null propagates!)
{ $addFields: { finalPrice: { $subtract: ["$price", "$discount"] } } }`,
      right: `{ $addFields: { finalPrice: { $subtract: ["$price", { $ifNull: ["$discount", 0] }] } } }`,
      explanation: 'If any input to an arithmetic expression is null or missing, the result is null. Use $ifNull to provide defaults for optional fields before using them in calculations.',
    },
    {
      title: 'Using $filter without $$ for the element variable',
      wrong: `// 'score' is field path — not the loop variable!
{ $filter: { input: "$scores", as: "score", cond: { $gte: ["$score", 60] } } }`,
      right: `// $$score (double $) is the loop variable
{ $filter: { input: "$scores", as: "score", cond: { $gte: ["$$score", 60] } } }`,
      explanation: 'The "as" variable in $filter/$map/$reduce is referenced with $$ inside the "cond"/"in" expression. Using single $ references a document field, not the iteration variable.',
    },
    {
      title: 'Applying complex expressions to un-filtered large collections',
      wrong: `// Runs $regexMatch on every document in a 10M collection
col.aggregate([{ $addFields: { matches: { $regexMatch: { input: "$content", regex: /complex pattern/ } } } }])`,
      right: `// $match first to reduce docs; only then apply expensive expressions
col.aggregate([
  { $match: { status: "active", createdAt: { $gte: oneWeekAgo } } },
  { $addFields: { matches: { $regexMatch: { input: "$content", regex: /pattern/ } } } },
])`,
      explanation: 'Aggregation expressions run on every document that reaches the stage. Without a preceding $match, complex expressions (regex, $reduce, $filter on large arrays) run on the entire collection, making the pipeline slow.',
    },
  ];

  challenge: Challenge = {
    title: 'Order Invoice Data',
    language: 'typescript',
    description: 'Write an aggregation to produce invoice-ready data for each order: fullCustomerName ($concat first/last), formattedDate ($dateToString), lineItems with each item\'s total (qty × price, rounded to 2dp), subtotal (sum of line item totals), tax (20% of subtotal, rounded), grandTotal, and a tier label (Gold ≥500, Silver ≥200, Bronze otherwise).',
    hints: [
      '$map to compute per-item totals in the items array.',
      '$reduce to sum the computed totals into a subtotal.',
      '$round to 2 decimal places for currency.',
      '$switch for the tier label based on grandTotal.',
    ],
    starterCode: `const orders = db.collection('orders');
// orders: { firstName, lastName, createdAt, items: [{ name, qty, price }] }

const invoices = await orders.aggregate([
  // TODO: build invoice shape
]).toArray();`,
    solution: `const orders = db.collection('orders');

const invoices = await orders.aggregate([
  { $addFields: {
    fullCustomerName: { $concat: ['$firstName', ' ', '$lastName'] },
    formattedDate:    { $dateToString: { format: '%d %B %Y', date: '$createdAt' } },
    lineItems: {
      $map: {
        input: '$items', as: 'item',
        in: {
          name:       '$$item.name',
          qty:        '$$item.qty',
          price:      '$$item.price',
          lineTotal:  { $round: [{ $multiply: ['$$item.qty', '$$item.price'] }, 2] },
        },
      },
    },
  }},
  { $addFields: {
    subtotal: {
      $round: [{
        $reduce: { input: '$lineItems', initialValue: 0, in: { $add: ['$$value', '$$this.lineTotal'] } },
      }, 2],
    },
  }},
  { $addFields: {
    tax:        { $round: [{ $multiply: ['$subtotal', 0.2] }, 2] },
    grandTotal: { $round: [{ $multiply: ['$subtotal', 1.2] }, 2] },
  }},
  { $addFields: {
    tier: { $switch: { branches: [
      { case: { $gte: ['$grandTotal', 500] }, then: 'Gold' },
      { case: { $gte: ['$grandTotal', 200] }, then: 'Silver' },
    ], default: 'Bronze' }},
  }},
  { $project: { firstName: 0, lastName: 0, items: 0 } },
]).toArray();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does "$price" (with a dollar sign) mean in an aggregation expression?',
      options: [
        'The literal string "price"',
        'A reference to the value of the "price" field in the current document',
        'The price accumulator',
        'A variable named price',
      ],
      answer: 1,
      explanation: 'In aggregation expressions, a string prefixed with $ is a field path that references the value of that field in the current document. Without $, it\'s a literal string. This is the most common source of aggregation bugs.',
    },
    {
      q: 'What does { $ifNull: ["$discount", 0] } return when "discount" is missing?',
      options: ['null', 'undefined', '0', 'An error'],
      answer: 2,
      explanation: '$ifNull returns the first non-null value. When the "discount" field is missing or null, it returns the second argument (0). Essential for safe arithmetic on optional fields.',
    },
    {
      q: 'Inside a $filter expression, how do you reference the current element (declared as "as: elem")?',
      options: ['$elem', '$$elem', '#elem', '@elem'],
      answer: 1,
      explanation: 'Variables in $filter/$map/$reduce "as" clause are referenced with $$ (double dollar). Single $ is for field paths in the source document. $$elem references the current array element being iterated.',
    },
    {
      q: 'What does $$NOW return?',
      options: [
        'The Unix epoch (1970-01-01)',
        'The current date/time at pipeline execution',
        'The modification timestamp of the current document',
        'null — you must pass the date from application code',
      ],
      answer: 1,
      explanation: '$$NOW is a system variable that returns the current timestamp at the moment the pipeline starts executing. Use it in $dateDiff to calculate ages, or for $cond to check expiry without passing the time from the application.',
    },
    {
      q: 'What does $$REMOVE do when used as an expression value in $project?',
      options: [
        'Sets the field to null',
        'Removes the field from the output document entirely',
        'Deletes the source document from the collection',
        'Throws an error',
      ],
      answer: 1,
      explanation: '$$REMOVE is a special system variable that, when used as a field value in $project or $addFields, removes that field from the output document. Useful with $cond to conditionally include/exclude a field based on a condition (e.g., hide admin-only fields).',
    },
    { q: 'What does the $cond expression do in MongoDB aggregation?', options: ['$cond is a pipeline stage that conditionally includes or excludes documents', '$cond is a ternary expression that evaluates a condition and returns one value if true and another if false, usable inside $project, $addFields, and other expression contexts', '$cond is used to conditionally apply indexes during query planning', '$cond is a comparison operator equivalent to the SQL CASE WHEN with only two branches'], answer: 1, explanation: '$cond syntax: { $cond: { if: <condition>, then: <valueIfTrue>, else: <valueIfFalse> } } or the shorthand array form: { $cond: [<condition>, <then>, <else>] }. Example: { $addFields: { discountedPrice: { $cond: { if: { $gt: [$quantity, 100] }, then: { $multiply: [$price, 0.9] }, else: $price } } } }. This adds a discountedPrice field that is 10% off for quantities above 100. $cond is fully nestable — you can use $cond inside another $cond for multi-branch logic. For more than two branches, prefer $switch which is more readable.' },
    { q: 'What is the difference between $map and $filter in aggregation expressions?', options: ['$map transforms each element of an array; $filter returns only elements matching a condition — they are complementary array transformation expressions', '$map and $filter are equivalent; use whichever reads better', '$filter is a pipeline stage; $map is an expression only usable inside $project', '$map is MongoDB-specific; $filter follows the standard JavaScript Array.prototype.filter semantics exactly'], answer: 0, explanation: '$map: applies an expression to each element of an array and returns a new array of the transformed elements. Syntax: { $map: { input: $tagsArray, as: "tag", in: { $toUpper: "$$tag" } } }. $filter: returns a subset of an array containing only elements matching a condition. Syntax: { $filter: { input: $scores, as: "score", cond: { $gte: ["$$score", 80] } } }. The s field names the iteration variable, accessed with $$ prefix inside the expression. Use $map when you want to transform every element. Use $filter when you want to keep only matching elements. Combine them: first $filter then $map to filter and transform in one pipeline stage.' },
    { q: 'What does $let do in aggregation expressions and when is it useful?', options: ['$let declares local variables within an expression scope, binding values to named variables for reuse in a complex sub-expression to avoid redundant computation', '$let is a pipeline stage that assigns values to new document fields like $addFields but with stronger typing', '$let is used to assign the result of a $lookup join to a local variable for subsequent pipeline stages', '$let is deprecated since MongoDB 5.0 and replaced by $setField'], answer: 0, explanation: '$let syntax: { $let: { vars: { <name1>: <expr1>, <name2>: <expr2> }, in: <expression using $$name1, $$name2> } }. Use case: when you need to reference the same sub-expression multiple times. Without $let: { $divide: [{ $subtract: [$price, $cost] }, $price] } repeated multiple times in the same expression. With $let: define the margin once as { margin: { $subtract: [$price, $cost] } }, then reference $$margin twice. Variables defined in $let are scoped to the in expression only. $let is also commonly used inside $reduce, $map, and $filter for complex logic that requires intermediate values.' },
    { q: 'How does the $reduce expression work for aggregating array elements?', options: ['$reduce is a pipeline stage that reduces the number of documents output by the pipeline by merging adjacent documents', '$reduce applies an expression iteratively to each element of an array, accumulating a running value, similar to Array.prototype.reduce in JavaScript', '$reduce is used to reduce the size of embedded arrays by truncating elements beyond a maximum count', '$reduce computes aggregate statistics (min, max, sum, avg) from an array field without using a $group stage'], answer: 1, explanation: '$reduce syntax: { $reduce: { input: <array>, initialValue: <value>, in: <expression> } }. Inside the in expression, $$value is the accumulator and $$this is the current element. Example: sum an array of numbers — { $reduce: { input: $scores, initialValue: 0, in: { $add: ["$$value", "$$this"] } } }. Concatenate an array of strings with a separator — initialValue: "", in: { $cond: [{ $eq: ["$$value", ""] }, "$$this", { $concat: ["$$value", ", ", "$$this"] }] }. $reduce is the most flexible array aggregation expression — for simple cases, prefer $sum, $avg, $min, $max accumulators in $group.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between $add in aggregation expressions and the update $inc?',
      a: '<strong>$add (expression)</strong> computes the sum of values at query/aggregation time — it\'s used in $project, $addFields, etc. to produce a new computed field. It does NOT modify stored data. <strong>$inc (update operator)</strong> atomically increments a stored field\'s value in a document. $add is read-time computation; $inc is write-time mutation.',
    },
    {
      q: 'How do I use $regexMatch in aggregation?',
      a: '<code>{ $regexMatch: { input: "$fieldName", regex: /pattern/flags } }</code> returns true/false. Use it in $addFields to tag documents: <code>{ $addFields: { hasKeyword: { $regexMatch: { input: "$description", regex: /mongodb/i } } } }</code>. For extracting matches, use <code>$regexFind</code> (first match) or <code>$regexFindAll</code> (all matches), which return the match and capture groups.',
    },
    {
      q: 'How do I convert a string field to a date in aggregation?',
      a: 'Use <code>$toDate</code>: <code>{ $addFields: { date: { $toDate: "$dateString" } } }</code>. The string must be in ISO 8601 format (e.g., "2024-01-15T12:00:00Z"). For custom formats, use <code>$dateFromString</code>: <code>{ $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } }</code>. The <code>format</code> parameter uses strftime-style codes.',
    },
    {
      q: 'What is $mergeObjects and how does it differ from $concat?',
      a: '<code>$mergeObjects</code> merges object/document values into one — fields from later objects overwrite earlier ones on conflict. <code>$concat</code> joins arrays of strings into a single string. They operate on completely different types. Example: <code>{ $mergeObjects: ["$userDefaults", "$userSettings"] }</code> produces one object with settings overriding defaults.',
    },
    {
      q: 'Can aggregation expressions access fields in nested sub-documents?',
      a: 'Yes — use dot notation with $ prefix: <code>"$address.city"</code> accesses the city field inside the address embedded document. For arrays of embedded documents, <code>$map</code> or <code>$filter</code> iterate over the array: <code>{ $map: { input: "$orders", as: "o", in: "$$o.amount" } }</code> extracts the amount from each order.',
    },
    { q: 'How do arithmetic expressions handle division by zero in MongoDB aggregation?', a: '$divide returns null when the divisor is zero — it does not throw an error. This means a division by zero silently produces a null result, which can propagate through subsequent expressions as null. Best practice: guard with $cond before dividing: { $cond: { if: { $eq: [$denominator, 0] }, then: null, else: { $divide: [$numerator, $denominator] } } }. Similarly, $mod returns null when the divisor is zero. Be aware that null propagates: { $add: [null, 5] } returns null, not 5. If you need a default value instead of null, wrap with $ifNull: { $ifNull: [<expression>, 0] }.' },
    { q: 'What is the difference between $toString and $convert for type conversion?', a: '$toString is a shorthand for $convert with a to: "string" argument. $convert is more powerful and flexible. $convert syntax: { $convert: { input: $field, to: "string", onError: "error", onNull: "N/A" } }. The onError and onNull options handle conversion failures gracefully — without them, a conversion failure aborts the entire aggregation. Example: converting a field that might be a string or a number to a double: { $convert: { input: $amount, to: "double", onError: 0.0, onNull: 0.0 } }. Available type names: double, string, objectId, bool, date, int, long, decimal. $toInt, $toLong, $toDouble, $toDecimal, $toDate, $toObjectId, $toBool are all shorthands for $convert without the error-handling options.' },
    { q: 'How do you work with date fields in aggregation expressions?', a: 'Date extraction operators: $year, $month, $dayOfMonth, $hour, $minute, $second, $millisecond extract the corresponding component from a Date field. $dayOfWeek (1=Sunday through 7=Saturday), $dayOfYear, $week (ISO week number). $dateToString: formats a Date as a string — { $dateToString: { format: "%Y-%m-%d", date: $createdAt, timezone: "America/New_York" } }. $dateTrunc: truncates a date to a time unit — great for grouping by hour, day, week, month. $dateAdd / $dateSubtract: add or subtract time from a date — { $dateAdd: { startDate: $createdAt, unit: "day", amount: 30 } }. $dateDiff: compute the difference between two dates in a given unit — { $dateDiff: { startDate: $orderDate, endDate: $deliveryDate, unit: "day" } }. Always store dates as BSON Date, never as strings, to use these operators efficiently with date range indexes.' },
    { q: 'What is the $mergeObjects expression and when is it useful?', a: '$mergeObjects merges two or more documents into one. Later fields overwrite earlier fields with the same name. Syntax with two documents: { $mergeObjects: [$doc1, $doc2] }. Later keys win: if both have a name field, doc2.name wins. Common use case after $lookup: { $replaceRoot: { newRoot: { $mergeObjects: ["ROOT", { $arrayElemAt: [$joinedDocs, 0] }] } } } — this merges the parent document with the first matched lookup document. In $group: $mergeObjects is an accumulator that merges all documents in the group into one. Example: grouping product variants and collecting all attribute objects into a single merged attributes document. Null and missing fields: $mergeObjects ignores null inputs — if one of the documents is null, it is skipped rather than overwriting existing fields with null.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Aggregation expressions transform data at query time: $ for field refs, $$ for variables; arithmetic, string, date, array, and conditional operators compose freely.',
    mustKnow: [
      '"$field" = field reference; "field" = literal string (no $)',
      '$$NOW = current time; $$ROOT = current document; $$REMOVE = exclude field from output',
      '$filter/$$var for array filtering; $map for transforming; $reduce for folding',
      '$ifNull for null-safe defaults in arithmetic',
      '$cond (ternary), $switch (multi-branch), $ifNull for conditional logic',
      '$dateToString for formatting; $dateDiff for durations; $dateAdd for offset dates',
      'Expressions propagate null — always handle optional fields with $ifNull',
    ],
    interviewFocus: [
      '$ vs $$ in expressions (field path vs variable reference)',
      'Null propagation in arithmetic and how to prevent it ($ifNull)',
      '$filter/$map/$reduce for array transformations',
      '$$REMOVE for conditional field exclusion',
      '$cond vs $switch for conditional output',
    ],
  };
}
