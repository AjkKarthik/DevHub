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
  templateUrl: './cloudfront-default-cache-key-excludes-query-strings-and-headers.html',
  styleUrl: './cloudfront-default-cache-key-excludes-query-strings-and-headers.scss'
})
export class CloudfrontDefaultCacheKeyExcludesQueryStringsAndHeadersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own wording about the cache key is ambiguous about what\'s in it by default',
      points: [
        'The main page\'s own "CloudFront Distributions" theory bullet states: "Cache key: by default URL path + selected headers/query strings." Read quickly, this can be misread as saying headers and query strings ARE part of the default cache key — when the actual default is much narrower.',
        'This ambiguity matters directly: whether a query string is part of the cache key determines whether two requests for the same path but different query parameters get treated as the SAME cached object or as two DIFFERENT ones.',
      ]
    },
    {
      heading: 'The real default cache key is just the distribution domain plus the URL path — nothing else',
      points: [
        'Per AWS\'s own documentation, "by default, the cache key for a CloudFront distribution includes the following information: the domain name of the CloudFront distribution... [and] the URL path of the requested object." Everything else in the request — query strings, headers, and cookies — is explicitly "not included in the cache key, by default."',
        'AWS\'s own documentation gives a concrete illustration: two requests for the exact same path but with different query strings (?ref=0123abc&split-pages=false vs. ?ref=xyz987&split-pages=true), different User-Agent headers, and different session cookies still "results in a cache hit" against each other — because none of those varying values are part of the cache key unless a cache policy explicitly adds them.',
        'This is precisely why the main page\'s own Managed Cache Policies bullet recommends "CachingDisabled... for APIs" as a separate, distinct policy from the default "CachingOptimized" — an API where different query strings genuinely mean different responses needs EITHER caching disabled entirely, OR a custom cache policy that explicitly adds the relevant query string parameters (or headers) into the cache key — the default cache key alone will silently serve the WRONG response for a different-but-uncached-variable query string, treating /search?q=cats and /search?q=dogs as the identical cached object if a cache policy doesn\'t opt query strings in.',
        'AWS\'s own guidance also warns about the other direction of this mistake: including a highly variable value (their own example is the User-Agent header, which "can have thousands of unique variations") in the cache key can explode the number of cached copies of an object, tanking the cache hit ratio — so the fix for an API isn\'t simply "add every varying value to the cache key," it\'s "add only the SPECIFIC values that actually change the origin\'s response."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the default behavior — different query strings, same cache hit',
      language: 'bash',
      code: `# The main page's own "CachingDisabled... for APIs" advice implies
# there's a reason query-string-driven APIs need special handling --
# here's exactly why, using the DEFAULT CachingOptimized policy:
curl -s "https://d111111abcdef8.cloudfront.net/search?q=cats" \\
  -D - -o /dev/null | grep -i x-cache
# X-Cache: Miss from cloudfront
# -- first request for this PATH -- cache miss, origin is hit,
# response for q=cats is cached.

curl -s "https://d111111abcdef8.cloudfront.net/search?q=dogs" \\
  -D - -o /dev/null | grep -i x-cache
# X-Cache: Hit from cloudfront
# -- SAME path (/search), DIFFERENT query string -- but since
# query strings are NOT part of the default cache key, this is a
# CACHE HIT -- the response for q=cats (from the first request) is
# served, even though the client explicitly asked for q=dogs.
# This is the exact "serves the wrong response" trap the main
# page's own ambiguous cache-key wording doesn't warn about.`,
    },
    {
      label: 'Fixing it: an explicit cache policy that includes the query string',
      language: 'bash',
      code: `# Create a custom cache policy that includes the "q" query string
# parameter specifically -- NOT all query strings (which would hurt
# the cache hit ratio unnecessarily for any other, irrelevant params):
aws cloudfront create-cache-policy \\
  --cache-policy-config '{
    "Name": "search-api-cache-policy",
    "DefaultTTL": 60,
    "MaxTTL": 300,
    "MinTTL": 0,
    "ParametersInCacheKeyAndForwardedToOrigin": {
      "EnableAcceptEncodingGzip": true,
      "EnableAcceptEncodingBrotli": true,
      "HeadersConfig": { "HeaderBehavior": "none" },
      "CookiesConfig": { "CookieBehavior": "none" },
      "QueryStringsConfig": {
        "QueryStringBehavior": "whitelist",
        "QueryStrings": { "Quantity": 1, "Items": ["q"] }
      }
    }
  }'

# Attach this cache policy to the /search* cache behavior, then
# repeat the same two requests:
curl -s "https://d111111abcdef8.cloudfront.net/search?q=cats" -D - -o /dev/null | grep -i x-cache
# X-Cache: Miss from cloudfront
curl -s "https://d111111abcdef8.cloudfront.net/search?q=dogs" -D - -o /dev/null | grep -i x-cache
# X-Cache: Miss from cloudfront
# -- NOW correctly treated as two distinct cache keys -- q=cats and
# q=dogs are cached and served separately, because "q" is explicitly
# part of the cache key.

# Re-requesting q=cats again shows the fix didn't just disable
# caching entirely:
curl -s "https://d111111abcdef8.cloudfront.net/search?q=cats" -D - -o /dev/null | grep -i x-cache
# X-Cache: Hit from cloudfront
# -- correctly a cache HIT this time, since q=cats was already
# cached under its own distinct cache key.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team puts CloudFront in front of a product-search API, using the default CachingOptimized managed cache policy — matching the main page\'s own recommended default for most workloads. Users start reporting that searching for different terms sometimes returns results for a COMPLETELY different, unrelated search term. Using this subtopic\'s theory, explain what\'s actually happening, and why the main page\'s own "CachingDisabled... for APIs" advice exists specifically for cases like this.',
    hint: 'The search term is passed as a query string parameter (e.g. ?q=cats). Is a query string part of the CloudFront cache key by default?',
    solution: 'Per this subtopic\'s theory, this is the exact default-cache-key trap: query strings are explicitly NOT included in the default cache key (only the distribution domain and URL path are), so CloudFront treats every request to /search — regardless of the actual "q" value in the query string — as requesting the SAME cached object. The first search term to hit a given edge location after a cache expiration gets cached, and every subsequent search request to that path (with a completely different "q" value) is served that same stale, cached response as a "cache hit," exactly matching what users are reporting. This is precisely why the main page\'s own advice separately recommends "CachingDisabled... for APIs" as a distinct managed policy from the default CachingOptimized — an API whose responses genuinely vary by query string cannot safely use the default cache key behavior. The better fix here (rather than disabling caching entirely, which forfeits any performance benefit) is a custom cache policy that explicitly whitelists the "q" query string parameter into the cache key, per this subtopic\'s own code example — this way, different search terms get correctly cached as distinct objects, while irrelevant query string variations (that don\'t affect the response) stay out of the cache key and don\'t needlessly fragment the cache.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'By default, CloudFront\'s cache key already includes query strings and relevant headers, matching a literal reading of the main page\'s own "URL path + selected headers/query strings" wording.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the default cache key includes ONLY the distribution domain name and URL path — query strings, headers, and cookies are explicitly excluded unless a cache policy adds them.'
    },
    {
      thought: 'If an API\'s responses vary by query string, the only fix is to disable CloudFront caching for that path entirely.',
      reality: 'Per this subtopic\'s code example, a custom cache policy can explicitly whitelist the SPECIFIC query string parameters that actually affect the response — preserving caching\'s performance benefit while still returning the correct, distinct response for each parameter value.'
    },
    {
      thought: 'The safest fix for a cache-key mismatch is to add every varying request value (all query strings, all headers, all cookies) into the cache key, to be sure nothing is missed.',
      reality: 'Per this subtopic\'s theory, AWS\'s own guidance warns this approach can backfire — a highly variable value like the User-Agent header can produce thousands of near-duplicate cached objects, tanking the cache hit ratio; only values that actually change the origin\'s response should be added.'
    }
  ];
}
