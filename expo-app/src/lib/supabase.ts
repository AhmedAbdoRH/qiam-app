import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// SecureStore adapter for Supabase auth (mobile session persistence).
// Falls back to AsyncStorage on web / where SecureStore is unavailable.
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") return await AsyncStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === "web") return await AsyncStorage.setItem(key, value);
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value).catch(() => {});
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === "web") return await AsyncStorage.removeItem(key);
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key).catch(() => {});
    }
  },
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? (process.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (process.env as any).VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth & sync will fail until .env is set."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: SecureStoreAdapter as any,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
