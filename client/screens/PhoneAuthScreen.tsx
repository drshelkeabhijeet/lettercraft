import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PhoneAuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { sendOtp, verifyOtp } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const otpInputRef = useRef<TextInput>(null);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    return cleaned;
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const { error } = await sendOtp(formattedPhone);

      if (error) {
        Alert.alert("Error", error.message || "Failed to send verification code");
      } else {
        setStep("otp");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => otpInputRef.current?.focus(), 100);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const { error } = await verifyOtp(formattedPhone, otp);

      if (error) {
        Alert.alert("Verification Failed", error.message || "Invalid code");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp("");
    await handleSendOtp();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (step === "otp") {
              setStep("phone");
              setOtp("");
            } else {
              navigation.goBack();
            }
          }}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.header}>
          <ThemedText type="h1" style={styles.title}>
            {step === "phone" ? "Enter Phone Number" : "Verify Code"}
          </ThemedText>
          <ThemedText type="body" secondary style={styles.subtitle}>
            {step === "phone"
              ? "We'll send you a verification code via SMS"
              : `Enter the 6-digit code sent to +91${phone}`}
          </ThemedText>
        </View>

        {step === "phone" ? (
          <View style={styles.form}>
            <View style={styles.phoneInputContainer}>
              <View
                style={[
                  styles.countryCode,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <ThemedText type="body">+91</ThemedText>
              </View>
              <TextInput
                style={[
                  styles.phoneInput,
                  { borderColor: theme.border, color: theme.text },
                ]}
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                placeholder="Phone number"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
                testID="input-phone"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: Colors.light.primary },
                pressed && styles.buttonPressed,
                (phone.length < 10 || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={phone.length < 10 || isLoading}
              testID="button-send-otp"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.light.buttonText} />
              ) : (
                <ThemedText
                  type="body"
                  style={[styles.buttonText, { color: Colors.light.buttonText }]}
                >
                  Send Code
                </ThemedText>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              ref={otpInputRef}
              style={[
                styles.otpInput,
                { borderColor: theme.border, color: theme.text },
              ]}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, ""))}
              placeholder="000000"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              testID="input-otp"
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: Colors.light.primary },
                pressed && styles.buttonPressed,
                (otp.length !== 6 || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleVerifyOtp}
              disabled={otp.length !== 6 || isLoading}
              testID="button-verify-otp"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.light.buttonText} />
              ) : (
                <ThemedText
                  type="body"
                  style={[styles.buttonText, { color: Colors.light.buttonText }]}
                >
                  Verify
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.resendButton}
              onPress={handleResendOtp}
              disabled={isLoading}
            >
              <ThemedText type="link">Resend Code</ThemedText>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <ThemedText type="small" muted style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
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
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing["3xl"],
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    lineHeight: 24,
  },
  form: {
    gap: Spacing.lg,
  },
  phoneInputContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  countryCode: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneInput: {
    flex: 1,
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    letterSpacing: 1,
  },
  otpInput: {
    height: 64,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 32,
    letterSpacing: 8,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: "600",
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  footer: {
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  footerText: {
    textAlign: "center",
    lineHeight: 20,
  },
});
