workspace "tin-ha-tai-ping" "C4 architecture for the Tin Ha Tai Ping mobile MVP" {
  model {
    player = person "Player" "A player using the phone, either against the AI or in pass-and-play mode."
    mobileOS = softwareSystem "Mobile OS" "iOS or Android services for lifecycle, local storage, audio output, and the graphics device."
    game = softwareSystem "Tin Ha Tai Ping Mobile" "A portrait, offline 3D remake of the Hong Kong classroom game." {
      app = container "Mobile app shell and match coordinator" "Owns navigation, input routing, phase presentation, event fan-out, and app lifecycle." "TypeScript / React Native / Expo"
      engine = container "Headless rules engine" "Owns the match state machine, command validation, rules, damage cascade, repair, and domain events." "TypeScript, pure module" {
        matchAggregate = component "Match aggregate and state machine" "Owns phase transitions and the canonical match snapshot." "TypeScript"
        legality = component "Legality and action catalogue" "Derives legal actions, legal targets, build caps, and phase gates." "TypeScript"
        rps = component "RPS resolver" "Resolves submitted throws without exposing a pending pass-and-play choice." "TypeScript"
        build = component "Build and repair rules" "Applies character, flag, shield, weapon, and repair rules." "TypeScript"
        fireResolver = component "Fire and damage resolver" "Validates a shot, applies 0/1/2 damage, and cascades overflow." "TypeScript"
        events = component "Domain event collector" "Emits ordered facts after each accepted command." "TypeScript"
        projection = component "Snapshot and public projection" "Returns immutable snapshots with pending private choices redacted." "TypeScript"
      }
      ai = container "AI policy" "Chooses fair RPS throws and legal actions for Easy and Standard difficulty." "TypeScript, seeded policy module"
      fire = container "Fire minigame controller" "Runs the crosshair interaction and maps aim against versioned tuning data to miss, hit, or center-hit." "TypeScript / React Native"
      renderer = container "3D renderer" "Renders the battlefield and consumes snapshots and events for projectile, shatter, camera, and hand animations." "React Native + react-three-fiber + Three.js + Expo GL"
      audio = container "Audio and effects adapter" "Subscribes to domain events and plays the small MVP SFX set." "Expo-compatible audio/effects adapter"
      store = container "Local match save store" "Stores a versioned, resumable match snapshot and settings. No server synchronization." "AsyncStorage-compatible local store" {
        tags "Database"
      }
    }

    player -> game "Plays offline matches"
    game -> mobileOS "Uses lifecycle, local storage, audio, and graphics APIs"

    app -> engine "Dispatches player commands and receives snapshots/events"
    app -> ai "Requests a policy decision from the current public game view"
    ai -> engine "Reads legal actions and submits commands through the coordinator"
    app -> fire "Starts a fire interaction from the legal action catalogue"
    fire -> engine "Submits a validated fire result as a command"
    app -> renderer "Provides snapshots and ordered domain events"
    app -> audio "Provides ordered domain events"
    app -> store "Loads and persists versioned snapshots"
    renderer -> mobileOS "Uses the device GPU through Expo GL"
    audio -> mobileOS "Uses device audio output and mute state"

    matchAggregate -> legality "Asks for legal transitions"
    matchAggregate -> rps "Resolves submitted throws"
    matchAggregate -> build "Applies build and repair transitions"
    matchAggregate -> fireResolver "Applies fire and damage transitions"
    matchAggregate -> events "Records accepted domain facts"
    matchAggregate -> projection "Projects immutable public state"
    legality -> build "Checks build and repair legality"
    legality -> fireResolver "Checks weapon and target legality"
    events -> projection "Publishes the committed sequence and snapshot"
  }

  views {
    systemContext game "context" {
      include player
      include game
      include mobileOS
      autolayout lr
    }

    container game "containers" {
      include player
      include app
      include engine
      include ai
      include fire
      include renderer
      include audio
      include store
      include mobileOS
      autolayout lr
    }

    component engine "engine-components" {
      include app
      include matchAggregate
      include legality
      include rps
      include build
      include fireResolver
      include events
      include projection
      autolayout lr
    }

    styles {
      element "Person" {
        background #084c61
        color #ffffff
        shape person
      }
      element "Software System" {
        background #176b87
        color #ffffff
      }
      element "Container" {
        background #2589a8
        color #ffffff
      }
      element "Component" {
        background #62b6cb
        color #102a43
      }
      element "Database" {
        background #6c584c
        color #ffffff
        shape cylinder
      }
    }
  }
}
