import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
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
  deleteCustomCategory,
  loadCustomCategories,
  updateCustomCategory,
} from "@/storage/customCategories";
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

  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editHint, setEditHint] = useState("");

  const canAdd = useMemo(() => newWord.trim().length > 0, [newWord]);
  const canSaveEdit = useMemo(() => editWord.trim().length > 0, [editWord]);

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

    const entry: WordEntry = {
      word: newWord.trim(),
      hint: newHint.trim() || undefined,
    };

    const updated: Category = {
      ...category,
      words: [...category.words, entry],
    };

    await save(updated);
    setNewWord("");
    setNewHint("");
  }

  async function removeRow(index: number) {
    if (!category) return;

    const updated: Category = {
      ...category,
      words: category.words.filter((_, i) => i !== index),
    };

    await save(updated);
  }

  async function onDeleteCategory() {
    if (!category) return;
    await deleteCustomCategory(category.id);
    router.back();
  }

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
    if (!category || editIndex === null) return;

    const nextWord = editWord.trim();
    const nextHint = editHint.trim();
    if (!nextWord) return;

    const nextWords = category.words.map((w, i) =>
      i === editIndex
        ? { word: nextWord, hint: nextHint || undefined }
        : w
    );

    await save({ ...category, words: nextWords });
    cancelEdit();
  }

  function renderRightActions(index: number) {
    return (
      <View style={[styles.actionsWrap, { width: TOTAL_W }]}>
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
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.screen}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
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

        {category.words.map((w, i) => (
          <Swipeable
            key={i}
            renderRightActions={() => renderRightActions(i)}
            overshootRight={false}
          >
            <Pressable style={styles.tableRow} onPress={() => openEdit(i)}>
              <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>
                {w.word}
              </Text>
              <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>
                {w.hint ?? ""}
              </Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          </Swipeable>
        ))}

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
          <Pressable
            style={[styles.addBtn, !canAdd && { opacity: 0.45 }]}
            disabled={!canAdd}
            onPress={addRow}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <Pressable style={styles.danger} onPress={onDeleteCategory}>
          <Text style={styles.dangerText}>Delete Category</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={editOpen} transparent onRequestClose={cancelEdit}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    gap: 12,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
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

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "rgba(255,255,255,0.96)",
  },

  error: {
    color: "#FF5A6A",
    fontWeight: "700",
  },

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

  colHeader: {
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
  },

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

  cell: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "800",
  },

  chev: {
    width: 16,
    textAlign: "right",
    color: "rgba(255,255,255,0.55)",
    fontSize: 18,
    fontWeight: "900",
  },

  actionsWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },

  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  swipeEdit: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  swipeEditText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
  },

  swipeDelete: {
    backgroundColor: "rgba(255,90,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,90,106,0.35)",
  },

  swipeDeleteText: {
    color: "rgba(255,90,106,0.95)",
    fontWeight: "900",
  },

  addRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

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

  addBtnText: {
    color: "#0B0F14",
    fontWeight: "900",
  },

  danger: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,90,106,0.35)",
    backgroundColor: "rgba(255,90,106,0.12)",
    alignItems: "center",
  },

  dangerText: {
    color: "rgba(255,90,106,0.95)",
    fontWeight: "900",
  },

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

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(255,255,255,0.95)",
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
  },

  modalRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },

  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  modalCancelText: {
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
  },

  modalSave: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  modalSaveText: {
    fontWeight: "900",
    color: "#0B0F14",
  },
});
