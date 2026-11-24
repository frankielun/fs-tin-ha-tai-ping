import { StatusBar } from "expo-status-bar";
import { useRef, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BattlefieldScene } from "../scene/BattlefieldScene";
import { MatchCoordinator } from "./MatchCoordinator";
import { createDemoCoordinator, createReplayCommands, DEMO_COMMAND_COUNT } from "./replay";
import { t } from "./tokens";

function createCoordinator(debug: boolean): MatchCoordinator {
  if (debug) return createDemoCoordinator();
  const coordinator = new MatchCoordinator();
  coordinator.dispatch({ type: "startMatch", mode: "vsAi", difficulty: "easy", seed: Date.now() });
  return coordinator;
}

export function BattlefieldApp({ debug = false }: { debug?: boolean }) {
  const coordinatorRef = useRef<MatchCoordinator | null>(null);
  if (coordinatorRef.current === null) coordinatorRef.current = createCoordinator(debug);
  const coordinator = coordinatorRef.current;
  const snapshot = useSyncExternalStore(coordinator.subscribeToSnapshot, coordinator.getSnapshot);
  const replayCommands = useRef(createReplayCommands()).current;
  const [replayIndex, setReplayIndex] = useState(DEMO_COMMAND_COUNT);
  const [replayError, setReplayError] = useState<string | null>(null);

  const advanceReplay = () => {
    const command = replayCommands[replayIndex];
    if (command === undefined) return;
    coordinator.dispatch(command);
    if (coordinator.getLastError() !== null) {
      setReplayError("重演失敗，請重新啟動應用程式。");
      return;
    }
    setReplayError(null);
    setReplayIndex((current) => current + 1);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>天下太平</Text>
        <Text style={styles.subtitle}>第 {snapshot.round} 回合 · 紅方在下，藍方在上</Text>
      </View>
      <View style={styles.battlefield}>
        <BattlefieldScene snapshot={snapshot} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.caption}>所有棋子均由規則引擎快照驅動</Text>
        {debug ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="播放下一個引擎快照"
              disabled={replayIndex >= replayCommands.length}
              onPress={advanceReplay}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>
                {replayIndex >= replayCommands.length ? "重演完成" : "下一個快照：開火"}
              </Text>
            </Pressable>
            <Text style={styles.caption}>除錯重演 {Math.min(replayIndex + 1, replayCommands.length)} / {replayCommands.length}</Text>
            {replayError === null ? null : <Text style={styles.error}>{replayError}</Text>}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.color.sky },
  header: {
    position: "absolute",
    zIndex: 2,
    top: 48,
    left: t.space.s4,
    right: t.space.s4,
    alignItems: "center",
    padding: t.space.s3,
    borderRadius: t.radius.panel,
    backgroundColor: t.color.panel,
  },
  title: { color: t.color.text, fontSize: t.font.title, fontWeight: "800", letterSpacing: 5 },
  subtitle: { color: t.color.muted, fontSize: t.font.caption, marginTop: t.space.s2 },
  battlefield: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: t.space.s6,
    right: t.space.s6,
    alignItems: "center",
    padding: t.space.s3,
    borderRadius: t.radius.panel,
    backgroundColor: t.color.panel,
  },
  caption: { color: t.color.muted, fontSize: t.font.caption, marginTop: t.space.s2 },
  button: {
    minWidth: 220,
    alignItems: "center",
    paddingHorizontal: t.space.s4,
    paddingVertical: t.space.s3,
    borderRadius: t.radius.button,
    backgroundColor: t.color.accent,
  },
  buttonPressed: { opacity: 0.72 },
  buttonText: { color: t.color.sky, fontSize: t.font.button, fontWeight: "700" },
  error: { color: t.color.flag1, fontSize: t.font.caption, marginTop: t.space.s2 },
});
