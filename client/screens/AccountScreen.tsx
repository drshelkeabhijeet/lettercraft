import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  Letterhead,
  getLetterheads,
  saveLetterhead,
  deleteLetterhead,
} from "@/lib/storage";

import avatarDefaultImage from "../../assets/images/illustrations/avatar-default.png";
import emptyLetterheadsImage from "../../assets/images/illustrations/empty-letterheads.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AccountScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const [letterheads, setLetterheads] = useState<Letterhead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [letterheadName, setLetterheadName] = useState("");

  const loadData = useCallback(async () => {
    const loaded = await getLetterheads();
    setLetterheads(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUploadLetterhead = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });

    if (!result.canceled) {
      setPendingImageUri(result.assets[0].uri);
      setLetterheadName("");
      setShowNameModal(true);
    }
  };

  const handleSaveLetterhead = async () => {
    if (!letterheadName.trim() || !pendingImageUri) return;

    const newLetterhead: Letterhead = {
      id: Date.now().toString(),
      name: letterheadName.trim(),
      imageUri: pendingImageUri,
      createdAt: new Date().toISOString(),
    };

    await saveLetterhead(newLetterhead);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowNameModal(false);
    setPendingImageUri(null);
    setLetterheadName("");
    loadData();
  };

  const handleCancelModal = () => {
    setShowNameModal(false);
    setPendingImageUri(null);
    setLetterheadName("");
  };

  const handleDeleteLetterhead = (letterhead: Letterhead) => {
    Alert.alert(
      "Delete Letterhead",
      `Are you sure you want to delete "${letterhead.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteLetterhead(letterhead.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData();
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.reset({
            index: 0,
            routes: [{ name: "Landing" }],
          });
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <View style={styles.userInfo}>
            <Image
              source={avatarDefaultImage}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userDetails}>
              <ThemedText type="h3">{user?.name || "User"}</ThemedText>
              <ThemedText type="caption" secondary>
                {user?.email || "user@example.com"}
              </ThemedText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Letterhead Manager</ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: Colors.light.primary },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleUploadLetterhead}
              testID="button-add-letterhead"
            >
              <Feather name="plus" size={16} color={Colors.light.buttonText} />
              <ThemedText
                type="caption"
                style={{ color: Colors.light.buttonText }}
              >
                Add
              </ThemedText>
            </Pressable>
          </View>

          {letterheads.length > 0 ? (
            <View style={styles.letterheadsGrid}>
              {letterheads.map((letterhead) => (
                <View key={letterhead.id} style={styles.letterheadItem}>
                  <Image
                    source={{ uri: letterhead.imageUri }}
                    style={styles.letterheadImage}
                    contentFit="cover"
                  />
                  <View style={styles.letterheadInfo}>
                    <ThemedText type="caption" numberOfLines={1}>
                      {letterhead.name}
                    </ThemedText>
                    <Pressable
                      onPress={() => handleDeleteLetterhead(letterhead)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={14} color={theme.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyLetterheads}>
              <Image
                source={emptyLetterheadsImage}
                style={styles.emptyImage}
                contentFit="contain"
              />
              <ThemedText type="caption" secondary style={styles.emptyText}>
                No letterheads uploaded yet
              </ThemedText>
            </View>
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <ThemedText type="h3" style={styles.sectionTitle}>
            Settings
          </ThemedText>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Feather name="info" size={20} color={theme.textSecondary} />
                <ThemedText type="body">About LetterCraft</ThemedText>
              </View>
              <ThemedText type="caption" muted>
                v1.0.0
              </ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              style={({ pressed }) => [
                styles.settingItem,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleLogout}
              testID="button-logout"
            >
              <View style={styles.settingContent}>
                <Feather name="log-out" size={20} color={theme.error} />
                <ThemedText type="body" style={{ color: theme.error }}>
                  Log Out
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault },
              Shadows.floating,
            ]}
          >
            <ThemedText type="h3" style={styles.modalTitle}>
              Name Your Letterhead
            </ThemedText>

            {pendingImageUri ? (
              <Image
                source={{ uri: pendingImageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : null}

            <TextInput
              style={[
                styles.modalInput,
                { borderColor: theme.border, color: theme.text },
              ]}
              value={letterheadName}
              onChangeText={setLetterheadName}
              placeholder="Enter letterhead name"
              placeholderTextColor={theme.textMuted}
              autoFocus
              testID="input-letterhead-name"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCancelModal}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: Colors.light.primary },
                  pressed && styles.buttonPressed,
                  !letterheadName.trim() && styles.buttonDisabled,
                ]}
                onPress={handleSaveLetterhead}
                disabled={!letterheadName.trim()}
              >
                <ThemedText
                  type="body"
                  style={{ color: Colors.light.buttonText, fontWeight: "600" }}
                >
                  Save
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  letterheadsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  letterheadItem: {
    width: "47%",
  },
  letterheadImage: {
    width: "100%",
    height: 80,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  letterheadInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyLetterheads: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyImage: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
  },
  settingsList: {
    gap: Spacing.sm,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: "100%",
    height: 100,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
});
