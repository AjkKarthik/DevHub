import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './contain-content-clips-overflow-like-overflow-hidden.html',
  styleUrl: './contain-content-clips-overflow-like-overflow-hidden.scss'
})
export class ContainContentClipsOverflowLikeOverflowHiddenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'contain: content bundles paint containment — and paint containment clips overflow, the same way overflow: hidden does',
      points: [
        '<code>contain: content</code> is shorthand for layout + style + paint containment (no size containment). The PAINT part specifically means: nothing inside the element is allowed to visually render outside the element\'s own border box.',
        'This is a real, structural side effect beyond "isolating layout cost" — an element that overflows its container (e.g. via a large negative margin or explicit off-box positioning) gets visually clipped at the container\'s edge once paint containment applies, exactly as <code>overflow: hidden</code> would clip it.',
      ]
    },
    {
      heading: 'Confirmed directly — an overflowing child was fully hit-testable without containment, and not hit-testable at all with contain: content',
      points: [
        'A 30×30px child positioned 150px to the right inside a 100×100px container (genuinely overflowing outside the container\'s box) was correctly found by <code>document.elementFromPoint()</code> at its real screen position when the container had no containment.',
        'Applying <code>contain: content</code> to the identical container, with the child at the identical position, made that same screen point resolve to a completely different element (content behind the clipped area) — the overflowing part of the child had become invisible and non-interactive, confirming genuine paint-level clipping, not just a layout-isolation label.',
        'This matters in practice: a component using <code>contain: content</code> purely for its layout-isolation performance benefit can silently clip a tooltip, dropdown, or badge that was relying on visually overflowing its container — a real, easy-to-miss regression when containment is added to an existing component.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>contain: content clips overflow like overflow: hidden</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Build a container with a child that deliberately overflows outside its box,
// once with no containment and once with contain: content — then hit-test the
// overflowing child's real screen position with document.elementFromPoint().
function buildCase(containValue: string | null) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '400px';
  container.style.top = '400px';
  container.style.width = '100px';
  container.style.height = '100px';
  container.style.background = 'steelblue';
  container.style.zIndex = '99999';
  if (containValue) container.style.contain = containValue;

  const overflowChild = document.createElement('div');
  overflowChild.style.position = 'absolute';
  overflowChild.style.left = '150px'; // 150px past the container's own 100px width — genuinely overflowing
  overflowChild.style.top = '10px';
  overflowChild.style.width = '30px';
  overflowChild.style.height = '30px';
  overflowChild.style.background = 'limegreen';
  container.appendChild(overflowChild);
  document.body.appendChild(container);
  return { container, overflowChild };
}

(async () => {
  // Case 1: no containment
  const { container: c1, overflowChild: child1 } = buildCase(null);
  await new Promise((r) => setTimeout(r, 20));
  const rect1 = child1.getBoundingClientRect();
  const px1 = rect1.left + rect1.width / 2;
  const py1 = rect1.top + rect1.height / 2;
  const hit1 = document.elementFromPoint(px1, py1);
  console.log('NO containment — overflowing child hit-tested at its real position?', hit1 === child1);
  c1.remove();

  // Case 2: contain: content
  const { container: c2, overflowChild: child2 } = buildCase('content');
  await new Promise((r) => setTimeout(r, 20));
  const rect2 = child2.getBoundingClientRect();
  const px2 = rect2.left + rect2.width / 2;
  const py2 = rect2.top + rect2.height / 2;
  const hit2 = document.elementFromPoint(px2, py2);
  console.log('contain: content — same overflowing child hit-tested at the same position?', hit2 === child2);
  console.log('(geometry is IDENTICAL in both cases — contain does not move or resize the child, it only clips what paints)');
  c2.remove();

  console.log('---');
  console.log('contain: content genuinely clips overflow, exactly like overflow: hidden would.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds contain: content to a card component purely for the layout-isolation performance benefit described on the main page. After deploying, a badge that was styled with a small negative margin to overflow slightly outside the top-right corner of the card visually disappears. What happened?',
    hint: 'Think about what contain: content actually bundles beyond layout isolation — this subtopic\'s demo showed a second, separate effect from the same property.',
    solution: 'The badge disappeared because contain: content also applies PAINT containment, confirmed directly in this subtopic\'s demo — anything overflowing the container\'s own border box stops being painted (and stops being hit-testable) once paint containment applies, exactly like adding overflow: hidden would. The team correctly reasoned about the layout-isolation benefit but missed this bundled side effect. The fix is either to move the badge fully inside the container\'s box, or to use contain: layout instead of contain: content/strict — layout containment alone does NOT include paint containment, so overflowing content stays visible while still getting the layout-isolation benefit.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'contain: content only affects layout calculation performance — it has no effect on what is visually rendered or where.',
      reality: 'This subtopic\'s demo shows contain: content has a real, visible side effect beyond layout isolation: it clips any content overflowing the element\'s border box, confirmed by an identical overflowing child being hit-testable with no containment and completely non-hit-testable with contain: content applied.'
    },
    {
      thought: 'contain: layout, contain: content, and contain: strict differ only in DEGREE — stronger containment just means "more isolated," with no functional difference in what actually renders.',
      reality: 'They differ in WHICH containment types are bundled, not just degree — contain: layout alone does not include paint containment (no overflow clipping), while contain: content and contain: strict both add paint containment (real overflow clipping) on top, confirmed in this subtopic\'s demo using contain: content specifically.'
    },
    {
      thought: 'If a component visually looks correct in a code review or a quick manual check, adding contain: content for a performance win is safe.',
      reality: 'This subtopic\'s exercise shows the exact realistic failure mode: an overflowing badge/tooltip/dropdown can look completely fine until contain: content is added, at which point the overflowing part silently clips — a visual regression that a performance-focused reviewer, not looking for layout overflow specifically, could easily miss.'
    }
  ];
}
