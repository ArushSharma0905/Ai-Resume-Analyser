import { extractText } from "unpdf";
import mammoth from "mammoth";

export interface ExtractedTextResult {
  text: string;
  fileType: "pdf" | "docx" | "txt";
  fileName: string;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractedTextResult> {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf" || mimeType === "application/pdf") {
    try {
      const uint8 = new Uint8Array(buffer);
      const { text } = await extractText(uint8, { mergePages: true });
      const extractedText = text?.trim();

      if (!extractedText) {
        throw new Error(
          "Could not extract readable text from this PDF file. It may be scanned or password-protected."
        );
      }

      return {
        text: extractedText,
        fileType: "pdf",
        fileName,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse PDF document.";
      throw new Error(`PDF extraction failed: ${msg}`);
    }
  }

  if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const extractedText = result.value?.trim();

      if (!extractedText) {
        throw new Error("Could not extract readable text from this DOCX file. The document may be empty.");
      }

      return {
        text: extractedText,
        fileType: "docx",
        fileName,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse DOCX document.";
      throw new Error(`DOCX extraction failed: ${msg}`);
    }
  }

  if (extension === "txt" || extension === "md" || mimeType?.startsWith("text/")) {
    const extractedText = buffer.toString("utf-8").trim();
    if (!extractedText) {
      throw new Error("The uploaded text file is empty.");
    }
    return {
      text: extractedText,
      fileType: "txt",
      fileName,
    };
  }

  throw new Error(`Unsupported file type: .${extension || "unknown"}. Please upload a PDF, DOCX, or TXT file.`);
}
