/**
 * Test Fixtures for Feeds Lab Tests
 *
 * This module provides test fixtures for the feeds lab tests:
 * - Sample OPML content with different structures
 * - Sample RSS feed content with different formats
 * - Mock functions for network and file system operations
 * - Helper functions for testing
 */

// ============================================================================
// Sample OPML Content
// ============================================================================

/**
 * Simple OPML document with a few feeds
 */
export const SIMPLE_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Simple Feed Collection</title>
  </head>
  <body>
    <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="https://techcrunch.com/feed/" htmlUrl="https://techcrunch.com" />
    <outline type="rss" text="Wired" title="Wired" xmlUrl="https://www.wired.com/feed/rss" htmlUrl="https://www.wired.com" />
    <outline type="rss" text="BBC News" title="BBC News" xmlUrl="http://feeds.bbci.co.uk/news/rss.xml" htmlUrl="https://www.bbc.com/news" />
  </body>
</opml>`;

/**
 * Complex OPML document with nested categories
 */
export const COMPLEX_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Complex Feed Collection</title>
  </head>
  <body>
    <outline title="Technology" text="Technology">
      <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="https://techcrunch.com/feed/" htmlUrl="https://techcrunch.com" />
      <outline type="rss" text="Wired" title="Wired" xmlUrl="https://www.wired.com/feed/rss" htmlUrl="https://www.wired.com" />
      <outline title="Programming" text="Programming">
        <outline type="rss" text="Hacker News" title="Hacker News" xmlUrl="https://news.ycombinator.com/rss" htmlUrl="https://news.ycombinator.com" />
        <outline type="rss" text="Dev.to" title="Dev.to" xmlUrl="https://dev.to/feed" htmlUrl="https://dev.to" />
      </outline>
    </outline>
    <outline title="News" text="News">
      <outline type="rss" text="BBC News" title="BBC News" xmlUrl="http://feeds.bbci.co.uk/news/rss.xml" htmlUrl="https://www.bbc.com/news" />
      <outline type="rss" text="CNN" title="CNN" xmlUrl="http://rss.cnn.com/rss/edition.rss" htmlUrl="https://www.cnn.com" />
    </outline>
    <outline title="Personal" text="Personal">
      <outline type="rss" text="Austin Kleon" title="Austin Kleon" xmlUrl="https://austinkleon.com/feed/" htmlUrl="https://austinkleon.com" />
    </outline>
  </body>
</opml>`;

/**
 * OPML document with special characters
 */
export const SPECIAL_CHARS_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Feed &amp; Collection</title>
  </head>
  <body>
    <outline title="Tech &amp; News" text="Tech &amp; News">
      <outline type="rss" text="Example &lt;Tech&gt;" title="Example &lt;Tech&gt;" xmlUrl="https://example.com/tech/feed?a=1&amp;b=2" htmlUrl="https://example.com/tech" />
    </outline>
  </body>
</opml>`;

/**
 * Empty OPML document
 */
export const EMPTY_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Empty Feed Collection</title>
  </head>
  <body>
  </body>
</opml>`;

/**
 * Malformed OPML document
 */
export const MALFORMED_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Malformed Feed Collection
  </head>
  <body>
    <outline type="rss" text="Broken Feed" title="Broken Feed" xmlUrl="https://example.com/feed" htmlUrl="https://example.com" />
  </body>
</opml>`;

// ============================================================================
// Sample RSS Feed Content
// ============================================================================

/**
 * Simple RSS feed with a few items
 */
export const SIMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Simple Test Feed</title>
    <link>https://example.com</link>
    <description>A simple test RSS feed</description>
    <item>
      <title>Test Item 1</title>
      <link>https://example.com/item1</link>
      <pubDate>Mon, 01 Jan 2023 12:00:00 GMT</pubDate>
      <description>This is test item 1</description>
      <guid>https://example.com/item1</guid>
    </item>
    <item>
      <title>Test Item 2</title>
      <link>https://example.com/item2</link>
      <pubDate>Tue, 02 Jan 2023 12:00:00 GMT</pubDate>
      <description>This is test item 2</description>
      <guid>https://example.com/item2</guid>
    </item>
  </channel>
</rss>`;

/**
 * Complex RSS feed with many items and rich content
 */
