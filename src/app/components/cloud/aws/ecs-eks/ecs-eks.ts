import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aws-ecs-eks',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ecs-eks.html',
  styleUrl: './ecs-eks.scss'
})
export class AwsEcsEks {

  quickRef: QuickRefItem[] = [
    { name: 'Task Definition', type: 'class', desc: 'Blueprint for an ECS container: image, CPU/memory, env vars, port mappings, log driver, IAM roles.' },
    { name: 'ECS Service', type: 'class', desc: 'Maintains N running task copies; integrates with ALB target groups and handles rolling deploys.' },
    { name: 'Fargate', type: 'keyword', desc: 'Serverless compute for containers — no EC2 nodes to manage; billed per vCPU/memory-second.' },
    { name: 'EKS Managed Node Group', type: 'class', desc: 'AWS-managed EC2 nodes for EKS — handles AMI updates, draining, and ASG lifecycle.' },
    { name: 'IRSA', type: 'keyword', desc: 'IAM Roles for Service Accounts — scoped IAM credentials for EKS pods via OIDC (no access keys).' },
    { name: 'ALB Ingress Controller', type: 'class', desc: 'Kubernetes controller that provisions ALBs from Ingress resources (AWS Load Balancer Controller).' },
    { name: 'Fargate Profile', type: 'class', desc: 'EKS config that routes matching pods (namespace/labels) to Fargate instead of EC2 nodes.' },
    { name: 'Service Connect', type: 'keyword', desc: 'ECS service-to-service discovery and mTLS using AWS Cloud Map — simpler than App Mesh.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ECS Core Concepts',
      points: [
        'A Task Definition is the unit of deployment: it specifies container image, CPU/memory allocation, environment variables, secrets (from SSM or Secrets Manager), port mappings, and log configuration.',
        'A Service runs N copies of a task definition and maintains that count — replacing failed tasks, integrating with ALB target groups for load-balanced traffic.',
        'Two launch types: EC2 (you manage node pool) and Fargate (AWS manages compute — specify vCPU and memory directly on the task).',
        'Clusters are logical groupings. In Fargate mode, a cluster is just a namespace — no EC2 instances to provision or patch.',
        'ECS Exec lets you run shell commands in a running container: aws ecs execute-command — useful for debugging without opening SSH ports.',
      ]
    },
    {
      heading: 'Fargate vs EC2 Launch Type',
      points: [
        'Fargate: no EC2 infrastructure — AWS handles node provisioning, patching, and scaling. Ideal for variable or unpredictable workloads. Slightly higher per-unit cost but zero ops overhead.',
        'EC2 launch type: you manage node capacity (typically via an ASG). Better for workloads requiring GPU, custom kernel parameters, or specific storage (e.g. bind-mount to a host path).',
        'Fargate tasks are priced per vCPU and GB of memory per second — a 0.5 vCPU / 1 GB task running 24/7 costs roughly $18/month.',
        'Fargate Spot offers up to 70% discount on Fargate — same interruption model as EC2 Spot. Great for batch and background jobs.',
        'Graviton (ARM64) tasks on Fargate cost 20% less than x86 with the same performance for most containerised apps — specify runtimePlatform.cpuArchitecture: ARM64.',
      ]
    },
    {
      heading: 'ECS Networking & ALB Integration',
      points: [
        'awsvpc network mode gives each task its own ENI and private IP — required for Fargate and recommended for EC2 tasks. Security groups apply at the task level.',
        'To route traffic: create an ALB → Listener → Target Group (type: ip, for awsvpc) → ECS Service registers task IPs on launch and deregisters on stop.',
        'ECS rolling update: deploymentConfiguration.minimumHealthyPercent (e.g. 100) and maximumPercent (e.g. 200) control how many old vs new tasks run during a deploy.',
        'Blue/Green deployments use CodeDeploy + ECS — two target groups, traffic shifts in canary/linear/all-at-once increments; fast rollback by shifting traffic back.',
        'Service Connect replaces Service Discovery (Cloud Map) for service-to-service calls — automatically handles retries, circuit breaking, and mTLS between ECS services.',
      ]
    },
    {
      heading: 'EKS Architecture',
      points: [
        'EKS manages the Kubernetes control plane (API server, etcd, scheduler) — you manage node groups and add-ons. AWS guarantees 99.95% SLA on the control plane.',
        'Managed Node Groups use EC2 Auto Scaling Groups with EKS-optimised AMIs. AWS handles draining, AMI upgrades, and ASG lifecycle — vastly simpler than self-managed nodes.',
        'Fargate profiles on EKS route pods to Fargate based on namespace and label selectors — no nodes needed for matching pods, but DaemonSets and stateful workloads don\'t run on Fargate.',
        'AWS VPC CNI gives pods real VPC IP addresses (no overlay network) — pods are routable within the VPC and can be reached directly by ALBs, RDS, and other AWS services.',
        'EKS add-ons (CoreDNS, kube-proxy, VPC CNI, EBS CSI Driver) are managed by AWS — version updates happen through the EKS console/CLI without manual Helm chart work.',
      ]
    },
    {
      heading: 'When ECS vs EKS',
      points: [
        'ECS is simpler: smaller API surface, tighter AWS integration, easier IAM (task roles vs IRSA), no Kubernetes expertise required. Ideal for greenfield AWS-only microservices.',
        'EKS is portable: standard Kubernetes API, runs anywhere (on-prem, other clouds), rich ecosystem (Helm, ArgoCD, Istio). Ideal when portability or existing K8s investment matters.',
        'Both support Fargate — choose based on operational complexity preference, not just compute.',
        'ECS Service Connect and App Mesh provide service mesh capabilities comparable to Istio without Kubernetes overhead.',
        'Cost: EKS control plane costs $0.10/hour per cluster ($73/month). ECS control plane is free — only pay for compute.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ECS Task & Service',
      language: 'bash',
      code: `# Register a Fargate task definition
aws ecs register-task-definition \\
  --family web-app \\
  --network-mode awsvpc \\
  --requires-compatibilities FARGATE \\
  --cpu "512" \\
  --memory "1024" \\
  --execution-role-arn arn:aws:iam::123:role/ecsTaskExecutionRole \\
  --task-role-arn arn:aws:iam::123:role/webAppTaskRole \\
  --container-definitions '[{
    "name": "web",
    "image": "123456789012.dkr.ecr.eu-west-1.amazonaws.com/web-app:latest",
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "environment": [{"name": "ENV", "value": "production"}],
    "secrets": [{
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:eu-west-1:123:secret:db-password"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/web-app",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]'
  --runtime-platform '{"cpuArchitecture":"ARM64","operatingSystemFamily":"LINUX"}'

# Create or update ECS service (ALB integration)
aws ecs create-service \\
  --cluster production \\
  --service-name web-svc \\
  --task-definition web-app:1 \\
  --desired-count 2 \\
  --launch-type FARGATE \\
  --network-configuration 'awsvpcConfiguration={
    subnets=[subnet-aaa,subnet-bbb],
    securityGroups=[sg-ecs-tasks],
    assignPublicIp=DISABLED
  }' \\
  --load-balancers '[{
    "targetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/web/abc",
    "containerName": "web",
    "containerPort": 8080
  }]' \\
  --deployment-configuration 'minimumHealthyPercent=100,maximumPercent=200'

# Force new deployment (rolling update)
aws ecs update-service \\
  --cluster production \\
  --service web-svc \\
  --force-new-deployment`,
    },
    {
      label: 'ECS Exec & Logs',
      language: 'bash',
      code: `# Enable ECS Exec on the service (requires SSM agent in container)
aws ecs update-service \\
  --cluster production \\
  --service web-svc \\
  --enable-execute-command

# Shell into a running container
TASK_ID=$(aws ecs list-tasks \\
  --cluster production \\
  --service-name web-svc \\
  --query 'taskArns[0]' --output text | awk -F/ '{print $NF}')

aws ecs execute-command \\
  --cluster production \\
  --task $TASK_ID \\
  --container web \\
  --interactive \\
  --command "/bin/sh"

# View container logs (CloudWatch)
aws logs tail /ecs/web-app --follow

# Describe running tasks
aws ecs describe-tasks \\
  --cluster production \\
  --tasks $TASK_ID \\
  --query 'tasks[0].{status:lastStatus,health:healthStatus,ip:containers[0].networkInterfaces[0].privateIpv4Address}'

# List services and task counts
aws ecs describe-services \\
  --cluster production \\
  --services web-svc \\
  --query 'services[0].{running:runningCount,pending:pendingCount,desired:desiredCount}'`,
    },
    {
      label: 'EKS Cluster & Nodes',
      language: 'bash',
      code: `# Create EKS cluster (eksctl is the recommended tool)
eksctl create cluster \\
  --name my-cluster \\
  --region eu-west-1 \\
  --version 1.30 \\
  --nodegroup-name general \\
  --node-type m6g.large \\
  --nodes 2 \\
  --nodes-min 2 \\
  --nodes-max 6 \\
  --managed \\
  --asg-access \\
  --with-oidc

# Update kubeconfig
aws eks update-kubeconfig --name my-cluster --region eu-west-1

# Verify cluster access
kubectl get nodes -o wide
kubectl get pods -A

# Add a Fargate profile (pods in 'serverless' namespace go to Fargate)
eksctl create fargateprofile \\
  --cluster my-cluster \\
  --name serverless-fp \\
  --namespace serverless

# Install AWS Load Balancer Controller (required for ALB Ingress)
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \\
  -n kube-system \\
  --set clusterName=my-cluster \\
  --set serviceAccount.create=true \\
  --set serviceAccount.annotations."eks\\.amazonaws\\.com/role-arn"=arn:aws:iam::123:role/AlbControllerRole

# Scale a managed node group
eksctl scale nodegroup \\
  --cluster my-cluster \\
  --name general \\
  --nodes 4`,
    },
    {
      label: 'EKS Deployment & Ingress',
      language: 'bash',
      code: `# Deploy a workload
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      serviceAccountName: web-app-sa  # IRSA-annotated SA
      containers:
        - name: web
          image: 123456789012.dkr.ecr.eu-west-1.amazonaws.com/web-app:latest
          ports:
            - containerPort: 8080
          resources:
            requests: { cpu: "250m", memory: "256Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
---
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: production
spec:
  selector:
    app: web-app
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app
                port:
                  number: 80
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to set the task execution role vs task role',
      wrong: `# Only set executionRoleArn — task has no AWS API access
--execution-role-arn arn:aws:iam::123:role/ecsTaskExecutionRole
# App calls s3:GetObject -> AccessDenied`,
      right: `# executionRoleArn: allows ECS agent to pull image, write logs, fetch secrets
--execution-role-arn arn:aws:iam::123:role/ecsTaskExecutionRole
# taskRoleArn: IAM permissions for YOUR application code
--task-role-arn arn:aws:iam::123:role/webAppTaskRole  # s3, dynamodb, etc.`,
      explanation: 'These are two distinct roles: the execution role is used by the ECS agent (pull image, write CloudWatch Logs, read Secrets Manager). The task role is what your application code uses to call AWS APIs. Confusing them is the most common ECS IAM mistake.'
    },
    {
      title: 'Using bridge network mode instead of awsvpc for Fargate',
      wrong: `"networkMode": "bridge"
# Error: Fargate requires awsvpc network mode`,
      right: `"networkMode": "awsvpc"
# Each task gets its own ENI, private IP, and security group`,
      explanation: 'Fargate only supports awsvpc networking. Even on EC2 launch type, awsvpc is preferred — it gives each task its own security group and private IP, enabling fine-grained traffic control between services.'
    },
    {
      title: 'Not setting resource requests/limits on EKS pods',
      wrong: `containers:
  - name: web
    image: my-app:latest
    # No resources defined
    # Scheduler places pod anywhere, node may OOM-kill it`,
      right: `containers:
  - name: web
    image: my-app:latest
    resources:
      requests: { cpu: "250m", memory: "256Mi" }
      limits:   { cpu: "500m", memory: "512Mi" }`,
      explanation: 'Without resource requests, the scheduler cannot make intelligent placement decisions and nodes can become overcommitted. Without limits, a memory leak in one pod can OOM-kill other pods on the same node.'
    },
    {
      title: 'ECS service not draining connections before task termination',
      wrong: `# Default deregistration delay is 300s on the target group
# But ECS stops container immediately when task is deregistered
# In-flight requests get hard-closed`,
      right: `# Set stopTimeout on the container definition
{
  "stopTimeout": 30,          # graceful shutdown window (max 120s on Fargate)
  "essential": true
}
# Also match ALB deregistration delay:
aws elbv2 modify-target-group-attributes \\
  --target-group-arn arn:... \\
  --attributes Key=deregistration_delay.timeout_seconds,Value=30`,
      explanation: 'ECS sends SIGTERM to the container and waits stopTimeout seconds before SIGKILL. Match the ALB deregistration delay to this value so the ALB stops sending new requests while the container finishes existing ones.'
    },
    {
      title: 'EKS nodes without the Cluster Autoscaler or Karpenter',
      wrong: `# Created fixed-size node group, no autoscaling
eksctl create cluster --nodes 3
# Pods pending when cluster is full; nodes idle at night`,
      right: `# Install Karpenter (modern) or Cluster Autoscaler
# Karpenter provisions nodes in seconds based on pending pod requirements
helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \\
  --namespace karpenter --create-namespace \\
  --set settings.clusterName=my-cluster`,
      explanation: 'A static node group wastes money during low-traffic periods and causes pod scheduling failures during traffic spikes. Karpenter is the modern choice — it provisions right-sized nodes in under 30 seconds based on pending pod resource requests.'
    },
  ];

  challenge: Challenge = {
    title: 'ECS Fargate Service with Secrets',
    language: 'typescript',
    description: `Write the AWS CLI command to register an ECS task definition for a Node.js API container. Requirements: Fargate, ARM64 architecture, 0.5 vCPU (512), 1 GB memory (1024), image from ECR, port 3000, DB_URL injected from Secrets Manager (not plaintext env var), logs to CloudWatch group /ecs/api, execution role and task role both referenced.`,
    hints: [
      'Use requires-compatibilities: ["FARGATE"] and networkMode: "awsvpc".',
      'CPU and memory at task level: "512" and "1024" (strings for the CLI).',
      'Use secrets[] with valueFrom pointing to the Secrets Manager ARN — not environment[] for sensitive values.',
      'logConfiguration needs awslogs-group, awslogs-region, awslogs-stream-prefix.',
      'runtimePlatform: cpuArchitecture ARM64, operatingSystemFamily LINUX.',
    ],
    starterCode: `const taskDef = {
  family: "api",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  cpu: "512",
  memory: "1024",
  executionRoleArn: "arn:aws:iam::123:role/ecsTaskExecutionRole",
  taskRoleArn: "arn:aws:iam::123:role/apiTaskRole",
  // TODO: runtimePlatform for ARM64
  containerDefinitions: [{
    name: "api",
    image: "123456789012.dkr.ecr.eu-west-1.amazonaws.com/api:latest",
    portMappings: [{ containerPort: 3000 }],
    // TODO: inject DB_URL from Secrets Manager (not plaintext)
    // TODO: CloudWatch log configuration
  }]
};

console.log(JSON.stringify(taskDef, null, 2));`,
    solution: `const taskDef = {
  family: "api",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  cpu: "512",
  memory: "1024",
  executionRoleArn: "arn:aws:iam::123:role/ecsTaskExecutionRole",
  taskRoleArn: "arn:aws:iam::123:role/apiTaskRole",
  runtimePlatform: {
    cpuArchitecture: "ARM64",
    operatingSystemFamily: "LINUX"
  },
  containerDefinitions: [{
    name: "api",
    image: "123456789012.dkr.ecr.eu-west-1.amazonaws.com/api:latest",
    portMappings: [{ containerPort: 3000, protocol: "tcp" }],
    secrets: [{
      name: "DB_URL",
      valueFrom: "arn:aws:secretsmanager:eu-west-1:123456789012:secret:prod/api/db-url"
    }],
    logConfiguration: {
      logDriver: "awslogs",
      options: {
        "awslogs-group": "/ecs/api",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
};

console.log(JSON.stringify(taskDef, null, 2));

// CLI command:
// aws ecs register-task-definition --cli-input-json "$(echo taskDef | jq .)"`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What network mode is required for ECS Fargate tasks?',
      options: ['bridge', 'host', 'awsvpc', 'none'],
      answer: 2,
      explanation: 'Fargate only supports awsvpc network mode. It gives each task its own ENI, private IP, and security group, enabling task-level network isolation.'
    },
    {
      q: 'Which role allows the ECS agent to pull a container image from ECR?',
      options: ['Task Role', 'Task Execution Role', 'Service Role', 'Instance Profile'],
      answer: 1,
      explanation: 'The Task Execution Role is used by the ECS agent for infrastructure operations: pulling container images from ECR, writing logs to CloudWatch, and reading secrets from Secrets Manager. The Task Role is for your application code.'
    },
    {
      q: 'What does an ECS Fargate Profile in EKS do?',
      options: [
        'Defines resource limits for Fargate pods',
        'Routes matching pods (by namespace/labels) to Fargate instead of EC2 nodes',
        'Enables GPU support for Fargate tasks',
        'Creates an ALB for Fargate-hosted services'
      ],
      answer: 1,
      explanation: 'A Fargate Profile defines namespace and label selectors. Pods matching those selectors are scheduled on Fargate instead of managed node group EC2 instances — no nodes to manage for those workloads.'
    },
    {
      q: 'What is the main cost difference between ECS and EKS?',
      options: [
        'ECS charges $0.10/hour for the cluster; EKS is free',
        'EKS charges $0.10/hour for the control plane; ECS control plane is free',
        'Both charge $0.10/hour for clusters',
        'Neither charges for cluster management'
      ],
      answer: 1,
      explanation: 'EKS charges $0.10/hour per cluster ($73/month) for the managed control plane. ECS control plane is free — you only pay for the EC2 or Fargate compute resources running your tasks.'
    },
    {
      q: 'Which ECS deployment strategy enables instant rollback by shifting ALB traffic?',
      options: ['Rolling update', 'Blue/Green with CodeDeploy', 'Canary', 'Recreate'],
      answer: 1,
      explanation: 'ECS Blue/Green deployments (with CodeDeploy) maintain two sets of tasks and two ALB target groups. Traffic shifts gradually (canary, linear) or all at once, and rollback is instant — just shift traffic back to the original target group.'
    },
    {
      q: 'What is the difference between EC2 launch type and Fargate launch type for ECS?',
      options: ['They are identical; Fargate is just a newer name', 'EC2 launch type requires you to provision and manage the underlying EC2 instances; Fargate is serverless — AWS manages the compute infrastructure', 'Fargate only works with EKS, not ECS', 'EC2 launch type is always more expensive than Fargate'],
      answer: 1,
      explanation: 'With the EC2 launch type, you manage a cluster of EC2 instances (patching, scaling, capacity planning) that ECS schedules containers onto. Fargate removes this entirely — you specify CPU/memory per task and AWS provisions and manages the underlying compute, charging per task resource usage. Fargate trades some cost efficiency at scale for significantly reduced operational overhead.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose ECS over EKS?',
      a: 'Choose ECS when: you\'re building AWS-native microservices and don\'t need cross-cloud portability; your team doesn\'t have Kubernetes expertise; you want simpler IAM (task roles vs IRSA); you want to avoid the $73/month EKS control plane cost; and you want tighter built-in AWS integrations (Service Connect, App Mesh, CloudWatch Container Insights). Choose EKS when you need Kubernetes portability, an existing K8s investment, or the broader CNCF ecosystem (ArgoCD, Istio, Helm).'
    },
    {
      q: 'How does ECS Blue/Green deployment differ from a rolling update?',
      a: 'Rolling update replaces tasks in-place: old and new tasks run simultaneously behind the same target group, with minimumHealthyPercent/maximumPercent controlling the overlap. Blue/Green (via CodeDeploy) keeps two separate sets of tasks (blue = old, green = new) behind two target groups. Traffic shifts from blue to green according to a configured schedule (canary, linear, all-at-once). Rollback is instant — just shift traffic back to blue — whereas rolling update rollback requires re-deploying the old image.'
    },
    {
      q: 'What is the difference between the ECS execution role and task role?',
      a: 'The execution role is used by the ECS agent (the AWS infrastructure layer) to: pull the container image from ECR, write container logs to CloudWatch, and read secrets from Secrets Manager or SSM Parameter Store. The task role is the IAM identity assumed by your application code running inside the container — it determines what AWS APIs your app can call (S3, DynamoDB, SQS, etc.). Both are needed and serve entirely different purposes.'
    },
    {
      q: 'How does the AWS VPC CNI differ from typical Kubernetes CNI plugins?',
      a: 'Most K8s CNI plugins use an overlay network (VXLAN, Geneve) that assigns pods IP addresses from a separate pod CIDR, requiring encapsulation for inter-node traffic. The AWS VPC CNI allocates real VPC IP addresses directly to pods using secondary IPs on node ENIs. This means pods are directly routable within the VPC without encapsulation overhead, can be reached by ALBs, RDS, and other VPC resources without NAT, and their traffic appears in VPC Flow Logs.'
    },
    {
      q: 'When should you choose ECS over EKS for running containers on AWS?',
      a: 'ECS is AWS\'s own simpler, proprietary container orchestrator — easier to learn, tightly integrated with AWS services, and sufficient for most teams not requiring Kubernetes-specific features or portability. EKS runs actual upstream Kubernetes, which is the right choice if you need Kubernetes-specific tooling/ecosystem (Helm charts, operators), multi-cloud portability, or your team already has deep Kubernetes expertise. For AWS-only teams without existing Kubernetes investment, ECS is often the lower-overhead choice.',
    },
    {
      q: 'What is an ECS Task Definition, and how does it relate to a running Task?',
      a: 'A Task Definition is a JSON blueprint describing one or more containers to run together (image, CPU/memory, port mappings, environment variables, IAM role) — analogous to a Kubernetes Pod spec. A Task is a running instance of that Task Definition, scheduled onto either EC2 or Fargate compute. Task Definitions are versioned (each update creates a new revision), letting you roll back to a previous definition revision if a new deployment causes issues.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ECS runs containers with simpler AWS-native APIs; EKS provides managed Kubernetes with the full CNCF ecosystem — both support Fargate for serverless compute.',
    mustKnow: [
      'Task Definition = container blueprint; Service = keeps N tasks running + ALB integration',
      'Fargate requires awsvpc network mode; each task gets its own ENI and security group',
      'Execution role = ECS agent (pull image, write logs); Task role = application AWS calls',
      'EKS control plane costs $0.10/hr; ECS control plane is free',
      'Managed Node Groups handle draining, AMI updates, and ASG lifecycle automatically',
      'Fargate Profile routes matching pods to Fargate — no EC2 nodes for those workloads',
      'AWS VPC CNI gives pods real VPC IPs — directly routable, no overlay network overhead',
    ],
    interviewFocus: [
      'ECS execution role vs task role — what each is used for',
      'ECS rolling update vs Blue/Green (CodeDeploy) — rollback speed and traffic control',
      'ECS vs EKS decision criteria — complexity, cost, portability',
      'IRSA for EKS pods — how projected service account tokens replace access keys',
      'AWS VPC CNI vs overlay CNI — why pod IPs are directly routable in AWS',
    ],
  };
}
