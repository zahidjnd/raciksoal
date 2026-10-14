// Hanya dipanggil dari server (actions.ts). Kunci API tidak pernah dikirim ke browser.
// Adapter: semua penyedia yang memakai format OpenAI (DeepSeek, OpenRouter,
// OpenAI, Gemini) cukup diganti lewat .env: AI_BASE_URL, AI_API_KEY, AI_MODEL.
export async function tanyaAI(sistem: string, pengguna: string) {
  const model = process.env.AI_MODEL!;
  const res = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: sistem },
        { role: "user", content: pengguna },
      ],
      response_format: { type: "json_object" },
      max_tokens: Number(process.env.AI_MAX_TOKENS ?? 8000),
    }),
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS ?? 180_000)),
  });
  if (!res.ok) throw new Error(`AI menolak permintaan (kode ${res.status}): ${await res.text()}`);
  const data = await res.json();
  const pilihan = data.choices[0];
  return { jawaban: pilihan.message.content as string, terpotong: pilihan.finish_reason === "length", model };
}
