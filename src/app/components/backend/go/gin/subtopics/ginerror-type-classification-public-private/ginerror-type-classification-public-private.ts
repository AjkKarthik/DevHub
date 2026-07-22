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
  templateUrl: './ginerror-type-classification-public-private.html',
  styleUrl: './ginerror-type-classification-public-private.scss'
})
export class GinerrorTypeClassificationPublicPrivateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'c.Error(err) is not just a logging call — it returns a structured *gin.Error you can classify',
      points: [
        'The main page\'s own Q&A mentions the pattern only briefly: "use c.Error(err) throughout, then add an error-processing middleware that reads c.Errors and formats all errors at the end of the chain." That is accurate as far as it goes, but it treats c.Errors as an undifferentiated bag of errors — it does not mention that c.Error(err) actually returns a *gin.Error value with structure the caller can use immediately.',
        'gin.Error wraps the underlying error alongside a Type field and a Meta field: Type is documented as classifying the error (Gin defines ErrorTypeBind for Context.Bind() failures, ErrorTypeRender for Context.Render() failures, ErrorTypePrivate for "a private error," ErrorTypePublic for "a public error," and ErrorTypeAny for "any other error"), and Meta can hold arbitrary attached data. Both SetType and SetMeta return the *gin.Error itself, meaning c.Error(err).SetType(gin.ErrorTypePublic) chains naturally at the call site.',
        'The Public/Private distinction directly addresses a problem the main page\'s own error-handling advice elsewhere warns about in a different context — never exposing raw panic details to clients (from its gin.Recovery() coverage). ErrorTypePrivate and ErrorTypePublic give the SAME classification power to ordinary handler errors, not just panics: a handler can mark an error explicitly as safe-to-show-the-client (Public) or internal-only (Private) at the moment it is recorded, rather than every downstream consumer having to re-derive that judgment from the error\'s content.',
      ]
    },
    {
      heading: 'ByType filtering: acting differently on different classes of accumulated errors',
      points: [
        'Because every error recorded via c.Error() carries its own Type, the accumulated c.Errors collection (a slice of *gin.Error) can be filtered by that classification. Gin documents this directly: "ByType returns a readonly copy filtered [by] the byte[Type]. ie ByType(gin.ErrorTypePublic) returns a slice of errors with type=ErrorTypePublic."',
        'This makes a genuinely different, more capable error-handling middleware possible than the main page\'s own brief mention implies: rather than looping over c.Errors and formatting every error identically, a final middleware can call c.Errors.ByType(gin.ErrorTypePublic) to build the client-facing response from ONLY the errors explicitly marked safe to show, while separately logging the FULL c.Errors collection (public and private alike) for internal debugging — a real separation between what the client sees and what gets logged, driven by the Type each error was tagged with at the point it was recorded.',
        'Meta extends this further for structured logging or tracing: a handler can attach arbitrary context to an error at the moment it happens (c.Error(err).SetMeta(map[string]any{"orderID": id})) rather than trying to reconstruct that context later from a bare error message string in a downstream middleware that has no direct access to the handler\'s own local variables.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tagging errors with Type and Meta at the point they occur',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "net/http"

    "github.com/gin-gonic/gin"
)

func getOrder(c *gin.Context) {
    id := c.Param("id")

    order, err := lookupOrder(id)
    if err != nil {
        if errors.Is(err, errOrderNotFound) {
            // Public: safe to describe to the client directly.
            c.Error(err).SetType(gin.ErrorTypePublic).
                SetMeta(gin.H{"orderID": id})
        } else {
            // Private: an internal failure (e.g. a DB error) --
            // never described to the client directly, but still
            // recorded with metadata for internal debugging.
            c.Error(err).SetType(gin.ErrorTypePrivate).
                SetMeta(gin.H{"orderID": id, "op": "lookupOrder"})
        }
        c.Status(http.StatusInternalServerError) // final status set
                                                     // by the error
                                                     // middleware below
        return
    }
    c.JSON(http.StatusOK, order)
}

var errOrderNotFound = errors.New("order not found")

func lookupOrder(id string) (any, error) {
    return nil, errOrderNotFound // simplified for the example
}`,
    },
    {
      label: 'A middleware that responds differently based on Type',
      language: 'typescript',
      code: `package main

import (
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
)

// errorHandlingMiddleware runs AFTER the route handler (via c.Next())
// and inspects the accumulated c.Errors, filtering by Type rather
// than treating every recorded error identically.
func errorHandlingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next() // let the handler run and record errors first

        if len(c.Errors) == 0 {
            return
        }

        // Log EVERYTHING -- public and private errors alike --
        // for internal visibility, including each one's Meta.
        for _, e := range c.Errors {
            log.Printf("type=%d meta=%v err=%v", e.Type, e.Meta, e.Err)
        }

        // But only PUBLIC errors make it into the client-facing
        // response body -- private/internal failures stay internal.
        publicErrors := c.Errors.ByType(gin.ErrorTypePublic)
        if len(publicErrors) > 0 {
            c.JSON(http.StatusNotFound, gin.H{
                "error": publicErrors[0].Error(),
                "meta":  publicErrors[0].Meta,
            })
            return
        }

        // No public error to show -- a generic message only,
        // deliberately hiding whatever internal error occurred.
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "internal server error",
        })
    }
}

