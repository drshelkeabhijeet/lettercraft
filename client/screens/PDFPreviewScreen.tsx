import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, "PDFPreview">;

export default function PDFPreviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);

  const { content, letterhead } = route.params;

  const generatePdfHtml = () => {
    const letterheadHtml = letterhead
      ? `<img src="${letterhead}" style="width: 100%; height: auto; display: block; margin: 0; padding: 0;" />`
      : "";

    const formattedContent = content.replace(/\n/g, "<br/>");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 210mm;
              min-height: 297mm;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #1F2937;
            }
            .letterhead {
              width: 100%;
            }
            .letterhead img {
              width: 100%;
              height: auto;
              display: block;
            }
            .content {
              padding: 20mm 25mm 25mm 25mm;
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            ${letterheadHtml}
          </div>
          <div class="content">
            ${formattedContent}
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const html = generatePdfHtml();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save Letter as PDF",
        UTI: "com.adobe.pdf",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText type="body">Close</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleDownload} disabled={isGenerating}>
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <Feather name="download" size={22} color={Colors.light.primary} />
          )}
        </HeaderButton>
      ),
    });
  }, [navigation, isGenerating]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pdfContainer, Shadows.card]}>
          <View style={styles.a4Page}>
            {letterhead ? (
              <Image
                source={{ uri: letterhead }}
                style={styles.letterheadImage}
                contentFit="cover"
              />
            ) : null}
            <ScrollView
              style={styles.pageScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.letterContent}
            >
              <ThemedText style={styles.letterText}>{content}</ThemedText>
            </ScrollView>
          </View>
        </View>

        <ThemedText type="caption" muted style={styles.helpText}>
          This is a preview of your letter. Tap download to save as PDF.
        </ThemedText>
      </ScrollView>

      <View
        style={[
          styles.floatingButton,
          { bottom: insets.bottom + Spacing.xl },
          Shadows.floating,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.downloadButton,
            { backgroundColor: Colors.light.primary },
            pressed && styles.buttonPressed,
            isGenerating && styles.buttonDisabled,
          ]}
          onPress={handleDownload}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={Colors.light.buttonText} />
          ) : (
            <>
              <Feather name="download" size={20} color={Colors.light.buttonText} />
              <ThemedText
                type="body"
                style={[styles.buttonText, { color: Colors.light.buttonText }]}
              >
                Download PDF
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  pdfContainer: {
    backgroundColor: "#E5E7EB",
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    alignItems: "center",
  },
  a4Page: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    aspectRatio: 210 / 297,
    borderRadius: 4,
    overflow: "hidden",
    maxHeight: 500,
  },
  letterheadImage: {
    width: "100%",
    height: 60,
  },
  pageScroll: {
    flex: 1,
  },
  letterContent: {
    padding: Spacing.lg,
  },
  letterText: {
    fontSize: 12,
    lineHeight: 20,
    color: "#1F2937",
    fontFamily: "serif",
  },
  helpText: {
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  floatingButton: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  downloadButton: {
    flexDirection: "row",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: "600",
  },
});
