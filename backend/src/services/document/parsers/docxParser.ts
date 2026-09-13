import mammoth from "mammoth";
import { IDocumentParser, ParsedDocument } from "../documentParser.interface";

export class DocxParser implements IDocumentParser {
  readonly format = "docx" as const;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      metadata: {
        warnings: result.messages.map((message) => message.message),
      },
    };
  }
}
