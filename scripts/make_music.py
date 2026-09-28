"""Synthesise the 15 s neutral score for the CanonMedicinae teaser.

Everything is generated procedurally (no samples), so the track is royalty-free.
120 BPM, one bar = 2 s. The arrangement tracks the picture:
  0-2   logo       soft pad + chime as the lines converge
  2-5   chaos      scattered, slightly detuned plucks
  5-8   the path   plucks lock into a steady arpeggio, pulse enters
  8-12  the lens   fuller pad, gentle kick + ticks, builds to a peak
  12-15 outro      resolves on Cmaj9 and settles into the reverb tail

Usage: python3 scripts/make_music.py public/music.wav   (needs numpy, scipy)
"""

import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 15.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, r, sustain_len):
    """Linear attack, flat sustain, exponential-ish release (lengths in seconds)."""
    out = np.zeros(n)
    ia, isus, ir = int(a * SR), int(sustain_len * SR), int(r * SR)
    ia = max(ia, 1)
    out[:ia] = np.linspace(0, 1, ia)[: n]
    end_s = min(n, ia + isus)
    out[ia:end_s] = 1
    rel = np.exp(-np.linspace(0, 5, ir))
    seg = out[end_s : end_s + ir]
    out[end_s : end_s + ir] = rel[: len(seg)]
    return out


def place(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf):
        return
    seg = sig[: len(buf) - i]
    buf[i : i + len(seg)] += gain * seg


def curve(points):
    """Piecewise-linear automation curve over the whole timeline."""
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


L = np.zeros(N)
R = np.zeros(N)

# ---------------------------------------------------------------- chords
CHORDS = [
    (0.0, [48, 55, 59, 62, 64]),  # Cmaj9
    (2.0, [45, 52, 55, 60, 62]),  # Am7(add11)
    (4.0, [38, 45, 53, 57, 64]),  # Dm9
    (6.0, [41, 48, 52, 57, 60]),  # Fmaj7
    (8.0, [41, 48, 55, 57, 64]),  # Fmaj9
    (10.0, [43, 50, 55, 60, 62]),  # Gsus4
    (11.0, [43, 50, 55, 59, 62]),  # G
    (12.0, [36, 48, 55, 59, 62, 64]),  # Cmaj9 — home
]

brightness = curve([(0, 2.4), (5, 2.1), (8, 1.7), (11.6, 1.35), (13, 1.9), (15, 2.3)])
pad_level = curve([(0, 0.0), (0.4, 0.55), (2, 0.6), (5, 0.7), (8, 0.85), (11.8, 1.0), (13, 0.8), (15, 0.6)])

for ci, (start, notes) in enumerate(CHORDS):
    end = CHORDS[ci + 1][0] if ci + 1 < len(CHORDS) else DUR
    length = end - start
    tail = 2.6 if ci == len(CHORDS) - 1 else 0.5
    n = int((length + tail) * SR)
    tt = np.arange(n) / SR
    e = env_adsr(n, 0.35, tail, max(length - 0.35, 0))
    i0 = int(start * SR)
    b = brightness[i0 : i0 + n]
    if len(b) < n:
        b = np.pad(b, (0, n - len(b)), mode="edge")
    for k, m in enumerate(notes):
        f0 = hz(m)
        for side, det in ((0, -5), (1, 5)):
            f = f0 * 2 ** (det / 1200)
            sig = np.zeros(n)
            for h in range(1, 9):
                if f * h > 9000:
                    break
                sig += np.sin(2 * np.pi * f * h * tt + rng.uniform(0, 6.28)) / h**b
            sig *= e * (0.9 if m < 45 else 1.0) / len(notes)
            place(L if side == 0 else R, start, sig, 0.18)

L *= pad_level
R *= pad_level


# ---------------------------------------------------------------- plucks
def pluck(freq, dur=0.9, decay=5.5, bright=0.35):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    e = np.exp(-tt * decay) * np.minimum(1, tt / 0.004)
    s = np.sin(2 * np.pi * freq * tt) + bright * np.sin(2 * np.pi * 2 * freq * tt) * np.exp(-tt * 9)
    s += 0.12 * np.sin(2 * np.pi * 3 * freq * tt) * np.exp(-tt * 14)
    return s * e


def chord_at(time):
    cur = CHORDS[0][1]
    for s, notes in CHORDS:
        if time >= s:
            cur = notes
    return cur


# chaos: scattered, slightly out-of-tune plucks
for i in range(16):
    tm = rng.uniform(2.05, 4.9)
    notes = chord_at(tm)
    m = notes[rng.integers(1, len(notes))] + 12 * rng.integers(0, 2)
    f = hz(m) * 2 ** (rng.uniform(-28, 28) / 1200)
    pan = rng.uniform(0.15, 0.85)
    g = 0.05 * rng.uniform(0.6, 1.0)
    s = pluck(f, 0.7, 6.5, 0.2)
    place(L, tm, s, g * (1 - pan))
    place(R, tm, s, g * pan)

# order: steady eighth-note arpeggio from 0:05, crescendo to 0:12
arp_level = curve([(5, 0.045), (8, 0.06), (11.9, 0.085), (12.0, 0.0)])
pattern = [0, 2, 1, 3, 2, 4, 3, 2]
step = 0.25
k = 0
tm = 5.0
while tm < 11.99:
    notes = sorted(chord_at(tm))
    upper = [m for m in notes if m >= 50] or notes
    m = upper[pattern[k % 8] % len(upper)] + 12
    g = arp_level[int(tm * SR)] * (1.15 if k % 4 == 0 else 0.9)
    s = pluck(hz(m), 0.8, 6.0, 0.3)
    pan = 0.35 if k % 2 == 0 else 0.65
    place(L, tm, s, g * (1 - pan) * 2)
    place(R, tm, s, g * pan * 2)
    tm += step
    k += 1

