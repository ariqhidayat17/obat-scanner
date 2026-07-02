import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM, type Message } from "./_core/llm";
import { storagePut, storageGetSignedUrl } from "./storage";
import { extractTextWithPaddle } from "./_core/paddleOcr";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ocr: router({
    /**
     * Endpoint untuk memproses gambar label obat menggunakan OCR berbasis LLM multimodal.
     * Menerima gambar dalam format base64, mengunggahnya ke S3, lalu mengirimkan ke LLM
     * untuk ekstraksi teks terstruktur dari label obat.
     */
    scan: publicProcedure
      .input(
        z.object({
          imageBase64: z.string().min(1, "Image data required").max(8000000, "Image too large"),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const { imageBase64, mimeType } = input;

        // 1. Decode base64 dan upload ke S3 agar bisa diakses LLM
        const imageBuffer = Buffer.from(imageBase64, "base64");
        const fileExt = mimeType.includes("png") ? "png" : "jpg";
        
        let storageUrl = "";
        let publicImageUrl = "";
        try {
          const res = await storagePut(
            `ocr-scans/scan.${fileExt}`,
            imageBuffer,
            mimeType
          );
          storageUrl = res.url;
          const storageKey = storageUrl.replace("/manus-storage/", "");
          publicImageUrl = await storageGetSignedUrl(storageKey);
        } catch (e) {
          console.error("Failed to upload image to storage, using base64 fallback:", e);
          storageUrl = `data:${mimeType};base64,${imageBase64}`;
          publicImageUrl = storageUrl;
        }

        // 2. Coba extract raw text menggunakan PaddleOCR
        let paddleRawText = "";
        let hasPaddleResult = false;
        try {
          console.log("Attempting PaddleOCR text extraction...");
          paddleRawText = await extractTextWithPaddle(imageBase64);
          hasPaddleResult = true;
          console.log("PaddleOCR text extraction succeeded.");
        } catch (ocrError) {
          console.error("PaddleOCR failed or unavailable, falling back to direct LLM OCR:", ocrError);
        }

        // 3. Kirim gambar ke LLM multimodal untuk OCR dan ekstraksi informasi obat
        const systemPrompt = `Kamu adalah sistem OCR (Optical Character Recognition) berbasis Deep Learning yang dirancang khusus untuk membaca, menerjemahkan, dan mengekstrak informasi dari label/kemasan obat.
${hasPaddleResult ? "\nKami telah mengekstrak beberapa teks mentah menggunakan PaddleOCR untuk membantumu. Gunakan teks ini dan verifikasi dengan melihat gambar:\n" + paddleRawText + "\n" : ""}
Tugasmu adalah:
1. PERTAMA, tentukan apakah gambar yang diberikan merupakan label/kemasan obat atau bukan. Perhatikan ciri-ciri label obat seperti: nama obat, komposisi/kandungan, dosis/aturan pakai, indikasi, kontraindikasi, efek samping, nomor registrasi BPOM/izin edar, nama produsen farmasi, tanggal kadaluarsa, dll. Jika gambar BUKAN label obat (misalnya spanduk, poster, dokumen, buku, papan nama, makanan, atau objek lain), maka set "isLabelObat" menjadi false.
2. Membaca semua teks yang terlihat pada gambar.
3. Jika gambar ADALAH label obat, ekstrak informasi terstruktur dari teks tersebut.
4. MENERJEMAHKAN dan MENULISKAN semua informasi hasil ekstraksi (khususnya namaObat, komposisi, dosis, indikasi, kontraindikasi, efekSamping, penyimpanan, dll.) ke dalam BAHASA INDONESIA yang baik, benar, dan mudah dipahami oleh pasien awam, bahkan jika label asli pada kemasan obat menggunakan Bahasa Inggris atau bahasa asing lainnya.
5. Mengembalikan hasil dalam format JSON yang terstruktur.

Selalu kembalikan JSON dengan struktur berikut (isi dengan string kosong "" jika tidak ditemukan, atau jika bukan label obat):
{
  "isLabelObat": true/false,
  "namaObat": "nama produk obat",
  "komposisi": "kandungan/komposisi aktif (diterjemahkan/ditulis dalam Bahasa Indonesia)",
  "dosis": "aturan pakai dan dosis (diterjemahkan/ditulis dalam Bahasa Indonesia)",
  "indikasi": "kegunaan/indikasi obat (diterjemahkan/ditulis dalam Bahasa Indonesia)",
  "kontraindikasi": "kontraindikasi jika ada (diterjemahkan/ditulis dalam Bahasa Indonesia)",
  "efekSamping": "efek samping jika ada (diterjemahkan/ditulis dalam Bahasa Indonesia)",
  "tanggalKadaluarsa": "tanggal expired",
  "nomorRegistrasi": "nomor registrasi BPOM/izin edar",
  "produsen": "nama produsen/pabrik",
  "penyimpanan": "cara penyimpanan (diterjemahkan/ditulis dalam Bahasa Indonesia)",
  "beratBersih": "berat bersih/netto",
  "hargaEceranTertinggi": "HET jika ada",
  "rawText": "semua teks asli yang berhasil dibaca dari gambar (biarkan dalam bahasa aslinya untuk referensi), dipisahkan dengan newline"
}

PENTING: Jika gambar BUKAN label obat, set isLabelObat ke false dan isi field lainnya dengan string kosong "".`;

        const userPromptText = hasPaddleResult
          ? "Berikut adalah raw text dari OCR:\n" + paddleRawText + "\nTolong verifikasi dengan gambar, lalu ekstrak dan kembalikan informasi detail obat dalam format JSON."
          : "Tolong baca dan ekstrak semua informasi dari label obat pada gambar ini. Kembalikan hasil dalam format JSON yang telah ditentukan.";

        const messages: Message[] = [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: userPromptText,
              },
              {
                type: "image_url" as const,
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high" as const,
                },
              },
            ],
          },
        ];

        let response;
        try {
          response = await invokeLLM({
            messages,
            response_format: { type: "json_object" },
          });
        } catch (e) {
          console.error("LLM Error in scan:", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Layanan AI sedang sibuk. Silakan coba lagi.",
          });
        }

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        let ocrResult: Record<string, string>;
        try {
          ocrResult = JSON.parse(content);
        } catch {
          ocrResult = { rawText: content };
        }

        return {
          success: true,
          data: {
            isLabelObat: ocrResult.isLabelObat ?? true,
            namaObat: ocrResult.namaObat ?? "",
            komposisi: ocrResult.komposisi ?? "",
            dosis: ocrResult.dosis ?? "",
            indikasi: ocrResult.indikasi ?? "",
            kontraindikasi: ocrResult.kontraindikasi ?? "",
            efekSamping: ocrResult.efekSamping ?? "",
            tanggalKadaluarsa: ocrResult.tanggalKadaluarsa ?? "",
            nomorRegistrasi: ocrResult.nomorRegistrasi ?? "",
            produsen: ocrResult.produsen ?? "",
            penyimpanan: ocrResult.penyimpanan ?? "",
            beratBersih: ocrResult.beratBersih ?? "",
            hargaEceranTertinggi: ocrResult.hargaEceranTertinggi ?? "",
            rawText: ocrResult.rawText ?? "",
          },
          // null jika storage tidak tersedia (dev lokal), string path jika berhasil upload
          imageUrl: storageUrl || null,
        };
      }),

    /**
     * Endpoint chat interaktif dengan AI Apoteker.
     * Menerima riwayat pesan + konteks data obat, mengembalikan respons apoteker AI.
     */
    chat: publicProcedure
      .input(
        z.object({
          /** Konteks obat dari hasil scan */
          drugContext: z.object({
            namaObat: z.string(),
            komposisi: z.string().optional(),
            dosis: z.string().optional(),
            indikasi: z.string().optional(),
            kontraindikasi: z.string().optional(),
            efekSamping: z.string().optional(),
          }),
          /** Riwayat pesan: array {role, content} */
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { drugContext, messages } = input;

        const contextText = [
          `Nama Obat: ${drugContext.namaObat}`,
          drugContext.komposisi && `Komposisi: ${drugContext.komposisi}`,
          drugContext.dosis && `Dosis & Aturan Pakai: ${drugContext.dosis}`,
          drugContext.indikasi && `Indikasi: ${drugContext.indikasi}`,
          drugContext.kontraindikasi && `Kontraindikasi: ${drugContext.kontraindikasi}`,
          drugContext.efekSamping && `Efek Samping: ${drugContext.efekSamping}`,
        ]
          .filter(Boolean)
          .join("\n");

        const systemPrompt = `Kamu adalah AI Apoteker yang ramah, berpengetahuan luas, dan berbicara dalam Bahasa Indonesia yang mudah dipahami masyarakat awam.

Kamu sedang membantu pengguna memahami obat berikut:
${contextText}

Pedoman penting:
1. Jawab pertanyaan seputar obat ini dengan jelas dan akurat.
2. Gunakan bahasa yang sederhana — hindari istilah medis yang sulit tanpa penjelasan.
3. Selalu ingatkan pengguna untuk berkonsultasi dengan dokter atau apoteker profesional untuk keputusan medis penting.
4. Jangan memberikan diagnosis penyakit. Batasi jawaban pada informasi obat.
5. Jika ada pertanyaan darurat medis, segera sarankan menghubungi layanan darurat (119).
6. Jawaban harus ringkas (maks 3–4 paragraf pendek) kecuali diminta detail lebih.`;

        const llmMessages: import("./_core/llm").Message[] = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];

        let response;
        try {
          response = await invokeLLM({ messages: llmMessages });
        } catch (e) {
          console.error("LLM Error in chat:", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Layanan AI sedang sibuk. Silakan coba lagi.",
          });
        }
        const content = response.choices[0]?.message?.content;
        const text = typeof content === "string" ? content : "Maaf, saya tidak bisa menjawab saat ini.";

        return { reply: text };
      }),

    /**
     * Endpoint pendeteksi interaksi antar obat.
     * Menerima daftar obat, mengembalikan analisis interaksi.
     */
    checkInteraction: publicProcedure
      .input(
        z.object({
          drugs: z.array(
            z.object({
              namaObat: z.string(),
              komposisi: z.string().optional(),
            })
          ).min(2).max(5),
        })
      )
      .mutation(async ({ input }) => {
        const { drugs } = input;

        const drugList = drugs
          .map((d, i) => {
            const detail = d.komposisi ? ` (${d.komposisi})` : "";
            return `${i + 1}. ${d.namaObat}${detail}`;
          })
          .join("\n");

        const systemPrompt = `Kamu adalah sistem pendeteksi interaksi obat berbasis AI yang akurat dan bertanggung jawab.

Daftar obat yang perlu dicek interaksinya:
${drugList}

Tugasmu:
1. Analisis semua kemungkinan interaksi antar obat dalam daftar tersebut.
2. Untuk setiap interaksi yang ditemukan, tentukan tingkat keparahan: "aman", "perhatian", atau "berbahaya".
3. Berikan penjelasan singkat dalam Bahasa Indonesia yang mudah dipahami.
4. Jika tidak ada interaksi bermakna, nyatakan dengan jelas.

Kembalikan hasil dalam format JSON dengan struktur berikut:
{
  "ringkasan": "ringkasan singkat hasil analisis keseluruhan",
  "levelKeseluruhan": "aman | perhatian | berbahaya",
  "interaksi": [
    {
      "obat1": "nama obat pertama",
      "obat2": "nama obat kedua",
      "level": "aman | perhatian | berbahaya",
      "penjelasan": "penjelasan interaksi dalam 1-2 kalimat",
      "rekomendasi": "saran tindakan"
    }
  ],
  "catatanUmum": "saran umum dan pengingat untuk konsultasi dokter"
}`;

        let response;
        try {
          response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: "Tolong analisis interaksi obat-obat dalam daftar tersebut dan kembalikan dalam format JSON.",
              },
            ],
            response_format: { type: "json_object" },
          });
        } catch (e) {
          console.error("LLM Error in checkInteraction:", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Layanan AI sedang sibuk. Silakan coba lagi.",
          });
        }

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";

        let result: {
          ringkasan: string;
          levelKeseluruhan: "aman" | "perhatian" | "berbahaya";
          interaksi: Array<{
            obat1: string;
            obat2: string;
            level: "aman" | "perhatian" | "berbahaya";
            penjelasan: string;
            rekomendasi: string;
          }>;
          catatanUmum: string;
        };

        try {
          result = JSON.parse(content);
        } catch {
          result = {
            ringkasan: "Tidak dapat menganalisis interaksi saat ini.",
            levelKeseluruhan: "perhatian",
            interaksi: [],
            catatanUmum: "Konsultasikan dengan dokter atau apoteker sebelum mengonsumsi beberapa obat sekaligus.",
          };
        }

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
