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
  selector: 'app-register-throws-same-value-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './register-throws-if-held-value-is-the-same-as-target.html',
  styleUrl: './register-throws-if-held-value-is-the-same-as-target.scss',
})
export class UsingFinalizationRegistryForCriticalCleanupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Real Spec Guard Rail the Main Page\'s Own Examples Quietly Follow',
      points: [
        'Look closely at the main page\'s own <code>ManagedResource</code> example: <code>resourceRegistry.register(this, { id, resourceId: this.#resourceId }, this.#token)</code> — the <code>heldValue</code> passed is a NEW plain object (<code>{ id, resourceId }</code>), never <code>this</code> itself. This subtopic demonstrates WHY that specific choice matters: calling <code>register(target, heldValue, ...)</code> with <code>heldValue</code> set to the SAME value as <code>target</code> throws an immediate TypeError, before any garbage collection is even involved.',
        'This restriction exists because <code>heldValue</code> is deliberately held with a STRONG reference by the <code>FinalizationRegistry</code> — the whole point is to have SOMETHING available to pass into your cleanup callback after <code>target</code> is gone. But if <code>heldValue</code> were allowed to BE <code>target</code>, the registry\'s own strong reference to <code>heldValue</code> would itself keep <code>target</code> permanently alive, making it mathematically impossible for <code>target</code> to EVER become eligible for collection — completely defeating the purpose of registering it in the first place.',
      ],
    },
    {
      heading: 'Why the Engine Catches This Immediately, Not Just as a "Best Practice"',
      points: [
        'This is spec-mandated behavior, not a lint rule or a documentation-only recommendation — <code>FinalizationRegistry.prototype.register()</code> is REQUIRED to throw a <code>TypeError</code> the moment it detects <code>target</code> and <code>heldValue</code> are the same value, catching the mistake immediately at the call site rather than allowing a registry entry to silently exist that could never fire.',
        'The fix is always the same shape shown throughout the main page\'s own examples: pass some OTHER piece of data as <code>heldValue</code> — an ID string, a plain object with the info your cleanup callback actually needs, or any value genuinely distinct from <code>target</code> — never a reference to <code>target</code> itself.',
        'This restriction applies specifically to <code>heldValue</code>, not the OPTIONAL third <code>unregisterToken</code> parameter — a common, valid pattern (also shown in the main page\'s own example) uses a small, otherwise-unused object as the unregister token, and that token CAN safely be unrelated to both <code>target</code> and <code>heldValue</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>FinalizationRegistry register() same-value demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const registry = new FinalizationRegistry((heldValue) => {
  console.log('[GC callback] fired with heldValue:', heldValue);
});

console.log('--- BROKEN: heldValue is the SAME object as target ---');
const brokenTarget = { id: 'broken-resource' };
try {
  registry.register(brokenTarget, brokenTarget); // heldValue === target!
  console.log('register() succeeded?!');
} catch (e) {
  console.log('register() THREW:', (e as Error).message);
}

console.log('--- Why this restriction exists: heldValue is held STRONGLY ---');
console.log('If heldValue could be the target itself, the registry\\'s own strong');
console.log('reference to heldValue would keep target alive forever -- making it');
console.log('mathematically impossible for target to ever become collectible.');

console.log('--- FIXED: heldValue is a genuinely SEPARATE value ---');
const fixedTarget = { id: 'fixed-resource' };
try {
  registry.register(fixedTarget, { id: 'fixed-resource', note: 'cleanup info' }); // a NEW, distinct object
  console.log('register() succeeded -- heldValue is unrelated to target');
} catch (e) {
  console.log('register() threw unexpectedly:', (e as Error).message);
}

console.log('--- Also fine: a simple string or primitive as heldValue ---');
const anotherTarget = { id: 'another-resource' };
registry.register(anotherTarget, 'another-resource-id'); // primitive heldValue -- always safe
console.log('register() with a primitive heldValue succeeded');

console.log('--- The unregisterToken (3rd arg) has NO such restriction ---');
const trackedTarget = { id: 'tracked-resource' };
const unregisterToken = {}; // can be anything, including unrelated to target/heldValue
registry.register(trackedTarget, 'tracked-resource-id', unregisterToken);
registry.unregister(unregisterToken); // cancels the registration -- works fine
console.log('register() + unregister() with a separate token object succeeded');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>registry.register(brokenTarget, brokenTarget)</code> passes the exact same object as both <code>target</code> and <code>heldValue</code>. Does this call succeed?',
    hint: 'Ask what heldValue is actually FOR -- it needs to survive AFTER target is gone, so it can be handed to your cleanup callback. What kind of reference must the registry hold to heldValue to make that possible, and what does that reference do to target if heldValue IS target?',
    solution: `No -- register() throws an immediate TypeError the moment target and
heldValue are the same value, before any garbage collection is even
attempted.

Here's the reasoning: heldValue's entire purpose is to survive and
be available AFTER target has already been collected, so it can be
passed into your cleanup callback. For that to work, the
FinalizationRegistry must hold a STRONG reference to heldValue --
otherwise heldValue itself could be collected before the callback
ever runs, defeating its purpose.

But if heldValue were allowed to be target itself, that same strong
reference (needed to keep heldValue alive) would ALSO keep target
alive -- permanently. target could never become eligible for
collection, since the registry's own reference to it (disguised as
a reference to "heldValue") would count as a legitimate strong
reference forever. The entire mechanism would be self-defeating:
you'd have registered target for cleanup-after-collection, while
simultaneously guaranteeing it can never BE collected.

The spec closes this loophole by throwing immediately at the
register() call itself -- catching the mistake at the exact moment
it's made, rather than allowing a silently broken registration to
exist that could never fire its callback.

The final example confirms this restriction is specific to
heldValue -- the optional third unregisterToken parameter has no
such rule, and a small, otherwise-unused object works perfectly
fine as a token, completely unrelated to either target or
heldValue.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'passing the target object itself as heldValue in FinalizationRegistry.register() is a convenient shortcut — the cleanup callback would simply receive the same object that was just collected.',
      reality: 'this call throws an immediate TypeError, specifically because heldValue is held with a STRONG reference by the registry — if heldValue were allowed to be target, that strong reference would permanently prevent target from ever being collected at all, making the entire registration pointless.',
    },
    {
      thought: 'this restriction is a documented best practice or lint recommendation that experienced developers just tend to follow — the language itself would technically allow passing the same value for both target and heldValue.',
      reality: 'this is a hard, spec-mandated restriction that the engine actively enforces — register() is REQUIRED to throw a TypeError the instant it detects target and heldValue are the same value, not merely discouraged by convention.',
    },
    {
      thought: 'since heldValue cannot be the same as target, the third parameter (unregisterToken) must follow the same restriction too, since it\'s also related to the registration.',
      reality: 'the same-value restriction applies ONLY to heldValue, not to the optional unregisterToken parameter — a token can safely be any object, including one unrelated to both target and heldValue, which is exactly the pattern shown in the main page\'s own ManagedResource example.',
    },
  ];
}
