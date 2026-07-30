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
  templateUrl: './smart-endpoints-dumb-pipes-was-reversed.html',
  styleUrl: './smart-endpoints-dumb-pipes-was-reversed.scss'
})
export class SmartEndpointsDumbPipesWasReversedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA question had the two halves of the phrase swapped',
      points: [
        'The page\'s own QnA originally asked "What does \'smart pipes, dumb endpoints\' mean?" — the words in the wrong order. Verified via WebSearch: the actual, coined phrase is "smart endpoints, dumb pipes," introduced by Martin Fowler and James Lewis in their 2014 article defining microservices characteristics.',
        'The mix-up was catchable without any external research at all: the QnA\'s OWN answer text correctly describes microservices as having "dumb pipes... and smart endpoints" — the opposite order from its own question title. The page\'s theory section, in a completely different part of the same file, ALSO correctly uses "smart endpoints, dumb pipes." Two sections agreed with each other; only the question title disagreed with both.',
        'The page has been corrected to state the question the right way round: "What does \'smart endpoints, dumb pipes\' mean?"',
      ]
    },
    {
      heading: 'Why the order isn\'t just a memorization detail — reversing it describes a different architecture',
      points: [
        '"Smart endpoints, dumb pipes" means: the SERVICES (endpoints) carry business logic, and the communication layer (pipes — HTTP, a message broker) stays deliberately minimal. This is the microservices position.',
        'Reverse it — "smart pipes, dumb endpoints" — and you get a coherent description too, just of the OPPOSITE architecture: a smart middleware layer (an ESB) doing routing, transformation, and orchestration, connecting comparatively thin services that just respond to what the ESB tells them. That is a fair one-line summary of classic SOA\'s ESB-centric model, which this same page\'s theory section describes elsewhere.',
        'That\'s what makes the reversed phrase a genuine trap rather than a harmless slip: it doesn\'t read as nonsense, it reads as a plausible description of the WRONG architecture — a reader skimming the reversed question title could walk away thinking it describes microservices when it actually better describes the SOA/ESB model the page contrasts it against.',
      ]
    },
    {
      heading: 'Where the correct phrase comes from and how it is used today',
      points: [
        'Fowler and Lewis\'s original formulation: microservices should communicate over "dumb" transport (simple HTTP, lightweight messaging) rather than embedding orchestration logic in the transport layer itself, which is exactly the ESB pattern they were reacting against.',
        'The phrase remains a standard shorthand in microservices literature for explaining WHY teams moved integration/business logic out of centralized middleware and into the services that own it — the same underlying point this page\'s own "SOA\'s Enterprise Service Bus and Why Microservices Diverged From It" theory section makes, just without naming the coined phrase\'s actual source there.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same four words, two orders, two different architectures',
      language: 'typescript',
      code: `interface ArchitectureCharacterization {
  phrase: string;
  describes: string;
  whoOwnsLogic: 'the services (endpoints)' | 'the middleware (pipe)';
}

const characterizations: ArchitectureCharacterization[] = [
  {
    phrase: 'Smart endpoints, dumb pipes',
    describes: 'Microservices (Fowler & Lewis, 2014) -- the coined, correct phrase',
    whoOwnsLogic: 'the services (endpoints)',
  },
  {
    phrase: 'Smart pipes, dumb endpoints',
    describes: 'Classic SOA with a centralized ESB -- NOT what the reversed phrase ' +
      'was meant to describe on this page, but a fair description of the OTHER ' +
      'architecture the page contrasts it against',
    whoOwnsLogic: 'the middleware (pipe)',
  },
];

// The QnA's original question title used the second row's phrase while its own
// answer body -- and the page's separate theory section -- both described the
// first row. Reversing two words didn't produce nonsense; it produced a
// coherent description of the wrong architecture.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate asks you to review a slide that says: "Microservices follow the \'smart pipes, dumb endpoints\' principle." Without changing any other wording, what\'s wrong with the slide, and which architecture does that exact phrase, read literally, actually describe well?',
    hint: 'Match each word to who owns the logic. If the "pipe" (transport/middleware) is smart, who is doing the routing/transformation work — the services, or the middleware?',
    solution: 'The slide has the two halves of the phrase reversed. The coined phrase for microservices is "smart endpoints, dumb pipes" -- services own their own logic, the transport stays minimal. Read literally, "smart pipes, dumb endpoints" describes the OPPOSITE arrangement: a smart middleware layer (an ESB) doing the routing/transformation/orchestration work, connecting comparatively passive services -- which is a reasonable one-line characterization of classic SOA\'s ESB-centric model, not microservices. The fix is swapping the two halves back, not rewording the whole sentence.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Smart pipes, dumb endpoints" and "smart endpoints, dumb pipes" are just two ways of phrasing the same underlying idea, so the order doesn\'t really matter.',
      reality: 'Per this subtopic\'s theory, the two orders describe OPPOSITE architectures: the correct order (smart endpoints, dumb pipes) is microservices; the reversed order reads as a coherent description of SOA\'s ESB-centric model instead — a real, differently-wrong claim, not a harmless rephrasing.'
    },
    {
      thought: 'Because this is "just a coined phrase," getting the word order backwards is a trivial typo with no real content consequence.',
      reality: 'Per this subtopic\'s theory, the reversed phrase doesn\'t collapse into nonsense — it accidentally produces an accurate-sounding description of the WRONG architecture, which is exactly what makes this kind of two-word swap easy to miss on a skim and genuinely misleading if left uncorrected.'
    },
    {
      thought: 'This phrase originated as a description of SOA\'s strengths and was later adapted by the microservices community.',
      reality: 'Per this subtopic\'s theory, "smart endpoints, dumb pipes" was coined by Fowler and Lewis specifically as a reaction AGAINST the ESB-centric SOA model — it describes what microservices does differently, not a shared or borrowed SOA principle.'
    }
  ];
}
