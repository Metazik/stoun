// Generates the demo audio files used by the mocked AudioEngine (see src/lib/audio-engine).
// These are real, listenable synthesized WAV files (not silence / not fake UI) so the
// "before / after" experience is credible during the MVP even though no real AI
// processing happens yet. Run with: node scripts/generate-demo-audio.mjs
import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const blockAlign = 2; // mono, 16-bit
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    // Soft-clip (tanh) instead of a hard clamp — hard clamping is what makes
    // synthesized audio sound harsh/"digital"; tanh rounds the peaks instead.
    const soft = Math.tanh(samples[i] * 1.15);
    buffer.writeInt16LE(Math.round(soft * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log("wrote", filePath, `${(buffer.length / 1024).toFixed(0)}kb`);
}

// One-pole lowpass — smooths out the harsh high-frequency edges of raw
// sine/square synthesis so it reads as "warm" rather than "digital".
function lowpass(buf, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const out = new Float32Array(buf.length);
  out[0] = buf[0];
  for (let i = 1; i < buf.length; i++) {
    out[i] = out[i - 1] + alpha * (buf[i] - out[i - 1]);
  }
  return out;
}

// Cheap short "room" ambience via a few feedback taps — turns a completely
// dry synth signal into something that sounds like it has space around it.
function addRoomEcho(buf, { delaySec = 0.09, feedback = 0.28, mix = 0.22, taps = 3 } = {}) {
  const out = Float32Array.from(buf);
  const delaySamples = Math.round(delaySec * SAMPLE_RATE);
  for (let tap = 1; tap <= taps; tap++) {
    const offset = delaySamples * tap;
    const gain = mix * Math.pow(feedback, tap - 1);
    for (let i = offset; i < out.length; i++) {
      out[i] += buf[i - offset] * gain;
    }
  }
  return out;
}

function polish(buf) {
  return addRoomEcho(lowpass(buf, 6500));
}

function seconds(n) {
  return Math.floor(n * SAMPLE_RATE);
}

// Simple ADSR envelope
function envelope(t, dur, a = 0.02, d = 0.05, s = 0.8, r = 0.15) {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  if (t < dur) return s * (1 - (t - (dur - r)) / r);
  return 0;
}

function noteFreq(semitoneFromA4) {
  return 440 * Math.pow(2, semitoneFromA4 / 12);
}

// A short "melody" of semitone offsets from A4, used as the vocal line.
const MELODY = [-4, -2, 0, -2, -4, -7, -4, 0, -2, -4, -7, -9, -7, -4, -2, 0];

function synthVocal(durationSec) {
  const n = seconds(durationSec);
  const out = new Float32Array(n);
  const noteLen = durationSec / MELODY.length;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noteIdx = Math.min(MELODY.length - 1, Math.floor(t / noteLen));
    const noteT = t - noteIdx * noteLen;
    const freq = noteFreq(MELODY[noteIdx]);
    const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * 0.004;
    // Longer attack/release than a hard on/off — reads as sung, not beeped.
    const env = envelope(noteT, noteLen, 0.04, 0.08, 0.7, 0.22);
    // breathy vocal-ish timbre: fundamental + a couple of gently detuned
    // harmonics (a hint of chorus) + very light noise, weighted toward the
    // fundamental so it doesn't buzz.
    const fundamental = Math.sin(2 * Math.PI * freq * (1 + vibrato) * t);
    const h2 = 0.22 * Math.sin(2 * Math.PI * freq * 2.003 * t);
    const h3 = 0.08 * Math.sin(2 * Math.PI * freq * 3.0 * t);
    const breath = (Math.random() * 2 - 1) * 0.015;
    out[i] = env * (fundamental + h2 + h3) * 0.55 + breath;
  }
  return out;
}

function addChord(out, semitones, startSec, durSec, gain = 0.15) {
  const start = seconds(startSec);
  const dur = seconds(durSec);
  for (let i = 0; i < dur && start + i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = envelope(t, durSec, 0.05, 0.1, 0.7, 0.3);
    let sample = 0;
    for (const semi of semitones) {
      sample += Math.sin(2 * Math.PI * noteFreq(semi - 12) * t);
    }
    out[start + i] += (sample / semitones.length) * env * gain;
  }
}

function addBass(out, semitone, startSec, durSec, gain = 0.2) {
  const start = seconds(startSec);
  const dur = seconds(durSec);
  const freq = noteFreq(semitone - 24);
  for (let i = 0; i < dur && start + i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = envelope(t, durSec, 0.01, 0.05, 0.8, 0.1);
    out[start + i] += Math.sin(2 * Math.PI * freq * t) * env * gain;
  }
}

