import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-ai-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/ai" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 AI/ML Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/ai/ml-fundamentals" routerLinkActive="active"><span class="nl-text">AI &amp; ML Fundamentals</span>@if(p.isDone('ai-ml-fundamentals')){<span class="nl-done">✓</span>}@if (subtopicsOf('ml-fundamentals'); as mlFundamentalsSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('ml-fundamentals', $event)">{{ isSubtopicsExpanded('ml-fundamentals') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('ml-fundamentals'); as mlFundamentalsSubs) {
        @if (isSubtopicsExpanded('ml-fundamentals')) {
          <div class="nav-subtopics">
            @for (sub of mlFundamentalsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/math-for-ml" routerLinkActive="active"><span class="nl-text">Mathematics for ML</span>@if(p.isDone('ai-math-for-ml')){<span class="nl-done">✓</span>}@if (subtopicsOf('math-for-ml'); as mathForMlSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('math-for-ml', $event)">{{ isSubtopicsExpanded('math-for-ml') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('math-for-ml'); as mathForMlSubs) {
        @if (isSubtopicsExpanded('math-for-ml')) {
          <div class="nav-subtopics">
            @for (sub of mathForMlSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Machine Learning</p>
      <a routerLink="/ai/linear-logistic-regression" routerLinkActive="active"><span class="nl-text">Linear &amp; Logistic Regression</span>@if(p.isDone('ai-linear-logistic-regression')){<span class="nl-done">✓</span>}@if (subtopicsOf('linear-logistic-regression'); as linearLogisticRegressionSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('linear-logistic-regression', $event)">{{ isSubtopicsExpanded('linear-logistic-regression') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('linear-logistic-regression'); as linearLogisticRegressionSubs) {
        @if (isSubtopicsExpanded('linear-logistic-regression')) {
          <div class="nav-subtopics">
            @for (sub of linearLogisticRegressionSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/decision-trees" routerLinkActive="active"><span class="nl-text">Decision Trees &amp; Random Forests</span>@if(p.isDone('ai-decision-trees')){<span class="nl-done">✓</span>}@if (subtopicsOf('decision-trees'); as decisionTreesSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('decision-trees', $event)">{{ isSubtopicsExpanded('decision-trees') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('decision-trees'); as decisionTreesSubs) {
        @if (isSubtopicsExpanded('decision-trees')) {
          <div class="nav-subtopics">
            @for (sub of decisionTreesSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/gradient-boosting" routerLinkActive="active"><span class="nl-text">Gradient Boosting (XGBoost)</span>@if(p.isDone('ai-gradient-boosting')){<span class="nl-done">✓</span>}@if (subtopicsOf('gradient-boosting'); as gradientBoostingSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('gradient-boosting', $event)">{{ isSubtopicsExpanded('gradient-boosting') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('gradient-boosting'); as gradientBoostingSubs) {
        @if (isSubtopicsExpanded('gradient-boosting')) {
          <div class="nav-subtopics">
            @for (sub of gradientBoostingSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/clustering" routerLinkActive="active"><span class="nl-text">Clustering &amp; Dimensionality</span>@if(p.isDone('ai-clustering')){<span class="nl-done">✓</span>}@if (subtopicsOf('clustering'); as clusteringSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('clustering', $event)">{{ isSubtopicsExpanded('clustering') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('clustering'); as clusteringSubs) {
        @if (isSubtopicsExpanded('clustering')) {
          <div class="nav-subtopics">
            @for (sub of clusteringSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Deep Learning</p>
      <a routerLink="/ai/neural-networks" routerLinkActive="active"><span class="nl-text">Neural Networks</span>@if(p.isDone('ai-neural-networks')){<span class="nl-done">✓</span>}@if (subtopicsOf('neural-networks'); as neuralNetworksSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('neural-networks', $event)">{{ isSubtopicsExpanded('neural-networks') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('neural-networks'); as neuralNetworksSubs) {
        @if (isSubtopicsExpanded('neural-networks')) {
          <div class="nav-subtopics">
            @for (sub of neuralNetworksSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/computer-vision" routerLinkActive="active"><span class="nl-text">CNNs &amp; Computer Vision</span>@if(p.isDone('ai-computer-vision')){<span class="nl-done">✓</span>}@if (subtopicsOf('computer-vision'); as computerVisionSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('computer-vision', $event)">{{ isSubtopicsExpanded('computer-vision') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('computer-vision'); as computerVisionSubs) {
        @if (isSubtopicsExpanded('computer-vision')) {
          <div class="nav-subtopics">
            @for (sub of computerVisionSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/transformers" routerLinkActive="active"><span class="nl-text">Transformers &amp; Attention</span>@if(p.isDone('ai-transformers')){<span class="nl-done">✓</span>}@if (subtopicsOf('transformers'); as transformersSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('transformers', $event)">{{ isSubtopicsExpanded('transformers') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('transformers'); as transformersSubs) {
        @if (isSubtopicsExpanded('transformers')) {
          <div class="nav-subtopics">
            @for (sub of transformersSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">LLMs</p>
      <a routerLink="/ai/llm-fundamentals" routerLinkActive="active"><span class="nl-text">LLM Fundamentals</span>@if(p.isDone('ai-llm-fundamentals')){<span class="nl-done">✓</span>}@if (subtopicsOf('llm-fundamentals'); as llmFundamentalsSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('llm-fundamentals', $event)">{{ isSubtopicsExpanded('llm-fundamentals') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('llm-fundamentals'); as llmFundamentalsSubs) {
        @if (isSubtopicsExpanded('llm-fundamentals')) {
          <div class="nav-subtopics">
            @for (sub of llmFundamentalsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/fine-tuning" routerLinkActive="active"><span class="nl-text">Fine-tuning &amp; RLHF</span>@if(p.isDone('ai-fine-tuning')){<span class="nl-done">✓</span>}@if (subtopicsOf('fine-tuning'); as fineTuningSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('fine-tuning', $event)">{{ isSubtopicsExpanded('fine-tuning') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('fine-tuning'); as fineTuningSubs) {
        @if (isSubtopicsExpanded('fine-tuning')) {
          <div class="nav-subtopics">
            @for (sub of fineTuningSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/ai/rag" routerLinkActive="active"><span class="nl-text">RAG</span>@if(p.isDone('ai-rag')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/evaluating-llms" routerLinkActive="active"><span class="nl-text">Evaluating LLM Outputs</span>@if(p.isDone('ai-evaluating-llms')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Prompt Eng. &amp; Agents</p>
      <a routerLink="/ai/prompt-engineering" routerLinkActive="active"><span class="nl-text">Prompt Engineering</span>@if(p.isDone('ai-prompt-engineering')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/ai-agents" routerLinkActive="active"><span class="nl-text">AI Agents &amp; Tool Use</span>@if(p.isDone('ai-ai-agents')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/vector-databases" routerLinkActive="active"><span class="nl-text">Vector Databases</span>@if(p.isDone('ai-vector-databases')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/ai-engineering" routerLinkActive="active"><span class="nl-text">AI Engineering Patterns</span>@if(p.isDone('ai-ai-engineering')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">MLOps</p>
      <a routerLink="/ai/mlops" routerLinkActive="active"><span class="nl-text">MLOps &amp; Deployment</span>@if(p.isDone('ai-mlops')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/hugging-face" routerLinkActive="active"><span class="nl-text">Hugging Face</span>@if(p.isDone('ai-hugging-face')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/ai/interview-prep" routerLinkActive="active"><span class="nl-text">AI Interview Prep</span></a>
      <a routerLink="/ai/responsible-ai" routerLinkActive="active"><span class="nl-text">Responsible AI &amp; Ethics</span></a>
      <a routerLink="/ai/ai-dotnet" routerLinkActive="active"><span class="nl-text">AI with .NET &amp; C#</span></a>
    </div>
  `,
})
export class AiNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  private expandedTopics = signal<Set<string>>(new Set());

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [slug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(slug));
      }
    }
  }

  subtopicsOf(slug: string) {
    return SUBTOPICS[slug] ?? null;
  }

  isSubtopicsExpanded(slug: string): boolean {
    return this.expandedTopics().has(slug);
  }

  toggleSubtopics(slug: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.expandedTopics.update(set => {
      const next = new Set(set);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }
}