export const COMPLEX_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Complex Test Feed</title>
    <link>https://example.com</link>
    <description>A complex test RSS feed with rich content</description>
    <language>en-us</language>
    <lastBuildDate>Wed, 03 Jan 2023 12:00:00 GMT</lastBuildDate>
    <item>
      <title>Complex Item 1</title>
      <link>https://example.com/complex1</link>
      <pubDate>Mon, 01 Jan 2023 12:00:00 GMT</pubDate>
      <dc:creator>Test Author</dc:creator>
      <category>Technology</category>
      <category>Web</category>
      <description>This is a complex item with HTML: &lt;p&gt;Paragraph with &lt;strong&gt;bold&lt;/strong&gt; text&lt;/p&gt;</description>
      <content:encoded><![CDATA[<p>This is the full content with <strong>rich</strong> HTML formatting.</p><p>It includes multiple paragraphs and <a href="https://example.com">links</a>.</p>]]></content:encoded>
      <guid isPermaLink="true">https://example.com/complex1</guid>
    </item>
    <item>
      <title>Complex Item 2</title>
      <link>https://example.com/complex2</link>
      <pubDate>Tue, 02 Jan 2023 12:00:00 GMT</pubDate>
      <dc:creator>Another Author</dc:creator>
      <category>Science</category>
      <description>Another complex item</description>
      <content:encoded><![CDATA[<p>More rich content here.</p>]]></content:encoded>
      <guid>unique-id-12345</guid>
    </item>
  </channel>
</rss>`;

/**
 * RSS feed with special characters and CDATA sections
 */
export const SPECIAL_CHARS_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Special &amp; Characters Feed</title>
    <link>https://example.com</link>
    <description>A feed with special characters &amp; CDATA sections</description>
    <item>
      <title>Special &lt;Characters&gt; Item</title>
      <link>https://example.com/special</link>
      <description><![CDATA[This description has <strong>HTML</strong> and special characters: & < > " ']]></description>
      <guid>https://example.com/special</guid>
    </item>
  </channel>
</rss>`;

/**
 * Empty RSS feed with no items
 */
export const EMPTY_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Test Feed</title>
    <link>https://example.com</link>
    <description>An empty test RSS feed</description>
  </channel>
</rss>`;

/**
 * Malformed RSS feed
 */
export const MALFORMED_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Malformed Test Feed
    <link>https://example.com</link>
    <item>
      <title>Malformed Item</title>
      <link>https://example.com/malformed</link>
    </item>
  </channel>
</rss>`;

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Setup mocks for file system operations
 *
 * @param opmlContent The OPML content to return from readTextFile for OPML files
 * @param rssContent The RSS content to return from readTextFile for RSS files
 * @returns Object with captured write information and restore function
 */
export function setupFileMocks(
  opmlContent: string = COMPLEX_OPML,
  rssContent: string = SIMPLE_RSS,
) {
  // Store original functions
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;

  // Captured write information
  const writtenFiles: Record<string, string> = {};
  const createdDirs: string[] = [];

  // Mock Deno.readTextFile to return provided content based on file extension
  // @ts-ignore: Mocking for test purposes
  Deno.readTextFile = (path) => {
    const pathStr = String(path);

    if (pathStr.endsWith(".opml")) {
      return Promise.resolve(opmlContent);
    } else if (pathStr.endsWith(".xml") || pathStr.endsWith(".rss")) {
      return Promise.resolve(rssContent);
    } else if (pathStr.endsWith(".json")) {
      // Return empty JSON object for JSON files
      return Promise.resolve("{}");
    } else {
      throw new Deno.errors.NotFound(`File not found: ${pathStr}`);
    }
  };

  // Mock Deno.writeTextFile to capture written content
  // @ts-ignore: Mocking for test purposes
  Deno.writeTextFile = (path, content) => {
    const pathStr = String(path);
    writtenFiles[pathStr] = String(content);
    return Promise.resolve();
  };

  // Mock Deno.mkdir to track created directories
  // @ts-ignore: Mocking for test purposes
  Deno.mkdir = (path, _options) => {
    const pathStr = String(path);
    createdDirs.push(pathStr);
    return Promise.resolve();
  };

  // Mock Deno.stat to simulate file/directory exists
  // @ts-ignore: Mocking for test purposes
  Deno.stat = (path) => {
    const pathStr = String(path);

    // If the path is in writtenFiles, it's a file
    if (pathStr in writtenFiles) {
      return Promise.resolve({
        isFile: () => true,
        isDirectory: () => false,
        isSymlink: () => false,
        size: 0,
        mtime: new Date(),
        atime: new Date(),
        birthtime: new Date(),
        dev: 0,
        ino: 0,
        mode: 0,
        nlink: 0,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 0,
        blocks: 0,
      } as unknown as Deno.FileInfo);
    }

    // If the path is in createdDirs, it's a directory
    if (createdDirs.includes(pathStr)) {
      return Promise.resolve({
        isFile: () => false,
        isDirectory: () => true,
        isSymlink: () => false,
        size: 0,
        mtime: new Date(),
        atime: new Date(),
        birthtime: new Date(),
        dev: 0,
        ino: 0,
        mode: 0,
        nlink: 0,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 0,
        blocks: 0,
      } as unknown as Deno.FileInfo);
    }

    // Otherwise, the file/directory doesn't exist
    throw new Deno.errors.NotFound(`File not found: ${pathStr}`);
  };

  // Return captured information and restore function
  return {
    getWrittenFiles: () => writtenFiles,
    getCreatedDirs: () => createdDirs,
    restore: () => {
      Deno.readTextFile = originalReadTextFile;
      Deno.writeTextFile = originalWriteTextFile;
      Deno.mkdir = originalMkdir;
      Deno.stat = originalStat;
    },
  };
}

