import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { CATEGORIES } from "@/constants/mock-data";
import { Spacing } from "@/constants/theme";

const SHAPES = [
  { id: "donut", label: "Torus", symbol: "🍩" },
  { id: "v-shape", label: "V-Kształt", symbol: "✌️" },
  { id: "cloud", label: "Chmurka", symbol: "☁️" },
  { id: "crescent", label: "Półksiężyc", symbol: "🌙" },
  { id: "wave", label: "Fala", symbol: "🌊" },
  { id: "sun", label: "Słońce", symbol: "☀️" },
];

const THEME_COLORS = [
  { id: "yellow", label: "Ciepły Żółty", color: "#FEF08A" },
  { id: "slate", label: "Grafit", color: "#CBD5E1" },
  { id: "lavender", label: "Lawenda", color: "#E9D5FF" },
  { id: "sage", label: "Szałwia", color: "#BBF7D0" },
  { id: "lilac", label: "Liliowy", color: "#DDD6FE" },
  { id: "pink", label: "Róż", color: "#FBCFE8" },
];

export default function ProposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedShape, setSelectedShape] = useState("donut");
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [benefit, setBenefit] = useState("");
  const [benefitsList, setBenefitsList] = useState<string[]>([
    "Oszczędność czasu i budżetu",
    "Integracja sąsiedzka",
  ]);

  const handleAddBenefit = () => {
    if (!benefit.trim()) return;
    setBenefitsList([...benefitsList, benefit.trim()]);
    setBenefit("");
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim() || !summary.trim()) {
      Alert.alert(
        "Uzupełnij dane",
        "Podaj co najmniej tytuł i krótkie podsumowanie pomysłu.",
      );
      return;
    }

    Alert.alert(
      "Sukces! 🎉",
      `Twój pomysł "${title}" został zgłoszony i oczekuje na pierwszych testerów!`,
      [
        {
          text: "Przejdź do przeglądania",
          onPress: () => router.push("/browse"),
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Zaproponuj Pomysł</Text>
          <Text style={styles.headerSubtitle}>
            Stwórz prototyp i zbuduj społeczność testerów
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
          {/* Section: Basic info */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>1. Podstawowe informacje</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tytuł inicjatywy *</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Sąsiedzka Narzędziownia & Pomoc"
                placeholderTextColor="#A8A29E"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Chwytliwy podtytuł</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Wypożyczalnia sprzętu i wsparcie w ogrodzie"
                placeholderTextColor="#A8A29E"
                value={subtitle}
                onChangeText={setSubtitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kategoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
              >
                {CATEGORIES.filter((c) => c !== "Wszystkie").map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          active && styles.pillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Section: Description & Audience */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>2. Opis i odbiorcy</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Krótkie podsumowanie (1-2 zdania) *
              </Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Czym jest Twój pomysł i jaki problem rozwiązuje?"
                placeholderTextColor="#A8A29E"
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Dla kogo jest ten pomysł?</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Mieszkańcy osiedla, rodziny z dziećmi..."
                placeholderTextColor="#A8A29E"
                value={targetAudience}
                onChangeText={setTargetAudience}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Szczegółowy opis</Text>
              <TextInput
                style={[styles.input, styles.multilineTall]}
                placeholder="Opisz jak ma działać prototyp, jakie kroki planujesz podjąć..."
                placeholderTextColor="#A8A29E"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>

          {/* Section: Benefits */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>3. Główne korzyści</Text>

            <View style={styles.benefitAddRow}>
              <TextInput
                style={[styles.input, styles.benefitInput]}
                placeholder="np. Brak opłat abonamentowych"
                placeholderTextColor="#A8A29E"
                value={benefit}
                onChangeText={setBenefit}
              />
              <Pressable
                style={styles.addBenefitButton}
                onPress={handleAddBenefit}
              >
                <Text style={styles.addBenefitButtonText}>Dodaj</Text>
              </Pressable>
            </View>

            <View style={styles.benefitsList}>
              {benefitsList.map((item, idx) => (
                <View key={idx} style={styles.benefitTag}>
                  <Text style={styles.benefitTagText}>✓ {item}</Text>
                  <Pressable
                    onPress={() => handleRemoveBenefit(idx)}
                    hitSlop={6}
                  >
                    <Text style={styles.benefitRemove}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Section: Visual Style */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>4. Styl wizualny karty</Text>

            <Text style={styles.label}>Kształt geometryczny</Text>
            <View style={styles.shapeGrid}>
              {SHAPES.map((shape) => {
                const active = selectedShape === shape.id;
                return (
                  <Pressable
                    key={shape.id}
                    style={[
                      styles.shapeOption,
                      active && styles.shapeOptionActive,
                    ]}
                    onPress={() => setSelectedShape(shape.id)}
                  >
                    <Text style={styles.shapeSymbol}>{shape.symbol}</Text>
                    <Text
                      style={[
                        styles.shapeLabel,
                        active && styles.shapeLabelActive,
                      ]}
                    >
                      {shape.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>
              Motyw kolorystyczny
            </Text>
            <View style={styles.colorRow}>
              {THEME_COLORS.map((tc) => {
                const active = selectedColor === tc.id;
                return (
                  <Pressable
                    key={tc.id}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: tc.color },
                      active && styles.colorCircleActive,
                    ]}
                    onPress={() => setSelectedColor(tc.id)}
                  />
                );
              })}
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>🚀 Opublikuj Inicjatywę</Text>
          </Pressable>
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
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#44403C",
  },
  input: {
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1C1917",
  },
  multiline: {
    minHeight: 65,
    textAlignVertical: "top",
  },
  multilineTall: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#F5F5F4",
  },
  pillActive: {
    backgroundColor: "#1C1917",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#57534E",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  benefitAddRow: {
    flexDirection: "row",
    gap: 8,
  },
  benefitInput: {
    flex: 1,
  },
  addBenefitButton: {
    backgroundColor: "#EFE5C6",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  addBenefitButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#44403C",
  },
  benefitsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  benefitTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  benefitTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },
  benefitRemove: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "700",
    marginLeft: 2,
  },
  shapeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shapeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F4",
    borderWidth: 1,
    borderColor: "transparent",
  },
  shapeOptionActive: {
    borderColor: "#1C1917",
    backgroundColor: "#FFFFFF",
  },
  shapeSymbol: {
    fontSize: 15,
  },
  shapeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#57534E",
  },
  shapeLabelActive: {
    color: "#1C1917",
    fontWeight: "700",
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorCircleActive: {
    borderColor: "#1C1917",
    transform: [{ scale: 1.15 }],
  },
  submitButton: {
    backgroundColor: "#1C1917",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
