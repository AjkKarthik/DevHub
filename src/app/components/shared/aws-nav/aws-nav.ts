import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';
import { SUBTOPICS } from '../../../data/subtopics';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-aws-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/aws" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">☁ AWS Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/aws/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">AWS Fundamentals</span>
        @if (p.isDone('aws-fundamentals')) {<span class="nl-done">✓</span>}
        @if (d('aws-fundamentals'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('aws-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('aws-fundamentals')"
                  (click)="toggleSubtopics('aws-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('aws-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('aws-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Compute</p>
      <a routerLink="/aws/ec2" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">EC2 &amp; Auto Scaling</span>
        @if (p.isDone('aws-ec2')) {<span class="nl-done">✓</span>}
        @if (d('aws-ec2'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('ec2')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('ec2')"
                  (click)="toggleSubtopics('ec2', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('ec2'); as ec2Subs) {
        @if (isSubtopicsExpanded('ec2')) {
          <div class="nav-subtopics">
            @for (s of ec2Subs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/aws/ecs-eks" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">ECS &amp; EKS</span>
        @if (p.isDone('aws-ecs-eks')) {<span class="nl-done">✓</span>}
        @if (d('aws-ecs-eks'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('ecs-eks')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('ecs-eks')"
                  (click)="toggleSubtopics('ecs-eks', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('ecs-eks'); as ecsEksSubs) {
        @if (isSubtopicsExpanded('ecs-eks')) {
          <div class="nav-subtopics">
            @for (s of ecsEksSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Networking</p>
      <a routerLink="/aws/vpc" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">VPC &amp; Networking</span>
        @if (p.isDone('aws-vpc')) {<span class="nl-done">✓</span>}
        @if (d('aws-vpc'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('vpc')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('vpc')"
                  (click)="toggleSubtopics('vpc', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('vpc'); as vpcSubs) {
        @if (isSubtopicsExpanded('vpc')) {
          <div class="nav-subtopics">
            @for (s of vpcSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/aws/route53-cloudfront" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Route 53 &amp; CloudFront</span>
        @if (p.isDone('aws-route53-cloudfront')) {<span class="nl-done">✓</span>}
        @if (d('aws-route53-cloudfront'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('route53-cloudfront')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('route53-cloudfront')"
                  (click)="toggleSubtopics('route53-cloudfront', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('route53-cloudfront'); as r53Subs) {
        @if (isSubtopicsExpanded('route53-cloudfront')) {
          <div class="nav-subtopics">
            @for (s of r53Subs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/aws/load-balancing" routerLinkActive="active"><span class="nl-text">Elastic Load Balancing</span>@if(p.isDone('aws-load-balancing')){<span class="nl-done">✓</span>}@if(d('aws-load-balancing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Storage</p>
      <a routerLink="/aws/s3" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">S3</span>
        @if (p.isDone('aws-s3')) {<span class="nl-done">✓</span>}
        @if (d('aws-s3'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('s3')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('s3')"
                  (click)="toggleSubtopics('s3', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('s3'); as s3Subs) {
        @if (isSubtopicsExpanded('s3')) {
          <div class="nav-subtopics">
            @for (s of s3Subs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/aws/ebs-efs" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">EBS, EFS &amp; FSx</span>
        @if (p.isDone('aws-ebs-efs')) {<span class="nl-done">✓</span>}
        @if (d('aws-ebs-efs'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('ebs-efs')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('ebs-efs')"
                  (click)="toggleSubtopics('ebs-efs', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('ebs-efs'); as ebsEfsSubs) {
        @if (isSubtopicsExpanded('ebs-efs')) {
          <div class="nav-subtopics">
            @for (s of ebsEfsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">IAM</p>
      <a routerLink="/aws/iam" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">IAM</span>
        @if (p.isDone('aws-iam')) {<span class="nl-done">✓</span>}
        @if (d('aws-iam'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('iam')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('iam')"
                  (click)="toggleSubtopics('iam', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('iam'); as iamSubs) {
        @if (isSubtopicsExpanded('iam')) {
          <div class="nav-subtopics">
            @for (s of iamSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/aws/iam-roles" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">IAM Roles &amp; Federation</span>
        @if (p.isDone('aws-iam-roles')) {<span class="nl-done">✓</span>}
        @if (d('aws-iam-roles'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('iam-roles')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('iam-roles')"
                  (click)="toggleSubtopics('iam-roles', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('iam-roles'); as iamRolesSubs) {
        @if (isSubtopicsExpanded('iam-roles')) {
          <div class="nav-subtopics">
            @for (s of iamRolesSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Databases</p>
      <a routerLink="/aws/rds-aurora" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">RDS &amp; Aurora</span>
        @if (p.isDone('aws-rds-aurora')) {<span class="nl-done">✓</span>}
        @if (d('aws-rds-aurora'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('rds-aurora')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('rds-aurora')"
                  (click)="toggleSubtopics('rds-aurora', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('rds-aurora'); as rdsSubs) {
        @if (isSubtopicsExpanded('rds-aurora')) {
          <div class="nav-subtopics">
            @for (s of rdsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/aws/dynamodb" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">DynamoDB</span>
        @if (p.isDone('aws-dynamodb')) {<span class="nl-done">✓</span>}
        @if (d('aws-dynamodb'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('dynamodb')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('dynamodb')"
                  (click)="toggleSubtopics('dynamodb', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('dynamodb'); as ddbSubs) {
        @if (isSubtopicsExpanded('dynamodb')) {
          <div class="nav-subtopics">
            @for (s of ddbSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Serverless</p>
      <a routerLink="/aws/lambda" routerLinkActive="active"><span class="nl-text">Lambda</span>@if(p.isDone('aws-lambda')){<span class="nl-done">✓</span>}@if(d('aws-lambda');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/api-gateway" routerLinkActive="active"><span class="nl-text">API Gateway</span>@if(p.isDone('aws-api-gateway')){<span class="nl-done">✓</span>}@if(d('aws-api-gateway');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/sqs-sns" routerLinkActive="active"><span class="nl-text">SQS &amp; SNS</span>@if(p.isDone('aws-sqs-sns')){<span class="nl-done">✓</span>}@if(d('aws-sqs-sns');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/eventbridge" routerLinkActive="active"><span class="nl-text">EventBridge</span>@if(p.isDone('aws-eventbridge')){<span class="nl-done">✓</span>}@if(d('aws-eventbridge');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/step-functions" routerLinkActive="active"><span class="nl-text">Step Functions</span>@if(p.isDone('aws-step-functions')){<span class="nl-done">✓</span>}@if(d('aws-step-functions');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Operations</p>
      <a routerLink="/aws/cloudwatch" routerLinkActive="active"><span class="nl-text">CloudWatch &amp; X-Ray</span>@if(p.isDone('aws-cloudwatch')){<span class="nl-done">✓</span>}@if(d('aws-cloudwatch');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/cloudformation-cdk" routerLinkActive="active"><span class="nl-text">CloudFormation &amp; CDK</span>@if(p.isDone('aws-cloudformation-cdk')){<span class="nl-done">✓</span>}@if(d('aws-cloudformation-cdk');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/security" routerLinkActive="active"><span class="nl-text">AWS Security Services</span>@if(p.isDone('aws-security')){<span class="nl-done">✓</span>}@if(d('aws-security');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/aws/cost-optimization" routerLinkActive="active"><span class="nl-text">Cost Optimization</span>@if(p.isDone('aws-cost-optimization')){<span class="nl-done">✓</span>}@if(d('aws-cost-optimization');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/aws/cheatsheet" routerLinkActive="active"><span class="nl-text">AWS Cheat Sheet</span></a>
    </div>
  `,
  styles: []
})
export class AwsNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  d(route: string): string | null { return DIFF[route] ?? null; }

  subtopicsOf(routeSlug: string) {
    return SUBTOPICS[routeSlug] ?? null;
  }

  private expandedTopics = signal<Set<string>>(new Set());

  isSubtopicsExpanded(routeSlug: string): boolean {
    return this.expandedTopics().has(routeSlug);
  }

  toggleSubtopics(routeSlug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = new Set(this.expandedTopics());
    next.has(routeSlug) ? next.delete(routeSlug) : next.add(routeSlug);
    this.expandedTopics.set(next);
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [topicSlug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(topicSlug));
        break;
      }
    }
  }
}
