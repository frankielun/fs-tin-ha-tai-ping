import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Action, RpsChoice } from "../engine/index";
import { BattlefieldScene } from "../scene/BattlefieldScene";
import { ActionMenu } from "./ActionMenu";
import { RPS_LABELS } from "../scene/rps";
import type { RpsResolvedEvent } from "../scene/RpsHands";
import { MatchCoordinator } from "./MatchCoordinator";
import { createDemoCoordinator, createReplayCommands, DEMO_COMMAND_COUNT } from "./replay";
import { t } from "./tokens";
import { VsAiMatchController } from "./VsAiMatchController";

const RPS_BUTTONS: readonly RpsChoice[] = ["paper", "scissors", "rock"];

function createMatch(debug: boolean): MatchCoordinator | VsAiMatchController {
  if (debug) return createDemoCoordinator();
  return new VsAiMatchController({ seed: Date.now() });
}

function outcomeText(event: RpsResolvedEvent): string {
  switch (event.winner) {
    case "player1":
      return "紅方勝出呢鋪！";
    case "player2":
      return "藍方勝出呢鋪！";
    case "draw":
      return "打和，再嚟過";
  }
}

export function BattlefieldApp({ debug = false }: { debug?: boolean }) {
  const matchRef = useRef<MatchCoordinator | VsAiMatchController | null>(null);
  if (matchRef.current === null) matchRef.current = createMatch(debug);
  const match = matchRef.current;
  const coordinator = match instanceof VsAiMatchController ? match.coordinator : match;
  const snapshot = useSyncExternalStore(coordinator.subscribeToSnapshot, coordinator.getSnapshot);
  const replayCommands = useRef(createReplayCommands()).current;
  const [replayIndex, setReplayIndex] = useState(DEMO_COMMAND_COUNT);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [rpsEvent, setRpsEvent] = useState<RpsResolvedEvent | null>(null);
  const [outcomeReady, setOutcomeReady] = useState(false);
  const [rpsError, setRpsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => coordinator.subscribeToEvents((event) => {
    if (event.type === "rpsResolved") {
      setOutcomeReady(false);
      setRpsEvent(event);
    }
  }), [coordinator]);

  useEffect(() => {
    if (rpsEvent === null) return;
    const revealTimer = setTimeout(() => setOutcomeReady(true), 850);
    const clearTimer = setTimeout(() => setRpsEvent(null), 2200);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(clearTimer);
    };
  }, [rpsEvent]);

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

  const submitRps = (choice: RpsChoice) => {
    if (!(match instanceof VsAiMatchController)) return;
    match.submitPlayerRps(choice);
    setRpsError(coordinator.getLastError() === null ? null : "呢鋪未能出招，請再試一次。");
  };

  const chooseAction = (action: Action) => {
    coordinator.dispatch({ type: "chooseAction", action });
    setActionError(coordinator.getLastError() === null ? null : "行動未能完成，請再試一次。");
  };

  const canChooseRps = !debug && rpsEvent === null && snapshot.status === "rps";
  const showActionMenu =
    !debug &&
    rpsEvent === null &&
    (snapshot.status === "action" || snapshot.status === "fire") &&
    snapshot.turnPlayer === "player1";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>天下太平</Text>
        <Text style={styles.subtitle}>第 {snapshot.round} 回合 · 紅方在下，藍方在上</Text>
      </View>
      <View style={styles.battlefield}>
        <BattlefieldScene snapshot={snapshot} rpsEvent={rpsEvent} />
      </View>
      <View style={styles.footer}>
        {debug ? (
          <>
            <Text style={styles.caption}>所有棋子均由規則引擎快照驅動</Text>
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
        ) : showActionMenu ? (
          <>
            <ActionMenu snapshot={snapshot} onChoose={chooseAction} />
            {actionError === null ? null : <Text style={styles.error}>{actionError}</Text>}
          </>
        ) : (
          <>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.caption, rpsEvent !== null && outcomeReady && styles.outcome]}
            >
              {rpsEvent !== null
                ? outcomeReady ? outcomeText(rpsEvent) : "雙方出手！"
                : snapshot.status === "over"
                  ? "對局完結"
                  : "揀一招，贏咗就可以行動"}
            </Text>
            <View style={styles.rpsButtons}>
              {RPS_BUTTONS.map((choice) => (
                <Pressable
                  key={choice}
                  testID={`rps-${choice}`}
                  accessibilityRole="button"
                  accessibilityLabel={`出${RPS_LABELS[choice]}`}
                  accessibilityState={{ disabled: !canChooseRps }}
                  disabled={!canChooseRps}
                  onPress={() => submitRps(choice)}
                  style={({ pressed }) => [
                    styles.rpsButton,
                    !canChooseRps && styles.rpsButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.rpsButtonText}>{RPS_LABELS[choice]}</Text>
                </Pressable>
              ))}
            </View>
            {rpsError === null ? null : <Text style={styles.error}>{rpsError}</Text>}
          </>
        )}
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
  caption: { color: t.color.muted, fontSize: t.font.body, marginBottom: t.space.s3, textAlign: "center" },
  outcome: { color: t.color.accent, fontSize: t.font.outcome, fontWeight: "800" },
  button: {
    minWidth: 220,
    alignItems: "center",
    paddingHorizontal: t.space.s4,
    paddingVertical: t.space.s3,
    borderRadius: t.radius.button,
    backgroundColor: t.color.accent,
  },
  buttonPressed: { opacity: t.opacity.pressed },
  buttonText: { color: t.color.sky, fontSize: t.font.button, fontWeight: "700" },
  rpsButtons: { flexDirection: "row", gap: t.space.s3, alignSelf: "stretch" },
  rpsButton: {
    flex: 1,
    minHeight: t.size.rpsButton,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radius.button,
    backgroundColor: t.color.accent,
  },
  rpsButtonDisabled: { opacity: t.opacity.disabled },
  rpsButtonText: { color: t.color.sky, fontSize: t.font.rps, fontWeight: "800" },
  error: { color: t.color.flag1, fontSize: t.font.caption, marginTop: t.space.s2 },
});
