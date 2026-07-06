import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-required-properties-and-system-text-json-deserialization-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './required-properties-and-system-text-json-deserialization.html',
  styleUrl: './required-properties-and-system-text-json-deserialization.scss',
})
export class RequiredPropertiesAndSystemTextJsonDeserializationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page covers required for object-initializer syntax only',
      points: [
        'The main Null Safety page shows <code>required</code> preventing code like <code>new Person()</code> without setting the required property via object-initializer syntax — a genuinely COMPILE-TIME check. It never addresses what happens when an object is constructed through a path that bypasses object initializers entirely, like JSON deserialization.',
      ],
    },
    {
      heading: 'System.Text.Json DOES enforce required — since .NET 7',
      points: [
        'Since .NET 7, <code>System.Text.Json</code>\'s source-generated AND reflection-based deserializers both genuinely check for <code>required</code> members: if the incoming JSON is missing a property marked <code>required</code>, deserialization THROWS a <code>JsonException</code> at runtime rather than silently leaving the property at its default value. This is a real, enforced runtime guarantee — not just a compile-time-only annotation like plain nullable reference types.',
        'This makes <code>required</code> fundamentally different from a bare nullable reference type annotation (<code>string</code> vs <code>string?</code>) discussed on the main page: nullable annotations are erased and have ZERO runtime effect, while <code>required</code> is actively checked by at least this one specific, common construction path (JSON deserialization via System.Text.Json).',
      ],
    },
    {
      heading: 'But required says nothing about NULLABILITY itself — only presence',
      points: [
        'A property can be <code>required string Name</code> (required AND non-nullable) — <code>System.Text.Json</code> enforces that the JSON key is PRESENT, but it does NOT separately validate that the JSON value for that key isn\'t <code>null</code>. Sending <code>{ "Name": null }</code> for a <code>required string Name</code> property (non-nullable) can still assign an actual <code>null</code> at runtime through deserialization — bypassing the nullable reference type\'s compile-time-only guarantee entirely, because deserialization uses reflection/source-generated setters, not the object-initializer path the nullable analysis was designed to check.',
        'This is the genuinely deep gap: nullable reference types protect you at COMPILE TIME against code you write; <code>required</code> protects you at RUNTIME against a JSON payload MISSING the key entirely; but nothing in the type system alone protects a non-nullable required property against a JSON payload that explicitly supplies <code>null</code> for that key.',
      ],
    },
    {
      heading: 'Closing the actual gap — [JsonRequired] and validation',
      points: [
        'The narrower <code>[JsonRequired]</code> attribute (distinct from the <code>required</code> keyword) can be applied per-property specifically for System.Text.Json presence-checking independent of the C# <code>required</code> modifier — useful for DTOs where you want JSON-level enforcement without also requiring object-initializer syntax everywhere the type is constructed in code.',
        'To actually reject an explicit <code>null</code> value (not just a missing key) for a non-nullable required property, you need EXPLICIT validation after deserialization — e.g. a custom <code>[JsonConverter]</code>, a validation attribute checked via <code>Validator.ValidateObject</code>, or a manual null-check in a constructor/init accessor — since neither <code>required</code> nor nullable reference types alone will catch this at either compile time or (for this specific case) runtime.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'required IS enforced when the JSON key is missing entirely',
      language: 'csharp',
      code: `#nullable enable
using System.Text.Json;

public class UserProfile
{
    public required string Email { get; init; }
    public required string DisplayName { get; init; }
    public int Age { get; init; } // not required — fine if missing
}

// JSON missing the required "DisplayName" key entirely:
string json = """
{ "Email": "ana@example.com", "Age": 30 }
""";

try
{
    var profile = JsonSerializer.Deserialize<UserProfile>(json);
}
catch (JsonException ex)
{
    // Genuinely thrown at runtime — required IS enforced by System.Text.Json
    // since .NET 7, unlike plain nullable reference type annotations which
    // have zero runtime effect.
    Console.WriteLine(ex.Message);
    // "JSON deserialization for type 'UserProfile' was missing required properties,
    //  including the following: DisplayName"
}`,
    },
    {
      label: 'The gap — required does not stop an EXPLICIT null value',
      language: 'csharp',
      code: `#nullable enable
using System.Text.Json;

public class UserProfile
{
    public required string Email { get; init; } // non-nullable AND required
    public required string DisplayName { get; init; }
}

// This time the JSON key IS present — but its value is explicitly null:
string json = """
{ "Email": "ana@example.com", "DisplayName": null }
""";

var profile = JsonSerializer.Deserialize<UserProfile>(json);

// No JsonException thrown — the key was present, so "required" is satisfied.
// But profile.DisplayName is now genuinely null at runtime, despite being
// declared as a non-nullable "string DisplayName" (not "string?").
Console.WriteLine(profile!.DisplayName is null); // True — the nullable
// reference type's compile-time-only guarantee never had a chance to run,
// because deserialization assigns the property directly, bypassing any
// object-initializer-based analysis entirely.`,
    },
    {
      label: 'Closing the gap — explicit post-deserialization validation',
      language: 'csharp',
      code: `#nullable enable
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

public class UserProfile
{
    [Required] // DataAnnotations attribute — checked explicitly, not by JSON parsing
    public required string Email { get; init; }

    [Required]
    public required string DisplayName { get; init; }
}

string json = """
{ "Email": "ana@example.com", "DisplayName": null }
""";

var profile = JsonSerializer.Deserialize<UserProfile>(json)!;

var results = new List<ValidationResult>();
var context = new ValidationContext(profile);
bool isValid = Validator.TryValidateObject(profile, context, results, validateAllProperties: true);

if (!isValid)
{
    foreach (var result in results)
    {
        Console.WriteLine(result.ErrorMessage);
        // "The DisplayName field is required." — NOW the explicit null is
        // genuinely caught, but only because of this SEPARATE validation
        // step — neither "required" nor "string" (non-nullable) caught it
        // on their own during deserialization.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "I marked the property <code>required string? Bio { get; init; }</code> — nullable AND required — so now null values are rejected too." Explain why this is wrong, and what <code>required string? Bio</code> actually enforces versus what it does not.',
    hint: 'Think about what "required" checks (key PRESENCE in the JSON) versus what the ? annotation means (this property is ALLOWED to be null — the opposite of rejecting null). Marking something both required and nullable is not a contradiction, but it does not add up to "value must be present and non-null."',
    solution: `// required string? Bio only enforces that the JSON KEY "Bio" must be present
// in the payload — it does NOT mean the VALUE must be non-null. In fact, the ?
// annotation explicitly says the opposite: null is an ACCEPTABLE value here.

public class Profile
{
    public required string? Bio { get; init; }
}

// This satisfies "required" (the key is present) AND is fully valid for
// "string?" (null is allowed) — this is completely correct per the two
// annotations' actual meanings, even though it "feels" like it should reject null:
string json = """{ "Bio": null }""";
var profile = JsonSerializer.Deserialize<Profile>(json); // succeeds, profile.Bio is null

// To ACTUALLY require a non-null, non-missing value, the correct combination is:
public class ProfileStrict
{
    public required string Bio { get; init; } // non-nullable — but as shown
    // earlier, this alone still does not stop an explicit JSON null from being
    // assigned. A [Required] DataAnnotations check (or custom validation) after
    // deserialization is still necessary to fully close the gap.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'marking a property <code>required</code> guarantees, at both compile time and runtime, that the property will never end up null.',
      reality: '<code>required</code> only enforces that the JSON key is PRESENT during System.Text.Json deserialization (since .NET 7) — it says nothing about whether the supplied value is itself null. A non-nullable required property can still be assigned an explicit JSON null through deserialization.',
    },
    {
      thought: 'because nullable reference type annotations are compile-time-only with zero runtime effect, <code>required</code> must work the same way — just another purely advisory compiler hint.',
      reality: '<code>required</code> is genuinely different: System.Text.Json actively checks for it at runtime during deserialization and throws a JsonException if a required property\'s JSON key is missing — a real enforced guarantee that a bare nullable annotation does not have.',
    },
    {
      thought: 'combining <code>required</code> and <code>?</code> on the same property (e.g. <code>required string? Bio</code>) is a contradiction, or somehow enforces both presence AND non-null.',
      reality: 'the two modifiers check entirely independent things — required checks JSON key presence, ? explicitly permits a null value for that key. Combining them is valid and means exactly "the key must be present, and null is an acceptable value for it" — not "must be present and non-null."',
    },
  ];
}
