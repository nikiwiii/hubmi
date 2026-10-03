import React, { useState } from "react";
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

import { ThemedView } from "@/components/themed-view";
import { ChatContact, INITIAL_CONTACTS } from "@/constants/mock-data";
import { Spacing } from "@/constants/theme";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "user-anna-2": [
    {
      id: "m1",
      sender: "them",
      text: "Cześć! Dziękuję za zainteresowanie Sąsiedzką Narzędziownią!",
      time: "12:30",
    },
    {
      id: "m2",
      sender: "them",
      text: "Wiertarka udarowa i glebogryzarka są wolne w tę sobotę. Pasuje Ci odbiór około 11:00?",
      time: "12:35",
    },
    {
      id: "m3",
      sender: "me",
      text: "Tak, świetnie! Chętnie przetestuję też procedurę rezerwacji w aplikacji.",
      time: "12:40",
    },
  ],
  "user-lois-5": [
    {
      id: "m1",
      sender: "them",
      text: "Dzień dobry! Najbliższe spotkanie Klubu Mądrości jest w czwartek o 18:00.",
      time: "Wczoraj",
    },
    {
      id: "m2",
      sender: "me",
      text: "Super, czy przygotować jakiś konkretny temat na dyskusję?",
      time: "Wczoraj",
    },
  ],
  "user-henrietta-6": [
    {
      id: "m1",
      sender: "them",
      text: "Dziękuję za zgłoszenie do testów wersji głosowej asystenta leków!",
      time: "2 dni temu",
    },
  ],
  "user-jan-3": [
    {
      id: "m1",
      sender: "them",
      text: "Dodałem nową trasę w okolicach Drawska. Daj znać jak oceniasz punkty postojowe!",
      time: "3 dni temu",
    },
  ],
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [contacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<ChatContact>(
    INITIAL_CONTACTS[0],
  );
  const [messages, setMessages] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  React.useEffect(() => {
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

  const bottomBarPadding = insets.bottom + Spacing.two;
  const currentMessages = messages[selectedContact.id] || [];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "me",
      text: inputText.trim(),
      time: "Teraz",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
    }));
    setInputText("");
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wiadomości & Konsultacje</Text>
          <Text style={styles.headerSubtitle}>
            Bezpośredni kontakt z twórcami pomysłów i testerami
          </Text>
        </View>

        {/* Contacts Horizontal Scroller */}
        <View style={styles.contactsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contactsScroll}
          >
            {contacts.map((contact) => {
              const active = selectedContact.id === contact.id;
              return (
                <Pressable
                  key={contact.id}
                  style={[
                    styles.contactCard,
                    active && styles.contactCardActive,
                  ]}
                  onPress={() => setSelectedContact(contact)}
                >
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.contactAvatar,
                        { backgroundColor: contact.avatarBg },
                      ]}
                    >
                      <Text style={styles.contactAvatarText}>
                        {contact.name.charAt(0)}
                      </Text>
                    </View>
                    {contact.isOnline && <View style={styles.onlineBadge} />}
                  </View>
                  <Text
                    style={[
                      styles.contactName,
                      active && styles.contactNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {contact.name}
                  </Text>
                  <Text style={styles.contactRole} numberOfLines={1}>
                    {contact.role}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Conversation Header */}
        <View style={styles.chatActiveHeader}>
          <View
            style={[
              styles.activeAvatar,
              { backgroundColor: selectedContact.avatarBg },
            ]}
          >
            <Text style={styles.activeAvatarText}>
              {selectedContact.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.activeMeta}>
            <Text style={styles.activeName}>{selectedContact.name}</Text>
            <Text style={styles.activeStatus}>
              {selectedContact.isOnline
                ? "🟢 Dostępny online"
                : "⚪ Ostatnio widziany niedawno"}
            </Text>
          </View>
        </View>

        {/* Message Thread */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {currentMessages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubbleWrapper,
                    isMe ? styles.messageMeWrapper : styles.messageThemWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
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
            })}
          </ScrollView>

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              { paddingBottom: isKeyboardVisible ? 12 : bottomBarPadding },
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder={`Wiadomość do ${selectedContact.name}...`}
              placeholderTextColor="#A8A29E"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <Pressable
              style={[
                styles.sendButton,
                inputText.trim().length > 0 && styles.sendButtonActive,
              ]}
              onPress={handleSendMessage}
            >
              <Text style={styles.sendButtonText}>➔</Text>
            </Pressable>
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
    backgroundColor: "#F7F6F1",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1917",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#78716C",
    marginTop: 2,
  },
  contactsSection: {
    backgroundColor: "#FAF9F6",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
    paddingVertical: 10,
  },
  contactsScroll: {
    paddingHorizontal: Spacing.four,
    gap: 10,
  },
  contactCard: {
    width: 105,
    padding: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  contactCardActive: {
    borderColor: "#1C1917",
    backgroundColor: "#EFE5C6",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 4,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
  },
  onlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  contactName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1917",
    textAlign: "center",
  },
  contactNameActive: {
    color: "#1C1917",
  },
  contactRole: {
    fontSize: 10,
    color: "#78716C",
    textAlign: "center",
    marginTop: 1,
  },
  chatActiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  activeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  activeAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
  },
  activeMeta: {
    flex: 1,
  },
  activeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
  },
  activeStatus: {
    fontSize: 11,
    color: "#78716C",
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
  quickRepliesRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingVertical: 6,
  },
  quickReplyChip: {
    backgroundColor: "#EFECE6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quickReplyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#44403C",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1C1917",
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E7E5E4",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#1C1917",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
