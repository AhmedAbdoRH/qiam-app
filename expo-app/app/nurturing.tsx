import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Heart, ChevronRight } from "lucide-react-native";

// Port of src/pages/Nurturing.tsx — local-only prototype (AsyncStorage instead of localStorage)
const DEFAULT_CARDS = [
  { title: "الأمان", description: "أنت آمن ومحتوى", emoji: "🤍" },
  { title: "القبول", description: "مقبول كما أنت", emoji: "🌸" },
  { title: "الحنان", description: "حضن دافئ لروحك", emoji: "🤗" },
  { title: "الطمأنينة", description: "سكون وسلام داخلي", emoji: "🕊️" },
  { title: "النمو", description: "تكبر بلطف كل يوم", emoji: "🌱" },
  { title: "النور", description: "نور يبدد الظلام", emoji: "✨" },
];

export default function NurturingScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("أنت تستحق الحب والاحتواء دائماً");
  const [quality, setQuality] = useState(7);
  const [likes, setLikes] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);

  useEffect(() => {
    AsyncStorage.multiGet(["nurturing_message", "nurturing_quality", "nurturing_likes"]).then((pairs) => {
      const m = Object.fromEntries(pairs as any);
      if (m.nurturing_message) setMessage(m.nurturing_message);
      if (m.nurturing_quality) setQuality(Number(m.nurturing_quality));
      if (m.nurturing_likes) setLikes(Number(m.nurturing_likes));
    });
    const t = setInterval(() => setCardIdx((i) => (i + 1) % DEFAULT_CARDS.length), 14000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    AsyncStorage.multiSet([
      ["nurturing_message", message],
      ["nurturing_quality", String(quality)],
      ["nurturing_likes", String(likes)],
    ]).catch(() => {});
  }, [message, quality, likes]);

  const card = DEFAULT_CARDS[cardIdx];

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <Pressable onPress={() => router.back()} className="self-end flex-row items-center gap-1 mb-2">
          <Text className="text-zinc-400">رجوع</Text>
          <ChevronRight size={18} color="#A1A1AA" />
        </Pressable>
        <View className="items-center py-6">
          <Pressable onLongPress={() => router.back()} className="w-28 h-28 rounded-full bg-pink-500/20 border border-pink-400/40 items-center justify-center">
            <Heart size={52} color="#F472B6" fill="#F472B6" />
          </Pressable>
          <Text className="text-zinc-400 text-xs mt-2">اضغط مطولاً للرجوع</Text>
        </View>
        <View className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-4 mb-3">
          <TextInput value={message} onChangeText={setMessage} multiline textAlign="center" className="text-white text-lg text-center" />
          <Pressable onPress={() => setLikes((l) => l + 1)} className="items-center mt-2">
            <Text className="text-pink-400">♥ {likes}</Text>
          </Pressable>
        </View>
        <View className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-4 mb-3 items-center">
          <Text className="text-4xl">{card.emoji}</Text>
          <Text className="text-white font-bold text-lg mt-1">{card.title}</Text>
          <Text className="text-zinc-400">{card.description}</Text>
          <View className="flex-row gap-1 mt-2">
            {DEFAULT_CARDS.map((_, i) => (
              <View key={i} className={`w-2 h-2 rounded-full ${i === cardIdx ? "bg-pink-400" : "bg-zinc-700"}`} />
            ))}
          </View>
        </View>
        <View className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-4">
          <Text className="text-white text-right mb-1">جودة الاحتواء: {quality.toFixed(1)}/10</Text>
          <Slider minimumValue={0} maximumValue={10} step={0.1} value={quality} onValueChange={setQuality} minimumTrackTintColor="#F472B6" maximumTrackTintColor="#27272A" />
        </View>
      </ScrollView>
    </View>
  );
}
