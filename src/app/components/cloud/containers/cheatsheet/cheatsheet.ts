import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';

interface CheatSection {
  heading: string;
  items: { cmd: string; desc: string }[];
}

const dockerSections: CheatSection[] = [
  {
    heading: 'Images',
    items: [
      { cmd: 'docker build -t name:tag .', desc: 'Build image from Dockerfile in current dir' },
      { cmd: 'docker build --no-cache -t name:tag .', desc: 'Build without layer cache' },
      { cmd: 'docker pull image:tag', desc: 'Pull image from registry' },
      { cmd: 'docker push image:tag', desc: 'Push image to registry' },
      { cmd: 'docker images', desc: 'List local images' },
      { cmd: 'docker rmi image:tag', desc: 'Remove a local image' },
      { cmd: 'docker image prune', desc: 'Remove dangling (untagged) images' },
      { cmd: 'docker image inspect name:tag', desc: 'Show image metadata and layers' },
      { cmd: 'docker tag src:tag dst:tag', desc: 'Tag an image with a new name' },
      { cmd: 'docker save name:tag | gzip > img.tar.gz', desc: 'Export image to file' },
    ],
  },
  {
    heading: 'Containers',
    items: [
      { cmd: 'docker run -d -p 8080:80 --name app image:tag', desc: 'Run detached, map host:container port' },
      { cmd: 'docker run --rm -it image:tag sh', desc: 'Run interactive, remove on exit' },
      { cmd: 'docker run -e KEY=val --env-file .env image', desc: 'Pass environment variables' },
      { cmd: 'docker run -v $(pwd):/app image', desc: 'Bind-mount current dir into container' },
      { cmd: 'docker ps', desc: 'List running containers' },
      { cmd: 'docker ps -a', desc: 'List all containers (including stopped)' },
      { cmd: 'docker logs -f name', desc: 'Stream container logs' },
      { cmd: 'docker logs --tail 100 name', desc: 'Last 100 lines of logs' },
      { cmd: 'docker exec -it name sh', desc: 'Open shell in running container' },
      { cmd: 'docker stop name && docker rm name', desc: 'Stop and remove a container' },
      { cmd: 'docker stats', desc: 'Live CPU/memory usage per container' },
      { cmd: 'docker inspect name', desc: 'Full container metadata (JSON)' },
    ],
  },
  {
    heading: 'Compose',
    items: [
      { cmd: 'docker compose up -d', desc: 'Start all services in background' },
      { cmd: 'docker compose up -d --build', desc: 'Rebuild images before starting' },
      { cmd: 'docker compose down', desc: 'Stop and remove containers + networks' },
      { cmd: 'docker compose down -v', desc: 'Also remove named volumes' },
      { cmd: 'docker compose logs -f service', desc: 'Follow logs for a service' },
      { cmd: 'docker compose exec service sh', desc: 'Shell into a running service' },
      { cmd: 'docker compose ps', desc: 'Status of all services' },
      { cmd: 'docker compose scale service=3', desc: 'Scale a service to N replicas' },
      { cmd: 'docker compose -f compose.yml -f compose.prod.yml up', desc: 'Merge multiple compose files' },
      { cmd: 'docker compose --profile debug up', desc: 'Start services with the debug profile' },
    ],
  },
];

