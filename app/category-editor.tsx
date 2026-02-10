import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { deleteCustomCategory, loadCustomCategories, updateCustomCategory } from "@/storage/customCategories";
import type { Category, WordEntry } from "@/types/category";

const ACTION_W = 92; 
const TOTAL_W = ACTION_W * 2;

export default function CategoryEditorScreen() {
  const params = useLocalSearchParams();
  const categoryId = String(params.categoryId ?? "");

  const [category, setCategory] = useState<Category | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newHint, setNewHint] = useState("");
  const [error, setError] = useState<string | null>(null);

  // edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editHint, setEditHint] = useState("");

  const canAdd = useMemo(() => newWord.trim().length > 0, [newWord]);
  const canSaveEdit = useMemo(() => editWord.trim().length > 0, [editWord]);

  // background animation (same as other screens)
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
    const all = await loadCustomCategories();
    const found = all.find((c) => c.id === categoryId) ?? null;
    setCategory(found);
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((e) => setError(String(e)));
    }, [refresh])
  );

  async function save(updated: Category) {
    await updateCustomCategory(updated);
    setCategory(updated);
  }

  async function addRow() {
    if (!category || !canAdd) return;
    const entry: WordEntry = { word: newWord.trim(), hint: newHint.trim() || undefined };
    const updated: Category = { ...category, words: [...category.words, entry] };
    await save(updated);
    setNewWord("");
    setNewHint("");
  }

  async function removeRow(index: number) {
    if (!category) return;
    const updated: Category = { ...category, words: category.words.filter((_, i) => i !== index) };
    await save(updated);
  }

  async function onDeleteCategory() {
    if (!category) return;
    await deleteCustomCategory(category.id);
    router.back();
  }

  // Edit Row
  function openEdit(i: number) {
    if (!category) return;
    const row = category.words[i];
    setEditIndex(i);
    setEditWord(row.word);
    setEditHint(row.hint ?? "");
    setEditOpen(true);
  }

  function cancelEdit() {
    setEditOpen(false);
    setEditIndex(null);
    setEditWord("");
    setEditHint("");
  }

  async function saveEdit() {
    if (!category) return;
    if (editIndex === null) return;

    const nextWord = editWord.trim();
    const nextHint = editHint.trim();

    if (!nextWord) return;

    const nextWords = category.words.map((w, i) =>
      i === editIndex ? { word: nextWord, hint: nextHint || undefined } : w
    );

    await save({ ...category, words: nextWords });
    cancelEdit();
  }

  // Swipe Actions
  function renderRightActions(
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    index: number
  ) {
      const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [TOTAL_W, 0],
      extrapolate: "clamp",
    });
  return (
    <View style={[styles.actionsWrap, { width: TOTAL_W }]}>
      <Animated.View
        style={{
          flexDirection: "row",
          transform: [{ translateX }],
        }}
      >
        <Pressable
          style={[styles.actionBtn, styles.swipeEdit]}
          onPress={() => openEdit(index)}
        >
          <Text style={styles.swipeEditText}>Edit</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.swipeDelete]}
          onPress={() => removeRow(index)}
        >
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
  if (!category) {
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

        <View style={[styles.loading, { justifyContent: "center" }]}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "700" }}>Loading…</Text>
        </View>
      </Animated.View>
    );
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

      <ScrollView style={{ backgroundColor: "transparent" }} contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>{category.name}</Text>

        {error && <Text style={styles.error}>Error: {error}</Text>}

        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, { flex: 1 }]}>Word</Text>
          <Text style={[styles.colHeader, { flex: 1 }]}>Hint</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Existing rows (Swipe left -> Edit + Delete) */}
        {category.words.map((w, i) => (
          <Swipeable
            key={i}
            renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, i)}
            overshootRight={false}
            rightThreshold={40}
            friction={2}
          >
            <Pressable style={styles.tableRow} onPress={() => openEdit(i)}>
              <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>
                {w.word}
              </Text>
              <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>
                {w.hint ?? ""}
              </Text>

              {/* little chevron to hint swipe/edit */}
              <Text style={styles.chev}>›</Text>
            </Pressable>
          </Swipeable>
        ))}

        {/* Add new row */}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Word"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={newWord}
            onChangeText={setNewWord}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Hint"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={newHint}
            onChangeText={setNewHint}
          />
          <Pressable style={[styles.addBtn, !canAdd && { opacity: 0.45 }]} disabled={!canAdd} onPress={addRow}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <Pressable style={styles.danger} onPress={onDeleteCategory}>
          <Text style={styles.dangerText}>Delete Category</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={cancelEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit entry</Text>

            <TextInput
              value={editWord}
              onChangeText={setEditWord}
              placeholder="Word"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.modalInput}
              autoFocus
            />

            <TextInput
              value={editHint}
              onChangeText={setEditHint}
              placeholder="Hint (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.modalInput}
            />

            <View style={styles.modalRow}>
              <Pressable onPress={cancelEdit} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveEdit}
                style={[styles.modalSave, !canSaveEdit && { opacity: 0.45 }]}
                disabled={!canSaveEdit}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  loading: { flex: 1, padding: 20 },

  backButton: { alignSelf: "flex-start", paddingVertical: 6 },
  backText: { fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "700" },

  title: { fontSize: 24, fontWeight: "900", color: "rgba(255,255,255,0.96)" },
  error: { color: "#FF5A6A", fontWeight: "700" },

  tableHeader: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    gap: 10,
    alignItems: "center",
  },
  colHeader: { fontWeight: "900", color: "rgba(255,255,255,0.9)" },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cell: { color: "rgba(255,255,255,0.92)", fontWeight: "800" },
  chev: { width: 16, textAlign: "right", color: "rgba(255,255,255,0.55)", fontSize: 18, fontWeight: "900" },

  // Swipe actions container (pulled from right)
  actionsWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    marginVertical: 6,
    marginRight: 0,
    gap: 10,
    paddingRight: 20, // aligns with page padding
  },

  swipeEdit: {
    width: 96,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeEditText: { color: "rgba(255,255,255,0.92)", fontWeight: "900" },

  swipeDelete: {
    width: 96,
    borderRadius: 12,
    backgroundColor: "rgba(255,90,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,90,106,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeDeleteText: { color: "rgba(255,90,106,0.95)", fontWeight: "900" },

  addRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
  },

  addBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#0B0F14", fontWeight: "900" },

  danger: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,90,106,0.35)",
    backgroundColor: "rgba(255,90,106,0.12)",
    alignItems: "center",
  },
  dangerText: { color: "rgba(255,90,106,0.95)", fontWeight: "900" },

  // Modal (same vibe)
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
