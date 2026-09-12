import { parse } from "csv-parse/sync";
import { IDocumentParser, ParsedDocument } from "../documentParser.interface";

/**
 * Converts CSV rows into readable "column: value" lines rather than
 * returning raw delimited text, so it reads naturally as extracted text.
 */
export class CsvParser implements IDocumentParser {
  readonly format = "csv" as const;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const rows: string[][] = parse(buffer, {
      skip_empty_lines: true,
      relax_column_count: true,
    });

    if (rows.length === 0) {
      return { text: "", metadata: { rowCount: 0 } };
    }

    const [header, ...dataRows] = rows;

    const lines = dataRows.map((row) =>
      header.map((column, index) => `${column}: ${row[index] ?? ""}`).join(", ")
    );

    return {
      text: lines.join("\n"),
      metadata: {
        rowCount: dataRows.length,
        columns: header,
      },
    };
  }
}
