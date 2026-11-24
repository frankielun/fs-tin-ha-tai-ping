import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Action, PublicGameSnapshot } from "../engine/index";
import { projectActionMenu } from "./action-menu";
import { t } from "./tokens";

export function ActionMenu({ snapshot, onChoose }: {
  snapshot: PublicGameSnapshot;
  onChoose: (action: Action) => void;
}) {
  const menu = projectActionMenu(snapshot);

  return (
    <View testID="action-menu" style={styles.root}>
      <Text style={styles.title}>你贏咗呢鋪！揀一項行動</Text>
      <View style={styles.actions}>
        {menu.items.map(({ action, label }) => (
          <Pressable
            key={action}
            testID={`action-${action}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => onChoose(action)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{label}</Text>
          </Pressable>
        ))}
        {menu.showFireHint ? (
          <Pressable
            testID="fire-hint"
            accessibilityRole="button"
            accessibilityLabel="開火功能即將登場"
            accessibilityState={{ disabled: true }}
            disabled
            style={[styles.button, styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>開火功能即將登場</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "stretch", alignItems: "center" },
  title: {
    color: t.color.accent,
    fontSize: t.font.outcome,
    fontWeight: "800",
    marginBottom: t.space.s3,
    textAlign: "center",
  },
  actions: { alignSelf: "stretch", gap: t.space.s2 },
  button: {
    minHeight: t.size.actionButton,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.space.s4,
    paddingVertical: t.space.s2,
    borderRadius: t.radius.button,
    backgroundColor: t.color.accent,
  },
  buttonPressed: { opacity: t.opacity.pressed },
  buttonDisabled: { opacity: t.opacity.disabled },
  buttonText: { color: t.color.sky, fontSize: t.font.button, fontWeight: "800" },
});
