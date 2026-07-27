/**
 * Danny Hirsch Arts — procedural gallery lounge
 *
 * Original, code-generated ambience. No samples, recordings, melodies, or
 * third-party material are used. Creating a player is silent; `start()` must
 * be called from an explicit visitor interaction so browser autoplay rules
 * and the visitor's choice are respected.
 */
(function exposeGalleryLounge(global) {
  "use strict";

  const API_NAME = "DHAGalleryLounge";
  const DEFAULT_LEVEL = 0.22;
  const CHORD_STEP = 8;
  const CHORD_LENGTH = 10.2;
  const SCHEDULE_AHEAD = 18;
  const SCHEDULER_INTERVAL = 1200;

  // An original, deliberately non-melodic 64-second harmonic cycle.
  // D minor colours keep the layer quiet, warm, and gallery-like.
  const PROGRESSION = Object.freeze([
    Object.freeze({ notes: [50, 57, 60, 64, 65], bass: 38, glint: 69 }), // Dm9
    Object.freeze({ notes: [46, 53, 57, 60, 62], bass: 34, glint: 65 }), // Bbmaj9
    Object.freeze({ notes: [45, 52, 55, 57, 60], bass: 33, glint: 64 }), // Fmaj9/A
    Object.freeze({ notes: [48, 55, 57, 62, 64], bass: 36, glint: 67 }), // C6/9
    Object.freeze({ notes: [43, 50, 53, 57, 58], bass: 31, glint: 62 }), // Gm9
    Object.freeze({ notes: [46, 53, 57, 60, 64], bass: 34, glint: 69 }), // Bbmaj9(#11)
    Object.freeze({ notes: [45, 52, 55, 58, 62], bass: 33, glint: 67 }), // A7sus(b9)
    Object.freeze({ notes: [50, 57, 60, 64, 65], bass: 38, glint: 72 })  // Dm9
  ]);

  const midiToFrequency = (note) => 440 * (2 ** ((note - 69) / 12));
  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

  const safeDisconnect = (node) => {
    try { node?.disconnect?.(); } catch (error) { /* Already disconnected. */ }
  };

  const safeStop = (node, when) => {
    try { node?.stop?.(when); } catch (error) { /* Already stopped. */ }
  };

  function createVoice(context, bus, note, startTime, stopTime, peak, pan, timbre = "pad") {
    const voiceGain = context.createGain();
    const panner = typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : context.createGain();
    const fundamental = context.createOscillator();
    const colour = context.createOscillator();
    const colourGain = context.createGain();
    const frequency = midiToFrequency(note);
    const fadeIn = timbre === "bass" ? 1.25 : 2.1;
    const fadeOut = timbre === "bass" ? 1.8 : 2.6;

    fundamental.type = "sine";
    fundamental.frequency.setValueAtTime(frequency, startTime);
    fundamental.detune.setValueAtTime(timbre === "bass" ? -1.5 : -3.5, startTime);

    colour.type = timbre === "bass" ? "sine" : "triangle";
    colour.frequency.setValueAtTime(frequency * (timbre === "bass" ? 2 : 1), startTime);
    colour.detune.setValueAtTime(timbre === "bass" ? 1.5 : 4.5, startTime);
    colourGain.gain.setValueAtTime(timbre === "bass" ? 0.07 : 0.10, startTime);

    voiceGain.gain.setValueAtTime(0.0001, startTime);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), startTime + fadeIn);
    voiceGain.gain.setValueAtTime(Math.max(peak, 0.0002), Math.max(startTime + fadeIn, stopTime - fadeOut));
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    if ("pan" in panner) panner.pan.setValueAtTime(clamp(pan, -0.75, 0.75), startTime);

    fundamental.connect(voiceGain);
    colour.connect(colourGain).connect(voiceGain);
    voiceGain.connect(panner).connect(bus);
    fundamental.start(startTime);
    colour.start(startTime);
    fundamental.stop(stopTime + 0.08);
    colour.stop(stopTime + 0.08);

    return [fundamental, colour, colourGain, voiceGain, panner];
  }

  function createGlint(context, bus, note, startTime, pan) {
    const panner = typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : context.createGain();
    const gain = context.createGain();
    const tone = context.createOscillator();
    const overtone = context.createOscillator();
    const overtoneGain = context.createGain();
    const stopTime = startTime + 4.8;
    const frequency = midiToFrequency(note);

    tone.type = "sine";
    tone.frequency.setValueAtTime(frequency, startTime);
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * 2.01, startTime);
    overtoneGain.gain.setValueAtTime(0.09, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.014, startTime + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
    if ("pan" in panner) panner.pan.setValueAtTime(clamp(pan, -0.7, 0.7), startTime);

    tone.connect(gain);
    overtone.connect(overtoneGain).connect(gain);
    gain.connect(panner).connect(bus);
    tone.start(startTime);
    overtone.start(startTime);
    tone.stop(stopTime + 0.08);
    overtone.stop(stopTime + 0.08);

    return [tone, overtone, overtoneGain, gain, panner];
  }

  function create(context, destination, options = {}) {
    if (!context?.createGain || !destination?.connect && !destination?.context) {
      throw new TypeError("A Web Audio context and destination node are required.");
    }

    const output = context.createGain();
    const warmth = context.createBiquadFilter();
    const drift = context.createOscillator();
    const driftDepth = context.createGain();
    const level = clamp(Number(options.level ?? DEFAULT_LEVEL), 0, 0.8);
    const activeNodes = new Set();
    let running = false;
    let disposed = false;
    let scheduler = 0;
    let nextChordTime = 0;
    let chordIndex = 0;
    let driftStarted = false;

    output.gain.value = 0;
    warmth.type = "lowpass";
    warmth.frequency.value = Number(options.cutoff ?? 1420);
    warmth.Q.value = 0.34;
    drift.type = "sine";
    drift.frequency.value = 0.021;
    driftDepth.gain.value = 130;
    drift.connect(driftDepth).connect(warmth.frequency);
    warmth.connect(output).connect(destination);

    const remember = (nodes, releaseTime) => {
      nodes.forEach((node) => activeNodes.add(node));
      const releaseDelay = Math.max(0, (releaseTime - context.currentTime + 0.25) * 1000);
      global.setTimeout(() => {
        nodes.forEach((node) => {
          activeNodes.delete(node);
          safeDisconnect(node);
        });
      }, releaseDelay);
    };

    const scheduleChord = (index, startTime) => {
      const chord = PROGRESSION[index % PROGRESSION.length];
      const stopTime = startTime + CHORD_LENGTH;
      const centre = (chord.notes.length - 1) / 2;

      chord.notes.forEach((note, noteIndex) => {
        const distance = Math.abs(noteIndex - centre);
        const peak = (0.0175 - distance * 0.0014) / chord.notes.length;
        const pan = (noteIndex - centre) * 0.19 + Math.sin((index + noteIndex) * 1.7) * 0.06;
        remember(createVoice(context, warmth, note, startTime, stopTime, peak, pan), stopTime);
      });

      remember(
        createVoice(context, warmth, chord.bass, startTime + 0.32, stopTime - 0.45, 0.013, index % 2 ? 0.08 : -0.08, "bass"),
        stopTime
      );

      // One tiny light reflection per chord, deliberately too sparse to act as a melody.
      const glintStart = startTime + (index % 2 ? 4.9 : 3.35);
      remember(createGlint(context, warmth, chord.glint, glintStart, index % 2 ? 0.42 : -0.38), glintStart + 5);
    };

    const schedule = () => {
      if (!running || disposed) return;
      const horizon = context.currentTime + SCHEDULE_AHEAD;
      while (nextChordTime < horizon) {
        scheduleChord(chordIndex, nextChordTime);
        chordIndex = (chordIndex + 1) % PROGRESSION.length;
        nextChordTime += CHORD_STEP;
      }
    };

    const start = async ({ fade = 2.8 } = {}) => {
      if (disposed) return false;
      await context.resume?.().catch?.(() => {});
      if (running) return true;
      running = true;
      chordIndex = 0;
      nextChordTime = context.currentTime + 0.08;
      if (!driftStarted) {
        drift.start();
        driftStarted = true;
      }
      const now = context.currentTime;
      output.gain.cancelScheduledValues(now);
      output.gain.setValueAtTime(Math.max(output.gain.value, 0.0001), now);
      output.gain.exponentialRampToValueAtTime(Math.max(level, 0.0002), now + Math.max(0.08, fade));
      schedule();
      scheduler = global.setInterval(schedule, SCHEDULER_INTERVAL);
      return true;
    };

    const stop = ({ fade = 1.8 } = {}) => {
      if (!running || disposed) return;
      running = false;
      global.clearInterval(scheduler);
      scheduler = 0;
      const now = context.currentTime;
      const stopTime = now + Math.max(0.08, fade);
      output.gain.cancelScheduledValues(now);
      output.gain.setValueAtTime(Math.max(output.gain.value, 0.0001), now);
      output.gain.exponentialRampToValueAtTime(0.0001, stopTime);
      activeNodes.forEach((node) => safeStop(node, stopTime + 0.1));
    };

    const setLevel = (nextLevel, fade = 0.65) => {
      if (disposed) return;
      const target = clamp(Number(nextLevel), 0, 0.8);
      const now = context.currentTime;
      output.gain.cancelScheduledValues(now);
      output.gain.setTargetAtTime(running ? target : 0.0001, now, Math.max(0.02, fade / 4));
    };

    const dispose = () => {
      if (disposed) return;
      stop({ fade: 0.08 });
      disposed = true;
      global.clearInterval(scheduler);
      activeNodes.forEach((node) => {
        safeStop(node, context.currentTime + 0.1);
        safeDisconnect(node);
      });
      activeNodes.clear();
      safeStop(drift, context.currentTime + 0.1);
      [drift, driftDepth, warmth, output].forEach(safeDisconnect);
    };

    return Object.freeze({
      start,
      stop,
      setLevel,
      dispose,
      get isRunning() { return running; },
      get isDisposed() { return disposed; },
      get cycleDuration() { return CHORD_STEP * PROGRESSION.length; },
      provenance: "Original procedural synthesis; no samples or third-party music."
    });
  }

  global[API_NAME] = Object.freeze({
    create,
    version: "1.0.0",
    provenance: "Original procedural synthesis; no samples or third-party music."
  });
})(typeof window !== "undefined" ? window : globalThis);
