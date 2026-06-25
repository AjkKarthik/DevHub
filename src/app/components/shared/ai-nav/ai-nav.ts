import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

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
      <a routerLink="/ai/ml-fundamentals" routerLinkActive="active"><span class="nl-text">AI &amp; ML Fundamentals</span>@if(p.isDone('ai-ml-fundamentals')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/math-for-ml" routerLinkActive="active"><span class="nl-text">Mathematics for ML</span>@if(p.isDone('ai-math-for-ml')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Machine Learning</p>
      <a routerLink="/ai/linear-logistic-regression" routerLinkActive="active"><span class="nl-text">Linear &amp; Logistic Regression</span>@if(p.isDone('ai-linear-logistic-regression')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/decision-trees" routerLinkActive="active"><span class="nl-text">Decision Trees &amp; Random Forests</span>@if(p.isDone('ai-decision-trees')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/gradient-boosting" routerLinkActive="active"><span class="nl-text">Gradient Boosting (XGBoost)</span>@if(p.isDone('ai-gradient-boosting')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/clustering" routerLinkActive="active"><span class="nl-text">Clustering &amp; Dimensionality</span>@if(p.isDone('ai-clustering')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Deep Learning</p>
      <a routerLink="/ai/neural-networks" routerLinkActive="active"><span class="nl-text">Neural Networks</span>@if(p.isDone('ai-neural-networks')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/computer-vision" routerLinkActive="active"><span class="nl-text">CNNs &amp; Computer Vision</span>@if(p.isDone('ai-computer-vision')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/transformers" routerLinkActive="active"><span class="nl-text">Transformers &amp; Attention</span>@if(p.isDone('ai-transformers')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">LLMs</p>
      <a routerLink="/ai/llm-fundamentals" routerLinkActive="active"><span class="nl-text">LLM Fundamentals</span>@if(p.isDone('ai-llm-fundamentals')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/ai/fine-tuning" routerLinkActive="active"><span class="nl-text">Fine-tuning &amp; RLHF</span>@if(p.isDone('ai-fine-tuning')){<span class="nl-done">✓</span>}</a>
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
}
