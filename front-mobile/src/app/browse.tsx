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
import { INITIAL_IDEAS, Idea } from "@/constants/mock-data";
import { Spacing } from "@/constants/theme";

type StatusFilter = "all" | "active" | "testing" | "archived";
type SortOrder = "popular" | "testers" | "newest";

export default function BrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ideas, setIdeas] = useState<Idea[]>(INITIAL_IDEAS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("popular");
  const [expandedId, setExpandedId] = useState<string | null>(
    ideas[0]?.id ?? null,
  );

  const filteredAndSortedIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        const matchesSearch =
          idea.title.toLowerCase().includes(search.toLowerCase()) ||
          idea.summary.toLowerCase().includes(search.toLowerCase()) ||
          idea.authorName.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || idea.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === "popular") return b.likes - a.likes;
        if (sortOrder === "testers") return b.testersCount - a.testersCount;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [ideas, search, statusFilter, sortOrder]);

  const handleVote = (id: string, type: "like" | "dislike") => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== id) return idea;
        const currentVote = idea.userVote;
        let newVote: "like" | "dislike" | null = type;
        let likesDelta = 0;
        let dislikesDelta = 0;

        if (currentVote === type) {
          newVote = null;
          if (type === "like") likesDelta = -1;
          else dislikesDelta = -1;
        } else {
          if (currentVote === "like") likesDelta = -1;
          if (currentVote === "dislike") dislikesDelta = -1;
          if (type === "like") likesDelta += 1;
          if (type === "dislike") dislikesDelta += 1;
        }

        return {
          ...idea,
          userVote: newVote,
          likes: Math.max(0, idea.likes + likesDelta),
          dislikes: Math.max(0, idea.dislikes + dislikesDelta),
        };
      }),
    );
  };

  const handleToggleTesting = (id: string) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== id) return idea;
        const isTesting = idea.testersList.includes("current-user");
        const updatedList = isTesting
          ? idea.testersList.filter((e) => e !== "current-user")
          : [...idea.testersList, "current-user"];

        return {
          ...idea,
          testersList: updatedList,
          testersCount: isTesting
            ? idea.testersCount - 1
            : idea.testersCount + 1,
        };
      }),
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Przeglądaj Pomysły</Text>
          <Text style={styles.headerSubtitle}>
            Baza lokalnych inicjatyw poddanych weryfikacji i testom
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔎</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Filtruj listę projektów..."
              placeholderTextColor="#A8A29E"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Status Tabs */}
          <View style={styles.filterRow}>
            {(
              [
                { id: "all", label: "Wszystkie" },
                { id: "active", label: "Aktywne" },
                { id: "testing", label: "W testach" },
                { id: "archived", label: "Zarchiwizowane" },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.statusTab, active && styles.statusTabActive]}
                  onPress={() => setStatusFilter(tab.id)}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      active && styles.statusTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sort Controls */}
          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sortuj:</Text>
            {(
              [
                { id: "popular", label: "Popularne" },
                { id: "testers", label: "Najwięcej testerów" },
                { id: "newest", label: "Najnowsze" },
              ] as const
            ).map((s) => {
              const active = sortOrder === s.id;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.sortButton, active && styles.sortButtonActive]}
                  onPress={() => setSortOrder(s.id)}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      active && styles.sortButtonTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Ideas List */}
          {filteredAndSortedIdeas.map((idea) => {
            const isExpanded = expandedId === idea.id;
            const isTester = idea.testersList.includes("current-user");

            return (
              <View key={idea.id} style={styles.card}>
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : idea.id)}
                  style={styles.cardPressable}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {idea.category}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        idea.status === "testing"
                          ? styles.statusTesting
                          : idea.status === "active"
                            ? styles.statusActive
                            : styles.statusArchived,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {idea.status === "testing"
                          ? "🧪 W testach"
                          : idea.status === "active"
                            ? "🟢 Aktywny"
                            : "📦 Archiwum"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{idea.title}</Text>
                  <Text style={styles.cardSubtitle}>{idea.subtitle}</Text>
                  <Text style={styles.cardSummary}>{idea.summary}</Text>
                </Pressable>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsHeading}>Szczegółowy opis:</Text>
                    <Text style={styles.detailsText}>{idea.description}</Text>

                    <Text style={[styles.detailsHeading, { marginTop: 10 }]}>
                      Dla kogo:
                    </Text>
                    <Text style={styles.detailsText}>
                      {idea.targetAudience}
                    </Text>

                    <Text style={[styles.detailsHeading, { marginTop: 10 }]}>
                      Kluczowe korzyści:
                    </Text>
                    {idea.keyBenefits.map((b, i) => (
                      <Text key={i} style={styles.benefitItem}>
                        • {b}
                      </Text>
                    ))}

                    <View style={styles.authorSection}>
                      <View style={styles.authorBadge}>
                        <Text style={styles.authorBadgeText}>
                          {idea.authorName.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.authorInfo}>
                        <Text style={styles.authorNameText}>
                          {idea.authorName}
                        </Text>
                        <Text style={styles.authorEmailText}>
                          {idea.authorEmail}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.chatButton}
                        onPress={() => router.push(`/chat/${idea.authorId}` as any)}
                      >
                        <Text style={styles.chatButtonText}>💬 Czat</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Footer Actions */}
                <View style={styles.cardFooter}>
                  <View style={styles.voteControls}>
                    <Pressable
                      style={[
                        styles.actionPill,
                        idea.userVote === "like" && styles.actionPillLike,
                      ]}
                      onPress={() => handleVote(idea.id, "like")}
                    >
                      <Text>👍 {idea.likes}</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionPill,
                        idea.userVote === "dislike" && styles.actionPillDislike,
                      ]}
                      onPress={() => handleVote(idea.id, "dislike")}
                    >
                      <Text>👎 {idea.dislikes}</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={[styles.testPill, isTester && styles.testPillActive]}
                    onPress={() => handleToggleTesting(idea.id)}
                  >
                    <Text
                      style={[
                        styles.testPillText,
                        isTester && styles.testPillTextActive,
                      ]}
                    >
                      {isTester
                        ? "✓ Tester"
                        : `+ Dołącz (${idea.testersCount})`}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
    paddingBottom: 14,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
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
  filterRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#EFECE6",
    padding: 4,
    borderRadius: 14,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 10,
  },
  statusTabActive: {
    backgroundColor: "#FFFFFF",
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78716C",
  },
  statusTabTextActive: {
    color: "#1C1917",
    fontWeight: "700",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78716C",
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  sortButtonActive: {
    backgroundColor: "#1C1917",
    borderColor: "#1C1917",
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#57534E",
  },
  sortButtonTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 8,
  },
  cardPressable: {
    gap: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#EFE5C6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#44403C",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: "#DCFCE7",
  },
  statusTesting: {
    backgroundColor: "#E0E7FF",
  },
  statusArchived: {
    backgroundColor: "#F5F5F4",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1917",
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#78716C",
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: "#44403C",
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E7E5E4",
    gap: 4,
  },
  detailsHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1917",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#57534E",
  },
  benefitItem: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "500",
    lineHeight: 18,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    padding: 8,
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
  },
  authorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFE5C6",
    alignItems: "center",
    justifyContent: "center",
  },
  authorBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1917",
  },
  authorInfo: {
    flex: 1,
  },
  authorNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1917",
  },
  authorEmailText: {
    fontSize: 11,
    color: "#78716C",
  },
  chatButton: {
    backgroundColor: "#1C1917",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F5F5F4",
  },
  voteControls: {
    flexDirection: "row",
    gap: 8,
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F5F5F4",
  },
  actionPillLike: {
    backgroundColor: "#DCFCE7",
  },
  actionPillDislike: {
    backgroundColor: "#FEE2E2",
  },
  testPill: {
    backgroundColor: "#1C1917",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testPillActive: {
    backgroundColor: "#059669",
  },
  testPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  testPillTextActive: {
    color: "#FFFFFF",
  },
});
