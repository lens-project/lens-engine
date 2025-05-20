/**
 * OPML Parser
 *
 * A module for parsing OPML (Outline Processor Markup Language) files.
 * OPML is commonly used to exchange lists of RSS feeds between feed readers.
 *
 * This module provides functions to parse OPML files into structured data
 * and extract feed information.
 *
 * @module opml_parser
 * @lab Experimental OPML parser for feed management
 * @version 0.1.0
 */

/**
 * Represents an OPML document
 */
export interface OpmlDocument {
  title: string;
  outlines: OpmlOutline[];
}

/**
 * Represents an outline element in an OPML document
 */
export interface OpmlOutline {
  title: string;
  text: string;
  type?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  children: OpmlOutline[];
}

/**
 * Represents a feed source extracted from an OPML document
 */
export interface FeedSource {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  category: string[];
}

/**
 * Parses an OPML XML string into an OpmlDocument object
 *
 * @param xml - The OPML content as a string
 * @returns The parsed OPML document
 */
export function parseOpml(xml: string): OpmlDocument {
  try {
    // Simple XML parsing using regular expressions
    // This is a basic implementation for lab purposes
    // A more robust solution would use a proper XML parser

    // Extract the title
    const titleMatch = xml.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "Untitled OPML";

    // Parse the outlines
    const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1] : "";

    const outlines = parseOutlines(bodyContent);

    return {
      title,
      outlines,
    };
  } catch (error) {
    throw new Error(
      `Error parsing OPML: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Recursively parses outline elements from an OPML document
 *
 * @param content - The XML content containing outline elements
 * @returns An array of parsed outline elements
 */
function parseOutlines(content: string): OpmlOutline[] {
  const outlines: OpmlOutline[] = [];
  const outlineRegex = /<outline\s+(.*?)(?:>(?:([\s\S]*?)<\/outline>)|(?:\/>))/g;

  let match;
  while ((match = outlineRegex.exec(content)) !== null) {
    const attributesStr = match[1];
    const childContent = match[2] || "";

    // Parse attributes
    const title = extractAttribute(attributesStr, "title") || "";
    const text = extractAttribute(attributesStr, "text") || title;
    const type = extractAttribute(attributesStr, "type");
    const xmlUrl = extractAttribute(attributesStr, "xmlUrl");
    const htmlUrl = extractAttribute(attributesStr, "htmlUrl");

    // Parse child outlines if they exist
    const children = childContent ? parseOutlines(childContent) : [];

    outlines.push({
      title,
      text,
      type,
      xmlUrl,
      htmlUrl,
      children,
    });
  }

  return outlines;
}

/**
 * Extracts an attribute value from an XML attributes string
 *
 * @param attributesStr - The string containing XML attributes
 * @param name - The name of the attribute to extract
 * @returns The attribute value or undefined if not found
 */
function extractAttribute(attributesStr: string, name: string): string | undefined {
  const regex = new RegExp(`${name}="(.*?)"`, "i");
  const match = attributesStr.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Extracts feed sources from an OPML document
 *
 * @param document - The parsed OPML document
 * @returns An array of feed sources
 */
export function extractFeeds(document: OpmlDocument): FeedSource[] {
  const feeds: FeedSource[] = [];
  
  function processOutline(outline: OpmlOutline, categories: string[] = []) {
    // If this is a feed (has xmlUrl), add it to the list
    if (outline.xmlUrl) {
      feeds.push({
        title: outline.title || outline.text,
        xmlUrl: outline.xmlUrl,
        htmlUrl: outline.htmlUrl,
        category: [...categories],
      });
    }
    
    // If this is a category (has children), process them
    if (outline.children && outline.children.length > 0) {
      const newCategories = [...categories];
      if (outline.title) {
        newCategories.push(outline.title);
      }
      
      for (const child of outline.children) {
        processOutline(child, newCategories);
      }
    }
  }
  
  // Process all top-level outlines
  for (const outline of document.outlines) {
    processOutline(outline);
  }
  
  return feeds;
}

/**
 * Gets feeds from a specific category in an OPML document
 *
 * @param document - The parsed OPML document
 * @param categoryName - The category name to filter by
 * @returns An array of feed sources in the specified category
 */
export function getFeedsByCategory(document: OpmlDocument, categoryName: string): FeedSource[] {
  const allFeeds = extractFeeds(document);
  return allFeeds.filter(feed => feed.category.includes(categoryName));
}

/**
 * Generates OPML XML from an OpmlDocument object
 *
 * @param document - The OPML document object
 * @returns The generated OPML XML as a string
 */
export function generateOpml(document: OpmlDocument): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<opml version="2.0">\n';
  xml += '<head>\n';
  xml += `  <title>${escapeXml(document.title)}</title>\n`;
  xml += '</head>\n';
  xml += '<body>\n';
  
  // Generate outline elements
  xml += document.outlines.map(outline => generateOutlineXml(outline, 1)).join('');
  
  xml += '</body>\n';
  xml += '</opml>';
  
  return xml;
}

/**
 * Recursively generates XML for an outline element
 *
 * @param outline - The outline element
 * @param indent - The indentation level
 * @returns The generated XML for the outline element
 */
function generateOutlineXml(outline: OpmlOutline, indent: number): string {
  const spaces = '  '.repeat(indent);
  let xml = `${spaces}<outline`;
  
  // Add attributes
  if (outline.title) xml += ` title="${escapeXml(outline.title)}"`;
  if (outline.text) xml += ` text="${escapeXml(outline.text)}"`;
  if (outline.type) xml += ` type="${escapeXml(outline.type)}"`;
  if (outline.xmlUrl) xml += ` xmlUrl="${escapeXml(outline.xmlUrl)}"`;
  if (outline.htmlUrl) xml += ` htmlUrl="${escapeXml(outline.htmlUrl)}"`;
  
  // Handle children
  if (outline.children && outline.children.length > 0) {
    xml += '>\n';
    for (const child of outline.children) {
      xml += generateOutlineXml(child, indent + 1);
    }
    xml += `${spaces}</outline>\n`;
  } else {
    xml += ' />\n';
  }
  
  return xml;
}

/**
 * Escapes special characters for XML
 *
 * @param str - The string to escape
 * @returns The escaped string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
