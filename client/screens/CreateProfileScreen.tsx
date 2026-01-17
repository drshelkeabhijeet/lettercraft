import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { HeaderButton } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveProfile } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UploadedFile {
  id: string;
  uri: string;
  name: string;
  mimeType?: string;
}

export default function CreateProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isValid = name.trim().length > 0 && files.length > 0;

  const handlePickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets) {
      const newFiles = result.assets.map((asset: DocumentPicker.DocumentPickerAsset, index: number) => ({
        id: `${Date.now()}-${index}`,
        uri: asset.uri,
        name: asset.name || `Sample ${files.length + index + 1}`,
        mimeType: asset.mimeType,
      }));
      setFiles([...files, ...newFiles]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFile = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        name: `Sample ${files.length + 1}`,
      };
      setFiles([...files, newFile]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!isValid) return;

    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const profileId = Date.now().toString();
    const newProfile = {
      id: profileId,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      sampleCount: files.length,
    };

    try {
      const formData = new FormData();
      formData.append("ocr_set_name", name.trim());
      formData.append("description", description.trim());

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileUri = file.uri;
        const fileName = file.name || `letter_${i + 1}`;
        const mimeType = file.mimeType || "image/jpeg";
        
        if (Platform.OS === "web") {
          const response = await fetch(fileUri);
          const blob = await response.blob();
          formData.append("files", blob, fileName);
        } else {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            formData.append("files", {
              uri: fileUri,
              name: fileName,
              type: mimeType,
            } as any);
          }
        }
      }

      const response = await fetch(
        "https://abhijeetshelke.app.n8n.cloud/webhook/d2691e15-a9d6-4066-bb12-73299f0ba003",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send profile data");
      }

      await saveProfile(newProfile);
      setIsAnalyzing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      setIsAnalyzing(false);
      Alert.alert(
        "Error",
        "Failed to create profile. Please check your connection and try again."
      );
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText type="body">Cancel</ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={!isValid || isAnalyzing}>
          <ThemedText
            type="body"
            style={{
              color: isValid && !isAnalyzing ? Colors.light.primary : theme.textMuted,
              fontWeight: "600",
            }}
          >
            Save
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, isValid, isAnalyzing, theme.textMuted]);

  if (isAnalyzing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText type="h3" style={styles.analyzingTitle}>
            Analyzing Your Writing Style
          </ThemedText>
          <ThemedText type="body" secondary style={styles.analyzingText}>
            Processing {files.length} sample letters...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <View style={styles.inputContainer}>
            <ThemedText type="caption" secondary style={styles.label}>
              Profile Name *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Formal Office Style"
              placeholderTextColor={theme.textMuted}
              testID="input-profile-name"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="caption" secondary style={styles.label}>
              Description (Optional)
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { borderColor: theme.border, color: theme.text },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe this writing style..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              testID="input-profile-description"
            />
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <ThemedText type="h3" style={styles.sectionTitle}>
            Sample Letters
          </ThemedText>
          <ThemedText type="caption" secondary style={styles.sectionSubtitle}>
            Upload 3-6 sample letters to train your writing style
          </ThemedText>

          <View style={styles.uploadButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                { borderColor: Colors.light.primary },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleTakePhoto}
            >
              <Feather name="camera" size={20} color={Colors.light.primary} />
              <ThemedText type="caption" style={{ color: Colors.light.primary }}>
                Take Photo
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                { borderColor: Colors.light.primary },
                pressed && styles.buttonPressed,
              ]}
              onPress={handlePickFiles}
            >
              <Feather name="folder" size={20} color={Colors.light.primary} />
              <ThemedText type="caption" style={{ color: Colors.light.primary }}>
                Choose Files
              </ThemedText>
            </Pressable>
          </View>

          {files.length > 0 ? (
            <View style={styles.filesGrid}>
              {files.map((file) => (
                <View key={file.id} style={styles.fileItem}>
                  {file.mimeType === "application/pdf" ? (
                    <View style={[styles.fileThumbnail, styles.pdfThumbnail, { backgroundColor: theme.backgroundSecondary }]}>
                      <Feather name="file-text" size={32} color={Colors.light.primary} />
                      <ThemedText type="small" numberOfLines={1} style={styles.pdfName}>
                        {file.name}
                      </ThemedText>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.fileThumbnail}
                      contentFit="cover"
                    />
                  )}
                  <Pressable
                    style={[
                      styles.removeButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() => handleRemoveFile(file.id)}
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.dropZone, { borderColor: theme.border }]}>
              <Feather name="upload" size={32} color={theme.textMuted} />
              <ThemedText type="caption" muted style={styles.dropZoneText}>
                No files uploaded yet
              </ThemedText>
            </View>
          )}

          {files.length > 0 && files.length < 3 ? (
            <ThemedText
              type="small"
              style={[styles.warning, { color: Colors.light.accent }]}
            >
              Tip: Upload at least 3 samples for better results
            </ThemedText>
          ) : null}
        </View>
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
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.lg,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 48,
    borderWidth: 1.5,
    borderRadius: BorderRadius.xs,
    borderStyle: "dashed",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  filesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  fileItem: {
    position: "relative",
  },
  fileThumbnail: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.xs,
  },
  pdfThumbnail: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
  },
  pdfName: {
    marginTop: Spacing.xs,
    textAlign: "center",
    width: "100%",
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dropZone: {
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  dropZoneText: {
    textAlign: "center",
  },
  warning: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  analyzingTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  analyzingText: {
    textAlign: "center",
  },
});
