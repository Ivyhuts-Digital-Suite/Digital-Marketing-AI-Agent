import { DocumentFormat } from "./documentParser.interface";
import { UnsupportedDocumentTypeError } from "./errors";

const MIME_TYPE_MAP: Record<string, DocumentFormat> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/markdown": "markdown",
  "text/x-markdown": "markdown",
  "text/csv": "csv",
  "application/csv": "csv",
  "application/vnd.ms-excel": "csv",
};

const EXTENSION_MAP: Record<string, DocumentFormat> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".pptx": "pptx",
  ".txt": "txt",
  ".md": "markdown",
  ".markdown": "markdown",
  ".csv": "csv",
};

export interface DocumentTypeInput {
  filename: string;
  mimeType?: string;
}

export function detectDocumentFormat(input: DocumentTypeInput): DocumentFormat {
  if (input.mimeType) {
    const normalizedMime = input.mimeType.split(";")[0].trim().toLowerCase();
    const byMime = MIME_TYPE_MAP[normalizedMime];

    if (byMime) {
      return byMime;
    }
  }

  const extensionMatch = /\.[^./\\]+$/.exec(input.filename.toLowerCase());
  const extension = extensionMatch ? extensionMatch[0] : "";
  const byExtension = EXTENSION_MAP[extension];

  if (byExtension) {
    return byExtension;
  }

  throw new UnsupportedDocumentTypeError(input.filename, input.mimeType);
}
