// Shared types untuk hasil OCR label obat

export interface OcrResult {
  isLabelObat: boolean;
  namaObat: string;
  komposisi: string;
  dosis: string;
  indikasi: string;
  kontraindikasi: string;
  efekSamping: string;
  tanggalKadaluarsa: string;
  nomorRegistrasi: string;
  produsen: string;
  penyimpanan: string;
  beratBersih: string;
  hargaEceranTertinggi: string;
  rawText: string;
}

export interface ScanHistory {
  id: string;
  imageUri: string;
  result: OcrResult;
  scannedAt: string; // ISO date string
}
