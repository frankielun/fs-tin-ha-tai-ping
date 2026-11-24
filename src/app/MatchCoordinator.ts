import {
  GameEngine,
  type Command,
  type EngineError,
  type EngineEvent,
  type PublicGameSnapshot,
} from "../engine/index";

export type Unsubscribe = () => void;
type SnapshotListener = (snapshot: PublicGameSnapshot) => void;
type EventListener = (event: EngineEvent) => void;

/** The sole command dispatcher. Durable state and one-shot events stay separate. */
export class MatchCoordinator {
  private readonly engine: GameEngine;
  private snapshot: PublicGameSnapshot;
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private readonly eventListeners = new Set<EventListener>();
  private lastError: EngineError | null = null;

  public constructor(engine = new GameEngine()) {
    this.engine = engine;
    this.snapshot = engine.getSnapshot();
  }

  public readonly getSnapshot = (): PublicGameSnapshot => this.snapshot;

  public readonly subscribeToSnapshot = (listener: SnapshotListener): Unsubscribe => {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  };

  public readonly subscribeToEvents = (listener: EventListener): Unsubscribe => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  public dispatch(command: Command): PublicGameSnapshot {
    const result = this.engine.dispatch(command);
    this.lastError = result.error ?? null;
    if (result.error !== undefined) return this.snapshot;

    this.snapshot = result.snapshot;
    for (const listener of this.snapshotListeners) listener(this.snapshot);
    for (const event of result.events) {
      for (const listener of this.eventListeners) listener(event);
    }
    return this.snapshot;
  }

  public getLastError(): EngineError | null {
    return this.lastError;
  }
}
