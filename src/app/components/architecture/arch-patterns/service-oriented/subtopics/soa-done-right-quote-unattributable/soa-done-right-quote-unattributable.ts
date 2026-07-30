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
  templateUrl: './soa-done-right-quote-unattributable.html',
  styleUrl: './soa-done-right-quote-unattributable.scss'
})
export class SoaDoneRightQuoteUnattributableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A specific quote, attributed to a real, named author, that doesn\'t check out',
      points: [
        'The page\'s theory section originally stated: "Microservices = SOA done right" — Sam Newman, author of Building Microservices, presented as a direct quotation with a named source.',
        'Verified via WebSearch: "SOA done right" (and close variants) is a widely-repeated industry characterization, discussed across many blog posts, conference talks (including a SATURN 2015 microservices workshop), and articles going back to around 2015 — but no source ties that specific phrasing to Sam Newman as its originator or as something he is on record saying. It reads as a genuine, well-known industry sentiment with a fabricated specific attribution bolted on.',
        'The page has been corrected to describe it as what the research actually supports: a widely-repeated industry characterization, not a quote from one named author.',
      ]
    },
    {
      heading: 'Why a fabricated citation is a real problem even when the underlying claim is basically reasonable',
      points: [
        'The IDEA behind the quote — that microservices kept SOA\'s service-oriented integration goals while fixing its centralized-ESB problems — is a fair, well-supported characterization; this page\'s own comparison sections make essentially the same point without needing a quote at all.',
        'The PROBLEM is narrower and more specific: attaching a real, identifiable person\'s name to words they may never have said. If a reader later cites "Sam Newman said X" based on this page, they are repeating a claim about what a specific real person said — not just repeating a general industry view — and that claim doesn\'t hold up to a direct check.',
        'This is a different failure mode from stating a wrong FACT (like a mislabeled default value or a stale version number): a false attribution is a claim about WHO said something, and it can\'t be partially right the way an imprecise technical claim sometimes can — either the named person said those words, or a citation attributing it to them is simply inaccurate regardless of whether the sentiment itself is reasonable.',
      ]
    },
    {
      heading: 'How to state a widely-held view without inventing an attribution',
      points: [
        'The corrected version keeps the substance — the characterization is genuinely common in the industry — while dropping the specific, unverifiable "who said it" claim: "is a widely-repeated industry characterization (not a single attributable quote from one named author)."',
        'As a general checklist for any specific-sounding quote attributed to a named, real, identifiable author (not just for this page): search for the exact phrase together with the author\'s name; check whether primary sources (the author\'s own book, blog, talks) actually contain it; and if a phrase can only be traced to "commonly said in the industry" without a specific originating source, present it as exactly that instead of inventing or repeating an unverified attribution.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What a quick source-check on a quote actually looks for',
      language: 'typescript',
      code: `interface QuoteCheck {
  claimedQuote: string;
  claimedAuthor: string;
  checkPerformed: string;
  result: 'confirmed' | 'not traceable to a single source';
}

const check: QuoteCheck = {
  claimedQuote: 'Microservices = SOA done right',
  claimedAuthor: 'Sam Newman, author of Building Microservices',
  checkPerformed:
    'Searched for the exact phrase plus the author name; searched for the ' +
    'general origin of that phrase across articles, talks, and conference ' +
    'materials discussing SOA vs. microservices.',
  result: 'not traceable to a single source',
};

// What the search DID confirm: the underlying sentiment is a widely-repeated
// industry characterization, discussed at multiple conferences and in many
// articles since around 2015 -- just not attributable to one specific,
// identifiable quote from the named author.

// Corrected phrasing keeps the sentiment, drops the fabricated attribution:
const corrected =
  '"Microservices = SOA done right" is a widely-repeated industry ' +
  'characterization (not a single attributable quote from one named author).';`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re reviewing a slide deck that includes: \'"REST killed SOAP" -- Roy Fielding, creator of REST.\' The sentiment (REST largely displaced SOAP for public APIs) is broadly true. Should you leave the slide as-is because the underlying claim is reasonable?',
    hint: 'Separate the two things being asserted: (1) REST displaced SOAP for many use cases, and (2) Roy Fielding specifically said those exact words. Verifying one doesn\'t verify the other.',
    solution: 'No -- the two claims need to be checked separately. The general trend (REST becoming dominant over SOAP for public APIs) may well be defensible and doesn\'t need a celebrity quote to support it. But "Roy Fielding said this" is a distinct, checkable factual claim about what a specific real person said -- and a plausible-sounding quote isn\'t evidence that they actually said it. The safe fix mirrors this subtopic\'s own correction: state the trend directly ("REST has become the dominant style for public APIs, mostly displacing SOAP") without attaching an unverified quotation to a real, named person.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a quote matches what a well-known author\'s book is about (Sam Newman wrote Building Microservices, and the quote is about microservices vs. SOA), that\'s enough evidence the quote is genuine.',
      reality: 'Per this subtopic\'s theory, topical relevance is not the same as verification — a WebSearch specifically for the exact phrase plus the author\'s name found no source tying it to Sam Newman, despite the topic matching his book perfectly.'
    },
    {
      thought: 'Since the underlying idea in the quote is basically accurate and well-supported, the false attribution attached to it is a minor, low-priority issue.',
      reality: 'Per this subtopic\'s theory, a false attribution is a distinct failure from an imprecise fact — it\'s a specific, checkable claim about what a real, named person said, and it doesn\'t become more accurate just because the general sentiment it\'s wrapped around happens to be reasonable.'
    },
    {
      thought: 'Fact-checking effort should focus on surprising, contested, or technical claims — a widely-agreed sentiment doesn\'t need the same scrutiny.',
      reality: 'Per this subtopic\'s theory, the SENTIMENT here was never in question — what needed (and failed) verification was a completely separate claim: that one specific, named, real person is the source of those exact words.'
    }
  ];
}
