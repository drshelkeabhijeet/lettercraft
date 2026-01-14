import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  StyleProfile,
  getProfiles,
  getSelectedProfile,
  setSelectedProfile,
} from "@/lib/storage";
import {
  fetchStyleProfiles,
  SupabaseStyleProfile,
} from "@/lib/supabase";
import { getApiUrl } from "@/lib/query-client";

const emptyGeneratorImage = require("../../assets/images/illustrations/empty-generator.png");

interface Letterhead {
  name: string;
  url: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GeneratorScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [letterheads, setLetterheads] = useState<Letterhead[]>([]);
  const [selectedLetterhead, setSelectedLetterhead] = useState<Letterhead | null>(null);
  const [isUploadingLetterhead, setIsUploadingLetterhead] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const [supabaseProfiles, localProfiles, savedProfileId] = await Promise.all([
        fetchStyleProfiles(),
        getProfiles(),
        getSelectedProfile(),
      ]);

      const mappedSupabaseProfiles: StyleProfile[] = supabaseProfiles.map(
        (p: SupabaseStyleProfile) => ({
          id: p.id,
          name: p.profile_name,
          description: p.description || "",
          createdAt: p.created_at,
          sampleCount: 0,
        })
      );

      const allProfiles =
        mappedSupabaseProfiles.length > 0
          ? mappedSupabaseProfiles
          : localProfiles;