func main() {
    r := gin.Default()
    r.Use(errorHandlingMiddleware())
    r.GET("/orders/:id", getOrder)
    r.Run(":8080")
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A handler calls a downstream payment-processing library and gets back a raw error whose message includes an internal account identifier and a partial stack trace fragment — clearly not something that should ever reach the client. Using this subtopic\'s theory, describe exactly how this error should be recorded via c.Error(), and explain what would go wrong if the handler recorded it using the DEFAULT type instead of explicitly classifying it.',
    hint: 'This subtopic\'s theory lists Gin\'s documented ErrorType values. Which one is described as indicating an error that "should not be exposed to clients"? What does c.Errors.ByType(gin.ErrorTypePublic) filter FOR — and what happens to an error that was never given that specific type?',
    solution: 'The handler should record this error as c.Error(err).SetType(gin.ErrorTypePrivate), optionally with .SetMeta(...) attaching whatever internal context (like the account identifier) is useful for debugging but must never reach the client. Per this subtopic\'s theory, ErrorTypePrivate is documented as indicating "a private error" — the correct classification for exactly this kind of internal-only failure. If the handler instead recorded the error using Gin\'s default type (ErrorTypeAny, since c.Error(err) with no explicit SetType call leaves the error at its default classification) rather than explicitly setting it to ErrorTypePrivate, the consequence depends entirely on how the downstream error-handling middleware is written — per this subtopic\'s second code example, a middleware built around c.Errors.ByType(gin.ErrorTypePublic) to decide what reaches the client would correctly EXCLUDE an ErrorTypeAny error from the public response (since ByType(gin.ErrorTypePublic) only returns errors explicitly typed Public), so the sensitive details would not leak through THAT specific mechanism by accident. However, this is fragile: it relies entirely on the downstream middleware\'s filtering logic being written correctly and consistently everywhere, rather than the error being unambiguously self-describing at the point it was created. The safer, more explicit practice this subtopic\'s theory describes is to always positively classify sensitive errors as ErrorTypePrivate right where they occur, rather than relying on them simply failing to qualify as ErrorTypePublic by omission — an error left at the default type could still be picked up by a DIFFERENT, less careful piece of error-handling code elsewhere that does not specifically filter for Public, exposing exactly the sensitive details this subtopic\'s scenario is trying to protect.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own advice — "use c.Error(err) throughout, then add an error-processing middleware that reads c.Errors" — implies every recorded error is treated identically by that middleware; c.Error(err) is essentially a structured alternative to log.Println(err), with no further classification built in.',
      reality: 'This subtopic\'s theory and first code example show c.Error(err) returns a genuinely structured *gin.Error with a documented Type field (Bind, Render, Private, Public, Any) and a Meta field for attached data — not an undifferentiated log entry. The Type can be set immediately via chaining (c.Error(err).SetType(...)), letting different errors be classified right at the point they occur.'
    },
    {
      thought: 'c.Errors.ByType(gin.ErrorTypePublic) is mainly a convenience for organizing log output — filtering errors by type is a nice-to-have for readability, not something with real security or correctness implications for what a client actually sees.',
      reality: 'This subtopic\'s second code example and exercise show ByType filtering can directly drive what content reaches the CLIENT-FACING response — building the client response exclusively from c.Errors.ByType(gin.ErrorTypePublic) is a genuine mechanism for preventing internal error details (account IDs, stack traces, database errors) from leaking into an HTTP response, not merely a logging convenience.'
    },
    {
      thought: 'Since gin.Error has both a Type and a Meta field, attaching metadata via SetMeta is really just an alternative way to set the Type — the two fields serve the same general "add more information to this error" purpose and are somewhat interchangeable in practice.',
      reality: 'This subtopic\'s theory and first code example show Type and Meta serve entirely different, complementary purposes: Type is a CLASSIFICATION drawn from a small, fixed set of documented values (Bind/Render/Private/Public/Any) used for FILTERING decisions (like ByType), while Meta is an open-ended, arbitrary data attachment (any struct or map) used for carrying CONTEXT specific to that one error instance — an order ID, a failed operation name, or any other detail useful for debugging that specific occurrence, not something used to filter or classify errors as a group.'
    }
  ];
}
