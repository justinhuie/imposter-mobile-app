import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { API_BASE } from "@/constants/api";

export default function RevealScreen() {
  const params = useLocalSearchParams();
  const gameId = String(params.gameId ?? "");
  const numPlayers = Number(params.numPlayers ?? "0");

  const categoryIdsParam = String(params.categoryIds ?? "");
  const numImposters = Number(params.numImposters ?? "0");
  const hintsEnabled = String(params.hintsEnabled ?? "false") === "true";

  // Optional: if you pass customCategories as a JSON string param
  const customCategoriesParam = String(params.customCategories ?? "");
  const customCategories = useMemo(() => {
    if (!customCategoriesParam) return undefined;
    try {
      return JSON.parse(customCategoriesParam);
    } catch {
      return undefined;
    }
  }, [customCategoriesParam]);

  const categoryIds = useMemo(
    () => categoryIdsParam.split(",").map((s) => s.trim()).filter(Boolean),
    [categoryIdsParam]
  );

  const [player, setPlayer] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [restartLoading, setRestartLoading] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);

  // solution state
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const [solution, setSolution] = useState<{ word: string; imposters: number[] } | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);

  const done = useMemo(() => player > numPlayers && numPlayers > 0, [player, numPlayers]);

  // background animation
  const bgAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ])
    );

    streakAnim.setValue(0);
    const streakLoop = Animated.loop(
      Animated.timing(streakAnim, {
        toValue: 1000,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    bgLoop.start();
    streakLoop.start();

    return () => {
      bgLoop.stop();
      streakLoop.stop();
    };
  }, [bgAnim, streakAnim]);

  const bg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#0B0F14", "#151B22"],
  });

  const streakTranslateX = streakAnim.interpolate({
    inputRange: [0, 1000],
    outputRange: [-300, 300],
  });

  async function doReveal() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerNumber: player }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404 && data?.error === "Game not found") {
          setError("This game expired. Start a new game.");
          return;
        }

        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }

      setResult(data);
      setRevealed(true);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  function nextPlayer() {
    setRevealed(false);
    setResult(null);
    setError(null);
    setPlayer((p) => p + 1);
  }

  async function revealImposters() {
    setSolutionError(null);
    setSolutionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/solution`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      setSolution(data);
      setSolutionOpen(true);
    } catch (e: any) {
      setSolutionError(String(e?.message ?? e));
    } finally {
      setSolutionLoading(false);
    }
  }

  async function restartGame() {
    setRestartError(null);

    // If the reveal screen wasn't given the settings, fall back gracefully.
    if (!categoryIds.length || !Number.isFinite(numImposters) || numImposters <= 0) {
      router.replace("/");
      return;
    }

    setRestartLoading(true);
    try {
      const res = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds,
          numPlayers,
          numImposters,
          hintsEnabled,
          ...(customCategories ? { customCategories } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      // Reset local UI state and jump to the new game
      setPlayer(1);
      setRevealed(false);
      setResult(null);
      setError(null);
      setSolution(null);
      setSolutionOpen(false);

      router.replace({
        pathname: "/reveal",
        params: {
          gameId: data.gameId,
          numPlayers: String(data.numPlayers),
          categoryIds: categoryIds.join(","),
          numImposters: String(numImposters),
          hintsEnabled: String(hintsEnabled),
          ...(customCategoriesParam ? { customCategories: customCategoriesParam } : {}),
        },
      });
    } catch (e: any) {
      setRestartError(String(e?.message ?? e));
    } finally {
      setRestartLoading(false);
    }
  }

  return (
    <Animated.View style={[styles.screen, { backgroundColor: bg }]}>
      {/* streak overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.streakLayer, { transform: [{ translateX: streakTranslateX }] }]}
      >
        <View style={[styles.streak, styles.streak1]} />
        <View style={[styles.streak, styles.streak2]} />
        <View style={[styles.streak, styles.streak3]} />
        <View style={[styles.streak, styles.streak4]} />
      </Animated.View>

      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Reveal</Text>

        {done ? (
          <>
            <Text style={styles.big}>All players revealed</Text>

            {solutionError && <Text style={styles.error}>Error: {solutionError}</Text>}

            <Pressable
              style={[styles.danger, solutionLoading && { opacity: 0.7 }]}
              disabled={solutionLoading}
              onPress={revealImposters}
            >
              {solutionLoading ? (
                <ActivityIndicator color="rgba(255,255,255,0.9)" />
              ) : (
                <Text style={styles.dangerText}>Reveal Imposters</Text>
              )}
            </Pressable>

            {solutionOpen && solution && (
              <>
                {/* Box 1: Solution + Hide (same box) */}
                <View style={styles.card}>
                  <Text style={styles.solutionWord}>Word: {solution.word}</Text>

                  <Text style={styles.solutionLine}>
                    {solution.imposters.length === 1 ? "Imposter: " : "Imposters: "}
                    {solution.imposters.map((n) => `Player ${n}`).join(", ")}
                  </Text>

                  <Pressable style={styles.secondary} onPress={() => setSolutionOpen(false)}>
                    <Text style={styles.secondaryText}>Hide</Text>
                  </Pressable>
                </View>

                {/* Box 2: Restart only (below) */}
                <View style={styles.card}>
                  {restartError && <Text style={styles.error}>Error: {restartError}</Text>}

                  <Pressable
                    style={[styles.secondary, restartLoading && { opacity: 0.7 }]}
                    disabled={restartLoading}
                    onPress={restartGame}
                  >
                    {restartLoading ? (
                      <ActivityIndicator color="rgba(255,255,255,0.9)" />
                    ) : (
                      <Text style={styles.secondaryText}>Restart</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.big}>Player {player}</Text>

            {error && (
              <View style={{ gap: 10 }}>
                <Text style={styles.error}>{error}</Text>

                {error.includes("expired") && (
                  <Pressable style={styles.secondary} onPress={() => router.replace("/")}>
                    <Text style={styles.secondaryText}>Back to Home</Text>
                  </Pressable>
                )}
              </View>
            )}

            {!revealed ? (
              <Pressable style={styles.primary} onPress={doReveal}>
                <Text style={styles.primaryText}>Tap to Reveal</Text>
              </Pressable>
            ) : (
              <View style={styles.card}>
                <Text style={styles.resultTitle}>
                  {result?.role === "imposter" ? "You are the IMPOSTER" : "Your word"}
                </Text>

                {result?.role === "player" && <Text style={styles.word}>{result.word}</Text>}
                {result?.hint && <Text style={styles.hint}>Hint: {result.hint}</Text>}

                <Pressable style={styles.secondary} onPress={nextPlayer}>
                  <Text style={styles.secondaryText}>Hide & Next Player</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },

  streakLayer: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  streak: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  streak1: { top: 140, left: -40, width: 220, transform: [{ rotate: "-10deg" }] },
  streak2: { top: 270, left: 40, width: 280, transform: [{ rotate: "8deg" }] },
  streak3: { top: 420, left: -10, width: 180, transform: [{ rotate: "-6deg" }] },
  streak4: { top: 560, left: 80, width: 260, transform: [{ rotate: "12deg" }] },

  container: { flex: 1, padding: 20, paddingTop: 60, gap: 14 },

  backButton: { alignSelf: "flex-start", paddingVertical: 6 },
  backText: { fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "700" },

  title: { fontSize: 28, fontWeight: "900", color: "rgba(255,255,255,0.96)" },
  big: { fontSize: 26, fontWeight: "900", color: "rgba(255,255,255,0.92)" },

  error: { color: "#FF5A6A", fontWeight: "700" },

  primary: {
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  primaryText: { color: "#0B0F14", fontSize: 16, fontWeight: "900" },

  card: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  resultTitle: { fontSize: 18, fontWeight: "900", color: "rgba(255,255,255,0.92)" },
  word: { fontSize: 24, fontWeight: "900", color: "rgba(255,255,255,0.96)" },
  hint: { color: "rgba(255,255,255,0.75)", fontWeight: "700" },

  secondary: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryText: { color: "rgba(255,255,255,0.92)", fontSize: 16, fontWeight: "800" },

  danger: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,90,106,0.35)",
    backgroundColor: "rgba(255,90,106,0.12)",
    alignItems: "center",
  },
  dangerText: { color: "rgba(255,90,106,0.95)", fontSize: 16, fontWeight: "900" },

  solutionWord: {
    fontSize: 22,
    fontWeight: "900",
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
  },
  solutionLine: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
});