/**
 * Setup mocks for network operations
 *
 * @param responseMap Map of URLs to response content
 * @returns Object with restore function
 */
export function setupNetworkMocks(responseMap: Record<string, {
  content: string;
  status: number;
  ok: boolean;
}> = {}) {
  // Store original fetch
  const originalFetch = globalThis.fetch;

  // Default response for any URL not in the map
  const defaultResponse = {
    content: SIMPLE_RSS,
    status: 200,
    ok: true,
  };

  // Mock fetch to return responses from the map
  // @ts-ignore: Mocking for test purposes
  globalThis.fetch = (url, _options) => {
    const urlStr = String(url);

    // Find the closest matching URL in the map
    const matchingUrl = Object.keys(responseMap).find((key) =>
      urlStr.includes(key)
    );
    const response = matchingUrl ? responseMap[matchingUrl] : defaultResponse;

    return Promise.resolve({
      ok: response.ok,
      status: response.status,
      statusText: response.ok ? "OK" : "Error",
      text: () => Promise.resolve(response.content),
    } as Response);
  };

  // Return restore function
  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

/**
 * Setup mocks for environment variables
 *
 * @param envVars Map of environment variables to values
 * @returns Object with restore function
 */
export function setupEnvMocks(envVars: Record<string, string> = {}) {
  // Store original env.get
  const originalGet = Deno.env.get;
  const originalSet = Deno.env.set;

  // Mock env.get to return values from the map
  // @ts-ignore: Mocking for test purposes
  Deno.env.get = (key) => {
    return key in envVars ? envVars[key] : null;
  };

  // Mock env.set to update the map
  // @ts-ignore: Mocking for test purposes
  Deno.env.set = (key, value) => {
    envVars[key] = value;
  };

  // Return restore function
  return {
    restore: () => {
      Deno.env.get = originalGet;
      Deno.env.set = originalSet;
    },
  };
}

/**
 * Setup mocks for the ensureDir function
 *
 * @param dirExists Whether the directory should be reported as existing
 * @param isDirectory Whether the path should be reported as a directory (vs a file)
 * @returns Object with information about mkdir calls and restore function
 */
export function setupEnsureDirMock(dirExists = true, isDirectory = true) {
  // Store original functions
  const originalStat = Deno.stat;
  const originalMkdir = Deno.mkdir;

  // Track mkdir calls
  let mkdirCalled = false;
  let mkdirPath = "";

  // Mock Deno.stat
  // @ts-ignore: Mocking for test purposes
  Deno.stat = (_path) => {
    if (!dirExists) {
      throw new Deno.errors.NotFound();
    }
    return Promise.resolve({
      isFile: () => !isDirectory,
      isDirectory: () => isDirectory,
      isSymlink: () => false,
      size: 0,
      mtime: new Date(),
      atime: new Date(),
      birthtime: new Date(),
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      blksize: 0,
      blocks: 0,
    } as unknown as Deno.FileInfo);
  };

  // Mock Deno.mkdir
  // @ts-ignore: Mocking for test purposes
  Deno.mkdir = (path, _options) => {
    mkdirCalled = true;
    mkdirPath = String(path);
    return Promise.resolve();
  };

  // Return information and restore function
  return {
    wasMkdirCalled: () => mkdirCalled,
    getMkdirPath: () => mkdirPath,
    restore: () => {
      Deno.stat = originalStat;
      Deno.mkdir = originalMkdir;
    },
  };
}

/**
 * Expected parsed results for testing
 */
export const EXPECTED_PARSED_OPML = {
  title: "Complex Feed Collection",
  outlines: [
    {
      title: "Technology",
      text: "Technology",
      children: [
        {
          type: "rss",
          text: "TechCrunch",
          title: "TechCrunch",
          xmlUrl: "https://techcrunch.com/feed/",
          htmlUrl: "https://techcrunch.com",
          children: [],
        },
        {
          type: "rss",
          text: "Wired",
          title: "Wired",
          xmlUrl: "https://www.wired.com/feed/rss",
          htmlUrl: "https://www.wired.com",
          children: [],
        },
        {
          title: "Programming",
          text: "Programming",
          children: [
            {
              type: "rss",
              text: "Hacker News",
              title: "Hacker News",
              xmlUrl: "https://news.ycombinator.com/rss",
              htmlUrl: "https://news.ycombinator.com",
              children: [],
            },
            {
              type: "rss",
              text: "Dev.to",
              title: "Dev.to",
              xmlUrl: "https://dev.to/feed",
              htmlUrl: "https://dev.to",
              children: [],
            },
          ],
        },
      ],
    },
    {
      title: "News",
      text: "News",
      children: [
        {
          type: "rss",
          text: "BBC News",
          title: "BBC News",
          xmlUrl: "http://feeds.bbci.co.uk/news/rss.xml",
          htmlUrl: "https://www.bbc.com/news",
          children: [],
        },
        {
          type: "rss",
          text: "CNN",
          title: "CNN",
          xmlUrl: "http://rss.cnn.com/rss/edition.rss",
          htmlUrl: "https://www.cnn.com",
          children: [],
        },
      ],
    },
    {
      title: "Personal",
      text: "Personal",
      children: [
        {
          type: "rss",
          text: "Austin Kleon",
          title: "Austin Kleon",
          xmlUrl: "https://austinkleon.com/feed/",
          htmlUrl: "https://austinkleon.com",
          children: [],
        },
      ],
    },
  ],
};

/**
 * Expected extracted feeds for testing
 */
export const EXPECTED_EXTRACTED_FEEDS = [
  {
    type: "rss",
    text: "TechCrunch",
    title: "TechCrunch",
    xmlUrl: "https://techcrunch.com/feed/",
    htmlUrl: "https://techcrunch.com",
    category: ["Technology"],
  },
  {
    type: "rss",
    text: "Wired",
    title: "Wired",
    xmlUrl: "https://www.wired.com/feed/rss",
    htmlUrl: "https://www.wired.com",
    category: ["Technology"],
  },
  {
    type: "rss",
    text: "Hacker News",
    title: "Hacker News",
    xmlUrl: "https://news.ycombinator.com/rss",
    htmlUrl: "https://news.ycombinator.com",
    category: ["Technology", "Programming"],
  },
  {
    type: "rss",
    text: "Dev.to",
    title: "Dev.to",
    xmlUrl: "https://dev.to/feed",
    htmlUrl: "https://dev.to",
    category: ["Technology", "Programming"],
  },
  {
    type: "rss",
    text: "BBC News",
    title: "BBC News",
    xmlUrl: "http://feeds.bbci.co.uk/news/rss.xml",
    htmlUrl: "https://www.bbc.com/news",
    category: ["News"],
  },
  {
    type: "rss",
    text: "CNN",
    title: "CNN",
    xmlUrl: "http://rss.cnn.com/rss/edition.rss",
    htmlUrl: "https://www.cnn.com",
    category: ["News"],
  },
  {
    type: "rss",
    text: "Austin Kleon",
    title: "Austin Kleon",
    xmlUrl: "https://austinkleon.com/feed/",
    htmlUrl: "https://austinkleon.com",
    category: ["Personal"],
  },
];
