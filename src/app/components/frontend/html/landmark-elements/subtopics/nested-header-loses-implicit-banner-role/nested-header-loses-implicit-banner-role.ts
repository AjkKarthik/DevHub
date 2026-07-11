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
  templateUrl: './nested-header-loses-implicit-banner-role.html',
  styleUrl: './nested-header-loses-implicit-banner-role.scss'
})
export class NestedHeaderLosesImplicitBannerRoleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A top-level <header> implicitly maps to the ARIA "banner" landmark role — but only at the document\'s outer level',
      points: [
        'When <code>&lt;header&gt;</code> is a direct descendant of <code>&lt;body&gt;</code> (not nested inside another sectioning element), the HTML-to-ARIA mapping spec gives it an implicit <code>role="banner"</code> — the "site-wide masthead" landmark screen reader users jump to first.',
        'The exact same tag nested inside <code>&lt;article&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>, or <code>&lt;section&gt;</code> gets NO implicit landmark role at all — it becomes a plain, non-landmark grouping, because it\'s now understood as that section\'s own local header, not the page\'s banner.',
      ]
    },
    {
      heading: 'This exact nesting condition is directly checkable from JavaScript, without needing to query the accessibility tree itself',
      points: [
        'The spec\'s rule is purely structural: "is this <code>&lt;header&gt;</code> a descendant of <code>&lt;article&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>, or <code>&lt;section&gt;</code>?" — exactly what <code>header.closest(\'article, aside, main, nav, section\')</code> answers.',
        'A non-null result from that check means the header has lost its banner role; <code>null</code> means it still has one — this mirrors the spec\'s own decision condition precisely, even though the browser\'s internal accessibility-role computation isn\'t itself exposed to plain JavaScript.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Nested header loses banner role</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>

    <header id="site-header">Site-wide header — top level</header>

    <article>
      <header id="article-header">Article's own header — nested</header>
    </article>

    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const sectioningSelector = 'article, aside, main, nav, section';

function describeHeader(id: string) {
  const el = document.querySelector<HTMLElement>(\\\`#\\\${id}\\\`)!;
  const nestedIn = el.closest(sectioningSelector);
  const hasBannerRole = nestedIn === null;
  console.log(\\\`#\\\${id}: nested in a sectioning element? \\\${nestedIn !== null} -> implicit banner role? \\\${hasBannerRole}\\\`);
}

describeHeader('site-header');
describeHeader('article-header');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>&lt;header&gt;</code> sits directly inside a <code>&lt;section&gt;</code>, which itself sits directly inside <code>&lt;body&gt;</code>. Does that header still get the implicit "banner" landmark role?',
    hint: 'The rule checks for ANY ancestor that is article/aside/main/nav/section, not just an immediate parent — apply <code>closest()</code> mentally, not just "is the direct parent body?".',
    solution: 'No — being nested inside a <code>&lt;section&gt;</code> at any depth removes the implicit banner role, regardless of how many other elements sit between the header and body. <code>header.closest(\'article, aside, main, nav, section\')</code> would return that section, proving the nesting condition is met.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every <code>&lt;header&gt;</code> element on a page automatically gets the "banner" landmark role, since that\'s what the tag is for.',
      reality: 'Only a <code>&lt;header&gt;</code> that is NOT nested inside <code>article</code>/<code>aside</code>/<code>main</code>/<code>nav</code>/<code>section</code> gets the implicit banner role. Nested ones are treated as ordinary, non-landmark section headers instead.'
    },
    {
      thought: 'Only being a DIRECT child of one of those sectioning elements removes the banner role — a header nested two levels deep still keeps it.',
      reality: 'The rule checks for ANY ancestor matching those tags, at any depth — exactly what <code>closest()</code> tests. A header buried three levels inside nested <code>&lt;div&gt;</code>s inside an <code>&lt;article&gt;</code> still loses the role, since <code>&lt;div&gt;</code> has no bearing on the check.'
    },
    {
      thought: 'You can directly read an element\'s computed ARIA role from plain JavaScript, the same way you\'d read <code>.ariaLabel</code>.',
      reality: 'There\'s no standard, universally-supported JS property for reading a computed implicit role like this. The structural <code>closest()</code> check works because it mirrors the SAME condition the spec uses to decide the role — it doesn\'t read the role directly, it recreates the spec\'s own logic.'
    }
  ];
}
