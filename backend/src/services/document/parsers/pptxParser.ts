import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { IDocumentParser, ParsedDocument, ParsedPage } from "../documentParser.interface";

const xmlParser = new XMLParser({ ignoreAttributes: false });

/**
 * PPTX is a zip of OOXML files; slide text lives in `<a:t>` runs inside
 * ppt/slides/slideN.xml. This walks the parsed XML tree and collects
 * every `<a:t>` text value, in document order.
 */
function extractTextFromSlideXml(xml: string): string {
  const parsed: unknown = xmlParser.parse(xml);
  const textRuns: string[] = [];

  const collect = (node: unknown): void => {
    if (node === null || node === undefined) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }

    if (typeof node === "object") {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (key === "a:t") {
          const values = Array.isArray(value) ? value : [value];
          for (const v of values) {
            if (typeof v === "string") {
              textRuns.push(v);
            } else if (v && typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
              textRuns.push(String((v as Record<string, unknown>)["#text"]));
            }
          }
        } else {
          collect(value);
        }
      }
    }
  };

  collect(parsed);

  return textRuns.join(" ");
}

export class PptxParser implements IDocumentParser {
  readonly format = "pptx" as const;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const zip = await JSZip.loadAsync(buffer);

    const slideFileNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
        const numB = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
        return numA - numB;
      });

    const pages: ParsedPage[] = [];

    for (let i = 0; i < slideFileNames.length; i++) {
      const file = zip.files[slideFileNames[i]];
      const xml = await file.async("text");
      pages.push({ pageNumber: i + 1, text: extractTextFromSlideXml(xml) });
    }

    return {
      text: pages.map((page) => page.text).join("\n\n"),
      pages,
      metadata: { slideCount: pages.length },
    };
  }
}
