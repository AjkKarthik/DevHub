import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-notification-permission-is-readable-anytime-construction-never-throws',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './notification-permission-is-readable-anytime-construction-never-throws.html',
  styleUrl: './notification-permission-is-readable-anytime-construction-never-throws.scss'
})
export class NotificationPermissionIsReadableAnytimeConstructionNeverThrowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Creating Notification without permission" is a real mistake — but not because it throws',
      points: [
        'The main page\'s Common Mistake warns against <code>new Notification(\'Hi\')</code> without first checking permission, and the fix is <code>Notification.requestPermission().then(() =&gt; new Notification(\'Hi\'))</code>. It is genuinely worth avoiding — but the reason is more subtle than "it will error."',
        '<code>Notification.permission</code> is a plain, synchronous string property (<code>\'granted\'</code>, <code>\'denied\'</code>, or <code>\'default\'</code>) readable at any time with zero permission prompt or async call required — checking it costs nothing and never requires user interaction.',
      ]
    },
    {
      heading: 'The constructor itself never throws for a permission problem — it fails by doing nothing visible',
      points: [
        'Calling <code>new Notification(...)</code> when permission is <code>\'denied\'</code> or still <code>\'default\'</code> does not throw a permission-related error — the constructor call succeeds and returns a real <code>Notification</code> object, but no actual system notification is ever displayed to the user.',
        'This is directly testable: read <code>Notification.permission</code> BEFORE construction, construct the object regardless, and confirm that construction never throws no matter what the permission state was — the mistake\'s real cost is a notification that silently never appears, not a caught exception you could react to.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Notification.permission and construction</title></head>
  <body>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

if (!('Notification' in window)) {
  output.textContent = 'The Notification API is not available in this sandbox.';
} else {
  const permissionBefore = Notification.permission;
  let constructionThrew = false;
  let errorMessage = '';
  let notificationObject: Notification | null = null;

  try {
    // Deliberately NOT checking permission first, and NOT calling requestPermission() —
    // this is exactly the "mistake" pattern the main page warns against.
    notificationObject = new Notification('Test notification — will it throw?');
  } catch (e) {
    constructionThrew = true;
    errorMessage = (e as Error).message;
  }

  output.textContent =
    \`Notification.permission (read with zero prompt, zero async call): "\${permissionBefore}"\\n\\n\` +
    \`Called new Notification(...) WITHOUT checking permission or calling requestPermission() first.\\n\\n\` +
    (constructionThrew
      ? \`Construction THREW: \${errorMessage}\`
      : \`Construction did NOT throw — a real Notification object was returned:\\n  \${notificationObject}\\n\\n\` +
        (permissionBefore === 'granted'
          ? 'Since permission is already "granted" here, the notification will actually display.'
          : 'Since permission is NOT "granted", nothing will actually be shown to the user —\\nbut you would never know that from the constructor call itself, since it never\\nthrew or rejected anything to signal the failure.')
    );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Assume <code>Notification.permission</code> reads as <code>\'default\'</code> (the user has never been asked). Predict: does <code>new Notification(\'Hi\')</code> throw an error you could catch, silently do nothing visible, or automatically trigger the permission prompt itself?',
    hint: 'The main page is explicit that requesting permission is a SEPARATE, required step (Notification.requestPermission()) — the constructor itself is not documented to trigger that prompt on your behalf.',
    solution: `It silently does nothing visible — no error thrown, no prompt triggered, no notification shown.
The Notification constructor succeeds and returns a real object either way, completely independent
of the current permission state; only the ACTUAL DISPLAY of the notification depends on permission
being 'granted'. This is precisely why the mistake is dangerous: there is no exception, no rejected
promise, and no automatic prompt to alert you that nothing happened — the failure is a notification
that simply, silently, never appears.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling new Notification() before checking or requesting permission throws an error, which is why the main page warns against it.',
      reality: 'It never throws for this reason — the constructor succeeds regardless of permission state. The real risk is a notification that silently fails to display, with no exception to alert you.'
    },
    {
      thought: 'Notification.permission requires an async call or user interaction to read, similar to requestPermission().',
      reality: 'It is a plain synchronous string property, readable instantly at any time with zero user interaction or async call — only CHANGING the permission (via requestPermission()) requires user interaction.'
    },
    {
      thought: 'Calling new Notification(...) implicitly triggers the browser\'s permission prompt if none has been granted yet.',
      reality: 'It does not — requesting permission is an entirely separate, required step via Notification.requestPermission(). The constructor never prompts on its own; it just silently produces a non-displaying notification if permission isn\'t already granted.'
    },
  ];
}