const kubectlSections: CheatSection[] = [
  {
    heading: 'Get & Describe',
    items: [
      { cmd: 'kubectl get pods -n ns', desc: 'List pods in a namespace' },
      { cmd: 'kubectl get pods -A', desc: 'List pods across all namespaces' },
      { cmd: 'kubectl get pods -o wide', desc: 'Show node IP and node name' },
      { cmd: 'kubectl get all -n ns', desc: 'Get pods, services, deployments, etc.' },
      { cmd: 'kubectl describe pod name -n ns', desc: 'Full pod info + Events (root cause)' },
      { cmd: 'kubectl describe node name', desc: 'Node capacity, taints, allocated resources' },
      { cmd: 'kubectl get events -n ns --sort-by=.lastTimestamp', desc: 'Cluster events in time order' },
      { cmd: 'kubectl top pods -n ns', desc: 'Live CPU/memory usage (needs metrics-server)' },
      { cmd: 'kubectl top nodes', desc: 'Node resource usage' },
      { cmd: 'kubectl get endpoints svc -n ns', desc: 'Check if service selector matches pods' },
    ],
  },
  {
    heading: 'Apply & Delete',
    items: [
      { cmd: 'kubectl apply -f manifest.yaml', desc: 'Create or update resources from file' },
      { cmd: 'kubectl apply -f ./k8s/', desc: 'Apply all manifests in a directory' },
      { cmd: 'kubectl delete -f manifest.yaml', desc: 'Delete resources defined in file' },
      { cmd: 'kubectl delete pod name -n ns', desc: 'Delete a specific pod (will restart)' },
      { cmd: 'kubectl delete pod name --grace-period=0 --force', desc: 'Force delete stuck pod' },
      { cmd: 'kubectl diff -f manifest.yaml', desc: 'Show what apply would change' },
      { cmd: 'kubectl apply --dry-run=client -f file.yaml', desc: 'Validate without applying' },
      { cmd: 'kubectl apply --dry-run=server -f file.yaml', desc: 'Server-side validation (checks RBAC)' },
    ],
  },
  {
    heading: 'Logs & Exec',
    items: [
      { cmd: 'kubectl logs pod -n ns', desc: 'Current container stdout/stderr' },
      { cmd: 'kubectl logs pod -n ns --previous', desc: 'Logs from last crashed container' },
      { cmd: 'kubectl logs -f pod -n ns', desc: 'Stream logs in real time' },
      { cmd: 'kubectl logs pod -c container -n ns', desc: 'Logs from specific container in pod' },
      { cmd: 'kubectl exec -it pod -n ns -- sh', desc: 'Open shell in container' },
      { cmd: 'kubectl exec pod -- env', desc: 'Print environment variables' },
      { cmd: 'kubectl debug -it pod --image=busybox', desc: 'Add ephemeral debug container' },
      { cmd: 'kubectl port-forward pod 8080:80 -n ns', desc: 'Forward local port to pod' },
      { cmd: 'kubectl port-forward svc/name 8080:80', desc: 'Forward local port to service' },
    ],
  },
  {
    heading: 'Rollouts & Scale',
    items: [
      { cmd: 'kubectl rollout status deploy/name -n ns', desc: 'Wait for rollout to complete' },
      { cmd: 'kubectl rollout history deploy/name', desc: 'View revision history' },
      { cmd: 'kubectl rollout undo deploy/name', desc: 'Roll back to previous revision' },
      { cmd: 'kubectl rollout undo deploy/name --to-revision=2', desc: 'Roll back to specific revision' },
      { cmd: 'kubectl scale deploy/name --replicas=5', desc: 'Scale deployment to N replicas' },
      { cmd: 'kubectl set image deploy/name container=image:v2', desc: 'Update container image' },
      { cmd: 'kubectl rollout restart deploy/name', desc: 'Rolling restart of all pods' },
      { cmd: 'kubectl drain node --ignore-daemonsets', desc: 'Evict pods from node (maintenance)' },
      { cmd: 'kubectl cordon node', desc: 'Prevent new pods from scheduling on node' },
      { cmd: 'kubectl uncordon node', desc: 'Re-enable scheduling on node' },
    ],
  },
  {
    heading: 'Config & Context',
    items: [
      { cmd: 'kubectl config get-contexts', desc: 'List all kubeconfig contexts' },
      { cmd: 'kubectl config use-context name', desc: 'Switch to a cluster context' },
      { cmd: 'kubectl config current-context', desc: 'Show current active context' },
      { cmd: 'kubectl config set-context --current --namespace=ns', desc: 'Set default namespace' },
      { cmd: 'kubectl auth can-i get pods --as=sa', desc: 'Check RBAC permissions for a subject' },
      { cmd: 'kubectl auth can-i --list --as=system:serviceaccount:ns:sa', desc: 'List all permissions for SA' },
      { cmd: 'kubectl label pod name key=val', desc: 'Add label to a resource' },
      { cmd: 'kubectl annotate pod name key=val', desc: 'Add annotation to a resource' },
    ],
  },
];

