import { createGameOnServer } from "@/storage/gameAPI";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function GameSettingsScreen() {
  const params = useLocalSearchParams();

  const categoryIds = String(params.categoryIds ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const categoryNames = String(params.categoryNames ?? "");

  const [players, setPlayers] = useState(6);
  const [imposters, setImposters] = useState(1);
  const [hints, setHints] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createGame() {
    setError(null);
    setLoading(true);
    try {
      const data = await createGameOnServer({
        categoryIds,
        numPlayers: players,
        numImposters: imposters,
        hintsEnabled: hints,
      });

      router.push({
        pathname: "/reveal",
        params: {
          gameId: data.gameId,
          numPlayers: String(players),
          numImposters: String(imposters),
          hintsEnabled: String(hints),
          categoryIds: categoryIds.join(","),
        },
      });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Game Settings</Text>
        <Text style={styles.category} numberOfLines={2}>
          {categoryNames}
        </Text>

        {error && <Text style={styles.error}>Error: {error}</Text>}

        <View style={styles.card}>
          <Text style={styles.label}>Players</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.btn}
              onPress={() => setPlayers((p) => clamp(p - 1, 3, 20))}
            >
              <Text style={styles.btnText}>-</Text>
            </Pressable>

            <Text style={styles.value}>{players}</Text>

            <Pressable
              style={styles.btn}
              onPress={() => setPlayers((p) => clamp(p + 1, 3, 20))}
            >
              <Text style={styles.btnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Imposters</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.btn}
              onPress={() => setImposters((i) => clamp(i - 1, 1, players - 1))}
            >
              <Text style={styles.btnText}>-</Text>
            </Pressable>

            <Text style={styles.value}>{imposters}</Text>

            <Pressable
              style={styles.btn}
              onPress={() => setImposters((i) => clamp(i + 1, 1, players - 1))}
            >
              <Text style={styles.btnText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.mutedSmall}>Must be less than players.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Hints (imposter only)</Text>
          <Pressable style={styles.toggle} onPress={() => setHints((h) => !h)}>
            <Text style={styles.toggleText}>{hints ? "ON" : "OFF"}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.primary, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={createGame}
        >
          {loading ? (
            <ActivityIndicator color="#0B0F14" />
          ) : (
            <Text style={styles.primaryText}>Create Game</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    gap: 14,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },

  title: { fontSize: 28, fontWeight: "900", color: "rgba(255,255,255,0.96)" },
  category: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.75)" },

  error: { color: "#FF5A6A", fontWeight: "700" },
  mutedSmall: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 6 },

  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },

  label: { fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.92)" },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },

  value: {
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    minWidth: 30,
    textAlign: "center",
  },

  btn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  btnText: { fontSize: 20, fontWeight: "900", color: "rgba(255,255,255,0.92)" },

  toggle: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  toggleText: { fontWeight: "900", color: "rgba(255,255,255,0.92)" },

  primary: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  primaryText: { color: "#0B0F14", fontSize: 16, fontWeight: "900" },
});
