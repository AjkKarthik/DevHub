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
    heading: 'A Comma-Delimited Path String, Queried With $regex',
    points: [
      'One of the main page\'s own QnAs names all four tree-structure patterns — Parent Reference, Child Reference, Materialised Path, Nested Sets — in a single dense paragraph, with zero code for any of them. This subtopic builds the Materialised Path pattern specifically, since it\'s the one the QnA itself calls out as easiest for finding all ancestors/descendants with $regex.',
      'Verified against MongoDB\'s own official Materialised Path tutorial: each node stores its full path as a string with a delimiter (a comma) at BOTH the start and end — <code>",Books,Programming,Databases,"</code> — not just between segments. This is what makes the $regex queries below work correctly without accidentally matching a partial segment name (e.g. "Program" incorrectly matching within "Programming").',
      'Finding all DESCENDANTS of a node: <code>{ path: /,NodeName,/ }</code> — matches any document whose path contains that exact, comma-bounded segment anywhere. Finding all ANCESTORS of a node: split that node\'s OWN path into segments and build every path PREFIX, then match documents whose OWN path equals one of those prefixes exactly — MongoDB\'s own tutorial does not show this second query directly, so it was worked out and verified independently.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Materialised Path: Descendants and Ancestors',
    language: 'typescript',
    code: `const categories = db.collection('categories');

await categories.insertMany([
  { name: 'Books',       path: ',Books,' },
  { name: 'Programming', path: ',Books,Programming,' },
  { name: 'Databases',   path: ',Books,Programming,Databases,' },
  { name: 'MongoDB',     path: ',Books,Programming,Databases,MongoDB,' },
  { name: 'PostgreSQL',  path: ',Books,Programming,Databases,PostgreSQL,' },
  { name: 'Fiction',     path: ',Books,Fiction,' },  // unrelated sibling branch
]);
await categories.createIndex({ path: 1 });

// DESCENDANTS of Programming (including Programming itself, since its
// own path contains ',Programming,')
const descendants = await categories.find({ path: /,Programming,/ }).toArray();
// -> Programming, Databases, MongoDB, PostgreSQL  (NOT Fiction)

// ANCESTORS of MongoDB -- split its OWN path into segments, build every
// prefix path, then match documents whose path equals one of those
// prefixes exactly.
const mongoNode = await categories.findOne({ name: 'MongoDB' });
const segments = mongoNode.path.split(',').filter(Boolean); // ['Books','Programming','Databases','MongoDB']
const prefixPaths = [];
for (let i = 0; i < segments.length - 1; i++) {  // -1: exclude the node itself
  prefixPaths.push(',' + segments.slice(0, i + 1).join(',') + ',');
}
const ancestors = await categories.find({ path: { \$in: prefixPaths } }).toArray();
// -> Books, Programming, Databases  (root-to-parent order)

// Pure-JS equivalent, verified against the same 6-node seed set:
function findDescendants(nodeName, docs) {
  const re = new RegExp(\`,\${nodeName},\`);
  return docs.filter(d => re.test(d.path)).map(d => d.name);
}
function findAncestors(nodePath, docs) {
  const segs = nodePath.split(',').filter(Boolean);
  const prefixes = [];
  for (let i = 0; i < segs.length - 1; i++) prefixes.push(',' + segs.slice(0, i + 1).join(',') + ',');
  return docs.filter(d => prefixes.includes(d.path)).map(d => d.name);
}

const seed = [
  { name: 'Books', path: ',Books,' },
  { name: 'Programming', path: ',Books,Programming,' },
  { name: 'Databases', path: ',Books,Programming,Databases,' },
  { name: 'MongoDB', path: ',Books,Programming,Databases,MongoDB,' },
  { name: 'PostgreSQL', path: ',Books,Programming,Databases,PostgreSQL,' },
  { name: 'Fiction', path: ',Books,Fiction,' },
];
console.log('Descendants of Programming:', findDescendants('Programming', seed));
console.log('Ancestors of MongoDB:', findAncestors(seed.find(s => s.name === 'MongoDB').path, seed));
console.log('Fiction is NOT a descendant of Programming:', !findDescendants('Programming', seed).includes('Fiction'));
// -> Descendants of Programming: [ 'Programming', 'Databases', 'MongoDB', 'PostgreSQL' ]
// -> Ancestors of MongoDB: [ 'Books', 'Programming', 'Databases' ]
// -> Fiction is NOT a descendant of Programming: true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own QnA says Materialised Path is "easy to find all ancestors/descendants with $regex" — but the ancestors query in this subtopic\'s own codeTab uses $in with an array of exact prefix strings, not a single $regex. Why can\'t a single $regex expression find ancestors the same simple way <code>/,Programming,/</code> finds descendants?',
  hint: 'A descendants query looks for one FIXED substring (the target node\'s own name) inside many different documents\' paths. An ancestors query is the OPPOSITE direction — think about what varies and what stays fixed in each case.',
  solution: `// A descendants query fixes the SEARCH TERM (the target node's name)
// and scans across many documents' paths, checking "does this ONE
// known string appear in THIS document's path?" -- a single, static
// regex works perfectly for that, since the pattern itself never
// changes.
//
// An ancestors query is the reverse: the target node's OWN path is
// the thing that's already known and fixed, and what's needed is
// every document whose ENTIRE path is a PREFIX of that one known
// path. There's no way to express "match if MY path is a prefix of
// THIS OTHER SPECIFIC STRING" as a single regex pattern applied
// uniformly across a collection -- regex matching in a query works
// the other way (a fixed pattern tested against each document's own
// field value), not "test whether each document's field is itself a
// prefix of some given string." That's why the ancestors query
// instead pre-computes every possible prefix STRING in application
// code first, then uses a plain equality-based $in to find documents
// whose path matches one of those specific, already-known strings
// exactly -- no regex needed at all for that direction.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The delimiter only needs to go BETWEEN segments (e.g. "Books,Programming,Databases"), the same way a typical file path or URL path is usually written.',
    reality: 'MongoDB\'s own documented convention puts the delimiter at BOTH the start AND the end of the path (",Books,Programming,Databases,"), not just between segments. This matters directly for the $regex descendants query — /,Programming,/ relies on the comma appearing on BOTH sides of every real segment name to avoid a partial-match false positive (e.g. a hypothetical "ProgrammingLanguages" category would NOT falsely match /,Programming,/, since there\'s no comma immediately after "Programming" in that longer name).',
  },
  {
    thought: 'Finding ancestors and finding descendants are symmetric operations that should both be expressible as the identical style of query, just swapping which node is "fixed."',
    reality: 'Verified directly that these are NOT symmetric: descendants is answered by a single static $regex tested against many documents\' paths, while ancestors requires first computing a list of candidate prefix strings from ONE specific node\'s own already-known path, then matching against that precomputed list with $in — a structurally different query shape, not just the same regex run "backwards."',
  },
];

@Component({
  selector: 'app-mongo-schema-materialised-path',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './materialised-path-ancestors-and-descendants-with-regex.html',
  styleUrl: './materialised-path-ancestors-and-descendants-with-regex.scss',
})
export class MaterialisedPathAncestorsAndDescendantsWithRegexSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
