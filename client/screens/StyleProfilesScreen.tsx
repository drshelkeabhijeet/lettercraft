import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  StyleProfile,
  getProfiles,
  deleteProfile,
  getSelectedProfile,
  setSelectedProfile,
} from "@/lib/storage";

import emptyProfilesImage from "../../assets/images/illustrations/empty-profiles.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StyleProfilesScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [loadedProfiles, savedId] = await Promise.all([
      getProfiles(),
      getSelectedProfile(),
    ]);
    setProfiles(loadedProfiles);
    setSelectedId(savedId);
    setLoading(false);
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

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    await setSelectedProfile(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (profile: StyleProfile) => {
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete "${profile.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteProfile(profile.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: StyleProfile;
    index: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          styles.profileCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
          pressed && styles.cardPressed,
          selectedId === item.id && styles.cardSelected,
        ]}
        onPress={() => handleSelect(item.id)}
        testID={`profile-card-${item.id}`}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <ThemedText type="h3" numberOfLines={1} style={styles.profileName}>
              {item.name}
            </ThemedText>
            {selectedId === item.id ? (
              <View
                style={[
                  styles.selectedBadge,
                  { backgroundColor: Colors.light.primary },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: Colors.light.buttonText }}
                >
                  Active
                </ThemedText>
              </View>
            ) : null}
          </View>

          {item.description ? (
            <ThemedText
              type="caption"
              secondary
              numberOfLines={2}
              style={styles.description}
            >
              {item.description}
            </ThemedText>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
              <Feather name="file-text" size={14} color={theme.textMuted} />
              <ThemedText type="small" muted>
                {item.sampleCount} samples
              </ThemedText>
            </View>
            <ThemedText type="small" muted>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Image
        source={emptyProfilesImage}
        style={styles.emptyImage}
        contentFit="contain"
      />
      <ThemedText type="h3" style={styles.emptyTitle}>
        No Style Profiles Yet
      </ThemedText>
      <ThemedText type="body" secondary style={styles.emptyText}>
        Create your first writing style profile by uploading sample letters
      </ThemedText>
      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          { backgroundColor: Colors.light.primary },
          pressed && styles.buttonPressed,
        ]}
        onPress={() => navigation.navigate("CreateProfile")}
      >
        <Feather name="plus" size={18} color={Colors.light.buttonText} />
        <ThemedText
          type="body"
          style={[styles.buttonText, { color: Colors.light.buttonText }]}
        >
          Create Profile
        </ThemedText>
      </Pressable>
    </View>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("CreateProfile")}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Feather name="plus" size={24} color={Colors.light.primary} />
        </Pressable>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText secondary>Loading profiles...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          profiles.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  profileCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  profileName: {
    flex: 1,
  },
  selectedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  description: {
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  createButton: {
    flexDirection: "row",
    height: Spacing.buttonHeight,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "600",
  },
  headerButton: {
    marginRight: Spacing.sm,
  },
});
