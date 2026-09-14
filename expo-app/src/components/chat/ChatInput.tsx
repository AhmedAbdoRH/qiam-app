import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Send } from "lucide-react-native";
import { QUICK_MILESTONES } from "./MilestoneParser";

interface ChatInputProps {
  onSend: (text: string) => void;
  sending?: boolean;
}

/** Input bar with quick milestone chips, send button and keyboard handling. */
export const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending = false }) => {
  const [draft, setDraft] = useState("");

  const submit = (text: string = draft) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setDraft("");
    onSend(trimmed);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="flex-row px-2 py-1 gap-1">
        {QUICK_MILESTONES.map((q) => (
          <Pressable
            key={q.tag}
            onPress={() => submit(q.tag)}
            disabled={sending}
            className="px-2 py-1 rounded-full bg-zinc-800 active:bg-zinc-700"
          >
            <Text className="text-zinc-200 text-[10px]">{q.label}</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row items-center p-3 gap-2 border-t border-zinc-800">
        <Pressable
          onPress={() => submit()}
          disabled={sending || !draft.trim()}
          className={`rounded-full p-3 ${
            sending || !draft.trim() ? "bg-zinc-700" : "bg-amber-500"
          }`}
        >
          <Send size={18} color="#000" />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          textAlign="right"
          multiline
          maxLength={2000}
          placeholder="اكتب رسالتك..."
          placeholderTextColor="#52525B"
          className="flex-1 bg-zinc-900 text-white rounded-2xl px-4 py-3 border border-zinc-800 max-h-28"
          onSubmitEditing={() => submit()}
          returnKeyType="send"
          blurOnSubmit={false}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
