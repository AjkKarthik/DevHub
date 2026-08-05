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
    heading: 'MediatR Stopped Being Fully Open Source in 2025',
    points: [
      'The main page\'s own theory calls MediatR "the de facto .NET Mediator for CQRS" — true in terms of ' +
      'ecosystem adoption, but the underlying licensing changed under that same name: starting with v13 ' +
      '(released July 2, 2025), MediatR ships under a dual Reciprocal Public License 1.5 (RPL-1.5) / ' +
      'commercial license from creator Jimmy Bogard\'s new company, Lucky Penny Software.',
      'The free tier is real, not a trick: individuals and companies with under $5,000,000 USD in annual ' +
      'revenue can keep using MediatR at no cost. Above that threshold, a commercial license is required to ' +
      'stay compliant — this is a genuine build-vs-buy decision for a company that didn\'t exist before v13.',
      'Nothing changes for existing code: MediatR 12.x and every earlier version remain permanently on the ' +
      'original Apache 2.0 license — they were never retroactively relicensed. A project already pinned to ' +
      '12.x can stay there indefinitely without ever touching the new license terms.',
    ],
  },
  {
    heading: 'What This Actually Changes for a Team Choosing MediatR Today',
    points: [
      'For the overwhelming majority of teams — solo developers, startups, and companies under the revenue ' +
      'threshold — nothing changes in practice: MediatR v13+ is still free, still actively maintained, and ' +
      'still has the same API the main page\'s own <code>IRequestHandler</code>/<code>INotificationHandler</code> ' +
      'examples use.',
      'For a company already over $5M in annual revenue, upgrading past v12 now requires either budgeting for ' +
      'a commercial license or evaluating an alternative — this is the one scenario where the licensing change ' +
      'is a real, not theoretical, factor in the decision.',
      'The change also renewed interest in source-generator-based alternatives with a similar API but a fully ' +
      'open license — e.g. martinothamar/Mediator, which generates strongly-typed dispatch code at compile ' +
      'time instead of MediatR\'s reflection/DI-based resolution, with the trade-off that its performance ' +
      'advantage degrades on projects with a very large number of distinct message types (500+).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'MediatR 12.x vs 13.x',
    language: 'csharp',
    code: `// A project pinned to MediatR 12.x — Apache 2.0, unaffected by the
// license change, can stay on this version indefinitely.
<PackageReference Include="MediatR" Version="12.4.1" />

// Upgrading to 13.x pulls in the new dual-license terms:
<PackageReference Include="MediatR" Version="13.0.0" />
// - Free: individuals and companies under $5M USD annual revenue.
// - Paid: a commercial license from Lucky Penny Software above that.
// The API (IRequestHandler<,>, INotificationHandler<>, IMediator)
// is unchanged between 12.x and 13.x — this is a licensing decision,
// not a rewrite.

// A fully open-source, source-generator-based alternative with a
// near-identical API, for teams that want to avoid the question
// entirely:
// dotnet add package Mediator.SourceGenerator
public record GetOrderQuery(int OrderId) : IRequest<OrderDto?>;

public class GetOrderHandler : IRequestHandler<GetOrderQuery, OrderDto?>
{
    public ValueTask<OrderDto?> Handle(GetOrderQuery query, CancellationToken ct)
        => // ... same handler shape as MediatR, dispatched via generated
           // code at compile time instead of DI-resolved reflection.
        default;
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team\'s product is already on MediatR 12.4, and their company just crossed $5M in annual revenue this ' +
    'year. Do they need to buy a commercial license right now, today, to stay compliant?',
  hint:
    'Re-read the theory section above carefully — does the license change apply to a VERSION, or to MediatR ' +
    'as a library in general regardless of version?',
  solution:
    'No — not as long as they stay on 12.x. The dual RPL-1.5/commercial license only applies starting with ' +
    'v13 (July 2025); every 12.x release remains permanently under the original Apache 2.0 license and was ' +
    'never retroactively relicensed. The revenue threshold only becomes relevant the moment the team chooses ' +
    'to upgrade to v13 or later — staying on 12.x sidesteps the question entirely, at the cost of missing any ' +
    'bug fixes or features MediatR ships in 13.x and beyond.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'MediatR going commercial means it is no longer free to use at all.',
    reality:
      'MediatR v13+ is still free for the vast majority of real-world users — individuals and companies under ' +
      '$5,000,000 USD in annual revenue pay nothing. The commercial license only applies above that threshold, ' +
      'and even then only to versions 13 and later — 12.x stays Apache 2.0 forever.',
  },
  {
    thought: 'Since the main page calls MediatR "the de facto .NET Mediator for CQRS," licensing is not really ' +
      'relevant to a page about the Mediator pattern.',
    reality:
      'The pattern itself (a central hub routing communication between colleagues) is licensing-agnostic — ' +
      'you can hand-roll it, as the main page\'s own <code>ChatRoom</code> example does. But the SPECIFIC ' +
      'library the page spends most of its ".NET Examples" and QnA content on, MediatR, now has a real ' +
      'commercial dimension that a "de facto" recommendation should account for, especially for larger teams.',
  },
];

@Component({
  selector: 'app-mediator-mediatr-2025-license-change',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mediatr-2025-license-change.html',
  styleUrl: './mediatr-2025-license-change.scss',
})
export class Mediatr2025LicenseChangeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
