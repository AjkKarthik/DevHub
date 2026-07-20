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
  templateUrl: './stash-is-scoped-to-the-current-build-only.html',
  styleUrl: './stash-is-scoped-to-the-current-build-only.scss'
})
export class StashIsScopedToTheCurrentBuildOnlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes stash and unstash but never says what happens to a stash once the build ends',
      points: [
        'The main page\'s own QnA on passing data between stages says: "For file artifacts between stages that use different agents, use stash and unstash... stash serializes files to the Jenkins controller; unstash restores them on any agent — the standard mechanism when different stages run on different agents." That is accurate as far as WHERE the files go, but it never says how long they stay there.',
        'Jenkins\'s own documentation states this directly: "The stash step allows capturing files matching an inclusion pattern... for reuse within the same Pipeline. Once the Pipeline has completed its execution, stashed files are deleted from the Jenkins controller." A stash is scoped to exactly one build, start to finish — it is not a general-purpose file store, and nothing about it persists once that specific pipeline run ends.',
      ]
    },
    {
      heading: 'Why this matters: stash is the wrong tool the moment you need a file in a LATER build, not just a later stage',
      points: [
        'Because a stash is deleted the moment its own pipeline run completes, it cannot be used to hand a file from one build to a completely separate, later build — for example, "reuse yesterday\'s compiled binary if nothing changed today" is not something stash can do, no matter how the includes pattern is written.',
        'The main page\'s own theory and QnA never mention `archiveArtifacts` in the same breath as `stash`/`unstash`, even though they solve genuinely different problems: `stash`/`unstash` moves a file between STAGES of the SAME run (and is automatically cleaned up); `archiveArtifacts` publishes a file to the build\'s own permanent record, visible and downloadable from that build\'s Jenkins UI page long after the run finishes, exactly the tool needed for cross-build reuse or for keeping a deployable artifact around for audit purposes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'stash/unstash works within a run, but leaves nothing behind for the next one',
      language: 'bash',
      code: `# pipeline {
#   agent none
#   stages {
#     stage('Build') {
#       agent { docker 'node:20' }
#       steps {
#         sh 'npm run build'
#         stash name: 'dist', includes: 'dist/**'
#         # This works perfectly WITHIN this run -- Deploy below,
#         # running on a DIFFERENT agent, can unstash it.
#       }
#     }
#     stage('Deploy') {
#       agent { label 'k8s' }
#       steps {
#         unstash 'dist'
#         sh './deploy.sh dist/'
#       }
#     }
#   }
#   post {
#     always {
#       # Per Jenkins's own docs: "Once the Pipeline has completed
#       # its execution, stashed files are deleted from the Jenkins
#       # controller." The 'dist' stash from this run is now GONE --
#       # tomorrow's build cannot unstash it, even if today's build
#       # is the most recent successful one and tomorrow's Build
#       # stage happens to be skipped for some reason.
#       echo 'stash dist no longer exists after this point'
#     }
#   }
# }`,
    },
    {
      label: 'archiveArtifacts is the actual tool for cross-build reuse',
      language: 'bash',
      code: `# stage('Build') {
#   steps {
#     sh 'npm run build'
#     # archiveArtifacts publishes to THIS BUILD's own permanent
#     # record in the Jenkins UI -- unlike stash, it survives long
#     # after the pipeline run itself has finished.
#     archiveArtifacts artifacts: 'dist/**', fingerprint: true
#   }
# }

# A LATER, SEPARATE build (days later) can pull that exact artifact
# back down using the Copy Artifact plugin, referencing the specific
# build number or "lastSuccessfulBuild" -- something stash, scoped
# to a single run, was never designed to support at all:

# stage('Reuse Yesterday\'s Build If Unchanged') {
#   steps {
#     copyArtifacts projectName: 'myapp-build',
#                    selector: lastSuccessful(),
#                    filter: 'dist/**'
#   }
# }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Jenkinsfile stashes a compiled binary in a Build stage, expecting to reuse it in tomorrow\'s Deploy-only pipeline run if nothing changed. The next day\'s run fails with "No such saved stash \'binary\'". Using this subtopic\'s theory, explain the actual cause, and name the shared component the main page\'s own QnA already uses that should have made this design suspicious from the start.',
    hint: 'Per this subtopic\'s theory, when exactly does a stash get deleted — at the end of a STAGE, or at the end of the whole pipeline RUN?',
    solution: 'The stash was never available to the next day\'s run because a stash is deleted the moment its OWN pipeline run finishes — per Jenkins\'s own documentation, "Once the Pipeline has completed its execution, stashed files are deleted from the Jenkins controller." Yesterday\'s Build-stage stash was gone the instant yesterday\'s pipeline completed, long before today\'s separate run even started, so there was never a "binary" stash for today\'s run to find. This should have been suspicious given the main page\'s own QnA already frames stash/unstash specifically as "the standard mechanism when different stages run on different agents" — WITHIN one run — never once describing it as a way to carry a file across separate runs. The correct tool is `archiveArtifacts` in yesterday\'s Build stage, paired with the Copy Artifact plugin (or an equivalent) in today\'s run to pull that specific archived build\'s artifact back down.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since stash and unstash move files between agents, they must work like a general-purpose shared file store that any future build can also read from.',
      reality: 'Per this subtopic\'s theory, Jenkins\'s own docs are explicit that stashed files exist "for reuse within the same Pipeline" and are deleted "once the Pipeline has completed its execution" — stash is scoped to exactly one run, never a general store other builds can reach into.'
    },
    {
      thought: 'archiveArtifacts and stash/unstash are two different-sounding names for roughly the same "move a file somewhere" mechanism, so either one works for passing a file between stages.',
      reality: 'This subtopic\'s theory draws the actual distinction: stash/unstash is for moving a file between STAGES of the SAME run and is auto-deleted afterward; archiveArtifacts publishes a file to that specific build\'s own permanent, browsable record — the tool actually built for keeping something around past the end of the run.'
    },
    {
      thought: 'If a stash worked correctly earlier in a pipeline run, it will keep working the same way for any later run of that same pipeline job.',
      reality: 'This subtopic\'s exercise shows the opposite — a stash\'s lifetime is tied to one specific run, not the pipeline job as a whole. A stash created in yesterday\'s run is completely gone by the time today\'s separate run starts, regardless of how reliably stash/unstash behaved within yesterday\'s own run.'
    }
  ];
}
