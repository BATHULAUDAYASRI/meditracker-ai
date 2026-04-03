import fs from "fs/promises";
import path from "path";
import * as pdfParsePkg from "pdf-parse";
import { createWorker } from "tesseract.js";

const pdfParse = pdfParsePkg.default || pdfParsePkg;

export async function extractPrescriptionText(filePath, mimeType = "") {
  if (!filePath) return "";
  if (mimeType.includes("pdf") || path.extname(filePath).toLowerCase() === ".pdf") {
    const buf = await fs.readFile(filePath);
    const data = await pdfParse(buf);
    return data.text || "";
  }

  if (mimeType.startsWith("image/")) {
    const worker = await createWorker("eng");
    try {
      const out = await worker.recognize(filePath);
      return out.data?.text || "";
    } finally {
      await worker.terminate();
    }
  }

  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  return raw || "";
}

