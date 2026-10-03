import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { CURRENT_USER, UserRole } from "@/constants/mock-data";
import { Spacing } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState(CURRENT_USER);
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleRoleChange = (newRole: UserRole) => {
    setUser({ ...user, role: newRole });
    Alert.alert(
      "Zmieniono rolę",
      `Twoja rola to teraz: ${newRole.toUpperCase()}`,
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mój Profil & Pulpit</Text>
          <Text style={styles.headerSubtitle}>
            Zarządzaj swoimi pomysłami, rolą i ustawieniami dostępności
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.userTop}>
              <View style={[styles.avatar, { backgroundColor: user.avatarBg }]}>
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    Rola:{" "}
                    {user.role === "admin"
                      ? "Administrator"
                      : user.role === "creator"
                        ? "Twórca"
                        : "Tester"}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.userBio}>{user.bio}</Text>

            {/* Role Switcher */}
            <View style={styles.roleSwitchSection}>
              <Text style={styles.subHeading}>Zmień aktywną rolę w Hubmi:</Text>
              <View style={styles.roleButtonsRow}>
                {(["creator", "tester", "admin"] as UserRole[]).map((r) => {
                  const active = user.role === r;
                  return (
                    <Pressable
                      key={r}
                      style={[styles.roleBtn, active && styles.roleBtnActive]}
                      onPress={() => handleRoleChange(r)}
                    >
                      <Text
                        style={[
                          styles.roleBtnText,
                          active && styles.roleBtnTextActive,
                        ]}
                      >
                        {r === "creator"
                          ? "💡 Twórca"
                          : r === "tester"
                            ? "🧪 Tester"
                            : "🛡️ Admin"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Zgłoszony pomysł</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Udział w testach</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>14</Text>
              <Text style={styles.statLabel}>Oddanych głosów</Text>
            </View>
          </View>

          {/* Accessibility & Settings */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>⚙️ Dostępność i Preferencje</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>
                  Powiększona czcionka (A+)
                </Text>
                <Text style={styles.settingDesc}>
                  Wygodniejszy odczyt dla osób słabowidzących i seniorów
                </Text>
              </View>
              <Switch
                value={isLargeFont}
                onValueChange={setIsLargeFont}
                trackColor={{ false: "#E7E5E4", true: "#1C1917" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.settingRow,
                {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: "#F5F5F4",
                },
              ]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Powiadomienia o testach</Text>
                <Text style={styles.settingDesc}>
                  Otrzymuj alerty, gdy autor zaprosi Cię do testów prototypu
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E7E5E4", true: "#1C1917" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Quick shortcuts */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🚀 Szybkie akcje</Text>

            <Pressable
              style={styles.actionRow}
              onPress={() => router.push("/propose")}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <View style={styles.actionTextWrapper}>
                <Text style={styles.actionTitle}>Zgłoś nowy pomysł</Text>
                <Text style={styles.actionSubtitle}>
                  Stwórz prototyp inicjatywy
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </Pressable>

            <Pressable
              style={styles.actionRow}
              onPress={() => router.push("/browse")}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <View style={styles.actionTextWrapper}>
                <Text style={styles.actionTitle}>
                  Przeglądaj wszystkie inicjatywy
                </Text>
                <Text style={styles.actionSubtitle}>
                  Głosuj i zgłaszaj się do testów
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </Pressable>

            <Pressable
              style={styles.actionRow}
              onPress={() => router.push("/chat")}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <View style={styles.actionTextWrapper}>
                <Text style={styles.actionTitle}>Twoje rozmowy</Text>
                <Text style={styles.actionSubtitle}>
                  Korespondencja z twórcami i testerami
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </Pressable>
          </View>

          {/* Sign Out Simulation */}
          <Pressable
            style={styles.signOutButton}
            onPress={() =>
              Alert.alert(
                "Wyloguj",
                "Czy na pewno chcesz się wylogować z Hubmi?",
                [
                  { text: "Anuluj", style: "cancel" },
                  { text: "Wyloguj", style: "destructive" },
                ],
              )
            }
          >
            <Text style={styles.signOutButtonText}>Wyloguj się z konta</Text>
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
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 12,
  },
  userTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1C1917",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1917",
  },
  userEmail: {
    fontSize: 13,
    color: "#78716C",
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EFE5C6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#44403C",
  },
  userBio: {
    fontSize: 13,
    lineHeight: 18,
    color: "#57534E",
  },
  roleSwitchSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F5F5F4",
    paddingTop: 10,
    gap: 8,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78716C",
    textTransform: "uppercase",
  },
  roleButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F5F5F4",
  },
  roleBtnActive: {
    backgroundColor: "#1C1917",
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#57534E",
  },
  roleBtnTextActive: {
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1917",
  },
  statLabel: {
    fontSize: 10,
    color: "#78716C",
    textAlign: "center",
    marginTop: 2,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1917",
  },
  settingDesc: {
    fontSize: 12,
    color: "#78716C",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F5F5F4",
    gap: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#78716C",
  },
  chevron: {
    fontSize: 16,
    color: "#A8A29E",
    fontWeight: "700",
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    marginTop: 4,
  },
  signOutButtonText: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "700",
  },
});
