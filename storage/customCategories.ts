import type { Category } from "@/types/category";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "CUSTOM_CATEGORIES";

export async function loadCustomCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll(categories: Category[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(categories));
}

export async function createCustomCategory(name: string): Promise<Category> {
  const categories = await loadCustomCategories();
  const newCategory: Category = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    words: [],
    isCustom: true,
  };
  await saveAll([...categories, newCategory]);
  return newCategory;
}

export async function updateCustomCategory(updated: Category) {
  const categories = await loadCustomCategories();
  const next = categories.map((c) => (c.id === updated.id ? updated : c));
  await saveAll(next);
}

export async function deleteCustomCategory(id: string) {
  const categories = await loadCustomCategories();
  const next = categories.filter((c) => c.id !== id);
  await saveAll(next);
}
