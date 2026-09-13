export class UnsupportedDocumentTypeError extends Error {
  constructor(filename: string, mimeType?: string) {
    super(
      `Unsupported document type for file "${filename}"${
        mimeType ? ` (mime type: ${mimeType})` : ""
      }.`
    );
    this.name = "UnsupportedDocumentTypeError";
  }
}

export class EmptyFileError extends Error {
  constructor(filename: string) {
    super(`Cannot process "${filename}": file is empty.`);
    this.name = "EmptyFileError";
  }
}

export class DocumentParseError extends Error {
  public readonly originalError: unknown;

  constructor(format: string, filename: string, originalError: unknown) {
    const originalMessage =
      originalError instanceof Error ? originalError.message : String(originalError);

    super(`Failed to parse "${filename}" as ${format}: ${originalMessage}`);
    this.name = "DocumentParseError";
    this.originalError = originalError;
  }
}
