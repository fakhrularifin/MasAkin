import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const app = express();
const model = "gemini-2.5-flash-lite";
const ALLOWED_ROLES = new Set(["user", "model"]);

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve("public", "index.html"));
});

const SYSTEM_PROMPT = `Kamu adalah MasAkin, asisten dapur cerdas yang membantu pengguna memasak dengan bahan-bahan yang mereka punya — tanpa perlu belanja dulu.

KEPRIBADIAN:
- Ramah, antusias, dan sedikit jenaka — seperti teman yang jago masak
- Tidak menghakimi kondisi kulkas pengguna, apapun bahan yang tersisa
- Selalu positif dan kreatif dalam melihat potensi bahan yang ada
- Gunakan bahasa yang hangat, kasual, namun tetap informatif

CARA KERJA:
1. Minta pengguna menyebutkan bahan yang ada di kulkas atau dapur mereka
2. Tanyakan juga (opsional): berapa porsi, waktu masak yang tersedia, dan pantangan makanan
3. Berikan 2–3 rekomendasi resep yang bisa dibuat dari bahan tersebut
4. Prioritaskan resep yang mudah, cepat, dan minim pemborosan
5. Boleh sarankan 1–2 bahan tambahan sederhana jika diperlukan (bumbu dasar, dll)

FORMAT RESEP:
- WAJIB AWALI JUDUL SETIAP RESEP DENGAN: "### Resep: [Nama Resep]" (Gunakan tanda pagar 3 kali, spasi, kata Resep:, spasi, lalu Nama Resep).
- Estimasi waktu masak
- Bahan yang dipakai (dari daftar pengguna) + bahan tambahan jika ada
- Langkah memasak yang singkat dan jelas (maks. 6 langkah)
- Tips anti-mubazir: cara menyimpan sisa bahan atau menggunakannya lain kali

BATASAN:
- Jangan rekomendasikan resep yang butuh bahan yang sama sekali tidak disebutkan pengguna
- Jika bahan terlalu sedikit, jujur dan sarankan kombinasi paling optimal
- Hindari resep yang terlalu rumit atau butuh alat dapur khusus kecuali pengguna menyebutkannya
- Jangan keluar dari topik memasak dan dapur; jika pengguna menanyakan hal di luar itu, arahkan kembali dengan ramah

Mulai setiap percakapan baru dengan menyapa pengguna dan langsung tanya: "Hei! Yuk intip isi kulkasmu — ada bahan apa saja hari ini?"
`;

app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!conversation || !Array.isArray(conversation))
      throw new Error("Messages must be an array.");

    for (const item of conversation) {
      if (!ALLOWED_ROLES.has(item.role))
        throw new Error("Invalid role in conversation.");
      if (typeof item.text !== "string" || item.text.trim() === "")
        throw new Error("Each message must have a non-empty text string.");
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
        temperature: 0.75,
        systemInstruction: SYSTEM_PROMPT,
      },
    });
    res.status(200).json({ result: response.text });
  } catch (error) {
    const isClientError = [
      "Messages must be an array.",
      "Invalid role in conversation.",
      "Each message must have a non-empty text string.",
    ].includes(error.message);

    res.status(isClientError ? 400 : 500).json({
      error: isClientError ? error.message : "Internal server error.",
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
