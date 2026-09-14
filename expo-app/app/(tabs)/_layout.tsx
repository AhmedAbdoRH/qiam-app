import React from "react";
import { Tabs } from "expo-router";
import { Target, BrickWall, Heart, Sparkles } from "lucide-react-native";

// Mirrors web BottomNavBar: الأنوثة(/feelings) الذات السيادية(/) العلاقات(/tasks) الايمان(/divinity)
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#000", borderTopColor: "#27272A" },
        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "#71717A",
        sceneStyle: { backgroundColor: "#000" },
      }}
    >
      <Tabs.Screen name="feelings" options={{ title: "الأنوثة", tabBarIcon: ({ color, size }) => <Target size={size} color={color} /> }} />
      <Tabs.Screen name="index" options={{ title: "الذات السيادية", tabBarIcon: ({ color, size }) => <BrickWall size={size} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: "العلاقات", tabBarIcon: ({ color, size }) => <Heart size={size} color={color} /> }} />
      <Tabs.Screen name="divinity" options={{ title: "الايمان", tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} /> }} />
    </Tabs>
  );
}
