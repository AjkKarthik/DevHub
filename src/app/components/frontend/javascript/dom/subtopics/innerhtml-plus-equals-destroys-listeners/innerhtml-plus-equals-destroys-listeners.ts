import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-innerhtml-plus-equals-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './innerhtml-plus-equals-destroys-listeners.html',
  styleUrl: './innerhtml-plus-equals-destroys-listeners.scss',
})
export class InnerHtmlPlusEqualsReparsesTheWholeContainerAndDestroysChildListenersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #5, Proven by Watching a Listener Stop Firing',
      points: [
        'The main page states plainly: "<code>innerHTML +=</code> reparses the ENTIRE container HTML, destroying all event listeners attached to child elements." This subtopic attaches a real click listener to an existing child, then appends more HTML via <code>innerHTML +=</code>, and clicks the SAME original element again — proving the listener is gone, not just describing that it should be.',
        '<code>element.innerHTML += moreHtml</code> is NOT an efficient "append" operation, despite how it reads — it is actually shorthand for <code>element.innerHTML = element.innerHTML + moreHtml</code>. The browser must first SERIALIZE the entire existing subtree back into an HTML string, concatenate the new HTML, then completely reparse and rebuild the ENTIRE subtree from scratch, discarding every original DOM node (and everything attached to those nodes) in the process.',
      ],
    },
    {
      heading: 'Why the Original Elements Don\'t Just "Keep Their Listeners"',
      points: [
        'When <code>innerHTML</code> is reassigned, the browser doesn\'t try to intelligently diff the old and new HTML and preserve unchanged nodes — it destroys the ENTIRE existing subtree and creates brand new DOM nodes from the newly parsed HTML string, even for the parts of the markup that look character-for-character identical to what was already there.',
        'Event listeners are attached to actual DOM node OBJECTS in memory, not to the markup that describes them — when the old nodes are destroyed and replaced with newly parsed nodes (even ones that render identically), the new nodes are entirely different objects with no listeners attached, since <code>addEventListener</code> was never called on THEM.',
        'This is exactly why the main page\'s fix uses <code>createElement</code> + <code>append</code> instead — those methods only touch the DOM nodes actually being added, leaving every pre-existing node (and its listeners) completely untouched.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>innerHTML += destroys child listeners demo</title></head>
  <body>
    <div id="container">
      <button id="original-btn">Click me (original button)</button>
    </div>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.getElementById('container')!;
const originalBtn = document.getElementById('original-btn')!;

let clickCount = 0;
originalBtn.addEventListener('click', () => {
  clickCount++;
  console.log('  [listener fired] original button clicked, count =', clickCount);
});

console.log('--- Clicking the button BEFORE any innerHTML += ---');
(originalBtn as HTMLButtonElement).click();
console.log('clickCount is now:', clickCount, '(listener works normally)');

console.log('--- Appending new HTML via innerHTML += ---');
container.innerHTML += '<p>A new paragraph, appended via +=</p>';

// Grab a reference to the button AGAIN by ID -- it looks identical in the DOM tree,
// but is it actually the SAME node object as before?
const btnAfter = document.getElementById('original-btn')!;
console.log('Is the button after += the SAME node object as before?', btnAfter === originalBtn);

console.log('--- Clicking the button AFTER innerHTML += ---');
(btnAfter as HTMLButtonElement).click();
console.log('clickCount is now:', clickCount, '<-- did NOT increase -- the listener is gone');

console.log('--- Contrast: using append() instead, which does NOT destroy existing nodes ---');
const p = document.createElement('p');
p.textContent = 'A new paragraph, added via append() -- safe';
container.append(p);
(document.getElementById('original-btn') as HTMLButtonElement).click();
console.log('clickCount is now:', clickCount, '<-- unaffected by append(), since the original button node was never touched');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The button is fetched again via <code>document.getElementById(\'original-btn\')</code> right after the <code>innerHTML +=</code> call — it looks like the same button in the rendered page. Is it actually the same DOM node object as before?',
    hint: 'Ask what innerHTML += is really shorthand for -- serialize everything to a string, concatenate, then do what to the ENTIRE container\'s contents?',
    solution: `No -- btnAfter === originalBtn evaluates to false. Even though the
button renders identically and has the exact same id attribute, it
is a completely different DOM node object after the += operation.

Here's why: container.innerHTML += moreHtml is really shorthand for
container.innerHTML = container.innerHTML + moreHtml. The browser
serializes the ENTIRE current subtree of container back into an
HTML string (including the button), concatenates the new HTML onto
it, then reassigns innerHTML with that combined string -- which
means the browser destroys every existing child node and parses the
combined string from scratch into brand new DOM nodes.

The freshly parsed button LOOKS identical (same tag, same id, same
text) but it is a new object in memory. The addEventListener('click',
...) call from earlier was attached to the OLD button object -- the
new one has no listeners attached at all, which is exactly why
clicking it after the += does not increment clickCount.

The final scenario shows the fix: container.append(p) only adds the
new paragraph node -- it never touches, serializes, or reparses
anything already inside container, so the original button (and its
listener) survives completely intact.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'element.innerHTML += moreHtml is an efficient way to append content, since it "just adds" the new HTML to whatever is already there.',
      reality: '<code>innerHTML +=</code> is shorthand for reassigning the ENTIRE innerHTML with the old content serialized to a string plus the new content — it reparses and rebuilds every existing child node from scratch, not just the newly added part.',
    },
    {
      thought: 'a DOM node fetched again via document.getElementById() (or another selector) after an innerHTML += operation is still the same underlying element, as long as it renders with the same tag, id, and content.',
      reality: 'looking identical is not the same as BEING the same object — after innerHTML is reassigned, every child is a brand new DOM node created by the reparse, even if it happens to have identical attributes and content to the node it replaced.',
    },
    {
      thought: 'only elements that were actually changed by an innerHTML += operation lose their event listeners — unrelated, unchanged sibling elements inside the same container keep theirs intact.',
      reality: 'EVERY existing child inside the container loses its listeners, not just the ones near the newly added content — reassigning innerHTML destroys and recreates the entire subtree unconditionally, with no distinction between "changed" and "unchanged" parts of the markup.',
    },
  ];
}
