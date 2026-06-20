import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-azure-pipelines',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './azure-pipelines.html',
  styleUrl: './azure-pipelines.scss'
})
export class DevopsAzurePipelines {
  quickRef: QuickRefItem[] = [];
  theory: TheoryPoint[] = [];
  codeTabs: CodeTab[] = [];
  mistakes: CommonMistake[] = [];
  challenge: Challenge = { title: '', language: 'typescript', description: '', hints: [], starterCode: '', solution: '' };
  quiz: QuizQuestion[] = [];
  qna: QnaItem[] = [];
  revision: RevisionSummary = { oneLiner: '', mustKnow: [], interviewFocus: [] };
}
