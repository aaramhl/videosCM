"""Synthesise the 25 s soft, steady score for the Virtual Microscope showcase.

Procedural (no samples), 120 BPM so every scene boundary (3, 7, 13, 18, 22 s)
lands on a beat. A calm four-chord loop with a gentle arpeggio and pulse; soft
chimes mark on-screen events (logo, slide loaded, zoom stops, markers,
captions) and the piece resolves under the end card.

Usage: python3 scripts/make_music_microscope.py public/music-microscope.wav
"""

import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 25.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def place(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf):
        return
    seg = sig[: len(buf) - i]
    buf[i : i + len(seg)] += gain * seg


L = np.zeros(N)
R = np.zeros(N)

# Cmaj9 | Am9 | Fmaj9 | G6(sus) — two seconds each, looping; home on Cmaj9 at 22 s.
LOOP = [
    [48, 55, 59, 62, 64],
    [45, 52, 55, 59, 60],
    [41, 48, 55, 57, 64],
    [43, 50, 55, 60, 64],
]
CHORDS = [(float(s), LOOP[(s // 2) % 4]) for s in range(0, 22, 2)] + [(22.0, [36, 48, 55, 59, 62, 64])]


def chord_at(time):
    cur = CHORDS[0][1]
    for s, notes in CHORDS:
        if time >= s:
            cur = notes
    return cur


# ---------------------------------------------------------------- pad
pad_level = curve([(0, 0.0), (0.6, 0.6), (3, 0.7), (7, 0.8), (18, 0.85), (22, 0.8), (25, 0.6)])
brightness = curve([(0, 2.3), (7, 2.0), (13, 1.8), (18, 1.8), (22, 2.0), (25, 2.3)])
for ci, (start, notes) in enumerate(CHORDS):
    end = CHORDS[ci + 1][0] if ci + 1 < len(CHORDS) else DUR
    tail = 3.0 if ci == len(CHORDS) - 1 else 0.6
    n = int((end - start + tail) * SR)
    tt = np.arange(n) / SR
    att = np.minimum(1, tt / 0.45)
    rel_start = end - start
    rel = np.where(tt > rel_start, np.exp(-(tt - rel_start) * 5 / tail), 1.0)
    e = att * rel
    i0 = int(start * SR)
    b = brightness[i0 : i0 + n]
    b = np.pad(b, (0, n - len(b)), mode="edge")
    for m in notes:
        for side, det in ((0, -5), (1, 5)):
            f = hz(m) * 2 ** (det / 1200)
            sig = np.zeros(n)
            for h in range(1, 8):
                if f * h > 8000:
                    break
                sig += np.sin(2 * np.pi * f * h * tt + rng.uniform(0, 6.28)) / h**b
            place(L if side == 0 else R, start, sig * e / len(notes), 0.17)
L *= pad_level
R *= pad_level


# ---------------------------------------------------------------- arpeggio (from 0:03)
def pluck(freq, dur=0.9, decay=5.5, bright=0.3):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    e = np.exp(-tt * decay) * np.minimum(1, tt / 0.004)
    s = np.sin(2 * np.pi * freq * tt) + bright * np.sin(2 * np.pi * 2 * freq * tt) * np.exp(-tt * 9)
    return s * e


arp_level = curve([(3, 0.035), (7, 0.05), (13, 0.055), (18, 0.055), (21.9, 0.05), (22, 0)])
pattern = [0, 2, 1, 3, 2, 4, 3, 1]
k = 0
tm = 3.0
while tm < 21.99:
    upper = sorted(m for m in chord_at(tm) if m >= 50)
    m = upper[pattern[k % 8] % len(upper)] + 12
    g = arp_level[int(tm * SR)] * (1.1 if k % 4 == 0 else 0.85)
    s = pluck(hz(m), 0.8, 6.0, 0.28)
    pan = 0.38 if k % 2 == 0 else 0.62
    place(L, tm, s, 2 * g * (1 - pan))
    place(R, tm, s, 2 * g * pan)
    tm += 0.25
    k += 1

# ---------------------------------------------------------------- bass pulse + soft kick (from 0:07)
bass_level = curve([(3, 0.0), (4, 0.09), (7, 0.12), (21.9, 0.12), (22, 0)])
for beat in np.arange(3.0, 22.0, 0.5):
    root = min(chord_at(beat)) % 12 + 36
    n = int(0.48 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(root) * tt) * np.exp(-tt * 3.2) * np.minimum(1, tt / 0.01)
    g = bass_level[int(beat * SR)]
    place(L, beat, s, g)
    place(R, beat, s, g)

kick_level = curve([(7, 0.0), (8, 0.14), (21.9, 0.16), (22, 0)])
for beat in np.arange(7.0, 22.0, 1.0):
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    f = 55 + 60 * np.exp(-tt * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 13)
    g = kick_level[int(beat * SR)]
    place(L, beat, s, g)
    place(R, beat, s, g)

hat_sos = butter(4, 7500, "highpass", fs=SR, output="sos")
hat_level = curve([(7, 0.0), (8, 0.02), (21.9, 0.022), (22, 0)])
for i, tm in enumerate(np.arange(7.5, 22.0, 1.0)):
    n = int(0.05 * SR)
    s = sosfilt(hat_sos, rng.standard_normal(n)) * np.exp(-np.arange(n) / SR * 80)
    g = hat_level[int(tm * SR)]
    place(L, tm, s, g * 0.8)
    place(R, tm, s, g * 1.2)

# final low C
n = int(3 * SR)
tt = np.arange(n) / SR
place(L, 22.0, np.sin(2 * np.pi * hz(36) * tt) * np.exp(-tt * 1.1) * np.minimum(1, tt / 0.02), 0.18)
place(R, 22.0, np.sin(2 * np.pi * hz(36) * tt) * np.exp(-tt * 1.1) * np.minimum(1, tt / 0.02), 0.18)


# ---------------------------------------------------------------- event chimes
def chime(start, midi, gain):
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, a, d in [(1, 1, 1.8), (2.76, 0.35, 3.2), (5.4, 0.15, 5.5)]:
        s += a * np.sin(2 * np.pi * hz(midi) * ratio * tt) * np.exp(-tt * d)
    s *= np.minimum(1, tt / 0.003)
    place(L, start, s, gain)
    place(R, start + 0.012, s, gain)


chime(0.2, 84, 0.04)  # logo
chime(6.2, 79, 0.03)  # slide loaded
chime(8.57, 83, 0.03)  # 10x
chime(12.37, 86, 0.03)  # 40x
chime(13.33, 88, 0.035)  # islet marker
chime(14.67, 91, 0.035)  # acini marker
for i, tm in enumerate((18.27, 19.47, 20.67)):  # captions 1-3
    chime(tm, [76, 79, 83][i], 0.028)
chime(22.1, 88, 0.045)  # end card

# ---------------------------------------------------------------- reverb + master
ir_n = int(2.8 * SR)
ir_t = np.arange(ir_n) / SR
lp = butter(1, 5000, "lowpass", fs=SR, output="sos")
irL = sosfilt(lp, rng.standard_normal(ir_n)) * np.exp(-ir_t * 2.4)
irR = sosfilt(lp, rng.standard_normal(ir_n)) * np.exp(-ir_t * 2.4)
irL /= np.sqrt(np.sum(irL**2))
irR /= np.sqrt(np.sum(irR**2))
wet = 0.3
L2 = (1 - wet) * L + wet * fftconvolve(L, irL)[:N]
R2 = (1 - wet) * R + wet * fftconvolve(R, irR)[:N]

hp = butter(2, 30, "highpass", fs=SR, output="sos")
mix = np.stack([sosfilt(hp, L2), sosfilt(hp, R2)], axis=1)
mix *= curve([(0, 0), (0.1, 1), (24.1, 1), (25.0, 0)])[:, None]
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else "public/music-microscope.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print(f"wrote {out}: {DUR}s, RMS {20 * np.log10(np.sqrt(np.mean(mix**2))):.1f} dBFS")
