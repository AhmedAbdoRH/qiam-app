import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

// Port of src/pages/Auth.tsx — email/password login + signup via useAuth session listener
export default function AuthScreen() {
  const { signIn, signUp, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert("تنبيه", "أدخل بريداً صحيحاً وكلمة مرور 6 أحرف على الأقل");
      return;
    }
    setBusy(true);
    const fn = mode === "login" ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) {
      Alert.alert("خطأ", error.message ?? "تعذر تسجيل الدخول");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-2xl font-bold mb-1">مقياس الاتزان الروحي والنفسي</Text>
        <Text className="text-zinc-400 mb-6">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</Text>
        <View className="w-full max-w-sm bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-5">
          <TextInput
            value={email}
            onChangeText={setEmail}
            textAlign="right"
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#52525B"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-zinc-900 text-white rounded-xl px-4 py-3 mb-2 border border-zinc-800"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            textAlign="right"
            placeholder="كلمة المرور"
            placeholderTextColor="#52525B"
            secureTextEntry
            className="bg-zinc-900 text-white rounded-xl px-4 py-3 mb-3 border border-zinc-800"
            onSubmitEditing={submit}
          />
          <Pressable onPress={submit} disabled={busy || loading} className="bg-amber-500 rounded-xl p-3">
            <Text className="text-black font-bold text-center">{busy ? "جاري..." : mode === "login" ? "دخول" : "إنشاء الحساب"}</Text>
          </Pressable>
          <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")} className="mt-3">
            <Text className="text-amber-400 text-center text-sm">
              {mode === "login" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
