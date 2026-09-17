import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-field-merging-conflicts',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './field-merging-conflicts.html',
  styleUrl: './field-merging-conflicts.scss',
})
export class FieldMergingConflictsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Why the alias is "required"',
      points: [
        'The Aliases section says an alias is "required when querying the same field twice with different arguments". The rule behind it is the spec’s <em>Fields in set can merge</em> validation, which runs before execution.',
        'GraphQL groups every selection in a set by its <strong>response key</strong> — the alias if present, otherwise the field name. If two selections share a response key, they must be able to merge: same field name, identical arguments, and mergeable sub-selections.',
        'Two selections of <code>posts</code> with different arguments both land under the response key <code>posts</code>, cannot merge, and the whole operation fails validation — the error reads <code>Fields "posts" conflict because they have differing arguments</code>.',
        'Giving each one its own alias (<code>featured:</code>, <code>recent:</code>) puts them under different response keys, so there is nothing to merge and the query is valid. That is the entire reason the alias is needed.',
      ],
    },
    {
      heading: 'It fires through fragments too',
      points: [
        'The conflict is evaluated on the <em>flattened</em> selection set, after every fragment spread is expanded. Two fragments that each select the same field with different arguments conflict even though your query text never writes that field twice.',
        'So spreading <code>...CardFields</code> and <code>...ListFields</code> into one <code>Post</code> selection fails if <code>CardFields</code> has <code>thumbnail(size: 80)</code> and <code>ListFields</code> has <code>thumbnail(size: 240)</code> — the error names <code>thumbnail</code>, and neither fragment mentions the other.',
        'Two fragments selecting the <em>same</em> field with the <em>same</em> arguments (or no arguments) merge cleanly — that is the normal, intended case and is why <code>...UserSummary</code> can appear on both <code>author</code> and <code>likedBy</code> without complaint.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The merge check, modelled',
      language: 'typescript',
      code: `type Selection = { responseKey: string; fieldName: string; args: string };

// Mirrors the spec's "Fields in set can merge" rule on a flattened selection set.
function fieldsCanMerge(selections: Selection[]): string {
  const byKey = new Map<string, Selection>();
  for (const s of selections) {
    const prev = byKey.get(s.responseKey);
    if (!prev) { byKey.set(s.responseKey, s); continue; }
    if (prev.fieldName !== s.fieldName)
      return 'Fields "' + s.responseKey + '" conflict because "' + prev.fieldName +
             '" and "' + s.fieldName + '" are different fields. Use different aliases.';
    if (prev.args !== s.args)
      return 'Fields "' + s.responseKey + '" conflict because they have differing arguments. ' +
             'Use different aliases.';
  }
  return 'ok';
}`,
    },
    {
      label: 'Conflicts, and how aliases fix them',
      language: 'typescript',
      code: `// { posts(first: 5) { id }  posts(first: 10) { id } }
console.log(fieldsCanMerge([
  { responseKey: 'posts', fieldName: 'posts', args: 'first:5' },
  { responseKey: 'posts', fieldName: 'posts', args: 'first:10' },
]));
// Fields "posts" conflict because they have differing arguments. Use different aliases.

// { featured: posts(first: 5) { id }  recent: posts(first: 10) { id } }
console.log(fieldsCanMerge([
  { responseKey: 'featured', fieldName: 'posts', args: 'first:5' },
  { responseKey: 'recent',   fieldName: 'posts', args: 'first:10' },
]));
// ok  -- distinct response keys, nothing to merge

// ...UserSummary spread on two relations -> same field, no args -> merges fine
console.log(fieldsCanMerge([
  { responseKey: 'name', fieldName: 'name', args: '' },
  { responseKey: 'name', fieldName: 'name', args: '' },
]));
// ok

// ...CardFields has thumbnail(size:80); ...ListFields has thumbnail(size:240)
console.log(fieldsCanMerge([
  { responseKey: 'thumbnail', fieldName: 'thumbnail', args: 'size:80' },
  { responseKey: 'thumbnail', fieldName: 'thumbnail', args: 'size:240' },
]));
// Fields "thumbnail" conflict because they have differing arguments. Use different aliases.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You spread <code>...CardFields</code> and <code>...ListFields</code> into the same <code>Post</code> selection and the query fails validation: <code>Fields "coverImage" conflict because they have differing arguments</code>. Neither fragment refers to the other, and you did not write <code>coverImage</code> anywhere in the query itself. What happened, and what are the two ways to fix it?',
    hint: 'The check runs after fragments are flattened. What field do both fragments contain?',
    solution: `Both fragments select coverImage, with different arguments -- say CardFields has coverImage(width: 400) and ListFields has coverImage(width: 120). After the fragments are expanded into the Post selection set, both selections share the response key coverImage but have differing args, so "Fields in set can merge" fails.

Two fixes:
1. Alias one of them so the response keys differ. Change ListFields to  listCover: coverImage(width: 120)  -- now the flattened set has coverImage AND listCover, no collision.
2. Make both fragments request coverImage with the same arguments. If a single width works for both call sites, that is the simpler fix and avoids duplicating the image fetch on the server.

Choose the alias fix when the two sizes are genuinely both needed; choose the unify fix when the difference was accidental.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A field conflict can only happen if I literally write the same field name twice in one selection set."',
      reality: 'The check runs on the flattened set after every fragment is expanded. Two fragments — or a fragment and an inline selection — that each pick the same field with different arguments conflict even though your query text never repeats the field.',
    },
    {
      thought: '"Two selections of the same field always conflict unless aliased."',
      reality: 'They merge cleanly when the field name and arguments are identical (or both absent). That is the normal case — it is why one fragment can be spread onto several relations. A conflict needs a genuine difference in field or arguments.',
    },
    {
      thought: '"The alias is just a convenience for reading the response."',
      reality: 'When the same field appears twice with different arguments, the alias is what makes the query <em>valid</em>. Without it, the operation is rejected at validation and never executes.',
    },
  ];

  topicLabel = 'GraphQL Queries';
  topicRoute = '/graphql/queries';
  prev: SubtopicLink | null = {
    label: '@skip and @include Run on the Server, Not the Client',
    route: '/graphql/queries/skip-include-run-on-the-server',
  };
  next: SubtopicLink | null = {
    label: 'The Lone Anonymous Operation Rule',
    route: '/graphql/queries/lone-anonymous-operation',
  };
}