function addKick(out, atSec, gain = 0.5) {
  const start = seconds(atSec);
  const dur = seconds(0.18);
  for (let i = 0; i < dur && start + i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 120 * Math.exp(-t * 25);
    const env = Math.exp(-t * 18);
    out[start + i] += Math.sin(2 * Math.PI * freq * t) * env * gain;
  }
}

function addHat(out, atSec, gain = 0.12) {
  const start = seconds(atSec);
  const dur = seconds(0.05);
  for (let i = 0; i < dur && start + i < out.length; i++) {
    const env = Math.exp(-(i / SAMPLE_RATE) * 60);
    out[start + i] += (Math.random() * 2 - 1) * env * gain;
  }
}

function mixInto(dest, src, gain = 1) {
  for (let i = 0; i < dest.length && i < src.length; i++) {
    dest[i] += src[i] * gain;
  }
}

function normalize(buf, peak = 0.92) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max === 0) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}

const DURATION = 16; // seconds, long enough to cut 5/10/15s clips from

// 1) ORIGINAL — dry vocal only, exactly what the "artist" recorded.
// Lowpass only (a phone/laptop mic rolls off highs) — no room echo, so the
// A/B contrast with the produced "Stoun version" tracks stays honest.
let original = lowpass(synthVocal(DURATION), 9000);
original = normalize(original, 0.85);
writeWav(
  path.join("public/audio/demo", "original-vocal.wav"),
  original
);

// 2) STOUN — "Piano / Soul": vocal + warm piano chords + soft bass, no drums.
{
  const out = new Float32Array(seconds(DURATION));
  mixInto(out, synthVocal(DURATION), 0.9);
  const chords = [
    [0, 3, 7],
    [-2, 2, 5],
    [-4, 0, 3],
    [-5, -1, 2],
  ];
  for (let bar = 0; bar < 4; bar++) {
    addChord(out, chords[bar % chords.length], bar * 4, 4, 0.18);
    addBass(out, chords[bar % chords.length][0], bar * 4, 4, 0.22);
  }
  const polished = polish(out);
  normalize(polished, 0.9);
  writeWav(path.join("public/audio/demo", "stoun-piano-soul.wav"), polished);
}

// 3) STOUN — "Afrobeat": vocal + rhythmic percussion + groove bass.
{
  const out = new Float32Array(seconds(DURATION));
  mixInto(out, synthVocal(DURATION), 0.85);
  const chords = [
    [0, 3, 7],
    [-3, 0, 4],
  ];
  for (let bar = 0; bar < 4; bar++) {
    addChord(out, chords[bar % chords.length], bar * 4, 4, 0.12);
    addBass(out, chords[bar % chords.length][0], bar * 4, 2, 0.2);
    addBass(out, chords[bar % chords.length][0] + 2, bar * 4 + 2, 2, 0.2);
  }
  for (let t = 0; t < DURATION; t += 0.5) {
    addKick(out, t, 0.45);
    addHat(out, t + 0.25, 0.15);
  }
  const polished = polish(out);
  normalize(polished, 0.92);
  writeWav(path.join("public/audio/demo", "stoun-afrobeat.wav"), polished);
}

// 4) STOUN — "Cinematic": vocal + swelling string-pad harmony.
{
  const out = new Float32Array(seconds(DURATION));
  mixInto(out, synthVocal(DURATION), 0.9);
  const chords = [
    [0, 3, 7, 10],
    [-5, -1, 2, 5],
    [-7, -3, 0, 4],
    [-2, 2, 5, 9],
  ];
  for (let bar = 0; bar < 4; bar++) {
    addChord(out, chords[bar % chords.length], bar * 4, 4, 0.2);
    addBass(out, chords[bar % chords.length][0], bar * 4, 4, 0.18);
  }
  const polished = polish(out);
  normalize(polished, 0.9);
  writeWav(path.join("public/audio/demo", "stoun-cinematic.wav"), polished);
}

// 5) Generic default "Stoun version" (used when no tag matches) — same as piano/soul mix
// but slightly brighter, so there is always a sensible fallback.
{
  const out = new Float32Array(seconds(DURATION));
  mixInto(out, synthVocal(DURATION), 0.9);
  const chords = [
    [0, 4, 7],
    [-5, -1, 2],
    [-3, 0, 4],
    [-7, -3, 0],
  ];
  for (let bar = 0; bar < 4; bar++) {
    addChord(out, chords[bar % chords.length], bar * 4, 4, 0.2);
    addBass(out, chords[bar % chords.length][0], bar * 4, 4, 0.22);
  }
  for (let t = 0.5; t < DURATION; t += 1) {
    addHat(out, t, 0.08);
  }
  const polished = polish(out);
  normalize(polished, 0.9);
  writeWav(path.join("public/audio/demo", "stoun-default.wav"), polished);
}

console.log("Done generating demo audio.");
