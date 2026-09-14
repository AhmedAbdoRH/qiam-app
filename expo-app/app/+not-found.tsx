import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function NotFound() {
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-white text-2xl font-bold">الصفحة غير موجودة</Text>
      <Link href="/(tabs)" asChild>
        <Pressable className="bg-amber-500 rounded-xl px-6 py-3 mt-4">
          <Text className="text-black font-bold">العودة للرئيسية</Text>
        </Pressable>
      </Link>
    </View>
  );
}
