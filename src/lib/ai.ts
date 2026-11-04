// Hanya dipanggil dari server (actions.ts). Kunci API tidak pernah dikirim ke browser.
// Adapter: semua penyedia yang memakai format OpenAI (DeepSeek, Gemini, OpenRouter, OpenAI, ...)
// diatur lewat .env, tanpa mengubah kode:
//   model 1: AI_BASE_URL, AI_API_KEY, AI_MODEL
//   model 2: AI2_BASE_URL, AI2_API_KEY, AI2_MODEL   (model 3: AI3_..., dst. sampai 9)
// Opsional per model:
//   AIn_MAX_TOKENS  batas panjang jawaban (bawaan 8000)
//   AIn_EXTRA_BODY  JSON tambahan khusus penyedia, misalnya mematikan "berpikir" DeepSeek:
//                   AI_EXTRA_BODY='{"thinking":{"type":"disabled"}}'
// Batas waktu bersama: AI_TIMEOUT_MS.

const awalan = (slot: number) => (slot === 1 ? "AI_" : `AI${slot}_`);

function konfigurasi(slot: number) {
  const a = awalan(slot);
  const model = process.env[`${a}MODEL`];
  if (!model) return null;
  return {
    model,
    baseUrl: process.env[`${a}BASE_URL`],
    kunci: process.env[`${a}API_KEY`],
    maksToken: Number(process.env[`${a}MAX_TOKENS`] ?? process.env.AI_MAX_TOKENS ?? 8000),
    tambahan: process.env[`${a}EXTRA_BODY`] ?? "",
  };
}

const COBA_ULANG = [429, 500, 502, 503]; // server AI sibuk/sementara gagal → coba lagi

/** Arti kode error dari penyedia AI, dalam bahasa sederhana. */
function alasan(status: number) {
  if (status === 402) return "saldo/kredit habis";
  if (status === 401 || status === 403) return "kunci API ditolak";
  if (status === 404) return "nama model tidak ditemukan";
  if (status === 429) return "batas pemakaian/kuota tercapai";
  if (status >= 500) return "server AI sedang sibuk atau bermasalah";
  return "permintaan ditolak";
}
const tunggu = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Model yang terpasang di .env (hanya nomor dan nama, tanpa kunci). */
export function daftarModel() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((slot) => {
    const k = konfigurasi(slot);
    return k ? [{ slot, nama: k.model }] : [];
  });
}

/** `sampai` (opsional) = batas waktu total dalam milidetik epoch: timeout dipendekkan dan coba ulang dihentikan. */
export async function tanyaAI(sistem: string, pengguna: string, slot = 1, sampai = Infinity) {
  const k = konfigurasi(slot);
  if (!k) throw new Error(`Model AI nomor ${slot} belum diatur di .env.`);
  let tambahan = {};
  try {
    tambahan = k.tambahan ? JSON.parse(k.tambahan) : {};
  } catch {
    throw new Error(`Isi EXTRA_BODY untuk model ${k.model} di .env bukan JSON yang valid.`);
  }
  const body = JSON.stringify({
    ...tambahan,
    model: k.model,
    messages: [
      { role: "system", content: sistem },
      { role: "user", content: pengguna },
    ],
    response_format: { type: "json_object" },
    max_tokens: k.maksToken,
  });

  const sisa = () => sampai - Date.now();
  let res: Response;
  for (let coba = 1; ; coba++) {
    res = await fetch(`${k.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${k.kunci}` },
      body,
      signal: AbortSignal.timeout(Math.max(1000, Math.min(Number(process.env.AI_TIMEOUT_MS ?? 180_000), sisa()))),
    });
    if (res.ok || !COBA_ULANG.includes(res.status) || coba === 3 || sisa() < coba * 10_000 + 30_000) break;
    await tunggu(coba * 10_000); // 10 detik, lalu 20 detik
  }
  if (!res.ok) throw new Error(`AI (${k.model}) gagal: ${alasan(res.status)} (kode ${res.status}). ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const pilihan = data.choices?.[0];
  if (!pilihan) throw new Error(`AI (${k.model}) tidak mengirim jawaban.`);
  return {
    jawaban: String(pilihan.message?.content ?? ""),
    terpotong: pilihan.finish_reason === "length",
    model: k.model,
    token: { masuk: Number(data.usage?.prompt_tokens) || 0, keluar: Number(data.usage?.completion_tokens) || 0 },
  };
}
