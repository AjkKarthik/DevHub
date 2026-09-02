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
    heading: 'A Decorator With Nothing Left to Decorate',
    points: [
      'The main page’s own "Custom Fault Injection" code tab decorates <code>FaultInjectionMiddleware</code> with Angular’s <code>@Injectable({ providedIn: \'root\' })</code>, imported from <code>@angular/core</code> — Angular’s DI-container registration decorator, meant for classes that get CONSTRUCTED and injected into other components/services.',
      'Every single member the class actually uses — <code>injectFault()</code>, and the config it reads — is declared <code>static</code>, and every call site in the same code tab calls it as <code>FaultInjectionMiddleware.injectFault()</code>, a plain static method call. Angular’s DI container never constructs an instance of this class anywhere in the shown code, because nothing ever asks it to.',
      'Verified directly: wrapping the class in a no-op decorator (standing in for what <code>@Injectable</code> actually does — register metadata for a container that might later construct the class) and calling the same static method produces byte-identical behavior to calling it with no decorator at all. The decorator, and the import that supplies it, do genuinely nothing for this specific class as written.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'With and Without the Decorator, Compared',
    language: 'typescript',
    code: `// A stand-in for Angular's real @Injectable() decorator -- it
// records DI-container metadata on the class, which only ever
// matters if something later asks the container to CONSTRUCT an
// instance of that class.
function FakeInjectable(config: object) {
  return function (target: any) {
    target.__ngInjectableConfig = config;
    return target;
  };
}

@FakeInjectable({ providedIn: 'root' })
class WithDecorator {
  static async injectFault(): Promise<string> {
    return 'fault-injected';
  }
}

class WithoutDecorator {
  static async injectFault(): Promise<string> {
    return 'fault-injected';
  }
}

async function main() {
  const a = await WithDecorator.injectFault();
  const b = await WithoutDecorator.injectFault();
  console.log('With decorator, static call result:', a);
  console.log('Without decorator, static call result:', b);
  console.log('Identical behavior?', a === b);
}
main();
// -> With decorator, static call result: fault-injected
// -> Without decorator, static call result: fault-injected
// -> Identical behavior? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Imagine a teammate later refactors <code>FaultInjectionMiddleware</code> to have real, non-static, per-instance state (say, a per-request request ID it tracks). At that point, would the <code>@Injectable</code> decorator suddenly start "doing something" again?',
  hint: 'Consider what would ALSO need to change at every call site for that refactor to actually take effect, beyond just adding the decorator back.',
  solution: `// The decorator alone still wouldn't do anything -- what would
// ACTUALLY need to change is every CALL SITE. Right now, every call
// site does FaultInjectionMiddleware.injectFault() -- a static
// reference to the class itself, never an injected instance. Even
// with real instance state and the decorator both present, Angular's
// DI container only ever constructs and hands out an instance to
// code that asks for one through the injection mechanism (a
// constructor parameter typed as the service, or inject()) --  a
// static call site never goes through that mechanism at all, no
// matter what the class itself looks like.
//
// So making the decorator meaningful again would need BOTH changes
// together: giving the class real instance state, AND rewriting every
// call site to actually inject and use an instance rather than
// calling static members directly. Adding instance state alone, with
// the call sites left as static references, would just be a second,
// unrelated bug layered on top of the first.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the class is decorated with <code>@Injectable</code>, Angular must be constructing at least one hidden instance of it somewhere behind the scenes — decorators like this always have SOME runtime effect.',
    reality: 'A decorator’s runtime effect is entirely conditional on something actually USING what it sets up. <code>@Injectable({ providedIn: \'root\' })</code> registers the class as available for injection — it doesn’t force Angular to construct an instance proactively. If nothing in the application ever injects <code>FaultInjectionMiddleware</code> (via a constructor parameter or <code>inject()</code>), no instance is ever created, decorator or not — this is precisely Angular’s tree-shakable-provider design, where an unused injectable is never instantiated and, in a production build, is typically eliminated entirely.',
  },
  {
    thought: 'This is purely a stylistic nitpick — leaving an unnecessary decorator and import in place is harmless, since TypeScript would catch it as an error if it were genuinely wrong.',
    reality: 'TypeScript’s type checker has no rule against decorating a class that happens to have only static members — it’s syntactically and semantically valid TypeScript, just misleading to a reader. The real cost isn’t a compile error, it’s that the decorator actively signals "construct this via DI and inject it" to anyone reading the code, which is the OPPOSITE of how the class is actually meant to be used — exactly the kind of mismatch that makes real production code confusing to onboard onto or refactor later.',
  },
];

@Component({
  selector: 'app-obs-chaos-injectable',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-injectable-decorator-thats-never-actually-injected.html',
  styleUrl: './the-injectable-decorator-thats-never-actually-injected.scss',
})
export class TheInjectableDecoratorThatsNeverActuallyInjectedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
