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
  templateUrl: './protectedlocalstorage-encrypts-at-rest-not-the-decrypted-value-in-memory.html',
  styleUrl: './protectedlocalstorage-encrypts-at-rest-not-the-decrypted-value-in-memory.scss'
})
export class ProtectedlocalstorageEncryptsAtRestNotTheDecryptedValueInMemorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The "Protected" in ProtectedLocalStorage specifically means "unreadable by directly inspecting browser storage" — not "unreadable by any script running on the page"',
      points: [
        'The main page states values are encrypted via ASP.NET Core Data Protection, worth being precise about WHAT that protects against: opening browser DevTools and inspecting the Application/Storage tab directly shows only CIPHERTEXT — a string that is meaningless without the server-side Data Protection key used to encrypt it. This is the actual threat ProtectedLocalStorage defends against — casual or malicious inspection of raw stored values.',
        'It does NOT protect against a compromised page itself: SetAsync/GetAsync perform the encryption/decryption via a round-trip to the server (Blazor Server) — by the time GetAsync returns the DECRYPTED value to your component\'s own C# code, that plaintext value is sitting in the same page/circuit as any other in-memory data, fully readable by any other script or code path that can execute within that same page context (e.g. a genuine XSS vulnerability elsewhere in the app).',
      ]
    },
    {
      heading: 'Why this distinction matters for deciding what is actually safe to store',
      points: [
        'ProtectedLocalStorage is well-suited for values you want to survive a browser restart WITHOUT being casually readable/tamperable via DevTools by the user themselves or someone with brief physical access to their machine — a saved UI preference, a non-sensitive user setting, or something where the THREAT MODEL is "prevent casual tampering," not "prevent all possible disclosure."',
        'It is NOT a substitute for proper secrets management — a genuinely sensitive value (an API key, a password, a security token that should never be exposed to any client-side code at all) should not be round-tripped through ProtectedLocalStorage just because the AT-REST storage happens to be encrypted, since the moment your own component code calls GetAsync and receives the decrypted value, that value is exposed to the same page context as everything else your app runs.',
        'The encryption key itself is managed by ASP.NET Core\'s Data Protection system, tied to the SERVER — if the Data Protection keys are not persisted correctly across app restarts/deployments (a common Blazor Server deployment gotcha), previously-encrypted values become permanently undecryptable, not a security feature but a real operational trap worth knowing about.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What DevTools actually sees — ciphertext, not plaintext',
      language: 'csharp',
      code: `@inject ProtectedLocalStorage Storage

@code {
    private async Task SaveTheme(string theme)
    {
        await Storage.SetAsync("theme", theme);
        // Opening browser DevTools → Application → Local Storage
        // now shows a key like "theme" with a VALUE that looks like:
        //   "CfDJ8NrAhF3iGDxJgqSf...(long opaque base64-looking string)..."
        // NOT the literal string "dark" — this is genuine encrypted
        // ciphertext, meaningless without the server's Data
        // Protection key to decrypt it.
    }
}`,
    },
    {
      label: 'The decrypted value is fully exposed once your own code reads it',
      language: 'csharp',
      code: `@inject ProtectedLocalStorage Storage

@code {
    private async Task LoadTheme()
    {
        var result = await Storage.GetAsync<string>("theme");
        // GetAsync performed the server-side decryption for you.
        // "result.Value" is now the PLAIN string "dark" — sitting in
        // this component's own memory, fully readable by ANY other
        // code that can execute in this same page/circuit context,
        // exactly like any other C# field. The encryption applied
        // ONLY to the value while it sat in browser storage — it
        // provides no protection at all once decrypted and back in
        // your application's own memory.
        theme = result.Value ?? "light";
    }

    private string theme = "light";
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer stores a user\'s API key in ProtectedLocalStorage, reasoning "it\'s encrypted at rest, so this is a safe place to keep it between sessions." A security reviewer flags this as a risk anyway. What is the reviewer\'s likely concern, given what ProtectedLocalStorage actually protects against?',
    hint: 'Think about the moment the component calls GetAsync to actually USE the API key for a real request — is the key still "protected" at that point, and from what specific threat was it ever protected in the first place?',
    solution: 'The reviewer\'s concern is well-founded: ProtectedLocalStorage only protects the value while it sits in browser storage as ciphertext — the moment the component calls GetAsync to actually use the API key (which it must, to make any real request with it), the decrypted plaintext key is sitting in the app\'s own memory, exposed to the same page context as everything else. If the app has ANY XSS vulnerability anywhere, or if the API key needs to be sent in an outgoing request that a malicious script could intercept, the "encrypted at rest" property provides zero protection at that point — it never protected against a compromised page, only against someone directly inspecting raw browser storage. A genuinely sensitive credential like an API key should not be stored client-side at all if avoidable — the safer pattern is keeping such secrets exclusively server-side and having the server make the authenticated call on the user\'s behalf, never handing the raw key to client-side code in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ProtectedLocalStorage makes it safe to store any kind of sensitive data client-side, since the encryption protects it from being read by anyone or anything.',
      reality: 'This subtopic\'s exercise clarifies the encryption only protects the value while it sits in browser storage as ciphertext — the moment application code retrieves and decrypts it (which it must, to actually use the value), the plaintext is fully exposed in the page\'s own memory, no different from any other in-memory data.'
    },
    {
      thought: 'If a user opens DevTools and inspects localStorage, they can read the plaintext value that was stored there via ProtectedLocalStorage.SetAsync, since browser storage is generally considered fully user-visible.',
      reality: 'This subtopic\'s first code example shows DevTools only reveals opaque, encrypted ciphertext for a ProtectedLocalStorage value — genuinely unreadable without the server-side Data Protection key, unlike plain (unprotected) localStorage or sessionStorage, which does store fully readable plaintext.'
    },
    {
      thought: 'ProtectedLocalStorage encryption keys are stored in the browser alongside the encrypted values, similar to how a password manager might store an encrypted vault with a locally-derived key.',
      reality: 'The Data Protection encryption keys are managed entirely SERVER-SIDE, not stored anywhere in the browser — this is precisely why a server\'s Data Protection keys not being persisted correctly across restarts/deployments can permanently break decryption of previously-stored values, a real operational gotcha distinct from anything client-side.'
    }
  ];
}
