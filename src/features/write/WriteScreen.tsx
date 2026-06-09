import { Fragment, useEffect, useRef } from "react";
import { Night } from "../scene";
import { GlowButton } from "../../components/GlowButton";
import { audio } from "../../lib/audio";
import { pick } from "../../lib/pick";
import { QUICK, REASSURE } from "../../data/copy";
import { CONFIG } from "../../app/config";

const ccS = "'Satoshi', system-ui, -apple-system, sans-serif";
const ccSerif = "'Instrument Serif', Georgia, serif";

const shell: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  fontFamily: ccS,
  color: "var(--bone)",
};

interface WriteScreenProps {
  text: string;
  setText: (t: string) => void;
  onContinue: () => void;
}

// ════════════════════════════════════════════════════════════════
// BEAT 1 — WRITE
// ════════════════════════════════════════════════════════════════
export function WriteScreen({ text, setText, onContinue }: WriteScreenProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    audio.startWind();
  }, []);
  useEffect(() => {
    if (taRef.current && window.innerWidth > 560) taRef.current.focus();
  }, []);

  const reassure = text.trim().length > 10 ? pick(REASSURE, text) : null;
  const canGo = text.trim().length >= 3;
  const release = () => {
    audio.play("whoosh");
    onContinue();
  };
  const fill = (t: string) => {
    audio.play("tick");
    setText(t);
    taRef.current?.focus();
  };

  return (
    <div style={shell}>
      <Night
        moonX="50%"
        moonY={28}
        moonSize={84}
        fireflies={CONFIG.fireflies}
        fogDensity={CONFIG.fogDensity}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          zIndex: 4,
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            padding: "150px 30px 0",
            textAlign: "center",
          }}
        >
          <h1
            className="cc-rise"
            style={{
              fontFamily: ccSerif,
              fontWeight: 400,
              fontSize: 44,
              lineHeight: 1.04,
              letterSpacing: -0.5,
              margin: 0,
              color: "var(--bone)",
            }}
          >
            What are you
            <br />
            <span style={{ fontStyle: "italic" }}>still carrying?</span>
          </h1>
          <p
            className="cc-rise"
            style={{
              animationDelay: ".12s",
              fontFamily: ccS,
              fontSize: 15,
              lineHeight: 1.5,
              color: "var(--muted)",
              margin: "16px auto 0",
              maxWidth: 270,
            }}
          >
            Write the thing that keeps replaying. Then let it float away.
          </p>
        </div>

        {/* the input */}
        <div
          className="cc-rise"
          style={{
            animationDelay: ".22s",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "26px 26px 0",
            minHeight: 0,
          }}
        >
          <div style={{ position: "relative", flex: 1, minHeight: 150 }}>
            <textarea
              ref={taRef}
              value={text}
              maxLength={180}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key && e.key.length === 1) audio.play("ink");
              }}
              style={{
                width: "100%",
                height: "100%",
                minHeight: 150,
                resize: "none",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--line)",
                borderRadius: 20,
                padding: "20px 18px",
                color: "var(--bone)",
                fontFamily: ccSerif,
                fontSize: 25,
                lineHeight: 1.4,
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "inset 0 1px 24px rgba(0,0,0,0.16)",
              }}
            />
          </div>

          {/* quick taps OR the reassurance line */}
          <div style={{ minHeight: 58, marginTop: 14 }}>
            {!text ? (
              <Fragment>
                <div
                  style={{
                    fontFamily: ccS,
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    color: "var(--faint)",
                    marginBottom: 9,
                  }}
                >
                  Or tap one we’ve all done
                </div>
                <div
                  className="cc-noscroll"
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    padding: "0 26px 4px",
                    margin: "0 -26px",
                  }}
                >
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => fill(q)}
                      style={{
                        flex: "0 0 auto",
                        fontFamily: ccSerif,
                        fontStyle: "italic",
                        fontSize: 16,
                        padding: "10px 15px",
                        borderRadius: 14,
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--bone-dim)",
                        border: "1px solid var(--line)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </Fragment>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  opacity: reassure ? 1 : 0,
                  transition: "opacity .5s",
                  paddingTop: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    flex: "0 0 auto",
                    boxShadow: "0 0 8px var(--glow-soft)",
                  }}
                />
                <span
                  style={{
                    fontFamily: ccS,
                    fontSize: 13.5,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {reassure || ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: "0 0 auto", padding: "16px 24px 40px" }}>
          <GlowButton glow disabled={!canGo} onClick={release}>
            Let it go
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
