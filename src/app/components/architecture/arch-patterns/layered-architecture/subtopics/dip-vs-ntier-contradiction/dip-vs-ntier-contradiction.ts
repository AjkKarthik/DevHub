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
  templateUrl: './dip-vs-ntier-contradiction.html',
  styleUrl: './dip-vs-ntier-contradiction.scss'
})
export class DipVsNtierContradictionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Three sections say Infrastructure depends on Domain; one section said the opposite',
      points: [
        'The page\'s Quick Reference states: "Domain Layer... zero external deps" and "Infrastructure Layer... implements domain interfaces." The "mistakes" block explicitly forbids Domain importing Infrastructure, with the fix being "Domain defines interface; Infrastructure implements it." Quiz question 1\'s own explanation states: "Infrastructure implements Domain interfaces (dependency inversion)." All three describe the SAME model: Infrastructure depends on Domain, never the reverse.',
        'The page\'s own QnA originally stated the opposite for the very same pattern: "Layered architecture often allows Infrastructure to be the bottom layer that Domain depends on" — literally Domain depending on Infrastructure, contradicting the three sections above. The page has been corrected so the QnA reconciles with, rather than contradicts, the rest of the page.',
      ]
    },
    {
      heading: 'Why this wasn\'t just a simple factual error to fix by picking a side',
      points: [
        'Both framings are legitimate descriptions of REAL architectures that exist in practice: classic, undisciplined N-tier layering (Presentation → Business Logic → Data Access → Database, with Business Logic directly instantiating Data Access classes) genuinely does have upper layers depend on lower ones including Infrastructure — no interface indirection required. A dependency-inverted variant (Domain defines repository interfaces, Infrastructure implements them) is a DIFFERENT, more disciplined pattern, often associated with Clean/Onion/Hexagonal Architecture.',
        'The problem wasn\'t that either framing is wrong in general — it\'s that the SAME page used BOTH framings to describe what it calls, in every section, simply "layered architecture" — without ever telling the reader that these are two different variants, or which one the page\'s own quickRef/mistakes-block/quiz were actually teaching.',
        'The fix reconciles the QnA to match the OTHER three sections (3-to-1 majority) rather than the reverse, and explicitly names what actually still distinguishes plain layered architecture from Clean Architecture: not the mere PRESENCE of dependency inversion (this page\'s own recommended layered-architecture practice already uses it), but whether it\'s enforced as a strict, project-wide rule (Clean Architecture) or just a best-practice recommendation that undisciplined codebases can quietly violate (plain layered architecture, exactly as the mistakes block warns).',
      ]
    },
    {
      heading: 'A reusable technique: when a page teaches one pattern across many sections, check for a lone outlier',
      points: [
        'This inconsistency was caught by treating the page\'s quickRef, mistakes block, and quiz explanation as three independent, mutually-reinforcing statements of the SAME rule — then noticing the QnA was the one section describing something different for what it claims is the identical pattern.',
        'A single outlier among several independently-stated descriptions of "the same thing" is a strong, checkable signal — especially when (as here) fixing the OUTLIER is less invasive than rewriting three consistent sections to match it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two real, differently-named patterns the page conflated',
      language: 'typescript',
      code: `interface LayeringVariant {
  name: string;
  domainDependsOnInfrastructure: boolean;
  describedByThisPageAs: string;
}

const variants: LayeringVariant[] = [
  {
    name: 'Classic / undisciplined N-tier',
    domainDependsOnInfrastructure: true, // Business Logic directly
    // instantiates Data Access classes -- no interface indirection.
    describedByThisPageAs: "the QnA's original wording",
  },
  {
    name: "Dependency-inverted layered (this page's actual recommendation)",
    domainDependsOnInfrastructure: false, // Domain defines interfaces;
    // Infrastructure implements them.
    describedByThisPageAs: "quickRef, the mistakes block, and quiz Q1's explanation",
  },
];

// Before the fix: 3 sections described variant #2, 1 section (QnA)
// described variant #1 -- for what all four sections called the same
// "layered architecture" pattern. The QnA has been corrected to
// describe variant #2, matching the other three, while still
// correctly distinguishing it from Clean Architecture on a
// different, accurate axis: enforcement rigor, not mere presence
// of dependency inversion.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page\'s Quick Reference states "Domain Layer... zero external deps" and its mistakes block forbids Domain from importing Infrastructure. The SAME page\'s QnA states "layered architecture often allows... Domain depends on [Infrastructure]." Which framing should a reader trust, and why?',
    hint: 'Count how many independent sections of the page describe each framing -- quickRef, the mistakes block, quiz Q1\'s explanation, and the QnA are four separate places the same claim could be checked.',
    solution: 'Three independent sections (quickRef, the mistakes block, and quiz Q1\'s explanation) all describe the dependency-inverted model -- Domain defines interfaces, Infrastructure implements them, Domain has zero dependency on Infrastructure. Only the QnA described the opposite. Since three mutually-reinforcing, independently-stated sections agree, and fixing the one outlier (the QnA) is less invasive than rewriting three consistent sections, the QnA is the section that needed correcting. The corrected QnA now explains that plain layered architecture, as taught on this page, already recommends dependency inversion -- what actually distinguishes Clean Architecture is enforcing that inversion as a strict, project-wide rule rather than a best practice a codebase can drift away from over time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Layered architecture" refers to a single, universally-agreed-upon dependency direction between Domain and Infrastructure, so any page describing it should never need to distinguish variants.',
      reality: 'Per this subtopic\'s theory, at least two real, differently-disciplined variants exist in practice (classic N-tier with direct dependencies, and a dependency-inverted variant) — a page teaching "layered architecture" needs to be explicit about which one it means, especially if it uses both framings in different sections without reconciling them.'
    },
    {
      thought: 'When a page has four sections describing the same rule and one of them disagrees, the disagreeing section is automatically the "special case" worth keeping as an intentional nuance, rather than a plain error.',
      reality: 'Per this subtopic\'s theory, a 3-to-1 split among sections that all claim to describe the identical pattern (not different scenarios) is much more likely to be an inconsistency worth fixing than an intentional nuance — especially when the outlier directly contradicts a "wrong vs. right" mistakes-block example elsewhere on the same page.'
    },
    {
      thought: 'Fixing an inconsistency like this means picking whichever framing is "more correct" in the abstract and rewriting every section to match it.',
      reality: 'Per this subtopic\'s theory, the practical fix was reconciling the OUTLIER section to match the majority, while preserving what was still a genuinely useful and accurate point in the outlier (the real distinction between layered and Clean Architecture) — just restated on the correct axis (enforcement rigor) instead of the axis that contradicted the rest of the page (presence of dependency inversion at all).'
    }
  ];
}
