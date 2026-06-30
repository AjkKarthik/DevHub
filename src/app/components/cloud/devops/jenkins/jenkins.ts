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
  selector: 'app-devops-jenkins',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './jenkins.html',
  styleUrl: './jenkins.scss'
})
export class DevopsJenkins {

  quickRef: QuickRefItem[] = [
    { name: 'Jenkinsfile',        type: 'keyword', desc: 'Groovy DSL file checked into the repo defining the pipeline — declarative or scripted syntax' },
    { name: 'Declarative',        type: 'keyword', desc: 'Structured pipeline syntax with pipeline{} block — easier to read, validated by Jenkins' },
    { name: 'Scripted',           type: 'keyword', desc: 'Full Groovy code in node{} block — maximum flexibility, no schema validation' },
    { name: 'Stage',              type: 'keyword', desc: 'Named phase (Build, Test, Deploy) — shown as columns in Blue Ocean UI' },
    { name: 'Agent',              type: 'keyword', desc: 'Where the pipeline/stage runs: any, label, docker, none (declare at stage level)' },
    { name: 'Credentials',        type: 'keyword', desc: 'Secrets stored in Jenkins Credentials Store — bound via withCredentials() or environment{}' },
    { name: 'Shared Library',     type: 'keyword', desc: 'Groovy code in a Git repo — imported with @Library — reusable pipeline functions' },
    { name: 'Blue Ocean',         type: 'keyword', desc: 'Modern Jenkins UI plugin with visual pipeline view — installed separately' },
    { name: 'Multibranch',        type: 'keyword', desc: 'Pipeline job that auto-discovers branches and PRs, creating a pipeline per branch' },
    { name: 'withCredentials',    type: 'keyword', desc: 'Groovy block that injects a credential as an env var for the scope of its block' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Jenkins Architecture',
      points: [
        'Jenkins is an open-source automation server — the most widely deployed CI/CD tool, self-hosted on your own infrastructure.',
        'Architecture: Controller node manages the web UI, plugin system, build queue, and job configuration. Agent nodes (static or dynamic) execute the builds.',
        'Pipelines are defined in a Jenkinsfile — a Groovy DSL file checked into the source repo, similar to GitLab CI YAML or GitHub Actions YAML.',
        'Plugin ecosystem: 1800+ plugins. Core Jenkins is intentionally minimal — every capability (Git, Docker, Slack, SonarQube) is a plugin.',
        'Scaling: add more agents by configuring Node labels. Docker agents spin containers per build — no state pollution between builds.',
      ]
    },
    {
      heading: 'Declarative vs Scripted Pipelines',
      points: [
        'Declarative (preferred): structured Groovy DSL inside `pipeline {}` block. Schema-validated by Jenkins — catches errors before runtime. Clear sections: agent, stages, post.',
        'Scripted: arbitrary Groovy code inside `node {}` block. No schema — maximum flexibility but easy to create unmaintainable pipelines.',
        'Mix both: in declarative, use `script {}` blocks to run arbitrary Groovy where declarative syntax is too restrictive.',
        'Declarative additions over scripted: `post {}` block for cleanup/notifications; `options {}` for timeout, retry; `environment {}` for env vars; `parameters {}` for build inputs.',
        'Recommendation: start with declarative. Only reach for scripted when you need complex conditional logic that the declarative DSL cannot express.',
      ]
    },
    {
      heading: 'Agents & Node Labels',
      points: [
        '`agent any`: Jenkins picks the first available agent. Fine for small setups.',
        '`agent { label "linux" }`: runs only on agents with that label. Use labels to target OS, tool availability (docker, node18, gpu).',
        '`agent { docker "node:20" }`: spins a Docker container on the agent for isolation. Requires Docker Engine installed on the agent.',
        '`agent none` at pipeline level + per-stage agents: each stage runs on a different agent — enables language/tool isolation across stages.',
        'Ephemeral agents: use Kubernetes Plugin or Docker Cloud to spin a fresh container per build, destroying it on completion — eliminates state pollution.',
      ]
    },
    {
      heading: 'Credentials & Secrets',
      points: [
        'Never hardcode credentials in Jenkinsfiles. Store in Jenkins Credentials Store (Manage Jenkins → Credentials).',
        'Credential types: Secret text, Username/Password, SSH key, Secret file, AWS credentials (via plugin).',
        '`withCredentials([string(credentialsId: \'MY_TOKEN\', variable: \'TOKEN\')])`: injects the secret into `TOKEN` env var for the block scope — masked in logs.',
        '`environment { TOKEN = credentials(\'MY_TOKEN\') }` in declarative: makes the secret available to all steps in the stage/pipeline.',
        'Credentials are masked in Jenkins logs — any `echo $TOKEN` outputs `****`. Never print secrets to help debugging — rotate any that leak.',
      ]
    },
    {
      heading: 'Shared Libraries',
      points: [
        'Shared Libraries let you extract common Groovy functions/classes into a Git repo, importable by all Jenkinsfiles in your org.',
        'Library structure: `vars/` contains global function files (e.g., `vars/deployToK8s.groovy`), `src/` contains classes, `resources/` contains non-Groovy files.',
        'Import: `@Library("my-shared-library") _` at the top of the Jenkinsfile. The underscore imports everything from `vars/`.',
        'Configure in Jenkins: Manage Jenkins → System → Global Pipeline Libraries — point to the Git repo, set a default branch/version.',
        'Versioning: pin with `@Library("my-shared-library@v1.2.3")` — just like pinning Docker images. Avoid `@Library("...@main")` in prod.',
      ]
    },
    {
      heading: 'Multibranch Pipelines',
      points: [
        'Multibranch Pipeline job: Jenkins scans your repo and auto-creates a pipeline run for every branch and every PR that has a Jenkinsfile.',
        'When a branch is created/pushed, Jenkins discovers it and runs its pipeline. When merged/deleted, the pipeline is automatically disabled.',
        'Branch conditions in Jenkinsfile: `when { branch "main" }` runs a stage only on main. `when { changeRequest() }` runs a stage only for PRs.',
        'PR builds: Multibranch + GitHub/Bitbucket Branch Source plugin creates a pipeline for every PR — comments the build result back to the PR.',
        'Essential for scaling: manually creating one job per branch is not maintainable. Multibranch + Jenkinsfile in repo = self-service pipeline per developer branch.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Declarative Jenkinsfile',
      language: 'bash',
      code: `# Jenkinsfile — Declarative pipeline
# pipeline {
#   agent none    // declare agents per stage
#
#   options {
#     timeout(time: 30, unit: 'MINUTES')
#     buildDiscarder(logRotator(numToKeepStr: '10'))
#     disableConcurrentBuilds()
#   }
#
#   environment {
#     DOCKER_REGISTRY = 'ghcr.io/myorg'
#     APP_NAME        = 'myapp'
#   }
#
#   parameters {
#     choice(name: 'DEPLOY_ENV', choices: ['staging','production'], description: 'Target env')
#   }
#
#   stages {
#     stage('Build') {
#       agent { docker 'node:20-alpine' }
#       steps {
#         sh 'npm ci'
#         sh 'npm run lint'
#         sh 'npm run build -- --configuration=production'
#       }
#     }
#
#     stage('Test') {
#       agent { docker 'node:20-alpine' }
#       steps {
#         sh 'npm test -- --coverage --watchAll=false'
#       }
#       post {
#         always {
#           junit 'test-results/**/*.xml'
#           publishHTML target: [reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Coverage']
#         }
#       }
#     }
#
#     stage('Docker Build & Push') {
#       agent { label 'docker' }
#       steps {
#         withCredentials([string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN')]) {
#           sh '''
#             echo $TOKEN | docker login ghcr.io -u $USER --password-stdin
#             docker build -t $DOCKER_REGISTRY/$APP_NAME:$BUILD_NUMBER .
#             docker push $DOCKER_REGISTRY/$APP_NAME:$BUILD_NUMBER
#           '''
#         }
#       }
#     }
#
#     stage('Deploy') {
#       when { branch 'main' }
#       agent { label 'kubernetes' }
#       steps {
#         sh "kubectl set image deployment/$APP_NAME $APP_NAME=$DOCKER_REGISTRY/$APP_NAME:$BUILD_NUMBER"
#       }
#     }
#   }
#
#   post {
#     success { slackSend message: "Build $BUILD_NUMBER succeeded" }
#     failure { slackSend message: "Build $BUILD_NUMBER FAILED — $BUILD_URL" }
#   }
# }`,
    },
    {
      label: 'Shared Library',
      language: 'bash',
      code: `# vars/deployToK8s.groovy — in shared library repo
# def call(String appName, String imageTag, String namespace = 'default') {
#   sh """
#     kubectl set image deployment/\${appName} \${appName}=\${imageTag} \\
#       --namespace=\${namespace}
#     kubectl rollout status deployment/\${appName} \\
#       --namespace=\${namespace} \\
#       --timeout=120s
#   """
# }

# vars/runTests.groovy
# def call(Map config = [:]) {
#   def coverage = config.get('coverage', true)
#   def pattern  = config.get('pattern', '**/*.test.js')
#   sh "npm test -- \${coverage ? '--coverage' : ''}"
# }

# Jenkinsfile using the shared library:
# @Library('my-shared-library@v2.1.0') _
#
# pipeline {
#   agent any
#   stages {
#     stage('Test') {
#       steps {
#         runTests coverage: true, pattern: 'src/**/*.spec.ts'
#       }
#     }
#     stage('Deploy') {
#       when { branch 'main' }
#       steps {
#         deployToK8s 'myapp', "ghcr.io/myorg/myapp:\${BUILD_NUMBER}", 'production'
#       }
#     }
#   }
# }`,
    },
    {
      label: 'Multibranch + when{} Conditions',
      language: 'bash',
      code: `# Jenkinsfile for Multibranch Pipeline — all branches + PRs

# pipeline {
#   agent any
#
#   stages {
#     // Runs on EVERY branch and PR
#     stage('Build & Lint') {
#       steps {
#         sh 'npm ci && npm run lint && npm run build'
#       }
#     }
#
#     stage('Unit Tests') {
#       steps {
#         sh 'npm test -- --watchAll=false'
#       }
#     }
#
#     // Runs only on Pull Requests
#     stage('PR Analysis') {
#       when { changeRequest() }
#       steps {
#         sh 'npx sonarqube-scanner -Dsonar.pullrequest.key=$CHANGE_ID'
#       }
#     }
#
#     // Runs only on main branch
#     stage('Publish Image') {
#       when { branch 'main' }
#       steps {
#         sh 'docker build -t myapp:$BUILD_NUMBER . && docker push ...'
#       }
#     }
#
#     // Runs only on release/* branches
#     stage('Deploy to Production') {
#       when {
#         branch pattern: 'release/.*', comparator: 'REGEXP'
#       }
#       steps {
#         input message: 'Deploy to production?', ok: 'Deploy'
#         sh './deploy-prod.sh'
#       }
#     }
#   }
# }

# Environment variable available in Multibranch:
# BRANCH_NAME   — the branch name (e.g. "main", "feature/auth")
# CHANGE_ID     — PR number (only set for PR builds)
# CHANGE_TARGET — target branch of the PR`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using scripted pipelines where declarative would work',
      wrong: `// Scripted Jenkinsfile — no structure, hard to read
node {
  stage('Build') {
    def version = sh(script: 'cat VERSION', returnStdout: true).trim()
    sh "docker build -t myapp:\${version} ."
  }
  // No schema validation, no built-in post/cleanup, no options block
}`,
      right: `// Declarative Jenkinsfile — validated, readable
pipeline {
  agent { docker 'node:20' }
  options { timeout(time: 20, unit: 'MINUTES') }
  stages {
    stage('Build') {
      steps {
        script { env.VERSION = sh(script: 'cat VERSION', returnStdout: true).trim() }
        sh "docker build -t myapp:\${env.VERSION} ."
      }
    }
  }
}`,
      explanation: 'Scripted pipelines have no schema validation and no standard structure. Declarative pipelines are parsed and validated by Jenkins before running, have built-in `options{}`, `post{}`, and `environment{}` blocks, and are significantly easier to read and maintain.',
    },
    {
      title: 'Hardcoding credentials in Jenkinsfile',
      wrong: `stage('Deploy') {
  steps {
    sh "kubectl --token=abc123secret apply -f k8s/"
    sh "docker login -u myuser -p MyPassword ghcr.io"
    // Credentials visible in Jenkinsfile, logs, and git history
  }
}`,
      right: `stage('Deploy') {
  steps {
    withCredentials([
      string(credentialsId: 'K8S_TOKEN', variable: 'K8S_TOKEN'),
      usernamePassword(credentialsId: 'GHCR_CREDS', usernameVariable: 'USER', passwordVariable: 'PASS')
    ]) {
      sh "kubectl --token=\$K8S_TOKEN apply -f k8s/"
      sh "echo \$PASS | docker login ghcr.io -u \$USER --password-stdin"
    }
  }
}`,
      explanation: 'Credentials in Jenkinsfiles are committed to git and visible in build logs. Use Jenkins Credentials Store and `withCredentials{}` — secrets are injected as env vars, masked in logs (printed as ****), and managed centrally with audit history.',
    },
    {
      title: 'Not using `agent none` at the top level',
      wrong: `pipeline {
  agent any    // Locks ONE agent for the entire pipeline
  stages {
    stage('Build') { steps { sh 'build' } }    // same agent
    stage('Deploy') { steps { sh 'deploy' } }   // same agent — held during
  }                                              // all stage pauses too!
}`,
      right: `pipeline {
  agent none    // No agent reserved at pipeline level
  stages {
    stage('Build')  { agent { docker 'node:20' } steps { sh 'build' } }
    stage('Deploy') { agent { label 'k8s' }     steps { sh 'deploy' } }
  }   // Each stage gets its own agent — released after stage completes
}`,
      explanation: '`agent any` at the pipeline level reserves a single agent for the entire pipeline run, including any `input{}` waits and inter-stage pauses. This blocks other builds from using that agent. Declaring `agent none` at the top and assigning agents per stage releases them between stages.',
    },
    {
      title: 'Not cleaning up Docker images/containers after builds',
      wrong: `stage('Docker Build') {
  steps {
    sh 'docker build -t myapp:latest .'
    sh 'docker run myapp:latest npm test'
    // Image and container left on the agent
    // After 100 builds: disk full, agents unusable
  }
}`,
      right: `stage('Docker Build') {
  steps {
    sh 'docker build -t myapp:\${BUILD_NUMBER} .'
    sh 'docker run --rm myapp:\${BUILD_NUMBER} npm test'
    // OR use Docker agent — container auto-removed when stage ends
  }
  post {
    always { sh 'docker rmi myapp:\${BUILD_NUMBER} || true' }
  }
}`,
      explanation: 'Every build that creates Docker images/containers without cleanup fills the agent disk. Use `--rm` for run, explicit `docker rmi` in `post { always {} }`, and periodic `docker system prune` via a Jenkins maintenance job. Or use Docker/Kubernetes agents where containers are destroyed after each stage.',
    },
    {
      title: 'Using `@Library("...@main")` in production',
      wrong: `@Library('shared-pipeline@main') _
// Shared library version is mutable — any push to main changes behavior
// A bad commit to shared library breaks ALL pipelines simultaneously
// No audit trail of what version ran your production deploy`,
      right: `@Library('shared-pipeline@v2.1.0') _
// Pinned to an immutable version tag
// Test in non-prod pipelines first, then bump the version deliberately
// Git tag in shared-library repo = full audit trail`,
      explanation: 'Shared library branches like `@main` are mutable — a bad commit immediately affects all pipelines using that library. Pin to a git tag (treat shared libraries like dependencies with SemVer). Bump the version deliberately after testing, just as you would a package dependency.',
    },
    {
      title: 'Not setting build discard policy',
      wrong: `pipeline {
  agent any
  // No options block — Jenkins keeps ALL build history forever
  // After 6 months: 3000 builds stored, 50GB of logs and artifacts
  // Jenkins UI becomes slow; disk fills; old builds can never be used again`,
      right: `pipeline {
  agent any
  options {
    buildDiscarder(logRotator(
      numToKeepStr: '30',          // keep last 30 builds
      artifactNumToKeepStr: '5'    // keep artifacts for last 5 only
    ))
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
  }`,
      explanation: 'Without a build discard policy, Jenkins accumulates build history indefinitely. After months of active use, this causes disk space issues and UI slowness. Set `buildDiscarder` in `options{}` on every pipeline — 20–50 builds for active projects, fewer for release branches.',
    },
  ];

  challenge: Challenge = {
    title: 'Jenkinsfile Stage Parser',
    language: 'typescript',
    description: `Build a function that parses a simplified declarative Jenkinsfile structure and extracts stage information.

Given a string representation of a Jenkinsfile, extract:
1. Pipeline agent (the value after "agent")
2. An array of stage objects, each with:
   - name: the stage name (from stage('...'))
   - hasWhen: whether the stage has a "when {" block
   - steps: array of shell commands (lines starting with sh '...' or sh "...")

Focus on parsing correctly, not on handling every Groovy edge case.`,
    hints: [
      'Split the input by lines and process line by line with a state machine',
      'Track which stage you\'re currently inside using a variable',
      'Look for "stage(\'" or "stage(\\"" to detect stage start',
      'Look for "when {" to set hasWhen = true for the current stage',
      'sh commands are single-quoted: sh \'cmd\' or double-quoted: sh "cmd"',
    ],
    starterCode: `interface ParsedStage {
  name: string;
  hasWhen: boolean;
  steps: string[];
}

interface ParsedPipeline {
  agent: string;
  stages: ParsedStage[];
}

function parseJenkinsfile(content: string): ParsedPipeline {
  // TODO: implement simple line-by-line parser
  return { agent: 'any', stages: [] };
}`,
    solution: `function parseJenkinsfile(content: string): ParsedPipeline {
  const lines = content.split('\\n').map(l => l.trim());
  const result: ParsedPipeline = { agent: 'any', stages: [] };
  let currentStage: ParsedStage | null = null;

  for (const line of lines) {
    // Agent line: agent any / agent { label 'docker' }
    const agentMatch = line.match(/^agent\\s+(.+)/);
    if (agentMatch && !currentStage) {
      result.agent = agentMatch[1].trim();
      continue;
    }

    // Stage start: stage('Name') { or stage("Name") {
    const stageMatch = line.match(/^stage\\(['"](.+?)['"]\\)/);
    if (stageMatch) {
      currentStage = { name: stageMatch[1], hasWhen: false, steps: [] };
      result.stages.push(currentStage);
      continue;
    }

    if (!currentStage) continue;

    // when block
    if (line.startsWith('when {') || line === 'when {') {
      currentStage.hasWhen = true;
    }

    // sh commands: sh 'cmd' or sh "cmd"
    const shMatch = line.match(/^sh\\s+['"](.+?)['"]/);
    if (shMatch) {
      currentStage.steps.push(shMatch[1]);
    }

    // Closing brace for stage — naive: track depth
    if (line === '}') {
      // Don't null currentStage here (too simplistic), just continue
    }
  }

  return result;
}

// Test:
const jf = \`pipeline {
  agent any
  stages {
    stage('Build') {
      steps { sh 'npm ci' }
    }
    stage('Deploy') {
      when { branch 'main' }
      steps { sh 'kubectl apply -f k8s/' }
    }
  }
}\`;
console.log(JSON.stringify(parseJenkinsfile(jf), null, 2));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between Declarative and Scripted Jenkins pipelines?',
      options: [
        'Declarative runs faster; scripted requires more memory',
        'Declarative uses a structured schema validated by Jenkins; scripted is arbitrary Groovy in a node{} block',
        'Scripted supports Docker agents; declarative does not',
        'Declarative only works with Multibranch jobs; scripted works with all job types',
      ],
      answer: 1,
      explanation: 'Declarative pipelines use a structured DSL inside `pipeline{}` that Jenkins parses and validates before execution — catching syntax errors before runtime. Scripted pipelines are arbitrary Groovy code in `node{}` blocks, validated only at runtime. Use declarative for predictability and structure; scripted when you need full Groovy flexibility.',
    },
    {
      q: 'How do you run different stages on different agents in a Declarative pipeline?',
      options: [
        'Set `agent any` at the top level and use `node()` inside each stage',
        'Declare `agent none` at the pipeline level and specify an `agent {}` block per stage',
        'Use `parallel {}` blocks to assign different agents to different stages',
        'Add a `runOn:` directive inside each `steps {}` block',
      ],
      answer: 1,
      explanation: 'With `agent none` at the pipeline level, no agent is pre-allocated. Each stage then declares its own `agent {}` block (`agent { docker "node:20" }`, `agent { label "k8s" }`). The agent is acquired for that stage and released immediately after — preventing a single long-running agent lock across the full pipeline run.',
    },
    {
      q: 'What does the `when { changeRequest() }` condition do in a Multibranch pipeline?',
      options: [
        'Runs the stage only when the pipeline was triggered by a manual change request form',
        'Runs the stage only when the build is triggered by a pull/merge request (not a branch push)',
        'Runs the stage when the build is triggered by a change to the Jenkinsfile itself',
        'Runs the stage when the Jenkins configuration was recently changed',
      ],
      answer: 1,
      explanation: '`changeRequest()` is true only when Jenkins is building a pull request (GitHub PR, Bitbucket PR, etc.) — not a regular branch push. Use it to run PR-specific steps like SonarQube PR analysis or posting coverage comments back to the PR, without running those on main/develop branch builds.',
    },
    {
      q: 'What is the purpose of Jenkins Shared Libraries?',
      options: [
        'They store build artifacts so they can be shared between pipeline runs',
        'They allow sharing Groovy functions and classes across multiple Jenkinsfiles in an organisation',
        'They sync Jenkins plugin versions across multiple Jenkins instances',
        'They provide pre-built Docker images for common build environments',
      ],
      answer: 1,
      explanation: 'Shared Libraries are Git repositories containing Groovy code (`vars/`, `src/`) that any Jenkinsfile can import with `@Library("name")`. They solve the copy-paste problem: define `deployToK8s()` once, use it from all pipelines. Changes to the library propagate to all consumers — pin to a version tag to avoid unintended updates.',
    },
    {
      q: 'Why should you set `buildDiscarder` in the pipeline options?',
      options: [
        'It speeds up builds by discarding unnecessary stages',
        'It prevents Jenkins from keeping unlimited build history which would fill disk and slow the UI',
        'It removes unused plugins from the Jenkins instance automatically',
        'It discards failed builds so only successful runs appear in history',
      ],
      answer: 1,
      explanation: '`buildDiscarder(logRotator(numToKeepStr: "30"))` tells Jenkins to keep only the last N build records and their associated logs/artifacts. Without it, Jenkins accumulates builds indefinitely — causing disk space exhaustion and UI slowness over months of active use. Set it on every pipeline.',
    },
    {
      q: 'What is the difference between Declarative and Scripted Pipeline in Jenkins?',
      options: [
        'Declarative is older; Scripted is the modern standard',
        'Declarative uses structured pipeline {} syntax with built-in validation; Scripted uses Groovy code in node {} blocks with full programming flexibility',
        'Scripted runs faster than Declarative',
        'They are interchangeable — both produce identical Jenkinsfiles'],
      answer: 1,
      explanation: 'Declarative Pipeline: structured YAML-like syntax within pipeline { agent, stages, steps, post }. Validates syntax before running. Easier to read and write. Recommended for most use cases. Scripted Pipeline: Groovy code in node { } blocks — full programming power (loops, conditionals, exceptions) but no syntax validation and harder to maintain. Use Declarative by default; drop into `script { }` blocks for Groovy when Declarative is insufficient.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you trigger a downstream Jenkins pipeline from a Jenkinsfile?',
      a: 'Use the `build` step: `build job: "my-downstream-job", parameters: [string(name: "VERSION", value: "\${BUILD_NUMBER}")]`. The `wait: false` option triggers asynchronously (fire-and-forget). `propagate: true` (default) makes the upstream build fail if the downstream fails; `propagate: false` lets it continue regardless. For complex orchestration, Multibranch pipelines with `resources:` triggers are more maintainable than `build` chains.',
    },
    {
      q: 'What is the `post {}` block and what sections does it support?',
      a: '`post {}` in a declarative pipeline runs steps after the pipeline (or stage) completes, regardless of outcome. Sections: `always` (always runs), `success` (only on success), `failure` (only on failure), `unstable` (when build is marked unstable, e.g., test failures), `aborted` (when manually stopped), `changed` (when status changes from previous run — good for Slack notifications only when something breaks or recovers). `post` can be at pipeline level (runs after all stages) or inside individual stages.',
    },
    {
      q: 'How do you handle a manual approval gate in Jenkins?',
      a: 'Use the `input` step: `input message: "Deploy to production?", ok: "Deploy", submitter: "release-approvers"`. This pauses the pipeline and shows an Approve/Abort dialog in the Jenkins UI (and optionally sends a notification). The `submitter` parameter restricts who can approve. Add a `timeout` around it (`timeout(time: 24, unit: "HOURS") { input ... }`) to auto-abort if nobody approves within the window, preventing pipelines from blocking an executor indefinitely.',
    },
    {
      q: 'What is a Jenkins Multibranch Pipeline and when should you use it?',
      a: 'A Multibranch Pipeline job scans a repository and auto-creates a pipeline run for each branch and PR that contains a Jenkinsfile. When a new branch is pushed, Jenkins discovers it and runs its pipeline automatically. When the branch is deleted or merged, the job is archived. Use Multibranch for any project where developers create feature branches — it gives every branch its own CI without manually creating Jenkins jobs. Pair with `when { branch "main" }` conditions to run deploy stages only on protected branches.',
    },
    {
      q: 'How do you pass information between stages in a Declarative Jenkinsfile?',
      a: 'Use `env` variables: in a `script {}` block, set `env.MY_VAR = "value"`. This persists across all subsequent stages on the same agent. For file artifacts between stages that use different agents, use `stash` and `unstash`: `stash name: "build-output", includes: "dist/**"` in Build, `unstash "build-output"` in Deploy. `stash` serializes files to the Jenkins controller; `unstash` restores them on any agent — the standard mechanism when different stages run on different agents.',
    },
    {
      q: 'What are Jenkins shared libraries and when would you use them?',
      a: 'Jenkins Shared Libraries are Groovy code stored in a separate Git repository, loaded into Jenkins pipelines. They allow you to extract common pipeline steps into reusable functions: def runTests(args) { ... }, def deployToKubernetes(args) { ... }. Usage: configure the shared library in Jenkins (Manage Jenkins → Configure System → Global Pipeline Libraries), then @Library("my-lib") _ at the top of a Jenkinsfile. Use shared libraries when: (1) Multiple pipelines repeat the same steps (build, test, deploy) — consolidate into one place. (2) You want to enforce company standards (security scans, notification patterns) — one update to the library propagates to all consuming pipelines. (3) You need to share complex Groovy logic that is impractical to inline. The library is versioned via Git tags/branches.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Jenkins: self-hosted CI/CD via Groovy Jenkinsfile — declarative (schema-validated pipeline{}) preferred over scripted (flexible node{}); Multibranch for auto-discovery; Shared Libraries for reuse; withCredentials() for secrets.',
    mustKnow: [
      'Declarative vs scripted: declarative is validated, structured, preferred — scripted only for complex Groovy logic',
      '`agent none` at pipeline level + per-stage agents: each stage gets its own agent, released immediately after',
      'Credentials: always withCredentials() or environment{credentials()} — never hardcode in Jenkinsfile',
      'Shared Libraries: Groovy in Git repo, imported with @Library — pin to version tags, not @main',
      'Multibranch: auto-discovers branches/PRs with Jenkinsfile — use when{} conditions for branch-specific stages',
      '`buildDiscarder` in options{}: prevents disk filling with unlimited build history',
      '`post {}`: always/success/failure/unstable/changed — run cleanup and notifications after stages',
    ],
    interviewFocus: [
      'What is the difference between Declarative and Scripted Jenkinsfile syntax?',
      'How would you structure a Jenkins pipeline for a multi-branch workflow with PR validation?',
      'How do you share common pipeline logic across 50 repositories in Jenkins?',
      'How do you handle secrets in Jenkins pipelines securely?',
    ],
  };
}
