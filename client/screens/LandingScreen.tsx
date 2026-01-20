import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

import featureStylesImage from "../../assets/images/illustrations/feature-styles.png";
import featureAiImage from "../../assets/images/illustrations/feature-ai.png";
import featurePrintImage from "../../assets/images/illustrations/feature-print.png";
import iconImage from "../../assets/images/icon.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const features = [
    {
      title: "Style Profiles",
      description: "Train AI on your unique writing style with sample letters",
      image: featureStylesImage,
    },
    {
      title: "AI Generation",
      description: "Generate professional letters matching your learned style",
      image: featureAiImage,
    },
    {
      title: "Print Ready",
      description: "Export as PDF with custom letterheads and formatting",
      image: featurePrintImage,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["2xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={iconImage} style={styles.logo} contentFit="contain" />
          <ThemedText type="h1" style={styles.title}>
            LetterCraft
          </ThemedText>
          <ThemedText type="body" secondary style={styles.subtitle}>
            Generate Official Letters In Your Own Writing Style
          </ThemedText>
          <ThemedText type="caption" muted style={styles.tagline}>
            For universities, government offices, and corporate users
          </ThemedText>
        </View>

        <View style={styles.features}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                { backgroundColor: theme.backgroundDefault },
                Shadows.card,
              ]}
            >
              <Image
                source={feature.image}
                style={styles.featureImage}
                contentFit="contain"
              />
              <View style={styles.featureText}>
                <ThemedText type="h3">{feature.title}</ThemedText>
                <ThemedText type="caption" secondary>
                  {feature.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: Colors.light.primary },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("PhoneAuth")}
          testID="button-get-started"
        >
          <ThemedText
            type="body"
            style={[styles.buttonText, { color: Colors.light.buttonText }]}
          >
            Get Started
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  tagline: {
    textAlign: "center",
  },
  features: {
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
  },
  featureImage: {
    width: 64,
    height: 64,
  },
  featureText: {
    flex: 1,
    gap: Spacing.xs,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "600",
  },
});
