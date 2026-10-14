// Hanya dipanggil dari server (actions.ts). Kunci API tidak pernah dikirim ke browser.
// Adapter AI: semua penyedia yang memakai format OpenAI (DeepSeek, OpenRouter,
// OpenAI, Gemini) cukup diganti lewat .env: AI_BASE_URL, AI_API_KEY, AI_MODEL.
export async function tanyaAI(prompt: string): Promise<{ jawaban: string; model: string }> {
  const model = process.env.AI_MODEL!;
  const res = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS ?? 90_000)),
  });
  if (!res.ok) throw new Error(`AI menolak permintaan (kode ${res.status}): ${await res.text()}`);
  const data = await res.json();
  return { jawaban: data.choices[0].message.content, model };
}
