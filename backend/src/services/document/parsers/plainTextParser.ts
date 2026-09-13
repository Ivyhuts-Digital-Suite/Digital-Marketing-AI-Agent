import { DocumentFormat, IDocumentParser, ParsedDocument } from "../documentParser.interface";

/**
 * Handles TXT and Markdown identically: both are decoded as UTF-8 text.
 * Markdown syntax is preserved as-is (not stripped) since that is still
 * meaningful, readable text for downstream chunking/embedding.
 */
export class PlainTextParser implements IDocumentParser {
  constructor(public readonly format: Extract<DocumentFormat, "txt" | "markdown">) {}

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const text = buffer.toString("utf-8");

    return {
      text,
      metadata: { format: this.format },
    };
  }
}
