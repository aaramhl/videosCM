import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, easeInOut, fonts, lerp, radius, tween } from "../shared/theme";
import { camera, LENS_R, STOP_CHANGES, stopFor, toLens } from "./camera";
import { ORGAN_EXTENT, ORGAN_PATH, TARGET_ACINUS, TARGET_ISLET } from "./pancreas";
import { SlideView } from "./SlideView";

// Global layout (px, 1080×1920 frame). All frame numbers are global.
export const CARD = { x: 50, y: 300, w: 980, h: 1180 };
export const LENS = { cx: 540, cy: 870 };

const T_CARD = 92;
const T_LOAD = 124;
const T_LOADED = 186;
const T_MARK1 = 400;
const T_MARK2 = 440;

const pill = (active = false): React.CSSProperties => ({
  borderRadius: radius.pill,
  border: `1.5px solid ${active ? colors.turquoiseGlow : colors.cardBorder}`,
  background: active ? "rgba(13,125,136,0.35)" : "rgba(10,26,42,0.85)",
});

const ToolButton: React.FC<{ d: string; active: number }> = ({ d, active }) => (
  <div
    style={{
      width: 64,
      height: 64,
      borderRadius: 16,
      border: `1.5px solid ${active > 0.5 ? colors.turquoiseGlow : colors.cardBorder}`,
      background: `rgba(13,125,136,${0.08 + active * 0.35})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${1 - active * 0.06})`,
    }}
  >
    <svg width={30} height={30} viewBox="0 0 30 30">
      <path d={d} fill="none" stroke={colors.turquoiseSoft} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const Marker: React.FC<{
  start: number;
  wx: number;
  wy: number;
  wr: number;
  pinAngle: number;
  label: { x: number; y: number; w: number; ar: string; en: string };
}> = ({ start, wx, wy, wr, pinAngle, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = frame - start;
  if (l < 0) return null;
  const p = toLens(frame, wx, wy);
  const s = camera(frame).s;
  const cx = LENS.cx + p.x;
  const cy = LENS.cy + p.y;
  const r = wr * s;
  const ring = tween(l, [0, 16], [0, 1], easeInOut);
  const pin = spring({ frame: l - 6, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const lead = tween(l, [10, 22], [0, 1], easeInOut);
  const card = tween(l, [16, 28], [0, 1]);
  const pulse = (l % 45) / 45;

  const px = cx + Math.cos(pinAngle) * r;
  const py = cy + Math.sin(pinAngle) * r;
  // leader attaches to the side of the label card facing the pin
  const lx = px < label.x ? label.x : label.x + label.w;
  const ly = label.y + 60;

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="rgba(13,125,136,0.10)"
          stroke={colors.turquoiseGlow}
          strokeWidth={3.5}
          strokeDasharray="1"
          pathLength={1}
          strokeDashoffset={1 - ring}
          transform={`rotate(${(pinAngle * 180) / Math.PI} ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 6px ${colors.turquoiseGlow})` }}
        />
        <circle cx={cx} cy={cy} r={r + 26 * pulse} fill="none" stroke={colors.turquoiseGlow} strokeWidth={2} opacity={ring * 0.5 * (1 - pulse)} />
        <line x1={px} y1={py} x2={lerp(px, lx, lead)} y2={lerp(py, ly, lead)} stroke={colors.turquoiseGlow} strokeWidth={2.5} />
        <circle cx={px} cy={py} r={14 * pin} fill={colors.turquoise600} stroke={colors.turquoiseSoft} strokeWidth={3} />
        <circle cx={px} cy={py} r={5 * pin} fill="#fff" />
      </svg>
      <div
        dir="rtl"
        style={{
          position: "absolute",
          left: label.x,
          top: label.y,
          width: label.w,
          padding: "16px 26px 18px",
          boxSizing: "border-box",
          borderRadius: 18,
          background: "rgba(10,26,42,0.9)",
          border: `1.5px solid ${colors.turquoiseGlow}`,
          boxShadow: `0 12px 30px rgba(3,10,20,0.45)`,
          opacity: card,
          transform: `translateY(${(1 - card) * 14}px)`,
        }}
      >
        <div style={{ fontFamily: fonts.arabic, fontWeight: 700, fontSize: 40, color: colors.text, lineHeight: 1.35 }}>{label.ar}</div>
        <div dir="ltr" style={{ fontFamily: fonts.latin, fontWeight: 500, fontSize: 27, color: colors.turquoiseSoft, textAlign: "right" }}>
          {label.en}
        </div>
      </div>
    </>
  );
};

/** Virtual Microscope viewer card, in global frame coordinates. */
export const Viewer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = camera(frame);
  const stop = stopFor(cam.mag);

  const cardIn = tween(frame, [T_CARD, T_CARD + 30], [0, 1]);
  const ringDraw = tween(frame, [T_CARD + 18, T_CARD + 42], [0, 1], easeInOut);
  const progress = tween(frame, [T_LOAD, T_LOADED - 12], [0, 1], easeInOut);
  const progressFade = tween(frame, [T_LOADED - 12, T_LOADED], [1, 0]);
  const loadingText = tween(frame, [T_LOAD - 6, T_LOAD + 4], [0, 1]) * tween(frame, [T_LOAD + 22, T_LOAD + 30], [1, 0]);
  const chrome = tween(frame, [T_LOADED - 20, T_LOADED], [0, 1]);

  // badge pops when the stop changes
  const lastChange = STOP_CHANGES.filter((f) => f <= frame).pop();
  const pop = lastChange === undefined ? 1 : spring({ frame: frame - lastChange, fps, config: { damping: 10, stiffness: 220, mass: 0.5 } });

  // zoom-in button lights up while the camera is zooming in
  const zoomRate = Math.log(camera(frame + 1).mag / camera(frame - 1).mag);
  const zoomActive = Math.min(1, Math.max(0, (zoomRate - 0.004) * 60));

  // magnification track (right-to-left: 4x at the right)
  const trackP = (Math.log(cam.mag) - Math.log(4)) / (Math.log(40) - Math.log(4));
  const TRACK = { right: 830, left: 170, y: 1400 };
  const trackX = (p: number) => lerp(TRACK.right, TRACK.left, p);

  const scaleUm = stop === 4 ? 500 : stop === 10 ? 200 : 50;

  // "drag" touch point during the pan at 10x
  const dragOpacity = tween(frame, [252, 262], [0, 1]) * tween(frame, [314, 324], [1, 0]);
  const c0 = camera(262);
  const drag = { x: 760 - (cam.x - c0.x) * cam.s, y: 690 - (cam.y - c0.y) * cam.s };

  const tiles = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const d = Math.hypot(i - (N - 1) / 2, j - (N - 1) / 2) / 5;
      const jitter = ((i * 7 + j * 13) % 5) / 5;
      const t0 = T_LOAD + 14 + d * 30 + jitter * 8;
      const o = tween(frame, [t0, t0 + 10], [1, 0]);
      if (o > 0)
        tiles.push(
          <div
            key={`${i}-${j}`}
            style={{
              position: "absolute",
              left: (j * LENS_R * 2) / N,
              top: (i * LENS_R * 2) / N,
              width: (LENS_R * 2) / N + 1,
              height: (LENS_R * 2) / N + 1,
              background: "#0B1C2D",
              opacity: o,
            }}
          />,
        );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, opacity: cardIn, transform: `translateX(${(1 - cardIn) * 140}px)` }}>
      {/* card */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 30,
          background: "rgba(11,52,116,0.30)",
          border: `1.5px solid ${colors.cardBorder}`,
          boxShadow: "0 30px 80px rgba(3,10,20,0.45)",
        }}
      />
      {/* top bar */}
      <div
        dir="rtl"
        style={{
          position: "absolute",
          left: CARD.x + 40,
          top: CARD.y + 30,
          width: CARD.w - 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.arabic, fontWeight: 700, fontSize: 40, color: colors.text, lineHeight: 1.3 }}>المجهر الافتراضي</div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", color: colors.textMuted }}>
            <span style={{ fontFamily: fonts.arabic, fontSize: 28, fontWeight: 500 }}>شريحة البنكرياس</span>
            <span style={{ fontFamily: fonts.latin, fontSize: 24, fontWeight: 500 }}>· H&amp;E</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, direction: "ltr", opacity: chrome }}>
          <ToolButton d="M8 15 H22" active={0} />
          <ToolButton d="M8 15 H22 M15 8 V22" active={zoomActive} />
          <ToolButton d="M6 11 V6 H11 M19 6 H24 V11 M24 19 V24 H19 M11 24 H6 V19" active={0} />
        </div>
      </div>

      {/* lens field */}
      <div
        style={{
          position: "absolute",
          left: LENS.cx - LENS_R,
          top: LENS.cy - LENS_R,
          width: LENS_R * 2,
          height: LENS_R * 2,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#0B1C2D",
        }}
      >
        {frame >= T_LOAD && <SlideView />}
        {tiles}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(circle, transparent 62%, rgba(15,36,56,0.22) 88%, rgba(15,36,56,0.6) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: loadingText,
          }}
        >
          <div dir="rtl" style={{ fontFamily: fonts.arabic, fontSize: 34, fontWeight: 600, color: colors.text }}>
            جارٍ تحميل الشريحة
          </div>
          <div style={{ fontFamily: fonts.latin, fontSize: 24, color: colors.textMuted }}>Loading slide</div>
        </div>
      </div>

      {/* lens ring + loading progress */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle
          cx={LENS.cx}
          cy={LENS.cy}
          r={LENS_R}
          fill="none"
          stroke={colors.turquoiseGlow}
          strokeWidth={4}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ringDraw}
          transform={`rotate(-90 ${LENS.cx} ${LENS.cy})`}
        />
        <circle
          cx={LENS.cx}
          cy={LENS.cy}
          r={LENS_R + 14}
          fill="none"
          stroke={colors.turquoiseSoft}
          strokeWidth={5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          opacity={progressFade * tween(frame, [T_LOAD, T_LOAD + 4], [0, 1])}
          transform={`rotate(-90 ${LENS.cx} ${LENS.cy})`}
        />
        <circle cx={LENS.cx} cy={LENS.cy} r={LENS_R + 14} fill="none" stroke={colors.turquoise600} strokeWidth={1.2} strokeDasharray="2 12" opacity={0.8 * chrome} />
      </svg>

      {/* magnification badge */}
      <div
        style={{
          position: "absolute",
          right: 1080 - (CARD.x + CARD.w) + 30,
          top: LENS.cy - LENS_R + 6,
          padding: "10px 28px",
          ...pill(true),
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: chrome,
          transform: `scale(${0.85 + 0.15 * pop})`,
          transformOrigin: "right center",
          boxShadow: `0 0 ${18 * (1 - pop) + 8}px ${colors.turquoiseGlow}66`,
        }}
      >
        <svg width={28} height={28} viewBox="0 0 28 28">
          <circle cx={12} cy={12} r={8} fill="none" stroke={colors.turquoiseSoft} strokeWidth={2.6} />
          <path d="M18 18 L24 24" stroke={colors.turquoiseSoft} strokeWidth={2.6} strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: fonts.latin, fontWeight: 700, fontSize: 38, color: colors.text, minWidth: 72, textAlign: "center" }}>{stop}x</span>
      </div>

      {/* minimap */}
      <div
        style={{
          position: "absolute",
          left: CARD.x + 20,
          top: LENS.cy + LENS_R - 150,
          width: 150,
          height: 150,
          borderRadius: 18,
          border: `1.5px solid ${colors.cardBorder}`,
          background: "rgba(10,26,42,0.9)",
          opacity: chrome,
          overflow: "hidden",
        }}
      >
        <svg width={150} height={150} viewBox={`${-ORGAN_EXTENT} ${-ORGAN_EXTENT} ${ORGAN_EXTENT * 2} ${ORGAN_EXTENT * 2}`}>
          <path d={ORGAN_PATH} fill="#C99AB8" opacity={0.75} transform="scale(0.9)" />
          <circle
            cx={cam.x * 0.9}
            cy={cam.y * 0.9}
            r={Math.max((LENS_R / cam.s) * 0.9, 90)}
            fill="rgba(63,194,204,0.18)"
            stroke={colors.turquoiseGlow}
            strokeWidth={70}
          />
        </svg>
      </div>

      {/* scale bar */}
      <div
        style={{
          position: "absolute",
          right: 1080 - (CARD.x + CARD.w) + 34,
          top: LENS.cy + LENS_R - 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          opacity: chrome,
        }}
      >
        <span style={{ fontFamily: fonts.latin, fontSize: 24, fontWeight: 500, color: colors.textMuted }}>{scaleUm} µm</span>
        <div style={{ width: scaleUm * cam.s, height: 5, borderRadius: 3, background: colors.turquoiseGlow }} />
      </div>

      {/* magnification track */}
      <div style={{ position: "absolute", inset: 0, opacity: chrome }}>
        <div
          dir="rtl"
          style={{
            position: "absolute",
            right: 1080 - (CARD.x + CARD.w) + 40,
            top: TRACK.y - 26,
            fontFamily: fonts.arabic,
            fontSize: 30,
            fontWeight: 600,
            color: colors.textMuted,
          }}
        >
          التكبير
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={TRACK.left} y1={TRACK.y} x2={TRACK.right} y2={TRACK.y} stroke={colors.cardBorder} strokeWidth={4} strokeLinecap="round" />
          <line x1={trackX(trackP)} y1={TRACK.y} x2={TRACK.right} y2={TRACK.y} stroke={colors.turquoiseGlow} strokeWidth={4} strokeLinecap="round" />
          {[4, 10, 40].map((m) => {
            const x = trackX((Math.log(m) - Math.log(4)) / (Math.log(40) - Math.log(4)));
            const on = cam.mag >= m * 0.95;
            return (
              <g key={m}>
                <circle cx={x} cy={TRACK.y} r={8} fill={on ? colors.turquoiseGlow : colors.navy900} stroke={on ? colors.turquoiseGlow : colors.cardBorder} strokeWidth={2} />
                <text x={x} y={TRACK.y + 52} textAnchor="middle" fontFamily={fonts.latin} fontSize={26} fontWeight={stop === m ? 700 : 500} fill={stop === m ? colors.text : colors.textMuted}>
                  {m}x
                </text>
              </g>
            );
          })}
          <circle cx={trackX(trackP)} cy={TRACK.y} r={16} fill={colors.turquoise600} stroke={colors.turquoiseSoft} strokeWidth={3} />
        </svg>
      </div>

      {/* drag touch point (free navigation) */}
      {dragOpacity > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: dragOpacity }}>
          <circle cx={drag.x} cy={drag.y} r={34} fill="rgba(255,255,255,0.16)" stroke="#fff" strokeWidth={3} />
          <circle cx={drag.x} cy={drag.y} r={8} fill="#fff" />
        </svg>
      )}

      {/* educational markers */}
      <Marker
        start={T_MARK1}
        wx={TARGET_ISLET.x}
        wy={TARGET_ISLET.y}
        wr={TARGET_ISLET.r + 18}
        pinAngle={Math.PI * 1.08}
        label={{ x: CARD.x + 30, y: 470, w: 420, ar: "جزر لانغرهانس", en: "Islets of Langerhans" }}
      />
      <Marker
        start={T_MARK2}
        wx={TARGET_ACINUS.x}
        wy={TARGET_ACINUS.y}
        wr={88}
        pinAngle={Math.PI * 0.05}
        label={{ x: 590, y: 1068, w: 420, ar: "العنيبات البنكرياسية", en: "Pancreatic acini" }}
      />
    </div>
  );
};
