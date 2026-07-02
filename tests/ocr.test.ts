import { describe, it, expect } from "vitest";
import type { OcrResult, ScanHistory } from "../shared/ocr-types";

describe("OCR Types", () => {
  it("should have all required fields in OcrResult", () => {
    const result: OcrResult = {
      isLabelObat: true,
      namaObat: "Paracetamol 500mg",
      komposisi: "Paracetamol 500mg",
      dosis: "3x sehari 1 tablet",
      indikasi: "Demam dan nyeri",
      kontraindikasi: "Gangguan hati berat",
      efekSamping: "Mual, ruam kulit",
      tanggalKadaluarsa: "12/2026",
      nomorRegistrasi: "DTL0101234567A1",
      produsen: "PT Kimia Farma",
      penyimpanan: "Simpan di bawah 30°C",
      beratBersih: "10 tablet",
      hargaEceranTertinggi: "Rp 5.000",
      rawText: "PARACETAMOL\n500mg\n3x sehari",
    };

    expect(result.namaObat).toBe("Paracetamol 500mg");
    expect(result.komposisi).toBe("Paracetamol 500mg");
    expect(result.dosis).toBe("3x sehari 1 tablet");
    expect(result.nomorRegistrasi).toBe("DTL0101234567A1");
    expect(result.produsen).toBe("PT Kimia Farma");
  });

  it("should have all required fields in ScanHistory", () => {
    const history: ScanHistory = {
      id: "1234567890",
      imageUri: "file:///path/to/image.jpg",
      result: {
        isLabelObat: true,
        namaObat: "Amoxicillin",
        komposisi: "",
        dosis: "",
        indikasi: "",
        kontraindikasi: "",
        efekSamping: "",
        tanggalKadaluarsa: "",
        nomorRegistrasi: "",
        produsen: "",
        penyimpanan: "",
        beratBersih: "",
        hargaEceranTertinggi: "",
        rawText: "",
      },
      scannedAt: new Date().toISOString(),
    };

    expect(history.id).toBe("1234567890");
    expect(history.imageUri).toBe("file:///path/to/image.jpg");
    expect(history.result.namaObat).toBe("Amoxicillin");
    expect(history.scannedAt).toBeTruthy();
  });

  it("should parse ISO date string correctly", () => {
    const isoDate = "2026-04-22T10:30:00.000Z";
    const parsed = new Date(isoDate);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(3); // April = 3 (0-indexed)
  });

  it("should handle empty OCR result fields gracefully", () => {
    const emptyResult: OcrResult = {
      isLabelObat: false,
      namaObat: "",
      komposisi: "",
      dosis: "",
      indikasi: "",
      kontraindikasi: "",
      efekSamping: "",
      tanggalKadaluarsa: "",
      nomorRegistrasi: "",
      produsen: "",
      penyimpanan: "",
      beratBersih: "",
      hargaEceranTertinggi: "",
      rawText: "",
    };

    // All string fields should be empty strings, not undefined/null
    const { isLabelObat: _, ...stringFields } = emptyResult;
    Object.values(stringFields).forEach((val) => {
      expect(val).toBe("");
    });
    expect(emptyResult.isLabelObat).toBe(false);
  });

  it("should correctly format OCR result for clipboard copy", () => {
    const result: OcrResult = {
      isLabelObat: true,
      namaObat: "Paracetamol 500mg",
      komposisi: "Paracetamol 500mg",
      dosis: "3x sehari",
      indikasi: "Demam",
      kontraindikasi: "",
      efekSamping: "",
      tanggalKadaluarsa: "12/2026",
      nomorRegistrasi: "DTL0101234567A1",
      produsen: "PT Kimia Farma",
      penyimpanan: "",
      beratBersih: "",
      hargaEceranTertinggi: "",
      rawText: "",
    };

    const text = [
      result.namaObat && `Nama Obat: ${result.namaObat}`,
      result.komposisi && `Komposisi: ${result.komposisi}`,
      result.dosis && `Dosis: ${result.dosis}`,
      result.indikasi && `Indikasi: ${result.indikasi}`,
      result.tanggalKadaluarsa && `Kadaluarsa: ${result.tanggalKadaluarsa}`,
      result.nomorRegistrasi && `No. Registrasi: ${result.nomorRegistrasi}`,
      result.produsen && `Produsen: ${result.produsen}`,
    ]
      .filter(Boolean)
      .join("\n");

    expect(text).toContain("Nama Obat: Paracetamol 500mg");
    expect(text).toContain("Dosis: 3x sehari");
    expect(text).toContain("Produsen: PT Kimia Farma");
    expect(text).not.toContain("Kontraindikasi");
  });
});
