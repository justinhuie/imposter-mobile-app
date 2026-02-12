import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import {
  createCustomCategory,
  deleteCustomCategory,
  loadCustomCategories,
  updateCustomCategory,
} from "@/storage/customCategories";
import type { Category } from "@/types/category";

export default function CategoriesScreen() {
  const [name, setName] = useState("");
  const [list, setList] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const canCreate = name.trim().length > 0;

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

  const refresh = useCallback(async () => {
    const cats = await loadCustomCategories();
    setList(cats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((e) => setError(String(e)));
    }, [refresh])
  );

  async function onCreate() {
    if (!canCreate) return;
    setError(null);
    const cat = await createCustomCategory(name.trim());
    setName("");
    router.push({ pathname: "/category-editor", params: { categoryId: cat.id } });
  }

  function goEdit(id: string) {
    router.push({ pathname: "/category-editor", params: { categoryId: id } });
  }

  function openRename(c: Category) {
    setRenameId(c.id);
    setRenameText(c.name);
    setRenameOpen(true);
  }

  function cancelRename() {
    setRenameOpen(false);
    setRenameId(null);
    setRenameText("");
  }

  async function saveRename() {
    if (!renameId) return;
    const nextName = renameText.trim();
    if (!nextName) return;

    const existing = list.find((x) => x.id === renameId);
    if (!existing) return;

    await updateCustomCategory({ ...existing, name: nextName });
    cancelRename();
    refresh();
  }

  function renderRightActions(
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    id: string
  ) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [96, 0], 
    });

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <Pressable
          onPress={async () => {
            await deleteCustomCategory(id);
            refresh();
          }}
          style={styles.swipeDelete}
        >
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.screen, { backgroundColor: bg }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.streakLayer, { transform: [{ translateX: streakTranslateX }] }]}
      >
        <View style={[styles.streak, styles.streak1]} />
        <View style={[styles.streak, styles.streak2]} />
        <View style={[styles.streak, styles.streak3]} />
        <View style={[styles.streak, styles.streak4]} />
      </Animated.View>

      <ScrollView style={{ backgroundColor: "transparent" }} contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Custom Categories</Text>

        <Text style={styles.label}>Category Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Superheroes"
          placeholderTextColor="rgba(255,255,255,0.45)"
          value={name}
          onChangeText={setName}
        />

        <Pressable
          style={[styles.primary, !canCreate && { opacity: 0.45 }]}
          disabled={!canCreate}
          onPress={onCreate}
        >
          <Text style={styles.primaryText}>Create Category</Text>
        </Pressable>

        {error && <Text style={styles.error}>Error: {error}</Text>}

        <Text style={styles.sectionTitle}>Your Categories</Text>

        {list.length === 0 ? (
          <Text style={styles.muted}>No custom categories yet.</Text>
        ) : (
          list.map((c) => (
            <Swipeable
              key={c.id}
              renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, c.id)}
              overshootRight={false}
              friction={2}
              rightThreshold={40}
            >
              <Pressable
                style={styles.card}
                onPress={() => goEdit(c.id)}
                onLongPress={() => openRename(c)}
                delayLongPress={350}
              >
                <Text style={styles.cardText} numberOfLines={1}>
                  {c.name}
                </Text>

                <Pressable onPress={() => goEdit(c.id)} hitSlop={10} style={styles.gearBtn}>
                  <Text style={styles.gear}>⚙️</Text>
                </Pressable>
              </Pressable>
            </Swipeable>
          ))
        )}

        <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={cancelRename}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Rename category</Text>

              <TextInput
                value={renameText}
                onChangeText={setRenameText}
                placeholder="New name"
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.modalInput}
                autoFocus
              />

              <View style={styles.modalRow}>
                <Pressable onPress={cancelRename} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable onPress={saveRename} style={styles.modalSave}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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

  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    gap: 12,
    backgroundColor: "transparent",
  },

  backButton: { alignSelf: "flex-start", paddingVertical: 6 },
  backText: { fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "700" },

  title: { fontSize: 26, fontWeight: "900", color: "rgba(255,255,255,0.96)" },
  label: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.9)" },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
  },

  primary: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#0B0F14", fontWeight: "900" },

  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "rgba(255,255,255,0.96)",
  },
  muted: { color: "rgba(255,255,255,0.7)" },
  error: { color: "#FF5A6A", fontWeight: "700" },

  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardText: { flex: 1, fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.92)" },

  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  gear: { fontSize: 18 },

  swipeDelete: {
    width: 96,
    height: "100%",
    borderRadius: 12,
    backgroundColor: "rgba(255,90,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,90,106,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeDeleteText: { color: "rgba(255,90,106,0.95)", fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 20,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#0F141B",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "rgba(255,255,255,0.95)" },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
  },
  modalRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalCancelText: { fontWeight: "900", color: "rgba(255,255,255,0.92)" },
  modalSave: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  modalSaveText: { fontWeight: "900", color: "#0B0F14" },
});
