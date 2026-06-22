import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface CliCommand { cmd: string; desc: string; }
interface CliSection { heading: string; commands: CliCommand[]; }
interface NamingRule { resource: string; prefix: string; example: string; constraints: string; }
interface ServiceRef { service: string; key: string; limit: string; sku: string; }
interface PortalShortcut { keys: string; action: string; }

@Component({
  selector: 'app-azure-cheatsheet',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class AzureCheatsheet {
  activeTab = signal<'cli' | 'naming' | 'services' | 'portal'>('cli');
  setTab(t: 'cli' | 'naming' | 'services' | 'portal') { this.activeTab.set(t); }

  cliSections: CliSection[] = [
    {
      heading: 'Account & Subscription',
      commands: [
        { cmd: 'az login', desc: 'Authenticate to Azure (browser-based)' },
        { cmd: 'az login --tenant <tenant-id>', desc: 'Login to a specific Entra ID tenant' },
        { cmd: 'az account list --output table', desc: 'List all accessible subscriptions' },
        { cmd: 'az account set --subscription <id-or-name>', desc: 'Set the active subscription for all commands' },
        { cmd: 'az account show', desc: 'Show current subscription details' },
        { cmd: 'az account get-access-token', desc: 'Get a bearer token for the current principal' },
        { cmd: 'az logout', desc: 'Sign out and clear cached credentials' },
      ]
    },
    {
      heading: 'Resource Groups & Management',
      commands: [
        { cmd: 'az group create --name my-rg --location eastus', desc: 'Create a resource group' },
        { cmd: 'az group list --output table', desc: 'List all resource groups' },
        { cmd: 'az group delete --name my-rg --yes --no-wait', desc: 'Delete a resource group and all resources (async)' },
        { cmd: 'az resource list --resource-group my-rg --output table', desc: 'List all resources in a resource group' },
        { cmd: 'az resource show --ids <resource-id>', desc: 'Show details of a specific resource by ARM resource ID' },
        { cmd: 'az tag create --resource-id <id> --tags Env=prod', desc: 'Add tags to a resource' },
        { cmd: 'az lock create --name no-delete --resource-group my-rg --lock-type CanNotDelete', desc: 'Apply a delete lock to a resource group' },
      ]
    },
    {
      heading: 'ARM Deployments & Bicep',
      commands: [
        { cmd: 'az deployment group create -g my-rg --template-file main.bicep', desc: 'Deploy a Bicep/ARM template to a resource group' },
        { cmd: 'az deployment group create -g my-rg --template-file main.bicep --parameters @params.json', desc: 'Deploy with a parameters file' },
        { cmd: 'az deployment group what-if -g my-rg --template-file main.bicep', desc: 'Preview changes before deploying (what-if)' },
        { cmd: 'az deployment group list -g my-rg --output table', desc: 'List all deployments in a resource group' },
        { cmd: 'az bicep build --file main.bicep', desc: 'Compile Bicep to ARM JSON' },
        { cmd: 'az bicep decompile --file template.json', desc: 'Convert ARM JSON to Bicep' },
        { cmd: 'az deployment group cancel -g my-rg --name my-deployment', desc: 'Cancel an in-progress deployment' },
      ]
    },
    {
      heading: 'Compute: VMs & App Service',
      commands: [
        { cmd: 'az vm create -g my-rg -n my-vm --image Ubuntu2204 --size Standard_D2s_v3 --generate-ssh-keys', desc: 'Create a Linux VM' },
        { cmd: 'az vm list -g my-rg --output table', desc: 'List VMs in a resource group' },
        { cmd: 'az vm start/stop/restart -g my-rg -n my-vm', desc: 'Start, stop, or restart a VM' },
        { cmd: 'az vm show -g my-rg -n my-vm --query publicIps -o tsv', desc: 'Get the public IP of a VM' },
        { cmd: 'az vm deallocate -g my-rg -n my-vm', desc: 'Deallocate VM (stop billing for compute, keep disks)' },
        { cmd: 'az webapp create -g my-rg --plan my-plan --name my-app --runtime "DOTNET:8.0"', desc: 'Create an App Service web app' },
        { cmd: 'az webapp deployment source config-zip -g my-rg -n my-app --src app.zip', desc: 'Deploy a zip to App Service' },
      ]
    },
    {
      heading: 'Networking',
      commands: [
        { cmd: 'az network vnet create -g my-rg -n my-vnet --address-prefix 10.0.0.0/16', desc: 'Create a virtual network' },
        { cmd: 'az network vnet subnet create -g my-rg --vnet-name my-vnet -n my-subnet --address-prefix 10.0.1.0/24', desc: 'Add a subnet to a VNet' },
        { cmd: 'az network nsg create -g my-rg -n my-nsg', desc: 'Create a network security group' },
        { cmd: 'az network nsg rule create -g my-rg --nsg-name my-nsg -n allow-ssh --priority 100 --destination-port-ranges 22 --access Allow --protocol Tcp', desc: 'Add an NSG inbound rule' },
        { cmd: 'az network public-ip create -g my-rg -n my-pip --sku Standard --allocation-method Static', desc: 'Create a static Standard public IP' },
        { cmd: 'az network vnet peering create --name peer-a-to-b -g rg-a --vnet-name vnet-a --remote-vnet /subscriptions/.../vnet-b --allow-vnet-access', desc: 'Create VNet peering (run in both directions)' },
      ]
    },
    {
      heading: 'Storage & Key Vault',
      commands: [
        { cmd: 'az storage account create -g my-rg -n mystorageacct --sku Standard_LRS --kind StorageV2', desc: 'Create a general-purpose v2 storage account' },
        { cmd: 'az storage container create --name my-container --account-name mystorageacct', desc: 'Create a blob container' },
        { cmd: 'az storage blob upload --account-name mystorageacct -c my-container -f ./file.txt -n file.txt', desc: 'Upload a file to blob storage' },
        { cmd: 'az keyvault create -g my-rg -n my-kv --enable-rbac-authorization true', desc: 'Create a Key Vault with RBAC model' },
        { cmd: 'az keyvault secret set --vault-name my-kv --name my-secret --value "hunter2"', desc: 'Set a secret in Key Vault' },
        { cmd: 'az keyvault secret show --vault-name my-kv --name my-secret --query value -o tsv', desc: 'Retrieve a secret value' },
      ]
    },
    {
      heading: 'Identity & RBAC',
      commands: [
        { cmd: 'az ad user show --id user@company.com', desc: 'Look up an Entra ID user' },
        { cmd: 'az ad sp create-for-rbac --name my-sp --role Contributor --scopes /subscriptions/<sub-id>', desc: 'Create a service principal with Contributor on a subscription' },
        { cmd: 'az role assignment create --assignee <objectId> --role "Storage Blob Data Contributor" --scope <resource-id>', desc: 'Assign an RBAC role to a principal' },
        { cmd: 'az role assignment list --assignee <objectId> --output table', desc: 'List role assignments for a principal' },
        { cmd: 'az identity create -g my-rg -n my-mi', desc: 'Create a user-assigned Managed Identity' },
        { cmd: 'az vm identity assign -g my-rg -n my-vm --identities my-mi', desc: 'Assign a user-assigned MI to a VM' },
      ]
    },
    {
      heading: 'AKS & Containers',
      commands: [
        { cmd: 'az aks create -g my-rg -n my-aks --node-count 2 --generate-ssh-keys --enable-managed-identity', desc: 'Create an AKS cluster with managed identity' },
        { cmd: 'az aks get-credentials -g my-rg -n my-aks', desc: 'Download kubeconfig and set kubectl context' },
        { cmd: 'az aks nodepool add -g my-rg --cluster-name my-aks -n spotpool --node-vm-size Standard_D4s_v3 --priority Spot', desc: 'Add a Spot node pool to an AKS cluster' },
        { cmd: 'az acr create -g my-rg -n myregistry --sku Basic', desc: 'Create an Azure Container Registry' },
        { cmd: 'az acr build --registry myregistry --image myapp:v1 .', desc: 'Build and push a container image via ACR Tasks' },
        { cmd: 'az aks update -g my-rg -n my-aks --attach-acr myregistry', desc: 'Grant AKS pull access to ACR' },
      ]
    },
  ];

  namingRules: NamingRule[] = [
    { resource: 'Resource Group', prefix: 'rg-', example: 'rg-myapp-prod-eus', constraints: '1–90 chars; letters, numbers, underscores, hyphens, periods; case-insensitive' },
    { resource: 'Virtual Machine', prefix: 'vm-', example: 'vm-web-prod-001', constraints: '1–15 chars (Windows), 1–64 (Linux); no special chars except hyphen; unique per RG' },
    { resource: 'Virtual Network', prefix: 'vnet-', example: 'vnet-myapp-prod-eus', constraints: '2–64 chars; alphanumeric, underscore, hyphen, period' },
    { resource: 'Subnet', prefix: 'snet-', example: 'snet-web-prod-001', constraints: '1–80 chars; alphanumeric, underscore, hyphen, period' },
    { resource: 'Network Security Group', prefix: 'nsg-', example: 'nsg-web-prod-eus', constraints: '1–80 chars; alphanumeric, underscore, hyphen, period' },
    { resource: 'Public IP', prefix: 'pip-', example: 'pip-lb-prod-eus', constraints: '1–80 chars; alphanumeric, underscore, hyphen, period' },
    { resource: 'Storage Account', prefix: 'st', example: 'stmyappprodeus001', constraints: '3–24 chars; lowercase letters and numbers ONLY; globally unique' },
    { resource: 'Key Vault', prefix: 'kv-', example: 'kv-myapp-prod-eus', constraints: '3–24 chars; alphanumeric and hyphens; globally unique; starts with letter' },
    { resource: 'App Service Plan', prefix: 'plan-', example: 'plan-myapp-prod-eus', constraints: '1–40 chars; alphanumeric and hyphens' },
    { resource: 'App Service (Web App)', prefix: 'app-', example: 'app-myapp-prod-eus', constraints: '2–60 chars; alphanumeric and hyphens; globally unique (.azurewebsites.net)' },
    { resource: 'Azure Container Registry', prefix: 'cr', example: 'crmyappprodeus', constraints: '5–50 chars; alphanumeric; globally unique; no hyphens' },
    { resource: 'AKS Cluster', prefix: 'aks-', example: 'aks-myapp-prod-eus', constraints: '1–63 chars; alphanumeric and hyphens; starts/ends with alphanumeric' },
    { resource: 'SQL Server (logical)', prefix: 'sql-', example: 'sql-myapp-prod-eus', constraints: '1–63 chars; lowercase letters, numbers, hyphens; globally unique' },
    { resource: 'SQL Database', prefix: 'sqldb-', example: 'sqldb-myapp-prod', constraints: '1–128 chars; cannot use: <>*%&:,./?' },
    { resource: 'Azure Function App', prefix: 'func-', example: 'func-myapp-prod-eus', constraints: '2–60 chars; alphanumeric and hyphens; globally unique (.azurewebsites.net)' },
    { resource: 'Service Bus Namespace', prefix: 'sb-', example: 'sb-myapp-prod-eus', constraints: '6–50 chars; alphanumeric and hyphens; globally unique' },
    { resource: 'API Management', prefix: 'apim-', example: 'apim-myapp-prod-eus', constraints: '1–50 chars; alphanumeric and hyphens; globally unique (.azure-api.net)' },
    { resource: 'Log Analytics Workspace', prefix: 'log-', example: 'log-myapp-prod-eus', constraints: '4–63 chars; alphanumeric and hyphens; globally unique per RG' },
  ];

  serviceRefs: ServiceRef[] = [
    { service: 'Azure VMs', key: 'OS disk + NIC + Public IP are separate resources. Deallocate (not just Stop) to stop billing.', limit: 'vCPU quota per region; soft limit, request increase via Support', sku: 'General: D-series; Compute: F-series; Memory: E-series; Storage: L-series; GPU: N-series' },
    { service: 'App Service', key: 'Apps on same plan share compute. Deployment slots on Standard+. Autoscale on Standard+.', limit: '10 deployment slots (Premium P2+); 100 apps per plan; 1 TB storage per plan', sku: 'Free F1 → Shared D1 → Basic B1/B2/B3 → Standard S1-S3 → Premium P0v3-P3v3 → Isolated I1v2-I3v2' },
    { service: 'Azure Functions', key: 'Consumption: scales to 0, billed per execution (1M free/month). Premium: pre-warmed, VNet, no cold start.', limit: 'Consumption: 5 min timeout default (10 min max); Premium: unlimited timeout; 200 instances max', sku: 'Consumption / Flex Consumption / Premium EP1-EP3 / Dedicated (same as App Service plan)' },
    { service: 'Azure Storage', key: 'LRS (3 copies same datacenter), ZRS (3 zones), GRS (+ paired region), GZRS (zones + paired region)', limit: '500 TB per storage account; 5 PiB per subscription per region; 20,000 IOPS per account', sku: 'Standard (HDD): LRS/GRS/ZRS/GZRS; Premium (SSD): LRS/ZRS only; Tiers: Hot/Cool/Cold/Archive' },
    { service: 'Azure SQL Database', key: 'vCore model: independently scale compute and storage. DTU: bundled (simpler, less flexible). Serverless: auto-pause after 1 hr idle.', limit: 'Max 4 TB storage (Business Critical); 128 vCores max; 56 GB memory max per DB', sku: 'General Purpose / Business Critical / Hyperscale; Serverless under General Purpose' },
    { service: 'Azure Cosmos DB', key: 'Partition key choice is permanent — high cardinality required. RU/s = request units/second. 400 RU/s minimum.', limit: '20 GB per logical partition; 10,000 RU/s per physical partition (burst); 1 PB total storage', sku: 'Provisioned Throughput / Serverless / Autoscale; APIs: Core(SQL) / Mongo / Cassandra / Gremlin / Table' },
    { service: 'Azure Cache for Redis', key: 'TLS port 6380 (not 6379). SCAN over KEYS in production. LRU eviction (allkeys-lru recommended).', limit: 'Basic/Standard: 53 GB max; Premium: 1.2 TB (cluster). Max 10,000 connections (Basic C6)', sku: 'Basic C0-C6 (dev only, no SLA) → Standard C0-C6 (replication) → Premium P1-P5 (persistence, VNet, geo)' },
    { service: 'Azure Service Bus', key: 'Queue: point-to-point (single consumer). Topic: pub/sub (multiple subscription consumers). AMQP port 5671.', limit: 'Standard: 256 KB max message; Premium: 100 MB. Basic: queues only. Premium: 1–16 messaging units', sku: 'Basic (queues, 256KB) / Standard (topics, 256KB, shared) / Premium (dedicated, up to 100MB, VNet, geo-DR)' },
    { service: 'Azure API Management', key: 'Policy pipeline: Inbound → Backend → Outbound → On-Error. Always use <base /> in child policies.', limit: 'Consumption: 500 req/sec per unit. Developer: 500 req/sec. Standard: 2500. Premium: 4000 per unit', sku: 'Consumption (serverless) / Developer (no SLA) / Basic / Standard / Premium (multi-region, VNet)' },
    { service: 'Azure Key Vault', key: 'Soft delete: 90-day retention (always on since 2023). Purge protection prevents permanent deletion. HSM keys: Premium tier only.', limit: '25,000 transactions per 10 sec per vault; 2000 secrets; 500 keys (premium HSM: higher)', sku: 'Standard (software-protected keys) / Premium (HSM-protected keys, HSM Key Vault)' },
    { service: 'Azure Virtual Network', key: '5 IPs reserved per subnet (.0 network, .1 gateway, .2-.3 Azure DNS, .255 broadcast). VNet peering is non-transitive.', limit: '65,536 IPs per VNet; 3,000 VNets per subscription; 250 subnets per VNet; 1000 NSG rules per NSG', sku: 'VNet is free. Charges for: VNet peering data transfer, Public IP, NAT Gateway, VPN Gateway, ExpressRoute' },
    { service: 'Azure Monitor / App Insights', key: 'Metrics: 93-day retention. Log Analytics: 30-day default (configurable 30–730 days). Diagnostic Settings required for resource logs.', limit: '10 GB/month free data ingestion per workspace; alerts: 1000 metric alert rules per subscription', sku: 'Pay-per-GB for Log Analytics ingestion; Application Insights: pay-per-GB; Metrics: free up to 10 metrics/resource' },
    { service: 'Azure Kubernetes Service', key: 'Control plane is free. Pay for node VMs, storage, networking. Cluster autoscaler: set min/max node counts per pool.', limit: '5000 nodes per cluster; 250 pods per node (Azure CNI); 110 pods/node (kubenet); 100 node pools', sku: 'Standard tier (99.95% SLA, Uptime SLA) / Free tier (no SLA — dev only)' },
    { service: 'Azure DevOps Pipelines', key: 'YAML hierarchy: Pipeline → Stages → Jobs → Steps. Microsoft-hosted agents: build in 2GB RAM, 10GB disk.', limit: '1 free parallel job (public); 1800 min/month free (private). Additional parallel jobs: pay per job', sku: 'Basic plan (up to 5 users free); Basic + Test Plans; GitHub Advanced Security for Azure DevOps (paid)' },
  ];

  portalShortcuts: PortalShortcut[] = [
    { keys: 'G + /  (type > in search)', action: 'Open the global search box — search resources, services, docs' },
    { keys: 'G + H', action: 'Go to Home' },
    { keys: 'G + D', action: 'Go to Dashboard' },
    { keys: 'G + N', action: 'Open the Notifications panel (recent activity)' },
    { keys: 'G + S', action: 'Open Settings' },
    { keys: 'G + B', action: 'Open All services / Browse' },
    { keys: 'G + ,', action: 'Toggle Favourites panel' },
    { keys: '? (question mark)', action: 'Open the keyboard shortcuts panel in the portal' },
    { keys: 'Ctrl + Shift + D (browser)', action: 'Open Azure Cloud Shell in a new browser tab (if already configured)' },
    { keys: 'Cloud Shell: az interactive', action: 'Enable Azure CLI interactive mode with auto-complete and docs in the shell' },
    { keys: 'Portal search: @type:', action: 'Filter search by resource type — e.g., @type:storageaccounts my-app' },
    { keys: 'Portal search: /resource-group', action: 'Go directly to All Resource Groups from the search box' },
    { keys: 'Pin to Dashboard', action: 'Click the pin icon on any blade header — pin cost views, metrics, queries for quick access' },
    { keys: 'Shift + Click (breadcrumb)', action: 'Open the parent breadcrumb item in a new browser tab — useful for comparing resources' },
    { keys: 'ESC', action: 'Close the current portal blade / side panel' },
  ];
}
