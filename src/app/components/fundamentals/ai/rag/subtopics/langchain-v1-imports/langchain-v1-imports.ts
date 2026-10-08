import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-langchain-v1-imports',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './langchain-v1-imports.html',
  styleUrl: './langchain-v1-imports.scss'
})
export class LangchainV1ImportsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against the published packages",
      "points": [
        "Installed versions: langchain 1.5.16, @langchain/core 1.2.17, @langchain/textsplitters 1.0.2, @langchain/classic 1.0.52.",
        "The <code>exports</code> map of langchain 1.5.16 contains no <code>vectorstores/memory</code>, <code>text_splitter</code> or <code>chains/*</code> entries, so the page's four imports would fail to resolve.",
        "@langchain/classic exports <code>./vectorstores/memory</code>, <code>./chains/retrieval</code>, <code>./chains/combine_documents</code> and <code>./text_splitter</code>.",
        "The splitter is also published on its own as @langchain/textsplitters, which is the package the page now uses."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Old vs new",
      "language": "typescript",
      "code": "// Before (langchain 0.x paths)\n// import { MemoryVectorStore } from 'langchain/vectorstores/memory';\n// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';\n// import { createRetrievalChain } from 'langchain/chains/retrieval';\n\n// After (LangChain 1.x)\nimport { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';\nimport { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';\nimport { createRetrievalChain } from '@langchain/classic/chains/retrieval';\nimport { createStuffDocumentsChain } from '@langchain/classic/chains/combine_documents';"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A teammate fixes the build by pinning langchain to an old 0.x version instead of changing the imports. What is the downside?",
    "hint": "Think about the other @langchain packages in the project.",
    "solution": "The integration packages (@langchain/openai, @langchain/core) move with the 1.x line, so an old langchain can conflict with them and stop receiving fixes. Updating the four import paths is a smaller change."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "langchain re-exports everything, so the old paths still work.",
      "reality": "The 1.x exports map does not list them; resolution fails."
    },
    {
      "thought": "Moving to @langchain/classic means rewriting the pipeline.",
      "reality": "The classes are the same; only the import paths change."
    }
  ];
}
