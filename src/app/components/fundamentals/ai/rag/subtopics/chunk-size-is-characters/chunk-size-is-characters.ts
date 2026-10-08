import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-chunk-size-is-characters',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './chunk-size-is-characters.html',
  styleUrl: './chunk-size-is-characters.scss'
})
export class ChunkSizeIsCharactersSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with @langchain/textsplitters 1.0.2",
      "points": [
        "With the default settings, <code>chunkSize: 512</code> produced chunks of at most 512 characters. Counted with the gpt-4 tokeniser, the largest was 102 tokens.",
        "The same text split with <code>lengthFunction: (t) => enc.encode(t).length</code> produced chunks of at most 512 tokens (about 2,600 characters).",
        "So the page's example was making chunks about 5 times smaller than the 256 to 512 tokens it recommends, which means more chunks to embed and less context per retrieved chunk.",
        "Python has the same default; <code>RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=512, chunk_overlap=50)</code> measures in tokens."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measure in tokens",
      "language": "typescript",
      "code": "import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';\nimport { encodingForModel } from 'js-tiktoken';\n\nconst enc = encodingForModel('gpt-4');\n\nconst byChars = new RecursiveCharacterTextSplitter({ chunkSize: 512, chunkOverlap: 50 });\nconst byTokens = new RecursiveCharacterTextSplitter({\n  chunkSize: 512, chunkOverlap: 50,\n  lengthFunction: (text) => enc.encode(text).length,\n});\n\n// On the same document:\n// byChars  -> largest chunk 512 chars, 102 tokens\n// byTokens -> largest chunk 512 tokens, about 2,600 chars"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your embedding model accepts at most 8,191 tokens and you split with the default chunkSize: 8000. Is there any risk of exceeding the model limit?",
    "hint": "What unit is 8000 in, and how many tokens can a character be?",
    "solution": "Not for normal text: 8000 characters is usually about 1,600 to 2,000 tokens, far under the limit. The real issue is the reverse: the chunks are much smaller than you intended. Measure in tokens if you want to use the model limit."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "chunkSize is in tokens because chunk sizes are always quoted in tokens.",
      "reality": "The splitter uses its lengthFunction, which defaults to string length in characters."
    },
    {
      "thought": "A 512-character chunk and a 512-token chunk hold about the same amount of text.",
      "reality": "Here the 512-token chunks were about 5 times longer."
    }
  ];
}
