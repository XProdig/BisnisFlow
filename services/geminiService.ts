import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client
// Note: In a real production app, API keys should be handled securely on a backend.
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateBusinessAdvice = async (
  query: string, 
  contextData: string
): Promise<string> => {
  if (!API_KEY) {
    return "API Key belum dikonfigurasi. Mohon tambahkan API_KEY di environment variables.";
  }

  try {
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `Anda adalah konsultan bisnis AI yang ahli untuk UMKM di Indonesia. 
    Tugas anda adalah membantu pemilik bisnis menganalisis data penjualan, stok, HPP, dan cashflow.
    Berikan jawaban yang ramah, praktis, dan langsung pada intinya.
    Gunakan format Markdown untuk struktur yang rapi.
    
    Konteks Data Bisnis Saat Ini:
    ${contextData}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on simple queries
      }
    });

    return response.text || "Maaf, saya tidak dapat menghasilkan jawaban saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi nanti.";
  }
};
