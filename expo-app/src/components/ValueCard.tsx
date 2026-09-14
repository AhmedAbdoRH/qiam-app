import React from "react";
import { View, Text, Pressable } from "react-native";
import { Pin } from "lucide-react-native";
import { getBalanceColor } from "../utils/balanceCalculator";

interface Props {
  name: string;
  balancePercentage: number;
  isPinned?: boolean;
  onPress: () => void;
}

export const ValueCard: React.FC<Props> = ({ name, balancePercentage, isPinned, onPress }) => {
  const color = getBalanceColor(balancePercentage);
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3 items-center justify-center min-h-[96px]"
      style={{ borderColor: color, borderWidth: 1.5 }}
    >
      {isPinned && (
        <View className="absolute top-1 right-1">
          <Pin size={14} color="#D4AF37" />
        </View>
      )}
      <Text className="text-white text-center text-sm font-bold" numberOfLines={2}>
        {name}
      </Text>
      <View className="mt-2 rounded-full px-2 py-0.5" style={{ backgroundColor: color }}>
        <Text className="text-black text-xs font-bold">{balancePercentage}%</Text>
      </View>
    </Pressable>
  );
};
