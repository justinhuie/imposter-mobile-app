import { API_BASE } from "@/constants/api";
import { loadCustomCategories } from "@/storage/customCategories";
import type { Category as SharedCategory } from "@/types/category";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const API_CATS_CACHE_KEY = "api_categories_cache_v1";

type Category = {
  id: string;
  name: string;
  isCustom?: boolean;
  words?: SharedCategory["words"];
};

function SelectableCategoryCard({
  name,
  isCustom,
  selected,
  onPress,
}: {
  name: string;
  isCustom?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected, anim]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.06)", "rgba(34,197,94,0.22)"],
  });

  const border = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.16)", "rgba(34,197,94,0.85)"],
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
        <Text style={styles.cardText}>
          {name}
          {isCustom ? " (Custom)" : ""}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function GetStartedScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const categoriesRef = useRef<Category[]>([]);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      async function loadAll() {
        setError(null);

        const customCats = await loadCustomCategories();

        try {
          const cached = await AsyncStorage.getItem(API_CATS_CACHE_KEY);

          if (alive) {
            if (cached) {
              const cachedApiCats = JSON.parse(cached) as { id: string; name: string }[];

              setCategories([
                ...cachedApiCats.map((c) => ({ ...c, isCustom: false })),
                ...customCats.map((c) => ({ ...c, isCustom: true })),
              ]);
            } else {
              setCategories(customCats.map((c) => ({ ...c, isCustom: true })));
            }
          }
        } catch {
          if (alive) setCategories(customCats.map((c) => ({ ...c, isCustom: true })));
        }

        try {
          const res = await fetch(`${API_BASE}/categories`);
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);

          const apiCats = body as { id: string; name: string }[];

          AsyncStorage.setItem(API_CATS_CACHE_KEY, JSON.stringify(apiCats)).catch(() => {});

          if (alive) {
            setCategories([
              ...apiCats.map((c) => ({ ...c, isCustom: false })),
              ...customCats.map((c) => ({ ...c, isCustom: true })),
            ]);
          }
        } catch (e: any) {
          if (alive && categoriesRef.current.length === 0) {
            setError(String(e?.message ?? e));
          }
        }
      }

      loadAll();

      return () => {
        alive = false;
      };
    }, [])
  );

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const selectedNames = useMemo(() => {
    const nameMap = new Map(categories.map((c) => [c.id, c.name]));
    return selectedIds.map((id) => nameMap.get(id)).filter(Boolean).join(", ");
  }, [categories, selectedIds]);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Choose Categories</Text>
        <Text style={styles.subtitle}>Tap to select (you can pick multiple).</Text>

        <Pressable style={styles.secondary} onPress={() => router.push("/create-category")}>
          <Text style={styles.secondaryText}>+ Create Custom Category</Text>
        </Pressable>

        {error && <Text style={styles.error}>Error: {error}</Text>}

        {categories.map((c) => {
          const isOn = selected.has(c.id);

          return (
            <SelectableCategoryCard
              key={c.id}
              name={c.name}
              isCustom={c.isCustom}
              selected={isOn}
              onPress={() => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(c.id)) next.delete(c.id);
                  else next.add(c.id);
                  return next;
                });
              }}
            />
          );
        })}

        {!error && categories.length === 0 && <Text style={styles.muted}>Loading…</Text>}

        <Pressable
          style={[styles.primary, selected.size === 0 && { opacity: 0.45 }]}
          disabled={selected.size === 0}
          onPress={() => {
            router.push({
              pathname: "/game-settings",
              params: {
                categoryIds: selectedIds.join(","),
                categoryNames: selectedNames,
              },
            });
          }}
        >
          <Text style={styles.primaryText}>Next</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  scroll: {
    backgroundColor: "transparent",
  },

  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    gap: 12,
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
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 6,
  },

  secondary: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  secondaryText: { fontWeight: "800", color: "rgba(255,255,255,0.92)" },

  card: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  cardText: { fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.92)" },

  muted: { opacity: 0.7, color: "rgba(255,255,255,0.75)" },
  error: { color: "#FF5A6A", fontWeight: "700" },

  primary: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
  },
  primaryText: { color: "#0B0F14", fontSize: 16, fontWeight: "900" },
});
