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
  templateUrl: './challenge-referenced-undefined-types.html',
  styleUrl: './challenge-referenced-undefined-types.scss'
})
export class ChallengeReferencedUndefinedTypesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two types used throughout the Challenge, defined nowhere',
      points: [
        'The Challenge\'s starterCode originally declared class InMemoryNotificationGateway implements INotificationGateway { } — using INotificationGateway as an interface name, but that interface was never declared anywhere in the starterCode, the hints, or the solution. Only SendNotificationPort (the primary port) was actually defined.',
        'The solution also used SendNotificationUseCase in the composition root — new SendNotificationUseCase(gateway) — but no class or interface named SendNotificationUseCase was ever declared anywhere in the Challenge either. The page has been corrected to define both INotificationGateway (the secondary port) and SendNotificationUseCase (the primary port\'s implementation) explicitly.',
      ]
    },
    {
      heading: 'Why this specific kind of gap is easy to miss on a first read',
      points: [
        'Reading the solution top to bottom, every individual class LOOKS complete and correctly implemented — SendNotificationCli reads process.argv and calls the port; InMemoryNotificationGateway pushes to an array. The bug isn\'t in what\'s WRITTEN, it\'s in what\'s MISSING: two types that everything else references as if they already exist.',
        'This is the same category of gap already found and fixed on a sibling Architecture Patterns topic (the Layered Architecture page\'s Challenge solution referencing an undeclared this.repo field) — worth specifically checking for on any Challenge solution: does every type NAME used actually have a matching DECLARATION somewhere in the same Challenge?',
      ]
    },
    {
      heading: 'The fix: define both missing types, matching the page\'s own established conventions',
      points: [
        'INotificationGateway is defined as a secondary port — an interface with a single send(recipient, message) method, matching exactly what InMemoryNotificationGateway.send() already implements and what the (also-missing) production adapter needs to implement too.',
        'SendNotificationUseCase is defined as the primary port\'s implementation — implements SendNotificationPort, with a constructor taking the secondary port (private gateway: INotificationGateway), matching the exact pattern the main page\'s own "Ports (defined in core)" code sample already establishes for PlaceOrderUseCase implements PlaceOrderPort.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Referenced-but-undefined vs. fully self-contained',
      language: 'typescript',
      code: `// BEFORE: two types used, neither ever declared anywhere.
// interface SendNotificationPort { ... } -- the ONLY type actually defined
class InMemoryNotificationGatewayBroken implements INotificationGateway {
  // ^ TypeScript error: Cannot find name 'INotificationGateway'.
  sent: Array<{ recipient: string; message: string }> = [];
  async send(recipient: string, message: string): Promise<void> {
    this.sent.push({ recipient, message });
  }
}

const useCaseBroken = new SendNotificationUseCase(new InMemoryNotificationGatewayBroken());
// ^ TypeScript error: Cannot find name 'SendNotificationUseCase'.

// AFTER: every referenced type is declared before use.
interface SendNotificationPort {
  execute(cmd: { recipient: string; message: string }): Promise<void>;
}

interface INotificationGateway {           // <-- now declared
  send(recipient: string, message: string): Promise<void>;
}

class SendNotificationUseCase implements SendNotificationPort {  // <-- now declared
  constructor(private gateway: INotificationGateway) {}
  async execute(cmd: { recipient: string; message: string }): Promise<void> {
    await this.gateway.send(cmd.recipient, cmd.message);
  }
}

class InMemoryNotificationGatewayFixed implements INotificationGateway {
  sent: Array<{ recipient: string; message: string }> = [];
  async send(recipient: string, message: string): Promise<void> {
    this.sent.push({ recipient, message });
  }
}

const useCaseFixed = new SendNotificationUseCase(new InMemoryNotificationGatewayFixed());
// No error -- every referenced name has a matching declaration.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Challenge solution defines a SendNotificationPort interface, a SendNotificationCli class, and an InMemoryNotificationGateway class that implements INotificationGateway. The composition root writes new SendNotificationUseCase(gateway). Which type names are used in this solution but never actually declared anywhere in it?',
    hint: 'For each capitalized type name that appears after "implements", "new", or as a parameter type, check whether an interface or class declaration with that EXACT name appears anywhere else in the same Challenge.',
    solution: 'Two type names are used but never declared: INotificationGateway (referenced in "implements INotificationGateway" but no interface with that name is defined anywhere) and SendNotificationUseCase (referenced in "new SendNotificationUseCase(gateway)" but no class with that name is defined anywhere). Only SendNotificationPort was actually declared. The fix adds both missing declarations: INotificationGateway as a secondary port interface with a send(recipient, message) method, and SendNotificationUseCase as a class implementing SendNotificationPort with a constructor taking the gateway -- matching the exact pattern the main page\'s own PlaceOrderUseCase implements PlaceOrderPort example already establishes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Challenge solution where every individual class is internally well-formed (correct method bodies, correct logic) is very unlikely to have a missing-declaration bug, since that class of error would show up as an obviously broken class.',
      reality: 'Per this subtopic\'s theory, this exact bug survived specifically because every INDIVIDUAL class was well-formed — the gap wasn\'t inside any one class\'s body, it was in two type NAMES being referenced (via "implements" and "new") with no matching declaration existing anywhere in the Challenge at all.'
    },
    {
      thought: 'Since the Challenge\'s starterCode only explicitly asks the learner to fill in a few TODO-marked classes, any type referenced but not defined is presumably meant to already exist elsewhere in a real codebase, not something the Challenge itself needs to define.',
      reality: 'Per this subtopic\'s theory, a self-contained Challenge exercise (with no external file references or imports from elsewhere) needs every type it uses to be fully defined WITHIN the exercise itself — a learner has no other codebase to look in, so an undefined reference here is a genuine gap in the exercise, not an implied external dependency.'
    },
    {
      thought: 'This kind of "referenced but never declared" gap is a one-off mistake specific to this page, unlikely to recur elsewhere in the same hub.',
      reality: 'Per this subtopic\'s theory, the identical category of bug (a Challenge solution referencing this.repo with no declaration anywhere) was already found and fixed on the Layered Architecture topic in this same hub — worth treating as a standing check for any Challenge solution: does every referenced type name actually have a matching declaration in the same Challenge?'
    }
  ];
}