      setProfiles(allProfiles);
      if (savedProfileId && allProfiles.some((p) => p.id === savedProfileId)) {
        setSelectedProfileId(savedProfileId);
      } else if (allProfiles.length > 0) {
        setSelectedProfileId(allProfiles[0].id);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
      const localProfiles = await getProfiles();
      setProfiles(localProfiles);
      if (localProfiles.length > 0) {
        setSelectedProfileId(localProfiles[0].id);
      }
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  const loadLetterheads = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/letterheads", apiUrl).toString());
      if (response.ok) {
        const data = await response.json();
        setLetterheads(data);
      }
    } catch (error) {
      console.error("Failed to load letterheads:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadLetterheads();
    }, [loadData, loadLetterheads])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleSelectProfile = async (id: string) => {
    setSelectedProfileId(id);
    await setSelectedProfile(id);
    setShowProfilePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleUploadLetterhead = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setIsUploadingLetterhead(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const asset = result.assets[0];
      const fileExt = asset.uri.split(".").pop() || "png";
      const fileName = `letterhead_${Date.now()}.${fileExt}`;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: "base64",
      });

      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/upload-letterhead", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileData: base64,
          contentType: `image/${fileExt}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newLetterhead = { name: data.fileName, url: data.url };
        setLetterheads((prev) => [...prev, newLetterhead]);
        setSelectedLetterhead(newLetterhead);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Upload Failed", "Could not upload letterhead image");
      }
    } catch (error) {
      console.error("Failed to upload letterhead:", error);
      Alert.alert("Error", "Failed to upload letterhead");
    } finally {
      setIsUploadingLetterhead(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProfile || !instructions.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/generate-letter", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          instructions: instructions.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const letterContent = data.letter || data.content || data.text || JSON.stringify(data);
        setGeneratedLetter(letterContent);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Generation Failed", "Could not generate letter. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Failed to generate letter:", error);
      Alert.alert("Error", "Failed to connect to the letter generation service.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/generate-letter", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile?.id,
          instructions: `${instructions.trim()}\n\nPlease refine and improve the previous version.`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const letterContent = data.letter || data.content || data.text || JSON.stringify(data);
        setGeneratedLetter(letterContent);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Refinement Failed", "Could not refine the letter. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Failed to refine letter:", error);
      Alert.alert("Error", "Failed to connect to the letter generation service.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTxt = async () => {
    try {
      const fileName = `letter_${Date.now()}.txt`;
      const file = new File(Paths.cache, fileName);
      file.create();
      file.write(generatedLetter);
      await Sharing.shareAsync(file.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to share file:", error);
    }
  };

  const handlePreviewPDF = () => {
    navigation.navigate("PDFPreview", { 
      content: generatedLetter,
      letterhead: selectedLetterhead?.url,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <ThemedText type="caption" secondary style={styles.label}>
            Writing Style
          </ThemedText>
          <Pressable
            style={[styles.selector, { borderColor: theme.border }]}
            onPress={() => setShowProfilePicker(!showProfilePicker)}
            testID="button-select-profile"
          >
            <ThemedText
              type="body"
              secondary={!selectedProfile}
              numberOfLines={1}
            >
              {selectedProfile?.name || "Select a style profile"}
            </ThemedText>
            <Feather
              name={showProfilePicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>

          {showProfilePicker && profiles.length > 0 ? (
            <View style={[styles.pickerDropdown, { borderColor: theme.border }]}>
              {profiles.map((profile) => (
                <Pressable
                  key={profile.id}
                  style={[
                    styles.pickerItem,
                    selectedProfileId === profile.id && {
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => handleSelectProfile(profile.id)}
                >
                  <ThemedText type="body">{profile.name}</ThemedText>
                  {selectedProfileId === profile.id ? (
                    <Feather
                      name="check"
                      size={18}
                      color={Colors.light.primary}
                    />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {isLoadingProfiles ? (
            <View style={styles.loadingProfiles}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <ThemedText type="caption" secondary>
                Loading profiles...
              </ThemedText>
            </View>
          ) : profiles.length === 0 ? (
            <Pressable
              style={styles.createProfileLink}
              onPress={() => navigation.navigate("CreateProfile")}
            >
              <Feather name="plus" size={16} color={Colors.light.primary} />
              <ThemedText type="link">Create your first style profile</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <ThemedText type="caption" secondary style={styles.label}>
            Letter Instructions
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Describe the letter you need... (e.g., Request for leave application for 3 days starting next Monday)"
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
            testID="input-instructions"
          />

          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              { backgroundColor: Colors.light.primary },
              pressed && styles.buttonPressed,
              (!selectedProfile || !instructions.trim() || isGenerating) &&
                styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={!selectedProfile || !instructions.trim() || isGenerating}
            testID="button-generate"
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.light.buttonText} />
            ) : (
              <>
                <Feather name="zap" size={18} color={Colors.light.buttonText} />
                <ThemedText
                  type="body"
                  style={[styles.buttonText, { color: Colors.light.buttonText }]}
                >
                  Generate Letter
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {generatedLetter ? (
          <View
            style={[
              styles.outputCard,
              { backgroundColor: theme.backgroundDefault },
              Shadows.card,
            ]}
          >
            <View style={styles.letterheadSection}>
              <ThemedText type="caption" secondary style={styles.label}>
                Letterhead
              </ThemedText>
              <View style={styles.letterheadRow}>
                {selectedLetterhead ? (
                  <Pressable
                    style={styles.selectedLetterheadContainer}
                    onPress={() => setSelectedLetterhead(null)}
                  >
                    <Image
                      source={{ uri: selectedLetterhead.url }}
                      style={styles.selectedLetterheadPreview}
                      contentFit="contain"
                    />
                    <View style={styles.removeLetterhead}>
                      <Feather name="x" size={14} color="#FFF" />
                    </View>
                  </Pressable>
                ) : null}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.letterheadScroll}
                >
                  <Pressable
                    style={[styles.uploadLetterheadButton, { borderColor: theme.border }]}
                    onPress={handleUploadLetterhead}
                    disabled={isUploadingLetterhead}
                  >
                    {isUploadingLetterhead ? (
                      <ActivityIndicator size="small" color={Colors.light.primary} />
                    ) : (
                      <>
                        <Feather name="upload" size={16} color={Colors.light.primary} />
                        <ThemedText type="caption" style={{ color: Colors.light.primary }}>
                          Upload
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                  {letterheads.map((lh) => (
                    <Pressable
                      key={lh.name}
                      style={[
                        styles.letterheadThumbnail,
                        selectedLetterhead?.name === lh.name && styles.letterheadThumbnailSelected,
                      ]}
                      onPress={() => setSelectedLetterhead(lh)}
                    >
                      <Image
                        source={{ uri: lh.url }}
                        style={styles.letterheadThumbnailImage}
                        contentFit="cover"
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <ThemedText type="caption" secondary style={styles.label}>
              Generated Letter
            </ThemedText>
            <View style={styles.a4Container}>
              <View
                style={[styles.letterPreview, { backgroundColor: "#FFFFFF" }]}
              >
                {selectedLetterhead ? (
                  <Image
                    source={{ uri: selectedLetterhead.url }}
                    style={styles.letterheadImage}
                    contentFit="cover"
                  />
                ) : null}
                <ScrollView
                  style={styles.letterScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.letterContent}
                >
                  <ThemedText
                    style={[styles.letterText, { color: "#1F2937" }]}
                  >
                    {generatedLetter}
                  </ThemedText>
                </ScrollView>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleRefine}
                disabled={isGenerating}
              >
                <Feather name="refresh-cw" size={16} color={theme.text} />
                <ThemedText type="caption">Refine</ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleDownloadTxt}
              >
                <Feather name="file-text" size={16} color={theme.text} />
                <ThemedText type="caption">TXT</ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handlePreviewPDF}
              >
                <Feather name="file" size={16} color={theme.text} />
                <ThemedText type="caption">PDF</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={emptyGeneratorImage}
              style={styles.emptyImage}
              contentFit="contain"
            />
            <ThemedText type="body" secondary style={styles.emptyText}>
              Describe the letter you need and tap Generate
            </ThemedText>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
  },
  pickerDropdown: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  createProfileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  loadingProfiles: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
  },
  generateButton: {
    flexDirection: "row",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: "600",
  },
  outputCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  a4Container: {
    alignItems: "center",
  },
  letterPreview: {
    width: "100%",
    aspectRatio: 210 / 297,
    maxHeight: 500,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  letterScroll: {
    flex: 1,
  },
  letterContent: {
    padding: Spacing.lg,
  },
  letterText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: "serif",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    textAlign: "center",
  },
  letterheadSection: {
    marginBottom: Spacing.lg,
  },
  letterheadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedLetterheadContainer: {
    position: "relative",
    marginRight: Spacing.sm,
  },
  selectedLetterheadPreview: {
    width: 80,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  removeLetterhead: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.error,
    alignItems: "center",
    justifyContent: "center",
  },
  letterheadScroll: {
    flexGrow: 0,
  },
  uploadLetterheadButton: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  letterheadThumbnail: {
    width: 60,
    height: 40,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  letterheadThumbnailSelected: {
    borderColor: Colors.light.primary,
  },
  letterheadThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  letterheadImage: {
    width: "100%",
    height: 80,
  },
});
