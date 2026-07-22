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
  templateUrl: './queryraw-can-return-bigint-json-stringify-throws.html',
  styleUrl: './queryraw-can-return-bigint-json-stringify-throws.scss'
})
export class QueryrawCanReturnBigintJsonStringifyThrowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own raw-query example runs SELECT ... COUNT(p.id) AS post_count ... — worth knowing that specific pattern is exactly the shape most likely to hand back a value type Express\'s res.json() cannot serialize at all',
      points: [
        'Per Prisma\'s own documentation on raw queries, results from $queryRaw and $queryRawUnsafe map certain database column categories — including 64-bit integer results, which is exactly what COUNT(*) and similar aggregates commonly produce — to the JavaScript BigInt type, rather than an ordinary number. The precise database type name varies by database (Prisma\'s own docs note this explicitly), but the underlying JS mapping to BigInt is consistent.',
        'BigInt has no native JSON representation. Calling JSON.stringify() on any object containing a BigInt value throws — the exact runtime error is "TypeError: Do not know how to serialize a BigInt." This is standard JavaScript behavior, not a Prisma-specific bug.',
        'The practical trap: Express\'s res.json(data) calls JSON.stringify() internally. If the raw query results (like the main page\'s own post_count aggregate) are passed straight to res.json(), the request throws a 500 error the instant a BigInt value shows up in the response — often on the very first request that actually exercises the count, since a small COUNT() result during initial development testing can behave identically whether it\'s a Number or a BigInt until you actually try to serialize it.',
      ]
    },
    {
      heading: 'The documented fix, straight from Prisma\'s own guidance',
      points: [
        'Prisma\'s own documentation for this exact scenario (found on their Fields & types guide, not the raw-queries page itself) recommends passing a custom replacer function to JSON.stringify(): (key, value) => typeof value === "bigint" ? value.toString() : value. This converts any BigInt encountered during serialization into a plain string before JSON.stringify() would otherwise throw on it.',
        'For an Express route specifically, this means NOT calling res.json(rawResults) directly on data that might contain BigInt values — instead, either pre-process the results (converting known BigInt fields to Number or String explicitly before sending), or replace the default JSON serialization with one that uses the replacer function, so the conversion happens automatically for any BigInt anywhere in the response.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example, now throwing in an Express route',
      language: 'typescript',
      code: `app.get('/user-stats', async (req, res) => {
  const results = await prisma.$queryRaw\`
    SELECT u.id, u.name, COUNT(p.id) AS post_count
    FROM "User" u
    LEFT JOIN "Post" p ON p."authorId" = u.id
    GROUP BY u.id
    HAVING COUNT(p.id) > \${minPosts}
  \`;

  // post_count can come back as a BigInt for a 64-bit integer
  // aggregate result — res.json() calls JSON.stringify() internally,
  // which throws: "TypeError: Do not know how to serialize a BigInt"
  res.json(results);
  // The route crashes with a 500 error the instant post_count is a
  // BigInt — looking identical to a working query right up until
  // serialization is actually attempted.
});`,
    },
    {
      label: 'Fixed: a BigInt-aware replacer, per Prisma\'s own docs',
      language: 'typescript',
      code: `function bigIntSafeJson(data) {
  return JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

app.get('/user-stats', async (req, res) => {
  const results = await prisma.$queryRaw\`
    SELECT u.id, u.name, COUNT(p.id) AS post_count
    FROM "User" u
    LEFT JOIN "Post" p ON p."authorId" = u.id
    GROUP BY u.id
    HAVING COUNT(p.id) > \${minPosts}
  \`;

  // Send the manually-serialized string with the correct content
  // type, instead of letting res.json() call the default
  // JSON.stringify() (which would still throw on any BigInt).
  res.set('Content-Type', 'application/json');
  res.send(bigIntSafeJson(results));
});

// Alternative: convert known fields explicitly right after the query
const safeResults = results.map(r => ({ ...r, post_count: Number(r.post_count) }));
res.json(safeResults); // safe, as long as the count fits in a Number`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer\'s Express route runs a raw Prisma query counting orders per customer and works perfectly in every manual test during development. After deploying, a specific high-volume customer\'s dashboard suddenly returns a 500 error, while every other customer\'s dashboard (with far fewer orders) still works fine. What is the most likely explanation, given how JavaScript numbers and BigInt behave?',
    hint: 'Does whether a 64-bit integer aggregate result from the database actually BEHAVES differently as a JavaScript value depend on the actual magnitude of the number, or is it always a BigInt regardless of how small the count happens to be?',
    solution: 'This scenario is actually a distractor based on a common but incorrect assumption — if the raw query genuinely returns a BigInt for the count column (per Prisma\'s documented type mapping for 64-bit integer results), it would ALWAYS be a BigInt regardless of the actual count\'s magnitude, meaning even a customer with a small order count would hit the exact same JSON.stringify() TypeError, not just the high-volume one. If only the high-volume customer\'s dashboard is failing, the actual cause is more likely a genuine JavaScript number-precision issue instead — JavaScript\'s regular Number type can only safely represent integers up to Number.MAX_SAFE_INTEGER (2^53 - 1); if the underlying value ISN\'T mapped to BigInt for this particular query/database/driver combination, an extremely large count could still silently lose precision as an ordinary Number without ever throwing an error at all, which is a different and arguably worse failure mode than a loud BigInt TypeError. Either way, the fix is the same discipline: know explicitly which raw-query result fields could plausibly be BigInt or exceed safe integer range for realistic data volumes, and handle both cases (a BigInt-aware serializer, or awareness of Number precision limits) deliberately rather than assuming small-scale testing represents production data volumes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A COUNT(*) or similar aggregate result from a Prisma raw query always comes back as a plain JavaScript number, the same as it would from a typed Prisma Client query method.',
      reality: 'This subtopic\'s theory shows the opposite — Prisma\'s own documentation confirms raw query results map certain 64-bit integer database types (including common aggregate results) to JavaScript BigInt, not Number, unlike Prisma Client\'s typed query methods which handle this conversion for you.'
    },
    {
      thought: 'Calling res.json(data) in Express is always safe for any data returned by a database query, since Express handles serialization automatically.',
      reality: 'This subtopic\'s first code example shows the opposite — res.json() calls JSON.stringify() internally, which throws a TypeError the instant it encounters a BigInt value anywhere in the data, crashing the route with a 500 error rather than serializing it gracefully.'
    },
    {
      thought: 'A small COUNT() result and a large COUNT() result from the same raw query behave differently with respect to whether they become a JavaScript BigInt — only very large counts trigger BigInt behavior.',
      reality: 'This subtopic\'s exercise clarifies the opposite — whether a raw query result maps to BigInt is determined by the DATABASE COLUMN TYPE category (e.g., a 64-bit integer type), not by the actual numeric value returned; a count of 3 and a count of 3 million behave identically with respect to BigInt if they come from the same underlying SQL type.'
    }
  ];
}
