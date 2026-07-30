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
  templateUrl: './optimistic-ui-updates-made-concrete.html',
  styleUrl: './optimistic-ui-updates-made-concrete.scss'
})
export class OptimisticUiUpdatesMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA describes the pattern but never shows the mechanics',
      points: [
        'The "How do you handle eventual consistency in the UI?" QnA says: "Optimistic updates: show the user the expected result immediately after a command, assume it will succeed. If it fails, show an error and roll back." Accurate, but no code on the page shows what "immediately" or "roll back" actually mean in practice.',
        'The core mechanic: the UI updates its LOCAL state to the expected post-command result the moment the command is SENT — not when the read model eventually catches up — using an ID (real or temporary) to track that specific optimistic change so it can be reconciled or reverted later.',
        'This is genuinely different from just "showing a loading spinner until the read model updates" — the whole point of optimistic UI is that the user sees the RESULT immediately, with the actual command/projection cycle happening invisibly in the background, only surfacing if something goes wrong.',
      ]
    },
    {
      heading: 'What reconciliation and rollback actually look like',
      points: [
        'When the command eventually succeeds (confirmed either by a command-acknowledgement response or by the read model catching up), the optimistic local entry is simply left in place — or, more robustly, replaced with the REAL data from the read model once it arrives, in case the actual result differed slightly from the optimistic guess.',
        'When the command fails, the optimistic entry has to be explicitly removed or reverted, and the user needs to be told what happened — silently leaving a failed optimistic update on screen is worse than a loading spinner, since it shows the user something that never actually happened.',
        'A subtle correctness requirement: the optimistic entry needs a stable identifier (a client-generated ID, sent as part of the command) so that when the REAL projection data eventually arrives, the UI can match it to — and replace or reconcile with — the correct optimistic placeholder, rather than just appending a duplicate.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Optimistic add, reconcile, or rollback',
      language: 'typescript',
      code: `interface OptimisticOrderLine {
  clientId: string;      // client-generated, stable across the optimistic lifecycle
  productId: string;
  qty: number;
  status: 'pending' | 'confirmed' | 'failed';
}

class OrderLinesViewModel {
  private lines: OptimisticOrderLine[] = [];

  // 1. Command sent -- show the expected result IMMEDIATELY, marked pending
  addLineOptimistically(productId: string, qty: number): string {
    const clientId = crypto.randomUUID();
    this.lines.push({ clientId, productId, qty, status: 'pending' });
    this.render();

    this.sendAddLineCommand(clientId, productId, qty)
      .then(() => this.onCommandAccepted(clientId))
      .catch(() => this.onCommandFailed(clientId));

    return clientId;
  }

  // 2a. Command SUCCEEDED -- mark confirmed; the real read model will
  // eventually replace this entry with authoritative projection data
  private onCommandAccepted(clientId: string): void {
    const line = this.lines.find(l => l.clientId === clientId);
    if (line) line.status = 'confirmed';
    this.render();
  }

  // 2b. Command FAILED -- roll back, tell the user what happened
  private onCommandFailed(clientId: string): void {
    this.lines = this.lines.filter(l => l.clientId !== clientId);
    this.render();
    this.notifyUser('Could not add item -- please try again.');
  }

  // 3. When the READ MODEL eventually catches up (poll or push), reconcile:
  // replace the optimistic placeholder with authoritative projection data,
  // matched by the SAME clientId sent with the original command
  reconcileWithReadModel(authoritative: { clientId: string; productId: string; qty: number }[]) {
    for (const real of authoritative) {
      const idx = this.lines.findIndex(l => l.clientId === real.clientId);
      if (idx >= 0) this.lines[idx] = { ...real, status: 'confirmed' };
    }
  }

  private render() { /* re-render UI from this.lines */ }
  private notifyUser(msg: string) { /* show toast/banner */ }
  private async sendAddLineCommand(clientId: string, productId: string, qty: number) {
    /* POST /orders/:id/lines with clientId included in the payload */
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements "optimistic updates" by adding the new line to the UI immediately after sending the command, but uses no client-generated ID at all -- just pushing the new item onto a local array. When the read model eventually catches up and returns the authoritative order lines (including the one just added), what problem does the UI hit?',
    hint: 'Without a stable identifier shared between the optimistic entry and the real one, how does the UI know which authoritative line corresponds to which optimistic placeholder?',
    solution: 'Without a shared identifier, the UI has no way to match the incoming authoritative line to the specific optimistic placeholder it\'s supposed to replace -- the most likely outcome is a duplicate: the optimistic entry stays in the local array, AND the authoritative entry from the read model gets added alongside it, showing the same line item twice until a full re-fetch happens to overwrite local state. This is exactly why the reconciliation code needs a client-generated ID sent as part of the original command and carried through to the read model\'s response (or matched via some other stable key) -- without it, optimistic UI updates and eventual read-model consistency have no reliable way to be reconciled.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Optimistic UI update" mainly means showing a loading indicator while waiting for the command to complete.',
      reality: 'Per this subtopic\'s theory, it means the opposite in spirit — showing the FINAL expected result immediately, with the actual command/projection cycle happening invisibly, only surfacing to the user if something goes wrong.'
    },
    {
      thought: 'Rolling back a failed optimistic update just means letting the next full data refresh eventually overwrite the incorrect local state.',
      reality: 'Per this subtopic\'s theory, a failed command needs an explicit, immediate rollback and user notification — silently leaving an optimistic entry on screen until some future refresh shows the user something that never actually happened, for an unbounded amount of time.'
    },
    {
      thought: 'Reconciling an optimistic update with the eventual authoritative read-model data is straightforward as long as both represent "the same logical change."',
      reality: 'Per this subtopic\'s theory, reconciliation specifically requires a STABLE, SHARED IDENTIFIER between the optimistic placeholder and the authoritative data — without one, the UI has no reliable way to match them and risks showing duplicates.'
    }
  ];
}
