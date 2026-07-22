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
  templateUrl: './subpath-volume-mounts-never-receive-configmap-secret-updates.html',
  styleUrl: './subpath-volume-mounts-never-receive-configmap-secret-updates.scss'
})
export class SubpathVolumeMountsNeverReceiveConfigmapSecretUpdatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory states a blanket "mounted volumes update automatically" rule',
      points: [
        'The main page\'s own theory section states: "Updates to a mounted ConfigMap are reflected in the container within ~1 minute (env vars require Pod restart)." The QnA repeats this: "ConfigMaps mounted as volumes are updated automatically by kubelet within approximately 1 minute." Both are phrased as an unconditional rule about ANY volume mount.',
        'The main page\'s own ConfigMap code tab actually uses `items:` under its `volumes:` entry to mount a SINGLE key (`app.properties`) at a specific `path:` inside the mount directory — a pattern commonly reached for exactly when someone wants a ConfigMap key to land at one specific FILE inside an existing directory, which is precisely the scenario where `subPath` gets introduced (though the main page\'s own example doesn\'t use `subPath` itself).',
      ]
    },
    {
      heading: 'The real exception: subPath-mounted ConfigMaps/Secrets never receive live updates at all',
      points: [
        'Per Kubernetes\' own documented, confirmed-as-designed limitation (tracked as kubernetes/kubernetes#50345), a container using a ConfigMap or Secret as a `subPath` volume mount does NOT receive updates when the source ConfigMap/Secret changes — not "eventually, after a longer delay than the usual ~1 minute," but never, for the lifetime of that container.',
        'The reason is mechanical: `subPath` mounts a specific file (or subdirectory) directly, using a different underlying mechanism than a whole-directory mount — whole-directory ConfigMap/Secret mounts use an atomic symlink-swap technique kubelet can update in place, but a `subPath` mount bypasses that symlink layer entirely, bind-mounting the target file/path once at container start with no ongoing sync.',
        'This means the main page\'s own "~1 minute" propagation timeline is only accurate for a WHOLE-DIRECTORY mount (no `subPath` on the volumeMount) — the moment `subPath` is introduced to place a single key at a specific file path inside an existing directory, that specific mount silently stops receiving any future updates, with no error or warning of any kind.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Whole-directory mount (the main page\'s own pattern) vs. subPath',
      language: 'bash',
      code: `# The main page's own volumeMount -- NO subPath, mounts the whole
# directory (with an items: filter, but still a directory mount):
# volumeMounts:
#   - name: config
#     mountPath: /etc/app
#     readOnly: true
# volumes:
#   - name: config
#     configMap:
#       name: app-config
#       items:
#         - key: app.properties
#           path: app.properties
# -- THIS pattern genuinely does update within ~1 min, as the main
#    page's own theory states.

# The DIFFERENT pattern that silently breaks live updates -- adding
# subPath to place ONE key at a specific file inside an ALREADY
# populated directory (a very common reason someone reaches for it,
# e.g. adding one config file alongside files from another source
# without a whole-directory mount clobbering the rest):
# volumeMounts:
#   - name: config
#     mountPath: /etc/app/app.properties  # a single FILE path
#     subPath: app.properties             # <- this is what breaks it
# volumes:
#   - name: config
#     configMap:
#       name: app-config

# Updating the ConfigMap after this:
kubectl create configmap app-config --from-literal=app.properties="feature.dark-mode=false" --dry-run=client -o yaml | kubectl apply -f -

# The whole-directory mount's file updates within ~1 min, exactly as
# documented. The subPath-mounted file NEVER updates, for as long as
# that container keeps running -- kubectl exec into the Pod and the
# file content is frozen at whatever it was at container start.`,
    },
    {
      label: 'The fix: avoid subPath, or accept a restart-only workflow',
      language: 'bash',
      code: `# Option 1 -- mount the whole directory instead of a single subPath
# file, if the directory can be dedicated entirely to this ConfigMap:
# volumeMounts:
#   - name: config
#     mountPath: /etc/app
#     readOnly: true
# volumes:
#   - name: config
#     configMap: { name: app-config }
# -- restores live ~1-minute update propagation, at the cost of no
#    longer being able to mix in files from another source in the
#    same directory without them being overwritten by this mount.

# Option 2 -- if subPath is unavoidable (e.g. injecting one file into
# a directory an image already populates), accept that updates
# require a Pod restart, same as env vars -- and use the SAME
# content-hash-suffixed-ConfigMap-name pattern the main page's own
# theory already recommends for env vars, since subPath mounts share
# the identical "no live update" limitation as env var injection:
kubectl rollout restart deployment/api
# -- the only reliable way to pick up a subPath-mounted change,
#    exactly as if it had been injected via envFrom/valueFrom instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team mounts a ConfigMap key at a specific file path inside a directory that already contains files baked into their container image, using <code>subPath</code> so the mount doesn\'t clobber the rest of the directory. They update the ConfigMap and wait the "~1 minute" the main page\'s own theory promises, but the file inside the running container never changes, even after waiting much longer. Using this subtopic\'s theory, is this a propagation-delay problem that will eventually resolve on its own?',
    hint: 'Does the main page\'s own "~1 minute" propagation timeline apply to EVERY volume mount, or specifically to whole-directory mounts? What mechanism does a <code>subPath</code> mount use instead of the whole-directory symlink-swap?',
    solution: 'No — per this subtopic\'s theory, this is not a delay that will eventually resolve; it is the documented, by-design behavior of subPath mounts, which never receive live updates at all, for the entire lifetime of the container. The main page\'s own "~1 minute" propagation figure only applies to a whole-directory ConfigMap/Secret mount, which kubelet updates via an atomic symlink-swap technique. Introducing subPath to mount a single key at a specific file path bypasses that symlink layer entirely — the file is bind-mounted once, at container start, with no ongoing sync mechanism watching for changes at all. No amount of waiting will make the file update; the only way to pick up the new ConfigMap value is to restart the Pod (kubectl rollout restart), exactly the same workaround the main page\'s own theory already recommends for environment-variable injection, since subPath mounts share that same "restart required" limitation despite looking like an ordinary file mount.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "~1 minute" ConfigMap/Secret volume-update propagation figure applies to every possible way of mounting a ConfigMap or Secret as a file, as long as it isn\'t an environment variable.',
      reality: 'Per this subtopic\'s theory, that figure only applies to a WHOLE-DIRECTORY volume mount. A subPath-based mount — used to place a single key at a specific file path — never receives live updates at all, a documented, permanent exception, not a longer delay.'
    },
    {
      thought: 'A subPath-mounted ConfigMap file that isn\'t updating yet is just experiencing a longer-than-usual kubelet sync delay, and will eventually catch up if you wait long enough.',
      reality: 'Per this subtopic\'s exercise, there is no amount of waiting that resolves this — subPath bind-mounts the target file once, at container start, with no ongoing sync mechanism at all. The only fix is restarting the Pod, the same workaround required for environment-variable injection.'
    },
    {
      thought: 'Since subPath and whole-directory mounts both ultimately come from the same ConfigMap/Secret object, they must behave identically with respect to live update propagation, just possibly at different speeds.',
      reality: 'Per this subtopic\'s theory, they use fundamentally different underlying mechanisms — whole-directory mounts use an atomic symlink-swap kubelet can update in place, while subPath bind-mounts the specific file directly, entirely bypassing that update mechanism. This is a difference in KIND, not just speed.'
    }
  ];
}
