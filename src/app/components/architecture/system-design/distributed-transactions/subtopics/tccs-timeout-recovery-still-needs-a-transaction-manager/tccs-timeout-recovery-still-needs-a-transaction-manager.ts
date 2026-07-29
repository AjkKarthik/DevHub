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
  templateUrl: './tccs-timeout-recovery-still-needs-a-transaction-manager.html',
  styleUrl: './tccs-timeout-recovery-still-needs-a-transaction-manager.scss'
})
export class TccsTimeoutRecoveryStillNeedsATransactionManagerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A QnA claim worth reading more carefully: "does not block" vs. "does not block the same way"',
      points: [
        'The main page\'s QnA comparing TCC to Saga states: "Unlike 2PC, TCC does not block if a coordinator fails because each participant can handle Cancel autonomously after a timeout." Checking this against how a real, widely-used TCC framework (Apache Seata) actually implements timeout recovery shows the claim is directionally true but glosses over a still-central coordinating role — worth adding back in.',
        'This is not a case of the main page being flatly wrong — TCC genuinely does NOT have 2PC\'s exact failure mode (participants blocking indefinitely on a permanently-crashed coordinator with no recovery path). But "each participant can handle Cancel autonomously" understates how much a coordinating component still matters in practice.',
      ]
    },
    {
      heading: 'What actually drives TCC\'s timeout-based recovery',
      points: [
        'In Seata\'s TCC mode, a central Transaction Manager (TM) still coordinates the overall transaction — when a participant\'s Try phase call times out (e.g. due to network congestion), it is the TRANSACTION MANAGER that decides to trigger a rollback and calls Cancel on the already-attempted participants, not each participant independently deciding on its own that it should self-cancel.',
        'So the real contrast with 2PC is narrower than "no coordinator involvement at all": TCC\'s coordinator (the TM) does not need to hold a LOCK-LIKE blocking state the way a 2PC coordinator does between Prepare and Commit — but a coordinating component is still very much part of how the timeout-triggered recovery actually happens.',
      ]
    },
    {
      heading: 'A real, documented edge case that shows TCC is not immune to all stuck states',
      points: [
        'Seata\'s own documentation describes a genuine problem case: if a participant\'s Try request is delayed by network congestion and arrives LATE — after the transaction manager has already given up and triggered Cancel for that participant — the late-arriving Try executes AFTER the Cancel already ran. That participant now has reserved a resource that no subsequent Confirm or Cancel will ever address, leaving it in a "suspended" state requiring separate handling (an "empty rollback"/"suspension" prevention mechanism, not automatic self-resolution).',
        'This is worth knowing specifically because it shows TCC has its OWN class of edge-case stuck states — different from 2PC\'s blocking problem, but not literally "resolved automatically by autonomous participants" either. Real TCC frameworks build explicit mechanisms (like Seata\'s transaction-control table tracking Try execution) specifically to detect and handle this case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually happens on a TCC Try timeout',
      language: 'typescript',
      code: `interface TccTimeoutStep {
  step: string;
  whoDecides: string;
}

const timeline: TccTimeoutStep[] = [
  {
    step: "Participant's Try call times out (network congestion)",
    whoDecides: 'The Transaction Manager detects the timeout -- ' +
      'not the participant deciding on its own that it timed out.',
  },
  {
    step: 'Rollback is triggered',
    whoDecides: 'The Transaction Manager calls Cancel on the ' +
      'participants that already completed Try -- a central ' +
      'coordinating decision, not each participant self-canceling.',
  },
  {
    step: 'Edge case: the "late Try" problem',
    whoDecides: 'If the ORIGINAL Try request was merely delayed ' +
      '(not actually failed) and arrives AFTER Cancel already ran, ' +
      'that participant is left "suspended" -- requires an explicit ' +
      'detection mechanism (e.g. Seata\'s transaction-control table), ' +
      'not automatic self-resolution by the participant.',
  },
];

// "Each participant handles Cancel autonomously" undersells the
// Transaction Manager's continued role, and skips this documented
// edge case where nothing resolves automatically at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "TCC completely eliminates the coordinator-failure risk that makes 2PC dangerous, since each participant independently handles its own Cancel after a timeout — there is no central component whose failure could stall the transaction." Is this a fully accurate characterization?',
    hint: 'In a real TCC implementation like Seata, who actually detects a Try timeout and decides to trigger Cancel — the participant itself, or a separate coordinating component?',
    solution: 'Not fully accurate. TCC does avoid 2PC\'s SPECIFIC failure mode (participants holding locks indefinitely while blocked waiting on a crashed coordinator\'s decision) — that part of the contrast is correct. But real TCC implementations like Seata still rely on a central Transaction Manager to detect a Try timeout and decide to trigger Cancel on the already-completed participants; it is not each participant unilaterally deciding on its own to self-cancel with zero coordination. TCC also has its own documented edge case — a Try request that is merely delayed (not actually failed) can arrive AFTER the Transaction Manager has already triggered Cancel, leaving that participant "suspended" in a state that needs an explicit detection mechanism to resolve, not automatic self-recovery. So TCC trades away 2PC\'s specific blocking problem, but it does not eliminate the need for coordination, nor does it make every failure scenario self-resolving.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'In TCC, each participant independently decides to Cancel after its own timeout, with no coordinating component involved at all.',
      reality: 'Per this subtopic\'s theory, real TCC implementations like Seata still use a central Transaction Manager to detect timeouts and trigger Cancel across participants — the coordination role does not disappear, even though TCC avoids 2PC\'s specific lock-holding blocking behavior.'
    },
    {
      thought: 'Since TCC avoids 2PC\'s blocking problem, it has no equivalent class of stuck or unresolved states at all.',
      reality: 'Per this subtopic\'s theory, TCC has its own documented edge case — a delayed Try request arriving after Cancel already ran leaves a participant "suspended," requiring an explicit detection mechanism, not automatic resolution.'
    },
    {
      thought: 'TCC and Saga are essentially the same coordination model, just with different names for the phases.',
      reality: 'Per this subtopic\'s theory (and the main page\'s own QnA on TCC), TCC genuinely differs from Saga by providing isolation (resources are held/reserved during Try, unlike Saga\'s independently-committing local transactions) — the two patterns make different tradeoffs, not just different terminology for the same mechanism.'
    }
  ];
}
