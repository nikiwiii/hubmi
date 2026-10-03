import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { useChatStore } from "@/constants/chat-store";
import { ChatContact } from "@/constants/mock-data";
import { Spacing } from "@/constants/theme";

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contacts, markAsRead } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.role.toLowerCase().includes(query) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(query)),
    );
  }, [contacts, searchQuery]);

  const handleOpenConversation = (contact: ChatContact) => {
    markAsRead(contact.id);
    router.push(`/chat/${contact.id}` as any);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wiadomości & Konsultacje</Text>
          <Text style={styles.headerSubtitle}>
            Twoje rozmowy z twórcami inicjatyw i testerami
          </Text>
        </View>

        {/* Search Input */}
        {contacts.length > 0 && (
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Szukaj w rozmowach..."
                placeholderTextColor="#A8A29E"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Empty state: No conversations at all */}
        {contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>
              Nie masz jeszcze żadnych rozmów
            </Text>
            <Text style={styles.emptySubtitle}>
              Dołącz do testowania pomysłu lub napisz do twórcy inicjatywy, aby
              rozpocząć rozmowę.
            </Text>
            <Pressable
              style={styles.emptyBrowseButton}
              onPress={() => router.push("/browse")}
            >
              <Text style={styles.emptyBrowseButtonText}>
                Przeglądaj inicjatywy →
              </Text>
            </Pressable>
          </View>
        ) : filteredContacts.length === 0 ? (
          /* Empty state: Search filter yielded no results */
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Brak wyników</Text>
            <Text style={styles.emptySubtitle}>
              Nie znaleziono rozmów pasujących do &bdquo;{searchQuery}&rdquo;.
            </Text>
          </View>
        ) : (
          /* Conversations List */
          <ScrollView
            style={styles.conversationsScroll}
            contentContainerStyle={[
              styles.conversationsContent,
              { paddingBottom: insets.bottom + Spacing.four },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Ostatnie rozmowy</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {filteredContacts.length}
                </Text>
              </View>
            </View>

            {filteredContacts.map((contact) => {
              const hasUnread = (contact.unreadCount ?? 0) > 0;
              return (
                <Pressable
                  key={contact.id}
                  style={({ pressed }) => [
                    styles.conversationCard,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => handleOpenConversation(contact)}
                >
                  {/* Avatar */}
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
                  </View>

                  {/* Content */}
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationTopRow}>
                      <Text style={styles.conversationName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                      <Text style={styles.conversationTime}>
                        {contact.lastMessageTime || ""}
                      </Text>
                    </View>

                    <Text style={styles.conversationRole} numberOfLines={1}>
                      {contact.role}
                    </Text>

                    <View style={styles.conversationBottomRow}>
                      <Text
                        style={[
                          styles.lastMessageText,
                          hasUnread && styles.lastMessageUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {contact.lastMessage || "Brak wiadomości"}
                      </Text>

                      {hasUnread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {contact.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Chevron */}
                  <Text style={styles.chevronIcon}>›</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
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
  searchWrapper: {
    paddingHorizontal: Spacing.four,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1C1917",
    padding: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: "#78716C",
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 6,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
  },
  countBadge: {
    backgroundColor: "#EFECE6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#57534E",
  },
  conversationsScroll: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: 8,
    gap: 10,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: "#FAF9F6",
    opacity: 0.95,
  },
  avatarWrapper: {
    position: "relative",
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1917",
  },

  conversationInfo: {
    flex: 1,
    gap: 2,
  },
  conversationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
    flex: 1,
    marginRight: 6,
  },
  conversationTime: {
    fontSize: 11,
    color: "#A8A29E",
    fontWeight: "500",
  },
  conversationRole: {
    fontSize: 12,
    color: "#78716C",
  },
  conversationBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  lastMessageText: {
    fontSize: 13,
    color: "#57534E",
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    fontWeight: "700",
    color: "#1C1917",
  },
  unreadBadge: {
    backgroundColor: "#1C1917",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  chevronIcon: {
    fontSize: 20,
    color: "#D6D3D1",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFECE6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1917",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#78716C",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBrowseButton: {
    backgroundColor: "#1C1917",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBrowseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
