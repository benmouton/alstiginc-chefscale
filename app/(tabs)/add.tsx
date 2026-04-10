import React, { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";

export default function AddScreen() {
  useEffect(() => {
    router.replace("/recipe/edit");
  }, []);

  return <View style={{ flex: 1, backgroundColor: Colors.backgroundDeep }} />;
}
