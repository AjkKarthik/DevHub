import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'docker-compose’s command: Replaces the Image’s Default CMD Entirely',
    points: [
      'The main page’s own "Thanos Setup" codeTab originally gave the <code>prometheus</code> service a <code>command:</code> list with four <code>--storage.tsdb.*</code> flags and <code>--web.enable-lifecycle</code> — but no <code>--config.file</code> flag anywhere in it. The volume mount right above (<code>./prometheus.yml:/etc/prometheus/prometheus.yml</code>) looks completely correct on a casual read, which is exactly what made this easy to miss.',
      'Docker’s ENTRYPOINT/CMD split matters here: the official <code>prom/prometheus</code> image’s Dockerfile sets <code>ENTRYPOINT ["/bin/prometheus"]</code> and a default <code>CMD</code> of <code>["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus"]</code> — confirmed directly from the image’s own Dockerfile. A compose file’s <code>command:</code> field overrides CMD WHOLESALE, not by appending — specifying any <code>command:</code> at all means every flag not explicitly re-listed is gone, including <code>--config.file</code>.',
      'Without <code>--config.file</code> being passed, Prometheus falls back to its own compiled-in default: the RELATIVE path <code>prometheus.yml</code> (confirmed via the flag’s own definition in Prometheus’s source, <code>Default("prometheus.yml")</code>) — resolved against the image’s <code>WORKDIR /prometheus</code>, giving <code>/prometheus/prometheus.yml</code>. That path is occupied by the <code>prometheus-data</code> volume (TSDB storage), never the mounted config file at <code>/etc/prometheus/prometheus.yml</code> — Prometheus would fail to start looking in entirely the wrong place.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Fix — One Missing Flag',
    language: 'bash',
    code: `services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      # command: fully replaces the image's default CMD -- every flag the
      # base image would normally pass (including --config.file) must be
      # re-listed explicitly here, or it's simply gone.
      - --config.file=/etc/prometheus/prometheus.yml   # <- the missing flag
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=2h
      - --storage.tsdb.min-block-duration=2h
      - --storage.tsdb.max-block-duration=2h
      - --web.enable-lifecycle

# Without --config.file explicitly listed:
#   Prometheus falls back to its own compiled-in default: the RELATIVE
#   path "prometheus.yml" (Default("prometheus.yml") in Prometheus's own
#   flag definitions), resolved against the image's WORKDIR /prometheus.
#   -> looks for /prometheus/prometheus.yml
#   -> that path is the prometheus-data VOLUME (TSDB storage), not the
#      config file mounted at /etc/prometheus/prometheus.yml
#   -> Prometheus fails to start: "open prometheus.yml: no such file"`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The "Prometheus Operator CRDs" codeTab elsewhere on the main page never has this problem — <code>ServiceMonitor</code> and <code>PrometheusRule</code> manifests never specify a Docker <code>command:</code> field at all. Why doesn’t the Prometheus Operator approach have this same failure mode?',
  hint: 'Ask what actually STARTS the Prometheus process in each approach — who writes the container’s command-line flags, and when.',
  solution: `// The Prometheus Operator approach never hand-writes a docker-compose
// command: list at all -- the Operator itself generates the Prometheus
// StatefulSet's container args programmatically, based on the Prometheus
// Custom Resource's own spec fields (retention, replicas, etc.), and it
// ALWAYS includes a correct --config.file flag pointing at the generated,
// Operator-managed config Secret.
//
// The docker-compose "Thanos Setup" codeTab, by contrast, is a fully
// manual, hand-written setup -- there's no Operator generating the
// command-line flags on your behalf, so a human has to remember to list
// EVERY flag the default CMD would have provided, including ones that
// are easy to overlook precisely because they "just worked" by default
// before command: was added at all.
//
// This is the general lesson: overriding a well-known image's default
// CMD is a real, silent risk specifically BECAUSE the default flags were
// invisible until you had to replace them -- switching to a
// declarative, operator-managed approach removes this entire class of
// mistake by generating the flags for you every time.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The volume mount (<code>./prometheus.yml:/etc/prometheus/prometheus.yml</code>) being correct means the config will be found — the mount and the flag are two ways of expressing the same intent.',
    reality: 'They’re two completely independent mechanisms that both have to line up: the volume mount controls WHERE a file ends up INSIDE the container’s filesystem; the <code>--config.file</code> flag controls WHERE Prometheus itself LOOKS for that file. Getting the mount right says nothing about whether the process is told to look there — this codeTab had the mount correct and the flag missing, and the mount alone accomplished nothing.',
  },
  {
    thought: 'Since the container would just crash loudly on startup ("no such file or directory"), this bug would be caught immediately in any real deployment — it’s not a serious risk in practice.',
    reality: 'A loud crash on FIRST deployment is exactly the best case — the same silent-override mechanism is a much bigger risk when only ADDING a new flag to an already-working <code>command:</code> list later (e.g. adding <code>--web.enable-lifecycle</code> to an already-running Thanos setup) if someone accidentally drops or forgets to re-copy an existing flag during that edit — the failure mode is identical, just triggered by an edit instead of an initial deploy, and it’s easy to test the ADDED flag works while missing that something else silently vanished.',
  },
  {
    thought: 'Since the flag’s default is <code>"prometheus.yml"</code> and the container’s WORKDIR is <code>/prometheus</code>, simply placing the config file AT <code>/prometheus/prometheus.yml</code> instead of <code>/etc/prometheus/prometheus.yml</code> would be a valid alternative fix, avoiding the need to specify <code>--config.file</code> at all.',
    reality: 'This is technically true as a workaround for THIS specific compose file, but it’s fragile and non-obvious — it silently depends on the image’s exact WORKDIR (which is an implementation detail that could change between image versions) and it means the config’s effective location is invisible from reading the compose file at all, unlike the explicit <code>--config.file</code> flag, which documents its own location directly at the point where the flag is set.',
  },
];

@Component({
  selector: 'app-obs-cloud-native-config-file-bug',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-command-override-that-drops-config-file.html',
  styleUrl: './the-command-override-that-drops-config-file.scss',
})
export class TheCommandOverrideThatDropsConfigFileSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
