/**
 * Document text extraction abstraction (Step 2: Document Processing).
 *
 * Each parser is responsible only for extracting text out of one document
 * format. Chunking, embedding, and vector search are explicitly out of
 * scope here and are handled by later steps.
 */

export type DocumentFormat = "pdf" | "docx" | "pptx" | "txt" | "markdown" | "csv";

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedSection {
  heading?: string;
  text: string;
}

export interface ParsedDocument {
  text: string;
  pages?: ParsedPage[];
  sections?: ParsedSection[];
  metadata?: Record<string, unknown>;
}

export interface IDocumentParser {
  readonly format: DocumentFormat;
  parse(buffer: Buffer): Promise<ParsedDocument>;
}
