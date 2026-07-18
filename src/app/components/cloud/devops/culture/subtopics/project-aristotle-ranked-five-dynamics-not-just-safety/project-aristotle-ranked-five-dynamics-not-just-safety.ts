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
  templateUrl: './project-aristotle-ranked-five-dynamics-not-just-safety.html',
  styleUrl: './project-aristotle-ranked-five-dynamics-not-just-safety.scss'
})
export class ProjectAristotleRankedFiveDynamicsNotJustSafetySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page cites Project Aristotle for one finding only — Google\'s own page ranks it as one of five',
      points: [
        'The main page\'s own theory states: "Google\'s Project Aristotle found psychological safety to be the number one predictor of high-performing teams." This is accurate as far as it goes, but it is the ENTIRETY of the main page\'s own treatment of the research — no other finding from the same study is mentioned anywhere on the page.',
        'Google\'s own re:Work page on the research states the finding differently — not as a single standalone predictor, but as the first of five ranked dynamics, presented explicitly "in order of importance": Psychological Safety, Dependability, Structure and Clarity, Meaning, and Impact.',
        'Psychological safety being ranked FIRST is exactly what the main page says — that part is correct — but presenting it as the only finding worth mentioning skips four other dynamics Google\'s own research found meaningfully predictive, in a specific, documented order of importance.',
      ]
    },
    {
      heading: 'What the other four dynamics actually measure, per Google\'s own definitions',
      points: [
        'Dependability (ranked #2): per Google\'s own definition, "on dependable teams, members reliably complete quality work on time" — distinct from psychological safety, which is about interpersonal risk-taking, not delivery reliability.',
        'Structure and Clarity (#3): "an individual\'s understanding of job expectations, the process for fulfilling these expectations, and the consequences of one\'s performance" — a team can feel completely safe to speak up (#1) while still being unclear on what is actually expected of them.',
        'Meaning (#4) and Impact (#5): Meaning is "finding a sense of purpose in either the work itself or the output"; Impact is "the subjective judgment that your work is making a difference." Both are about the INDIVIDUAL\'s relationship to the work, distinct from the team-dynamics focus of the first three.',
        'The ranked order itself is a finding worth knowing, not just the five names: a team optimising heavily for #4 or #5 (helping everyone feel their work matters) while neglecting #1 (psychological safety) is, per Google\'s own research ranking, investing in the less foundational dynamics first — the main page\'s own "psychological safety is the foundation" framing is directionally consistent with this ranking, even though it never states the ranking explicitly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A team health check using only the main page\'s own coverage',
      language: 'bash',
      code: `# Team Health Check -- using only what the main page's own theory
# and QnA mention: psychological safety, via Amy Edmondson's
# seven-question survey.

## Psychological Safety (the ONE dynamic the main page names)
- "If you make a mistake on this team, it is often held against you."
  (reverse-scored)
- "Members of this team are able to bring up problems and tough issues."
- "People on this team sometimes reject others for being different."
  (reverse-scored)

# Result: a survey that measures ONE of Google's own five ranked
# dynamics -- useful, but per Project Aristotle's own findings,
# incomplete as a full picture of what predicts team effectiveness.`,
    },
    {
      label: 'The fuller check -- all five dynamics, in Google\'s own ranked order',
      language: 'bash',
      code: `# Team Health Check -- all five dynamics Project Aristotle ranked,
# per Google's own re:Work page, "in order of importance":

## 1. Psychological Safety
- "If you make a mistake on this team, it is often held against you."

## 2. Dependability
- "When teammates say they'll do something, they follow through."
- Per Google's own definition: "members reliably complete quality
  work on time."

## 3. Structure and Clarity
- "I understand what is expected of me on this team, and how my
  performance is evaluated."
- Per Google's own definition: understanding "job expectations,
  the process for fulfilling these expectations, and the
  consequences of one's performance."

## 4. Meaning
- "The work I do on this team feels personally meaningful to me."
- Per Google's own definition: "finding a sense of purpose in
  either the work itself or the output."

## 5. Impact
- "I understand how my team's work contributes to the organization's
  goals."
- Per Google's own definition: "the subjective judgment that your
  work is making a difference."

# A LOW score on #1 undermines everything below it -- per this
# subtopic's theory, the RANKING itself (not just the five names)
# is part of what Google's own research found.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team scores extremely well on the main page\'s own psychological-safety survey questions — members openly disagree, admit mistakes, and ask questions without fear. Yet the team consistently misses deadlines, and a retro reveals members genuinely did not know who was responsible for what, or how their work was being evaluated. Using this subtopic\'s theory, identify which of Google\'s other four ranked dynamics this team is most clearly missing, and explain why strong psychological safety alone did not prevent this specific problem.',
    hint: 'Per this subtopic\'s theory, which of the four dynamics beyond psychological safety is specifically about "an individual\'s understanding of job expectations, the process for fulfilling these expectations, and the consequences of one\'s performance"? Is that the same thing psychological safety measures?',
    solution: 'This team is missing Structure and Clarity — dynamic #3 in Google\'s own ranked list, per this subtopic\'s theory defined as "an individual\'s understanding of job expectations, the process for fulfilling these expectations, and the consequences of one\'s performance." The team\'s retro symptom (members not knowing who was responsible for what, or how they were being evaluated) is precisely what this dynamic measures — and it is a genuinely SEPARATE dimension from psychological safety, which is about interpersonal risk-taking (feeling safe to speak up, admit mistakes, disagree), not about whether responsibilities and expectations are clearly defined in the first place. A team can score extremely well on psychological safety — as this team does — while still being weak on Structure and Clarity, because the two dynamics measure different things entirely; strong safety does not automatically produce clarity about roles and expectations. This is exactly why this subtopic\'s theory frames all five dynamics as worth tracking together rather than treating psychological safety as the single complete predictor the main page\'s own coverage implies.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Project Aristotle\'s finding was specifically and only about psychological safety — it is the single, standalone answer the research produced to "what makes teams effective."',
      reality: 'This subtopic\'s theory shows Google\'s own re:Work page presents the finding as five ranked dynamics, not one: "In order of importance" — Psychological Safety, Dependability, Structure and Clarity, Meaning, and Impact. Psychological safety ranking first is accurate, but it was one of five documented findings, not the sole one.'
    },
    {
      thought: 'If a team has strong psychological safety, the other factors that predict team effectiveness (reliability, clarity of roles, sense of purpose) will naturally follow, since safety is "the foundation."',
      reality: 'This subtopic\'s exercise shows a team can score very well on psychological safety while still being clearly deficient in a separate dynamic (Structure and Clarity) that Google\'s own research measures independently — the five dynamics are related but distinct, and strength in one does not guarantee strength in another.'
    },
    {
      thought: 'The four dynamics beyond psychological safety (Dependability, Structure and Clarity, Meaning, Impact) are minor or secondary findings not worth tracking in a real team health check, since psychological safety is "the number one predictor."',
      reality: 'This subtopic\'s second code example shows all five are part of the same documented, ranked research finding — being ranked first does not mean the other four are unimportant, only that they build on top of psychological safety rather than substituting for it. A complete team health check, per Google\'s own framework, tracks all five.'
    }
  ];
}
