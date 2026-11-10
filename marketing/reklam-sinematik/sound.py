"""Cinematic score + SFX for the Pirpir motion ad (24.8 s)."""
import wave
import numpy as np
from numpy.fft import rfft, irfft

SR = 48000; DUR = 24.8; N = int(SR * DUR)
rng = np.random.default_rng(3)
dry = np.zeros((N, 2)); wet_send = np.zeros((N, 2))

def put(sig, t, g=1.0, pan=0.0, rev=0.25):
    i = int(t * SR); n = min(len(sig), N - i)
    if n <= 0 or i < 0: return
    lr = np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)]) * 1.414
    s = sig[:n, None] * lr[None] * g
    dry[i:i + n] += s; wet_send[i:i + n] += s * rev

def env(n, a=0.005, r=0.3):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na) ** 2
    return e * np.exp(-np.arange(n) / SR / r)

def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440 * 2 ** ((m - 69) / 12)

def lp(x, fc):  # one-pole lowpass
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def whoosh(d, f0=200, f1=3000, rise=True):
    n = int(d * SR); x = rng.standard_normal(n)
    X = rfft(x); fr = np.fft.rfftfreq(n, 1 / SR)
    c = np.sqrt(f0 * f1); X *= np.exp(-((np.log(fr + 1) - np.log(c)) ** 2) / 1.2)
    y = irfft(X, n); y /= np.abs(y).max() + 1e-9
    sh = np.sin(np.linspace(0, np.pi, n)) ** (1.2 if rise else 2.5)
    if rise: sh *= np.linspace(0.3, 1, n) ** 2
    return y * sh

def boom(d=2.5):
    t = tt(d); f = 32 + 70 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    n = rng.standard_normal(len(t)) * np.exp(-t * 18) * 0.5
    return s + lp(n, 900) * 3

def hit_bright(d=1.6):
    t = tt(d); s = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in [523, 784, 1046, 1568, 2093]) / 5
    return s * env(len(t), 0.002, 0.5) + rng.standard_normal(len(t)) * np.exp(-t * 40) * 0.3

def bell(f, d=2.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 3) + .2 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 6)) * env(len(t), .002, .8)

def click(f=3000, d=0.03):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * .6 + rng.standard_normal(len(t)) * .4) * np.exp(-t * 180)

def pad(notes, d, bright=0.3):
    t = tt(d); s = np.zeros(len(t))
    for m in notes:
        for det in (-0.08, 0.0, 0.08):
            f = midi(m) * 2 ** (det / 12)
            s += np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * 2 * f * t) * 0.5
    s /= len(notes) * 3
    e = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8); return s * e

def pluck(f, d=0.6):
    t = tt(d)
    return sum(np.sin(2 * np.pi * f * h * t) / h ** 1.5 * np.exp(-t * (4 + 3 * h)) for h in range(1, 6)) * env(len(t), .002, .35)

def sub(f, d=0.5):
    t = tt(d); return np.sin(2 * np.pi * f * t) * env(len(t), .01, .18)

# ---------- score
BPM = 96; B = 60 / BPM
prog = [([57, 60, 64], 45), ([53, 57, 60], 41), ([48, 52, 55], 36), ([55, 59, 62], 43)]  # Am F C G
# intro drone
put(pad([45, 52, 57], 3.8, .1), 0.0, 0.18, 0, .5)
put(whoosh(1.35, 300, 5000, True), 0.0, 0.25, 0, .4)
t = 3.5; bar = 0
while t < 21.4:
    notes, root = prog[bar % 4]
    put(pad([n for n in notes], 4 * B + .4, .35), t, .14, 0, .6)
    for b in range(4):
        tb = t + b * B
        if tb > 21.5: break
        put(sub(midi(root - 12), B * .9), tb, .55 if b % 2 == 0 else .35, 0, 0)
    if t > 7.3:  # arp
        for k in range(8):
            tk = t + k * B / 2
            if tk > 21.5: break
            put(pluck(midi(notes[k % 3] + 12 + (12 if k in (3, 7) else 0))), tk, .08, -.5 + (k % 4) * .33, .5)
    if t > 12.6:  # hats
        for k in range(8):
            tk = t + k * B / 2 + B / 4
            if tk > 21.4: break
            h = rng.standard_normal(int(.05 * SR)); put(np.diff(np.r_[0, h]) * env(len(h), .001, .015), tk, .05, .3, .1)
    t += 4 * B; bar += 1
