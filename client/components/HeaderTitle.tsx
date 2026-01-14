import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";

import iconImage from "../../assets/images/icon.png";

export function HeaderTitle() {
  return (
    <View style={styles.container}>
      <Image source={iconImage} style={styles.icon} contentFit="contain" />
      <ThemedText type="h3" style={{ color: Colors.light.primary }}>
        LetterCraft
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  icon: {
    width: 28,
    height: 28,
  },
});
