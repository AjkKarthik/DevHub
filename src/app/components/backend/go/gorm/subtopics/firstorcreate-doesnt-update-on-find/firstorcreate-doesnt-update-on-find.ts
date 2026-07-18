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
  templateUrl: './firstorcreate-doesnt-update-on-find.html',
  styleUrl: './firstorcreate-doesnt-update-on-find.scss'
})
export class FirstorcreateDoesntUpdateOnFindSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own challenge solution uses FirstOrCreate — without ever explaining what it does on a match',
      points: [
        'The main page\'s own challenge solution writes db.FirstOrCreate(&tag, Tag{Name: name}) to find-or-create a tag by name, with a hint pointing at the same pattern — but the main page\'s theory never covers FirstOrCreate at all. This subtopic covers exactly what that call actually does, in both the found and not-found cases.',
        'GORM\'s own documentation states the found case directly: "If the user is found, no new record is created." The struct passed as the second argument (Tag{Name: name} in the main page\'s own example) serves as the SEARCH CONDITION — GORM builds a query from its fields and looks for a match. If one exists, FirstOrCreate returns it completely unchanged; none of the struct\'s OTHER fields (had there been any beyond Name) get written to that existing row.',
        'Only when NO match is found does GORM use the struct to build the INSERT — the exact same struct fields that were used as search conditions become the values written into the new row. This dual role (the same struct doubles as both the query filter AND, only on a miss, the values to insert) is precisely why the main page\'s own tag example works correctly with a single-field struct: Name is both what makes a tag "the same tag" and the only column that needs a value on creation.',
      ]
    },
    {
      heading: 'Attrs() and Assign(): the two ways to add fields beyond the search condition',
      points: [
        'A single struct only works cleanly when every field you\'d want set is also a field you want to search BY. The moment a real model needs additional fields that should only apply on CREATION (not affect the search, and not overwrite an existing match), the struct-only form breaks down — this is where GORM\'s own Attrs() and Assign() modifiers come in, and the main page\'s own tag example never needed either because Tag only has one meaningful field.',
        'Per GORM\'s own documentation, Attrs() fields "are used for creation but not in the initial search query" — meaning db.Where(Tag{Name: name}).Attrs(Color{...}).FirstOrCreate(&tag) searches ONLY by name, but if it needs to create a new row, the Attrs fields are included in the INSERT too. Crucially, if an existing tag is found, whatever Attrs values were passed are silently DISCARDED — they never touch the found record at all.',
        'Assign() behaves differently and more aggressively: per GORM\'s own documentation, "the Assign method sets attributes on the record regardless of whether it is found or not, and these attributes are saved back to the database." Assign fields apply on BOTH paths — set on a newly-created row, AND written as an update to an already-found row. This makes Assign the tool for "find or create, but also make sure THIS specific field is always up to date either way" — a genuinely different intent from Attrs\'s "only matters if we\'re creating."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern: a single-field struct, both roles at once',
      language: 'typescript',
      code: `package main

import "gorm.io/gorm"

type Tag struct {
    gorm.Model
    Name string \`gorm:"uniqueIndex"\`
}

// This mirrors the main page's own challenge solution exactly.
// Tag{Name: name} plays BOTH roles: it is the search condition
// ("does a tag with this name already exist?") AND, only if no
// match is found, the values used to construct the INSERT.
func findOrCreateTag(db *gorm.DB, name string) (Tag, error) {
    var tag Tag
    err := db.FirstOrCreate(&tag, Tag{Name: name}).Error
    return tag, err
}

// Calling this twice with the SAME name: the first call creates a
// new row; the second call finds the EXISTING row and returns it
// completely unchanged -- per GORM's own docs, "if the user is
// found, no new record is created," and nothing about the found
// row is touched or overwritten.`,
    },
    {
      label: 'Attrs(): extra fields that ONLY apply on creation',
      language: 'typescript',
      code: `package main

import "gorm.io/gorm"

type Tag struct {
    gorm.Model
    Name        string \`gorm:"uniqueIndex"\`
    Color       string
    CreatedByID uint
}

// findOrCreateTagWithColor searches ONLY by name -- Color and
// CreatedByID are NOT part of the search condition. If a matching
// tag already exists, these Attrs values are silently DISCARDED;
// they are used ONLY if GORM actually needs to create a new row.
func findOrCreateTagWithColor(db *gorm.DB, name, color string, creatorID uint) (Tag, error) {
    var tag Tag
    err := db.Where(Tag{Name: name}).
        Attrs(Tag{Color: color, CreatedByID: creatorID}).
        FirstOrCreate(&tag).Error
    return tag, err
}

// If a tag named "go" already exists with Color="blue", calling
// this with color="red" does NOT change the existing tag's color --
// Attrs fields never touch an already-found record.`,
    },
    {
      label: 'Assign(): extra fields that apply EITHER way',
      language: 'typescript',
      code: `package main

import (
    "time"

    "gorm.io/gorm"
)

type Tag struct {
    gorm.Model
    Name       string \`gorm:"uniqueIndex"\`
    LastUsedAt time.Time
}

// touchTag searches by name, same as before -- but uses Assign
// instead of Attrs for LastUsedAt. Per GORM's own docs, Assign
// "sets attributes on the record regardless of whether it is found
// or not, and these attributes are saved back to the database."
func touchTag(db *gorm.DB, name string) (Tag, error) {
    var tag Tag
    err := db.Where(Tag{Name: name}).
        Assign(Tag{LastUsedAt: time.Now()}).
        FirstOrCreate(&tag).Error
    return tag, err
}

// Every call updates LastUsedAt on the matching tag if one already
// exists (issuing an UPDATE), AND sets it correctly if a brand-new
// tag has to be created -- unlike Attrs, this field is never
// silently discarded on the found-record path.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes db.FirstOrCreate(&user, User{Email: email, Name: name}) intending "find the user by email, and if they exist, make sure their Name is up to date with whatever was just submitted; otherwise create a new user with this name." After running it twice with the same email but a DIFFERENT name the second time, the stored Name still shows the ORIGINAL value from the first call. Using this subtopic\'s theory, explain why, and describe the fix.',
    hint: 'This subtopic distinguishes what a plain struct argument to FirstOrCreate does (search condition, only used for the INSERT if not found) from what Attrs() and Assign() each do. Which of these three approaches actually updates an ALREADY-FOUND record\'s fields?',
    solution: 'The stored Name is not updated on the second call because User{Email: email, Name: name} passed directly as FirstOrCreate\'s struct argument treats BOTH Email and Name as SEARCH CONDITIONS, and per this subtopic\'s theory, "if the user is found, no new record is created" — meaning none of the struct\'s fields are written to an already-matching row at all; they are only ever used to build the INSERT on the not-found path. Worse, since Name is part of the search condition here, the SECOND call with a different name is not even searching for "email = X" — it is searching for "email = X AND name = NEW_NAME," which would not match the existing row (whose name is still the OLD value) at all; depending on the exact GORM version/behavior this could even attempt to create a SECOND row with the new name, likely failing on the unique email constraint rather than updating anything. The developer\'s actual intent — "always keep Name up to date, whether creating or updating" — is precisely the Assign() use case this subtopic\'s theory describes, not a bare struct argument. The fix is db.Where(User{Email: email}).Assign(User{Name: name}).FirstOrCreate(&user) — searching ONLY by email, then using Assign to guarantee Name is written on BOTH paths: set on a newly-created user, and updated via a real UPDATE statement on an already-found one, exactly matching Assign\'s documented behavior of setting "attributes on the record regardless of whether it is found or not."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'db.FirstOrCreate(&record, SomeStruct{...}) behaves like an "upsert" — if a matching record already exists, its fields get updated to match whatever values were passed in the struct, similar to how an UPDATE ... ON CONFLICT works in raw SQL.',
      reality: 'This subtopic\'s theory and first code example show the opposite is true by default: GORM\'s own documentation states plainly, "if the user is found, no new record is created" — and critically, nothing about that found record is updated either. A plain struct passed to FirstOrCreate is purely a search condition (and, only on a miss, the insert values) — genuine upsert-style updating on a match requires the separate Assign() modifier.'
    },
    {
      thought: 'Attrs() and Assign() are two interchangeable ways to write the same thing — extra fields on a FirstOrCreate call beyond the core search condition — and the choice between them is mostly a matter of style preference.',
      reality: 'This subtopic\'s theory and second/third code examples show these have genuinely different, non-interchangeable behavior: Attrs() fields are silently discarded whenever an existing record is found (they only ever apply on creation), while Assign() fields are written to the database on BOTH the found and not-found paths. Choosing the wrong one either silently fails to update an existing record\'s field (using Attrs when Assign was needed) or unexpectedly overwrites data on every call (using Assign when Attrs was intended).'
    },
    {
      thought: 'Since the main page\'s own challenge solution passes the ENTIRE struct (Tag{Name: name}) as FirstOrCreate\'s condition and it works correctly, this same single-struct pattern is the generally correct, idiomatic way to use FirstOrCreate for any model, regardless of how many fields it has.',
      reality: 'This subtopic\'s exercise shows this pattern only happens to work cleanly for the main page\'s own Tag example because Tag has exactly one meaningful field (Name), which is legitimately both the search condition AND the only value needed on creation. The moment a model has additional fields — like the exercise\'s User{Email, Name} — passing them all as one struct conflates "what defines a match" with "what should be updated," which is exactly the kind of bug this subtopic\'s exercise walks through.'
    }
  ];
}
