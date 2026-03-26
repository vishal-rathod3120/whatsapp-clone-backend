// Notification sound utility using Web Audio API
// Generates short, pleasant notification tones without external audio files

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Sound playback failed:', err);
  }
}

// Two-tone notification: WhatsApp-style "ding-dong"
export function playMessageSound() {
  playTone(880, 0.15, 'sine', 0.2);   // A5
  setTimeout(() => {
    playTone(1174.66, 0.2, 'sine', 0.15); // D6
  }, 100);
}

// Ringtone: repeating tones for incoming call
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

export function playRingtone() {
  stopRingtone();
  const ring = () => {
    playTone(523.25, 0.3, 'sine', 0.25); // C5
    setTimeout(() => playTone(659.25, 0.3, 'sine', 0.25), 200); // E5
    setTimeout(() => playTone(783.99, 0.3, 'sine', 0.25), 400); // G5
  };
  ring();
  ringtoneInterval = setInterval(ring, 2000);
}

export function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

// Short "sent" confirmation blip
export function playSentSound() {
  playTone(1200, 0.08, 'sine', 0.1);
}
