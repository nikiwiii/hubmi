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
import { CATEGORIES, INITIAL_IDEAS, Idea } from "@/constants/mock-data";
import { Spacing } from "@/constants/theme";

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [ideas, setIdeas] = useState<Idea[]>(INITIAL_IDEAS);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesQuery =
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.authorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "Wszystkie" ||
        idea.category
          .toLowerCase()
          .includes(selectedCategory.toLowerCase().slice(0, 4));

      return matchesQuery && matchesCategory;
    });
  }, [ideas, searchQuery, selectedCategory]);

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
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>m</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>MiNNO</Text>
              <Text style={styles.brandSubtitle}>Społeczność & Innowacje</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.proposeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/propose")}
          >
            <Text style={styles.proposeButtonText}>+ Dodaj pomysł</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={styles.heroSection}>
            <Text style={styles.heroHeadline}>Odkrywaj Pomysły</Text>
            <Text style={styles.heroSubheadline}>Inspiruj lokalne zmiany</Text>
            <Text style={styles.heroDesc}>
              Głosuj na inicjatywy mieszkańców, testuj prototypy i twórz z nami
              lepsze miasto.
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Szukaj pomysłów, kategorii, twórców..."
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

          {/* Categories Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Ideas List Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Wyróżnione inicjatywy ({filteredIdeas.length})
            </Text>
            <Pressable onPress={() => router.push("/browse")}>
              <Text style={styles.seeAllText}>Wszystkie →</Text>
            </Pressable>
          </View>

          {filteredIdeas.map((idea) => {
            const isTester = idea.testersList.includes("current-user");
            return (
              <View key={idea.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardCategoryBadge}>
                    <Text style={styles.cardCategoryText}>{idea.category}</Text>
                  </View>
                  <Text style={styles.cardDate}>{idea.createdAt}</Text>
                </View>

                <Text style={styles.cardTitle}>{idea.title}</Text>
                <Text style={styles.cardSubtitle}>{idea.subtitle}</Text>
                <Text style={styles.cardSummary}>{idea.summary}</Text>

                {/* Author Info */}
                <View style={styles.authorRow}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorInitial}>
                      {idea.authorName.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.authorName}>{idea.authorName}</Text>
                  <Text style={styles.testersBadgeText}>
                    • {idea.testersCount} testerów
                  </Text>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  <View style={styles.voteRow}>
                    <Pressable
                      style={[
                        styles.voteButton,
                        idea.userVote === "like" && styles.voteButtonActive,
                      ]}
                      onPress={() => handleVote(idea.id, "like")}
                    >
                      <Text style={styles.voteIcon}>👍</Text>
                      <Text
                        style={[
                          styles.voteCount,
                          idea.userVote === "like" && styles.voteTextActive,
                        ]}
                      >
                        {idea.likes}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.voteButton,
                        idea.userVote === "dislike" &&
                          styles.voteButtonActiveDislike,
                      ]}
                      onPress={() => handleVote(idea.id, "dislike")}
                    >
                      <Text style={styles.voteIcon}>👎</Text>
                      <Text
                        style={[
                          styles.voteCount,
                          idea.userVote === "dislike" && styles.voteTextActive,
                        ]}
                      >
                        {idea.dislikes}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={[
                      styles.testButton,
                      isTester && styles.testButtonActive,
                    ]}
                    onPress={() => handleToggleTesting(idea.id)}
                  >
                    <Text
                      style={[
                        styles.testButtonText,
                        isTester && styles.testButtonTextActive,
                      ]}
                    >
                      {isTester ? "✓ Biorę udział" : "🧪 Chcę testować"}
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
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
    backgroundColor: "#F7F6F1",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1C1917",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1917",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "500",
  },
  proposeButton: {
    backgroundColor: "#1C1917",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  proposeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  heroSection: {
    paddingVertical: Spacing.two,
  },
  heroHeadline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1C1917",
    letterSpacing: -1,
  },
  heroSubheadline: {
    fontSize: 24,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: -0.5,
    marginTop: -2,
  },
  heroDesc: {
    fontSize: 14,
    color: "#57534E",
    lineHeight: 20,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
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
  categoriesContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EFECE6",
  },
  categoryChipActive: {
    backgroundColor: "#1C1917",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#57534E",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1917",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#78716C",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategoryBadge: {
    backgroundColor: "#EFE5C6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardCategoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#44403C",
  },
  cardDate: {
    fontSize: 12,
    color: "#A8A29E",
  },
  cardTitle: {
    fontSize: 18,
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
    fontSize: 14,
    lineHeight: 20,
    color: "#44403C",
    marginTop: 2,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F5F5F4",
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EAE7DF",
    alignItems: "center",
    justifyContent: "center",
  },
  authorInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1917",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1917",
  },
  testersBadgeText: {
    fontSize: 12,
    color: "#78716C",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 8,
  },
  voteRow: {
    flexDirection: "row",
    gap: 8,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F5F5F4",
  },
  voteButtonActive: {
    backgroundColor: "#DCFCE7",
  },
  voteButtonActiveDislike: {
    backgroundColor: "#FEE2E2",
  },
  voteIcon: {
    fontSize: 13,
  },
  voteCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#44403C",
  },
  voteTextActive: {
    color: "#166534",
  },
  testButton: {
    backgroundColor: "#1C1917",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  testButtonActive: {
    backgroundColor: "#059669",
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  testButtonTextActive: {
    color: "#FFFFFF",
  },
});
