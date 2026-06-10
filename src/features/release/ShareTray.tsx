import { motion } from "framer-motion";
import { GlowButton } from "../../components/GlowButton";
import type { ShareAspect } from "../../types";

const ccS = "'Satoshi', system-ui, -apple-system, sans-serif";

interface ShareTrayProps {
  busy: string | null;
  wink: string;
  onSave: (aspect: ShareAspect) => void;
  onShare: (aspect: ShareAspect) => void;
  canShare: boolean;
  onRestart: () => void;
}

export function ShareTray({ busy, wink, onRestart }: ShareTrayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.2, 0.7, 0.3, 1] }}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 8,
        padding: "60px 22px calc(30px + env(safe-area-inset-bottom))",
        background:
          "linear-gradient(to top, rgba(8,12,28,.82) 30%, rgba(8,12,28,.45) 70%, transparent)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontFamily: ccS,
          fontSize: 13.5,
          color: "var(--muted)",
          marginBottom: 14,
          minHeight: 18,
        }}
      >
        {busy || wink}
      </div>
      <GlowButton variant="ghost" onClick={onRestart}>
        Let go of another
      </GlowButton>
    </motion.div>
  );
}