const helmSections: CheatSection[] = [
  {
    heading: 'Install & Upgrade',
    items: [
      { cmd: 'helm install name ./chart', desc: 'Install chart with release name' },
      { cmd: 'helm install name ./chart -f values.yaml', desc: 'Install with custom values' },
      { cmd: 'helm install name ./chart --set key=val', desc: 'Override a single value' },
      { cmd: 'helm upgrade name ./chart -f values.yaml', desc: 'Upgrade an existing release' },
      { cmd: 'helm upgrade --install name ./chart', desc: 'Install or upgrade (idempotent)' },
      { cmd: 'helm rollback name 1', desc: 'Roll back release to revision 1' },
      { cmd: 'helm uninstall name', desc: 'Delete a release and all its resources' },
      { cmd: 'helm template name ./chart', desc: 'Render templates without installing' },
      { cmd: 'helm lint ./chart', desc: 'Validate chart syntax and best practices' },
      { cmd: 'helm diff upgrade name ./chart', desc: 'Show what upgrade would change (plugin)' },
    ],
  },
  {
    heading: 'Repos & Search',
    items: [
      { cmd: 'helm repo add stable https://charts.helm.sh/stable', desc: 'Add a Helm repository' },
      { cmd: 'helm repo update', desc: 'Refresh repository index' },
      { cmd: 'helm search repo nginx', desc: 'Search for nginx charts in repos' },
      { cmd: 'helm search hub wordpress', desc: 'Search Artifact Hub for charts' },
      { cmd: 'helm show values repo/chart', desc: 'Show chart default values' },
      { cmd: 'helm list -n ns', desc: 'List releases in a namespace' },
      { cmd: 'helm history name', desc: 'Show release revision history' },
      { cmd: 'helm get values name', desc: 'Show values for a deployed release' },
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Security context',
    language: 'bash',
    code: '# Hardened pod security context\ncontainers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true\n      runAsUser: 1000\n      readOnlyRootFilesystem: true\n      allowPrivilegeEscalation: false\n      capabilities:\n        drop: [ALL]\n      seccompProfile:\n        type: RuntimeDefault\n\n# Scan image before deploy\ntrivy image --exit-code 1 --severity CRITICAL image:tag\n\n# Verify RBAC permissions\nkubectl auth can-i list secrets \\\n  --as=system:serviceaccount:production:myapp\n\n# Default-deny NetworkPolicy\nkind: NetworkPolicy\nspec:\n  podSelector: {}\n  policyTypes: [Ingress, Egress]\n  egress:\n    - ports: [{ protocol: UDP, port: 53 }]',
  },
  {
    label: 'Troubleshooting quick ref',
    language: 'bash',
    code: '# Pod diagnosis flow\nkubectl get pods -n ns                          # status\nkubectl describe pod name -n ns                  # Events section\nkubectl logs name -n ns --previous               # crashed container\nkubectl get events --sort-by=.lastTimestamp -n ns\n\n# Exit codes\n# 0 = success\n# 1 = application error\n# 137 = OOMKilled (SIGKILL, memory limit exceeded)\n# 139 = segmentation fault\n\n# Service not routing\nkubectl get endpoints svc-name -n ns  # <none> = label mismatch\nkubectl get svc svc-name -o jsonpath=\'{.spec.selector}\'\nkubectl get pods --show-labels -n ns\n\n# Force pod restart\nkubectl rollout restart deploy/name -n ns\n\n# Shell into distroless pod\nkubectl debug -it name --image=busybox --target=container\n\n# DNS check from inside cluster\nkubectl run test --image=busybox --rm -it -- \\\n  nslookup svc-name.namespace.svc.cluster.local',
  },
];

@Component({
  selector: 'app-k8s-cheatsheet',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, CodeBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class K8sCheatsheet {
  activeTab = signal<'docker' | 'kubectl' | 'helm'>('docker');
  codeTabs = codeTabs;

  dockerSections = dockerSections;
  kubectlSections = kubectlSections;
  helmSections = helmSections;

  setTab(tab: 'docker' | 'kubectl' | 'helm') { this.activeTab.set(tab); }
}
