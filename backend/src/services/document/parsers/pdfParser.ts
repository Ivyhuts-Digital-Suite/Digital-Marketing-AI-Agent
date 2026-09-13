import { PDFParse } from "pdf-parse";
import { IDocumentParser, ParsedDocument, ParsedPage } from "../documentParser.interface";

export class PdfParser implements IDocumentParser {
  readonly format = "pdf" as const;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();

      const pages: ParsedPage[] = result.pages.map((page) => ({
        pageNumber: page.num,
        text: page.text,
      }));

      return {
        text: result.text,
        pages,
        metadata: { pageCount: result.total },
      };
    } finally {
      await parser.destroy();
    }
  }
}
