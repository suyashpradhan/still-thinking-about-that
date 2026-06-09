import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ReleaseScreen } from "../features/release/ReleaseScreen";
import { MuteToggle } from "../components/MuteToggle";
import { Wordmark } from "../components/Wordmark";
import { audio } from "../lib/audio";
import { CONFIG } from "./config";
import type { View } from "../types";
import { WriteScreen } from "../features/write/WriteScreen";

// ════════════════════════════════════════════════════════════════
// APP — the two beats: Write, then Release.
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState<View>("write");
  const [text, setText] = useState("");
  // Bumped on each release so the ritual screen fully remounts per run.
  const [runId, setRunId] = useState(0);

  const release = () => setView("release");
  const restart = () => {
    audio.play("pop");
    setText("");
    setRunId((n) => n + 1);
    setView("write");
  };

  return (
    <div
      className="cc-stage"
      data-palette={CONFIG.palette}
      style={{ position: "relative" }}
    >
      <div className="cc-webbg">
        <div className="halo" />
        <div className="vign" />
      </div>
      <Wordmark />
      <MuteToggle />
      <div className="cc-frame">
        <div className="cc-portal">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${runId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ position: "absolute", inset: 0 }}
            >
              {view === "write" ? (
                <WriteScreen
                  text={text}
                  setText={setText}
                  onContinue={release}
                />
              ) : (
                <ReleaseScreen
                  text={text}
                  style={CONFIG.releaseStyle}
                  onRestart={restart}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
