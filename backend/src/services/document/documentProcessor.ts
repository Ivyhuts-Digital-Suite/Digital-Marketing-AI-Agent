import { fileStorageService, FileStorageService } from "../storage/fileStorageService";
import { detectDocumentFormat } from "./documentTypeDetector";
import { normalizeText } from "./textNormalizer";
import { EmptyFileError, DocumentParseError } from "./errors";
import {
  DocumentFormat,
  IDocumentParser,
  ParsedDocument,
  ParsedPage,
  ParsedSection,
} from "./documentParser.interface";
import { PlainTextParser } from "./parsers/plainTextParser";
import { CsvParser } from "./parsers/csvParser";
import { PdfParser } from "./parsers/pdfParser";
import { DocxParser } from "./parsers/docxParser";
import { PptxParser } from "./parsers/pptxParser";

export interface ProcessDocumentInput {
  filename: string;
  mimeType?: string;
}

export interface ProcessedDocumentResult {
  format: DocumentFormat;
  filename: string;
  text: string;
  pages?: ParsedPage[];
  sections?: ParsedSection[];
  metadata?: Record<string, unknown>;
}

/**
 * Step 2: Document Processing.
 *
 * Original File -> Retrieve File -> Detect Document Type -> Extract Text
 * -> Normalize -> Return result.
 *
 * Deliberately stops here: no chunking, no embeddings, no KnowledgeChunk
 * documents are created by this service.
 */
export class DocumentProcessor {
  private readonly parsers: Record<DocumentFormat, IDocumentParser>;
  private readonly storageService: FileStorageService;

  constructor(storageService: FileStorageService = fileStorageService) {
    this.storageService = storageService;
    this.parsers = {
      pdf: new PdfParser(),
      docx: new DocxParser(),
      pptx: new PptxParser(),
      txt: new PlainTextParser("txt"),
      markdown: new PlainTextParser("markdown"),
      csv: new CsvParser(),
    };
  }

  /**
   * Extracts and normalizes text from an in-memory buffer. Useful for
   * testing parsers directly without a configured storage provider.
   */
  async processBuffer(
    buffer: Buffer,
    input: ProcessDocumentInput
  ): Promise<ProcessedDocumentResult> {
    if (!buffer || buffer.length === 0) {
      throw new EmptyFileError(input.filename);
    }

    const format = detectDocumentFormat(input);
    const parser = this.parsers[format];

    let parsed: ParsedDocument;

    try {
      parsed = await parser.parse(buffer);
    } catch (error) {
      throw new DocumentParseError(format, input.filename, error);
    }

    return {
      format,
      filename: input.filename,
      text: normalizeText(parsed.text),
      pages: parsed.pages?.map((page) => ({
        pageNumber: page.pageNumber,
        text: normalizeText(page.text),
      })),
      sections: parsed.sections?.map((section) => ({
        heading: section.heading,
        text: normalizeText(section.text),
      })),
      metadata: parsed.metadata,
    };
  }

  /**
   * Retrieves the original file from storage (by the key produced during
   * Step 1C: Store Original File) and extracts/normalizes its text.
   */
  async processFile(
    storageKey: string,
    input: ProcessDocumentInput
  ): Promise<ProcessedDocumentResult> {
    const storedFile = await this.storageService.getFile(storageKey);
    return this.processBuffer(storedFile.buffer, input);
  }
}

export const documentProcessor = new DocumentProcessor();
