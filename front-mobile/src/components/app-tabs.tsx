import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Odkrywaj</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="safari"
          md="explore"
          src={require("@/assets/images/tabIcons/discover.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="propose">
        <NativeTabs.Trigger.Label>Zaproponuj</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="plus.circle"
          md="add_circle"
          src={require("@/assets/images/tabIcons/propose.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="browse">
        <NativeTabs.Trigger.Label>Przeglądaj</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="square.grid.2x2"
          md="dashboard"
          src={require("@/assets/images/tabIcons/browse.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Czat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="bubble.left.and.bubble.right"
          md="chat"
          src={require("@/assets/images/tabIcons/chat.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle"
          md="person"
          src={require("@/assets/images/tabIcons/profile.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
