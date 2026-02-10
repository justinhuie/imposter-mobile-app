import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { createCustomCategory, loadCustomCategories } from "@/storage/customCategories";
import type { Category } from "@/types/category";

export default function CategoriesScreen() {
  const [name, setName] = useState("");
  const [list, setList] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canCreate = name.trim().length > 0;

  async function refresh() {
    const cats = await loadCustomCategories();
    setList(cats);
  }

  useFocusEffect(
    useCallback(() => {
      refresh().catch((e) => setError(String(e)));
    }, [])
  );

  async function onCreate() {
    if (!canCreate) return;
    setError(null);
    const cat = await createCustomCategory(name.trim());
    setName("");
    router.push(`/category-editor?categoryId=${cat.id}`);
  }

  return (
    <ScrollView
      style={{ backgroundColor: "#fff" }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        {/* Back button (same place as your other screens) */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* Centered title */}
        <Text style={styles.title}>Custom Categories</Text>

        <Text style={styles.label}>Category Name</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Superheroes"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <Pressable
            style={[styles.primary, !canCreate && { opacity: 0.5 }]}
            disabled={!canCreate}
            onPress={onCreate}
          >
            <Text style={styles.primaryText}>Create</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>Error: {error}</Text>}

        <Text style={styles.sectionTitle}>Your Categories</Text>

        {list.length === 0 ? (
          <Text style={styles.muted}>No custom categories yet.</Text>
        ) : (
          list.map((c) => (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() => router.push(`/category-editor?categoryId=${c.id}`)}
            >
              <Text style={styles.cardText} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={styles.editIcon}>⚙️</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60, // brings everything down
    backgroundColor: "#fff",
  },

  inner: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",

    // centers the block, but still keeps it "lower" instead of dead-center
    marginTop: 40,

    gap: 12,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },

  backText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#000",
    textAlign: "center",
    marginBottom: 6,
  },

  label: { fontSize: 14, fontWeight: "800", color: "#000" },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    color: "#000",
  },

  primary: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900" },

  sectionTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    textAlign: "center",
  },

  muted: { color: "#666", textAlign: "center" },
  error: { color: "crimson", textAlign: "center" },

  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardText: { flex: 1, fontSize: 16, fontWeight: "800", color: "#000" },
  editIcon: { fontSize: 18 },
});
