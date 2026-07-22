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
  templateUrl: './sre-books-own-definition-sharpens-blameless.html',
  styleUrl: './sre-books-own-definition-sharpens-blameless.scss'
})
export class SreBooksOwnDefinitionSharpensBlamelessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "what allowed this to happen" framing is correct but skips the mechanism that makes it work',
      points: [
        'The main page\'s own theory states blameless post-mortems ask "what in the system allowed this to happen?" — not "who made the mistake?" Its wrong/right mistake example contrasts a blame-focused agenda ("Who deployed the broken change?") against a blameless one ("What systemic gaps allowed this?"). This is directionally correct but stays at the level of WHAT question to ask, not WHY that reframing actually produces better outcomes.',
        'Google\'s own SRE book states the mechanism precisely: "A postmortem must focus on identifying the contributing causes of the incident without indicting any individual or team for bad or inappropriate behavior." The key phrase is "contributing causes," plural — a blameless postmortem does not stop at the first human action in the causal chain; it keeps asking why THAT action seemed reasonable at the time.',
        'The SRE book\'s own explanation of why this works goes further than "focus on the system": "When postmortems shift from allocating blame to investigating the systematic reasons why an individual or team had incomplete or incorrect information, effective prevention plans can be put in place." The fix target is not "the person\'s judgment" — it is specifically WHY they had incomplete or incorrect information in the first place.',
      ]
    },
    {
      heading: 'What this precision changes about writing action items',
      points: [
        'The main page\'s own Blameless Post-Mortem Template has an "Action Items (NO blame — fix the system)" section listing three items: an alert, a checklist addition, and a load-test scenario. Per the SRE book\'s own framing, the strongest test for whether an action item is genuinely blameless is not just "does it avoid naming a person" — it is "does it address WHY the responsible person had incomplete or incorrect information," specifically.',
        'Applied to the main page\'s own example incident (a connection pool exhausted by an unexpected marketing-driven traffic spike): "add a connection pool saturation alert" fixes a DETECTION gap (nobody had timely information the pool was filling up); "add pool size to the capacity review checklist" fixes a PLANNING gap (pool size was set once and never revisited against changing traffic); "load test with 5× spikes" fixes a TESTING gap (nobody had information showing 5× traffic would exhaust the pool before it happened in production).',
        'Read this way, the main page\'s own three action items already implicitly follow the SRE book\'s own "incomplete or incorrect information" framing — this subtopic makes that connection explicit, giving a concrete test for evaluating any FUTURE action item: does it fix a gap in what someone knew, or does it just describe what someone should have "been more careful" about (a rephrased blame statement, not a systemic fix)?',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A weak "blameless" action item -- passes the "no names" test but fails the SRE book\'s own bar',
      language: 'bash',
      code: `## Action Items (from a real-looking but weak "blameless" post-mortem)

| Action                                          | Owner    | Due        |
|--------------------------------------------------|----------|------------|
| On-call engineer should double-check pool config
  before marketing campaigns                       | On-call  | 2024-02-10 |

# This item names no individual -- it passes a surface-level
# "no blame" check. But per the SRE book's own definition, the real
# question is whether it addresses "the systematic reasons why an
# individual or team had incomplete or incorrect information."
#
# "should double-check" does not fix any information gap at all --
# it just relocates the same judgment call onto a future on-call
# engineer, who will have EXACTLY the same incomplete information
# (no alert, no checklist entry, no load test data) the original
# engineer had. This is a blame statement in systemic-sounding
# language, not a systemic fix.`,
    },
    {
      label: 'The main page\'s own action items, read through the SRE book\'s own lens',
      language: 'bash',
      code: `## The main page's own Action Items -- each one closes a SPECIFIC
## information gap, per the SRE book's own framing:

| Action                                    | Information gap it closes         |
|--------------------------------------------|-----------------------------------|
| Add connection pool saturation alert        | DETECTION: nobody had timely
                                                data the pool was filling up |
| Add pool size to capacity review checklist  | PLANNING: pool size was set once,
                                                never revisited against
                                                current traffic data       |
| Load test with 5x traffic spikes            | TESTING: nobody had data
                                                showing 5x traffic would
                                                exhaust the pool           |

# None of these say "be more careful" -- each one gives someone in
# the FUTURE a piece of information the person in THIS incident
# did not have: a real-time alert, a checklist prompt, or load-test
# results. Per the SRE book's own words, this is exactly what
# "effective prevention plans" look like once a postmortem
# "shift[s] from allocating blame to investigating the systematic
# reasons why an individual or team had incomplete or incorrect
# information."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a post-mortem action item: "Engineers should be more thorough when reviewing capacity before high-traffic events." No individual is named, and the team is confident this counts as "blameless" since it does not point fingers. Using this subtopic\'s theory, apply the SRE book\'s own definition to evaluate whether this action item actually qualifies as a systemic fix, and rewrite it to genuinely close an information gap, using the main page\'s own connection-pool incident as the scenario.',
    hint: 'Per this subtopic\'s theory, what is the SRE book\'s own specific test for a genuine systemic fix — does it address WHY someone had incomplete or incorrect information, or does it just ask a future person to somehow do better with the SAME information the original person had?',
    solution: 'This action item fails the SRE book\'s own test despite naming no individual. Per this subtopic\'s theory, a genuine systemic fix addresses "the systematic reasons why an individual or team had incomplete or incorrect information" — "should be more thorough" does not change what information anyone has access to; it just asks a future engineer to somehow perform better using the exact same incomplete picture (no real-time pool-saturation alert, no checklist prompt, no load-test data showing where the pool actually breaks) that the original engineer had. It is a blame statement wearing systemic-sounding language, exactly like this subtopic\'s first code example. A genuine rewrite, matching the main page\'s own actual action items, would instead close a specific information gap — for example: "Add a connection pool saturation alert that fires at 80% utilization" (closes the DETECTION gap: the next engineer gets real-time data instead of having to notice a problem by intuition) or "Add current pool size vs. peak-traffic-multiple to the quarterly capacity review checklist" (closes the PLANNING gap: pool sizing decisions get revisited against current data instead of being set once and forgotten). Either rewrite gives someone in the future information the original engineer did not have — the concrete distinction this subtopic\'s theory identifies between a real systemic fix and a relabeled blame statement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A post-mortem action item is "blameless" as long as it does not name a specific individual or use accusatory language — the test is purely about surface phrasing.',
      reality: 'This subtopic\'s theory and first code example show a name-free action item can still fail the SRE book\'s own actual test: whether it addresses "the systematic reasons why an individual or team had incomplete or incorrect information." "Should be more careful" relocates the same judgment call onto a future person with the same information gap — it is not a systemic fix just because it avoids naming names.'
    },
    {
      thought: 'The main page\'s own "what in the system allowed this to happen" framing is a complete, self-sufficient definition of what makes a post-mortem blameless.',
      reality: 'This subtopic\'s theory shows the SRE book\'s own definition goes one level deeper: not just asking what the system allowed, but specifically investigating why the person involved had incomplete or incorrect information at the time — a more precise, actionable test than the general "focus on the system" framing alone.'
    },
    {
      thought: 'Blameless post-mortems avoid identifying what a specific person did during an incident — the timeline should stay vague about individual actions to avoid any appearance of blame.',
      reality: 'This subtopic\'s theory and code examples show the opposite: specific actions and decisions (which alert was missing, which checklist item was skipped, what data was never collected) are exactly what a blameless post-mortem needs to identify — the SRE book\'s own definition is about not indicting the PERSON for those actions, not about avoiding the actions themselves. A vague timeline actually makes it harder to find the specific information gap worth fixing.'
    }
  ];
}