# build into ending
put(whoosh(2.2, 150, 6000, True), 19.6, .22, 0, .5)
t = tt(2.0); put(np.sin(2 * np.pi * np.cumsum(np.geomspace(200, 1200, len(t))) / SR) * np.linspace(0, 1, len(t)) ** 2 * .3, 19.8, .25, 0, .6)
# final bloom (C major, lifted)
put(pad([48, 55, 60, 64, 67, 72], 3.0, .5), 21.9, .30, 0, .8)
for k, m in enumerate([72, 76, 79, 84]): put(bell(midi(m), 2.6), 22.0 + k * .07, .10, -.3 + .2 * k, .7)

# ---------- SFX
for k in range(5): put(whoosh(.6, 800, 6000, True), .15 + k * .2, .07, -.6 + .3 * k, .3)
put(boom(), 1.33, .9, 0, .4); put(hit_bright(), 1.33, .35, 0, .8)
put(whoosh(1.0, 3000, 9000, False), 2.2, .08, .2, .6)                      # logo shine
put(whoosh(.9, 120, 1800, True), 3.5, .28, 0, .3)                           # phone rises
for k in range(8): put(click(2400 + rng.uniform(-300, 300), .025), 4.7 + k * .11, .22, .1, .1)  # typing
put(click(1600, .05), 6.18, .45, 0, .2); put(sub(80, .3), 6.18, .4, 0, 0)    # Bilet bul
for k in range(5): put(whoosh(.55, 500, 4000, True), 7.35 + k * .07, .13, -.6 + .3 * k, .3)  # cards out
put(bell(midi(88), 1.2), 8.65, .07, .2, .6)                                  # focus
put(whoosh(.7, 2000, 300, False), 9.9, .16, 0, .4)                           # to detail
put(whoosh(.8, 2500, 9000, False), 10.7, .05, .3, .5)                        # button shine
put(click(1200, .06), 11.36, .5, 0, .2); put(sub(70, .35), 11.36, .5, 0, 0)  # Bilet al
for k, m in enumerate([76, 81, 88]): put(bell(midi(m), 1.4), 11.7 + k * .08, .12, -.2 + .2 * k, .6)  # success
put(whoosh(1.0, 200, 2500, True), 12.5, .22, 0, .4)                          # to map
t = tt(2.4); f = np.geomspace(300, 900, len(t))                              # arc glide
put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(t))) * .2, 13.4, .3, 0, .7)
put(whoosh(2.3, 300, 3000, True), 13.5, .16, -.4, .4)                         # flyby
put(bell(midi(91), 1.6), 15.8, .14, .4, .7); put(bell(midi(96), 1.2), 15.86, .06, .4, .7)
put(whoosh(.9, 150, 2000, True), 16.2, .28, 0, .3)                           # pass swing
put(boom(1.2), 17.05, .35, 0, .3)
put(hit_bright(1.0), 18.7, .14, 0, .8); put(sub(55, .6), 18.7, .4, 0, 0)
put(hit_bright(1.0), 19.95, .16, 0, .8); put(sub(55, .6), 19.95, .4, 0, 0)
put(whoosh(.45, 600, 5000, True), 20.25, .14, 0, .3)                         # swoosh underline
put(whoosh(1.2, 300, 3500, True), 20.9, .2, -.5, .4)                         # Pırpır flies in
put(boom(3.0), 21.9, .8, 0, .5); put(hit_bright(2.0), 21.9, .3, 0, 1.0)
put(whoosh(1.2, 3000, 10000, False), 22.3, .06, 0, .7)

# ---------- reverb (convolution with decaying noise)
ir_t = tt(2.2); ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 3.0)[:, None]
ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
L = N + len(ir_t); nfft = 1 << (L - 1).bit_length()
wet = np.stack([irfft(rfft(wet_send[:, c], nfft) * rfft(ir[:, c], nfft), nfft)[:N] for c in range(2)], 1)
mix = dry + wet / np.abs(wet).max() * np.abs(dry).max() * .35
tm = np.arange(N) / SR
mix *= np.clip((DUR - tm) / 0.7, 0, 1)[:, None]
mix = np.tanh(mix / np.abs(mix).max() * 1.4) / np.tanh(1.4) * 0.92
with wave.open('score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