# outro: a slow resolving motif on the home chord
for tm, m, g in [(12.0, 76, 0.07), (12.5, 79, 0.055), (13.0, 83, 0.05), (13.5, 86, 0.045)]:
    s = pluck(hz(m), 2.5, 2.0, 0.15)
    place(L, tm, s, g)
    place(R, tm, s, g)

# ---------------------------------------------------------------- bass pulse
bass_level = curve([(4, 0.0), (5, 0.10), (8, 0.13), (11.9, 0.17), (12.0, 0.15), (15, 0.0)])
for beat in np.arange(5.0, 12.0, 0.5):
    root = min(chord_at(beat)) % 12 + 36
    n = int(0.48 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(root) * tt) * np.exp(-tt * 3.2) * np.minimum(1, tt / 0.01)
    g = bass_level[int(beat * SR)]
    place(L, beat, s, g)
    place(R, beat, s, g)
# final low C
n = int(3 * SR)
tt = np.arange(n) / SR
s = np.sin(2 * np.pi * hz(36) * tt) * np.exp(-tt * 1.1) * np.minimum(1, tt / 0.02)
place(L, 12.0, s, 0.2)
place(R, 12.0, s, 0.2)

# ---------------------------------------------------------------- soft percussion
kick_level = curve([(6, 0.0), (8, 0.18), (11.9, 0.3), (12, 0)])
for beat in np.arange(6.0, 12.0, 0.5):
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    f = 55 + 70 * np.exp(-tt * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 13)
    g = kick_level[int(beat * SR)] * (1.0 if int(beat * 2) % 2 == 0 else 0.55)
    place(L, beat, s, g)
    place(R, beat, s, g)

hat_sos = butter(4, 7000, "highpass", fs=SR, output="sos")
hat_level = curve([(8, 0.0), (9, 0.02), (11.9, 0.04), (12, 0)])
for i, tm in enumerate(np.arange(8.0, 12.0, 0.25)):
    n = int(0.06 * SR)
    s = sosfilt(hat_sos, rng.standard_normal(n)) * np.exp(-np.arange(n) / SR * 70)
    g = hat_level[int(tm * SR)] * (1.0 if i % 2 else 0.6)
    pan = 0.3 if i % 2 else 0.7
    place(L, tm, s, g * (1 - pan) * 2)
    place(R, tm, s, g * pan * 2)


# ---------------------------------------------------------------- swells + accents
def swell(start, end, lo, hi, gain):
    n = int((end - start) * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    bands = np.geomspace(lo, hi, 6)
    for bi in range(len(bands) - 1):
        sos = butter(2, [bands[bi], bands[bi + 1]], "bandpass", fs=SR, output="sos")
        x = np.linspace(0, 1, n)
        center = (bi + 0.5) / (len(bands) - 1)
        w = np.clip(1 - np.abs(x - center) * 2.2, 0, 1)
        out += sosfilt(sos, noise) * w
    out *= np.linspace(0, 1, n) ** 2
    place(L, start, out, gain)
    place(R, start + 0.01, out, gain)


swell(6.6, 8.0, 300, 6000, 0.05)  # into the lens
swell(10.6, 12.0, 300, 8000, 0.06)  # into the logo


def chime(start, base, gain):
    n = int(3 * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, a, d in [(1, 1, 1.6), (2.76, 0.4, 3), (5.4, 0.2, 5), (8.93, 0.1, 7)]:
        s += a * np.sin(2 * np.pi * base * ratio * tt) * np.exp(-tt * d)
    s *= np.minimum(1, tt / 0.003)
    place(L, start, s, gain)
    place(R, start + 0.012, s, gain)


def impact(start, gain):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    f = 40 + 30 * np.exp(-tt * 8)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.005)
    place(L, start, s, gain)
    place(R, start, s, gain)


chime(0.95, hz(88), 0.05)  # lines meet → logo
chime(5.0, hz(84), 0.035)  # icons snap onto the path
impact(8.0, 0.22)
chime(8.0, hz(91), 0.03)
impact(12.0, 0.26)
chime(12.05, hz(88), 0.05)

# ---------------------------------------------------------------- reverb + master
ir_n = int(2.8 * SR)
ir_t = np.arange(ir_n) / SR
lp = butter(1, 5000, "lowpass", fs=SR, output="sos")
irL = sosfilt(lp, rng.standard_normal(ir_n)) * np.exp(-ir_t * 2.4)
irR = sosfilt(lp, rng.standard_normal(ir_n)) * np.exp(-ir_t * 2.4)
irL /= np.sqrt(np.sum(irL**2))
irR /= np.sqrt(np.sum(irR**2))
wet = 0.32
L2 = (1 - wet) * L + wet * fftconvolve(L, irL)[:N]
R2 = (1 - wet) * R + wet * fftconvolve(R, irR)[:N]

hp = butter(2, 30, "highpass", fs=SR, output="sos")
mix = np.stack([sosfilt(hp, L2), sosfilt(hp, R2)], axis=1)

# gentle master fade-in / fade-out
fade = curve([(0, 0), (0.08, 1), (14.1, 1), (15.0, 0)])
mix *= fade[:, None]

# soft clip then normalise to -1 dBFS
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else "public/music.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
rms = 20 * np.log10(np.sqrt(np.mean(mix**2)))
print(f"wrote {out}: {DUR}s, peak -1 dBFS, RMS {rms:.1f} dBFS")
