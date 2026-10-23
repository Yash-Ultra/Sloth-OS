export type AmbientHandle = {
  /** Fade out, stop the oscillators and release the audio device. */
  stop: () => void;
  /** Release immediately, used when the component unmounts. */
  close: () => void;
};

/**
 * Generate the wind-down soundscape with the Web Audio API: brown-ish noise
 * for rain, a 432 Hz / 426 Hz binaural pair for a slow theta beat, and a quiet
 * LFO so the rain ebbs and flows.
 *
 * Nothing is streamed or downloaded, so the loop costs no bandwidth.
 */
export function startRain(): AmbientHandle | null {
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  void ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Integrated white noise through a lowpass sounds close enough to rain.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < channel.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    channel[i] = last * 3.5;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 420;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.08;

  noise.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(master);

  // 432 Hz on the left and 426 Hz on the right gives a ~6 Hz theta beat.
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.04;

  const leftPan = ctx.createStereoPanner();
  leftPan.pan.value = -0.8;
  const rightPan = ctx.createStereoPanner();
  rightPan.pan.value = 0.8;

  const leftOsc = ctx.createOscillator();
  leftOsc.type = "sine";
  leftOsc.frequency.value = 432;
  const rightOsc = ctx.createOscillator();
  rightOsc.type = "sine";
  rightOsc.frequency.value = 426;

  leftOsc.connect(leftPan);
  leftPan.connect(droneGain);
  rightOsc.connect(rightPan);
  rightPan.connect(droneGain);
  droneGain.connect(master);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain);
  lfoGain.connect(noiseGain.gain);

  const sources = [noise, leftOsc, rightOsc, lfo];
  for (const source of sources) source.start();

  master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);

  const stopSources = () => {
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
  };

  return {
    stop: () => {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);

      // Let the fade finish before the device is released.
      window.setTimeout(() => {
        stopSources();
        void ctx.close();
      }, 700);
    },
    close: () => {
      stopSources();
      void ctx.close();
    },
  };
}
