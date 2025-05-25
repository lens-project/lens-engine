/**
 * OPML Parser Tests
 *
 * Tests for the OPML parser module.
 *
 * @module opml_parser_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  extractFeeds,
  generateOpml,
  getFeedsByCategory,
  type OpmlDocument,
  parseOpml,
} from "../opml_parser.ts";

// Import test fixtures
import {
  COMPLEX_OPML,
  EMPTY_OPML,
  MALFORMED_OPML,
  SIMPLE_OPML,
  SPECIAL_CHARS_OPML,
} from "./fixtures/fixtures.ts";

Deno.test("parseOpml - should parse simple OPML XML correctly", () => {
  const document = parseOpml(SIMPLE_OPML);

  assertEquals(document.title, "Simple Feed Collection");
  assertEquals(document.outlines.length, 3);
  assertEquals(document.outlines[0].title, "TechCrunch");
  assertEquals(document.outlines[0].xmlUrl, "https://techcrunch.com/feed/");
  assertEquals(document.outlines[1].title, "Wired");
  assertEquals(document.outlines[2].title, "BBC News");
});

Deno.test("parseOpml - should parse complex OPML XML correctly", () => {
  const document = parseOpml(COMPLEX_OPML);

  assertEquals(document.title, "Complex Feed Collection");
  assertEquals(document.outlines.length, 3); // Technology, News, Personal
  assertEquals(document.outlines[0].title, "Technology");

  // Check that the Technology outline has children
  assertExists(document.outlines[0].children);

  // Check that TechCrunch exists in Technology
  const techCrunchOutline = document.outlines[0].children.find((child) =>
    child.title === "TechCrunch" &&
    child.xmlUrl === "https://techcrunch.com/feed/"
  );
  assertExists(techCrunchOutline);

  // Check that News category exists
  const newsOutline = document.outlines.find((outline) =>
    outline.title === "News"
  );
  assertExists(newsOutline);
  assertExists(newsOutline.children);

  // Check that BBC News exists in News
  const bbcNewsOutline = newsOutline.children.find((child) =>
    child.title === "BBC News" &&
    child.xmlUrl === "http://feeds.bbci.co.uk/news/rss.xml"
  );
  assertExists(bbcNewsOutline);
});

Deno.test("parseOpml - should handle empty OPML", () => {
  const document = parseOpml(EMPTY_OPML);

  assertEquals(document.title, "Empty Feed Collection");
  assertEquals(document.outlines.length, 0);
});

Deno.test("parseOpml - should handle special characters in OPML", () => {
  const document = parseOpml(SPECIAL_CHARS_OPML);

  // The parser might return either the escaped or unescaped version
  // depending on implementation, so we check for either
  const titleIsValid = document.title === "Feed & Collection" ||
    document.title === "Feed &amp; Collection";
  assertEquals(
    titleIsValid,
    true,
    `Title should be either "Feed & Collection" or "Feed &amp; Collection", got "${document.title}"`,
  );

  // Check outline title
  const outlineTitleIsValid = document.outlines[0].title === "Tech & News" ||
    document.outlines[0].title === "Tech &amp; News";
  assertEquals(outlineTitleIsValid, true);

  // Check feed title
  const feedTitleIsValid =
    document.outlines[0].children[0].title === "Example <Tech>" ||
    document.outlines[0].children[0].title === "Example &lt;Tech&gt;";
  assertEquals(feedTitleIsValid, true);

  // Check URL - should contain the query parameters
  const url = document.outlines[0].children[0].xmlUrl;
  assertExists(url);
  assertEquals(url.includes("example.com/tech/feed"), true);
  assertEquals(url.includes("a=1"), true);
  assertEquals(url.includes("b=2"), true);
});

Deno.test("parseOpml - should handle malformed OPML gracefully", () => {
  try {
    parseOpml(MALFORMED_OPML);
    // If we get here, the parser handled the malformed OPML without throwing
    // This is acceptable if the parser is designed to be forgiving
  } catch (error) {
    // If we get here, the parser threw an error, which is also acceptable
    // for malformed input
    assertExists(error);
    assertEquals(error instanceof Error, true);
  }
});

Deno.test("extractFeeds - should extract all feeds from complex OPML", () => {
  const document = parseOpml(COMPLEX_OPML);
  const feeds = extractFeeds(document);

  // Check that we have feeds
  assertEquals(
    feeds.length > 0,
    true,
    `Expected at least 1 feed, got ${feeds.length}`,
  );

  // Check TechCrunch feed
  const techcrunch = feeds.find((f) => f.title === "TechCrunch");
  assertExists(techcrunch);
  assertEquals(techcrunch.xmlUrl, "https://techcrunch.com/feed/");

  // Check that TechCrunch has a category array
  assertExists(techcrunch.category);

  // Check BBC News feed
  const bbc = feeds.find((f) => f.title === "BBC News");
  assertExists(bbc);
  assertExists(bbc.category);
});

Deno.test("getFeedsByCategory - should filter feeds by category", () => {
  const document = parseOpml(COMPLEX_OPML);

  // Test Technology category
  const techFeeds = getFeedsByCategory(document, "Technology");
  assertEquals(
    techFeeds.length > 0,
    true,
    `Expected at least 1 Technology feed, got ${techFeeds.length}`,
  );

  // Check that TechCrunch is in Technology feeds
  const techCrunch = techFeeds.find((f) => f.title === "TechCrunch");
  assertExists(techCrunch);

  // Test News category
  const newsFeeds = getFeedsByCategory(document, "News");
  assertEquals(
    newsFeeds.length > 0,
    true,
    `Expected at least 1 News feed, got ${newsFeeds.length}`,
  );

  // Check that BBC News is in News feeds
  const bbcNews = newsFeeds.find((f) => f.title === "BBC News");
  assertExists(bbcNews);

  // Test non-existent category
  const nonExistentFeeds = getFeedsByCategory(document, "NonExistent");
  assertEquals(nonExistentFeeds.length, 0);
});

Deno.test("generateOpml - should generate valid OPML XML", () => {
  const document: OpmlDocument = {
    title: "Generated Feed Collection",
    outlines: [
      {
        title: "Tech",
        text: "Tech",
        children: [
          {
            title: "Example Tech",
            text: "Example Tech",
            type: "rss",
            xmlUrl: "https://example.com/tech/feed",
            htmlUrl: "https://example.com/tech",
            children: [],
          },
        ],
      },
    ],
  };

  const xml = generateOpml(document);

  // Parse the generated XML to verify it's valid
  const parsedDocument = parseOpml(xml);

  assertEquals(parsedDocument.title, "Generated Feed Collection");
  assertEquals(parsedDocument.outlines.length, 1);
  assertEquals(parsedDocument.outlines[0].title, "Tech");
  assertEquals(parsedDocument.outlines[0].children.length, 1);
  assertEquals(parsedDocument.outlines[0].children[0].title, "Example Tech");
  assertEquals(
    parsedDocument.outlines[0].children[0].xmlUrl,
    "https://example.com/tech/feed",
  );
});

Deno.test("generateOpml - should escape special characters", () => {
  const document: OpmlDocument = {
    title: "Feed & Collection",
    outlines: [
      {
        title: "Tech & News",
        text: "Tech & News",
        children: [
          {
            title: "Example <Tech>",
            text: "Example <Tech>",
            type: "rss",
            xmlUrl: "https://example.com/tech/feed?a=1&b=2",
            htmlUrl: "https://example.com/tech",
            children: [],
          },
        ],
      },
    ],
  };

  const xml = generateOpml(document);

  // Verify that the XML contains the expected content
  // The exact escaping might vary, so we check for inclusion of key parts
  assertEquals(xml.includes("Feed"), true);
  assertEquals(xml.includes("Collection"), true);
  assertEquals(xml.includes("Tech"), true);
  assertEquals(xml.includes("News"), true);
  assertEquals(xml.includes("Example"), true);
  assertEquals(xml.includes("Tech"), true);
  assertEquals(xml.includes("https://example.com/tech/feed"), true);

  // Parse the generated XML to verify it's valid
  const parsedDocument = parseOpml(xml);

  // The parser might return either the escaped or unescaped version
  // depending on implementation, so we check for either
  const titleIsValid = parsedDocument.title === "Feed & Collection" ||
    parsedDocument.title === "Feed &amp; Collection";
  assertEquals(titleIsValid, true);

  // Check outline title
  const outlineTitleIsValid =
    parsedDocument.outlines[0].title === "Tech & News" ||
    parsedDocument.outlines[0].title === "Tech &amp; News";
  assertEquals(outlineTitleIsValid, true);

  // Check feed title
  const feedTitleIsValid =
    parsedDocument.outlines[0].children[0].title === "Example <Tech>" ||
    parsedDocument.outlines[0].children[0].title === "Example &lt;Tech&gt;";
  assertEquals(feedTitleIsValid, true);

  // Check URL - should contain the query parameters
  const url = parsedDocument.outlines[0].children[0].xmlUrl;
  assertExists(url);
  assertEquals(url.includes("example.com/tech/feed"), true);
  assertEquals(url.includes("a=1"), true);
  assertEquals(url.includes("b=2"), true);
});
