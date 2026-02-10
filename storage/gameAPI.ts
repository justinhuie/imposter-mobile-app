import { API_BASE } from "@/constants/api";
import { loadCustomCategories } from "@/storage/customCategories";

export async function createGameOnServer(opts: {
  categoryIds: string[];
  numPlayers: number;
  numImposters: number;
  hintsEnabled: boolean;
}) {
  const custom = await loadCustomCategories();
  const customById = new Map(custom.map((c) => [c.id, c]));

  const customCategories = opts.categoryIds
    .map((id) => customById.get(id))
    .filter(Boolean)
    .map((c) => ({
      id: c!.id,
      name: c!.name,
      words: c!.words.map((w) => ({ word: w.word, hint: w.hint })),
    }));

  const res = await fetch(`${API_BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryIds: opts.categoryIds,
      numPlayers: opts.numPlayers,
      numImposters: opts.numImposters,
      hintsEnabled: opts.hintsEnabled,
      customCategories,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `HTTP ${res.status}`);

  return data as { gameId: string; numPlayers: number };
}