import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { useChatStore } from "@/constants/chat-store";
import { Spacing } from "@/constants/theme";
import { GlassView } from "expo-glass-effect";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function ConversationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getContact, getMessages, sendMessage, markAsRead } = useChatStore();

  const contact = getContact(id || "");
  const messages = getMessages(id || "");

  const [inputText, setInputText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim() || !id) return;
    sendMessage(id, inputText);
    setInputText("");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const bottomBarPadding = insets.bottom + Spacing.two;

  if (!contact) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Rozmowa",
            headerBackButtonDisplayMode: "minimal",
            headerBackTitle: "",
            headerTintColor: "#1C1917",
            headerStyle: { backgroundColor: "#FFFFFF" },
          }}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notFoundContainer}>
            <Text style={styles.notFoundTitle}>Nie znaleziono rozmowy</Text>
            <Pressable
              style={styles.notFoundBackButton}
              onPress={() => router.back()}
            >
              <Text style={styles.notFoundBackButtonArrow}>←</Text>
              <Text style={styles.notFoundBackButtonLabel}>Wróć do listy</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Native iOS Navigation Header */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          headerBackTitle: "",
          headerTintColor: "#1C1917",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerShadowVisible: true,
          headerTitle: () => (
            <View style={styles.navHeaderTitle}>
              <View
                style={[
                  styles.navAvatar,
                  { backgroundColor: contact.avatarBg },
                ]}
              >
                <Text style={styles.navAvatarText}>
                  {getInitials(contact.name)}
                </Text>
              </View>
              <View style={styles.navNameRow}>
                <Text style={styles.navName} numberOfLines={1}>
                  {contact.name}
                </Text>
              </View>
            </View>
          ),
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        {/* Message Thread */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.length === 0 ? (
              <View style={styles.emptyMessagesContainer}>
                <Text style={styles.emptyMessagesText}>
                  To początek Twojej rozmowy z {contact.name}.
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleWrapper,
                      isMe
                        ? styles.messageMeWrapper
                        : styles.messageThemWrapper,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isMe
                          ? styles.messageBubbleMe
                          : styles.messageBubbleThem,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isMe ? styles.messageTextMe : styles.messageTextThem,
                        ]}
                      >
                        {msg.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isMe ? styles.messageTimeMe : styles.messageTimeThem,
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input Bar with Native iOS Glass */}
          <View
            style={[
              styles.inputBar,
              { paddingBottom: isKeyboardVisible ? 20 : bottomBarPadding },
            ]}
          >
            <View style={styles.inputGlassPill}>
              <GlassView
                glassEffectStyle="regular"
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <TextInput
                style={styles.textInput}
                placeholder={`Wiadomość do ${contact.name}...`}
                placeholderTextColor="#FFFFFF"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  inputText.trim().length > 0 && styles.sendButtonActive,
                ]}
                onPress={handleSend}
                hitSlop={6}
              >
                <Text
                  style={[
                    styles.sendButtonText,
                    inputText.trim().length > 0 && styles.sendButtonTextActive,
                  ]}
                >
                  ➔
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F6F1",
  },
  safeArea: {
    flex: 1,
  },
  navHeaderTitle: {
    alignItems: "center",
    justifyContent: "center",
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  navAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1917",
  },
  navNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    maxWidth: 220,
  },
  navName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1917",
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: 10,
  },
  emptyMessagesContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyMessagesText: {
    fontSize: 13,
    color: "#A8A29E",
    fontStyle: "italic",
    textAlign: "center",
  },
  messageBubbleWrapper: {
    flexDirection: "row",
  },
  messageMeWrapper: {
    justifyContent: "flex-end",
  },
  messageThemWrapper: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    gap: 4,
  },
  messageBubbleMe: {
    backgroundColor: "#1C1917",
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  messageTextMe: {
    color: "#FFFFFF",
  },
  messageTextThem: {
    color: "#1C1917",
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
  },
  messageTimeMe: {
    color: "#A8A29E",
  },
  messageTimeThem: {
    color: "#78716C",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  inputGlassPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    overflow: "hidden",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: "#FFFFFF",
    paddingRight: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#1C1917",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonText: {
    color: "#A8A29E",
    fontSize: 14,
    fontWeight: "700",
  },
  sendButtonTextActive: {
    color: "#FFFFFF",
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1917",
  },
  notFoundBackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  notFoundBackButtonArrow: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1C1917",
  },
  notFoundBackButtonLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1917",
  },
});
