// Notification sound utility using Web Audio API
let audioContext: AudioContext | null = null;

export type SoundType = "chime" | "bell" | "pop" | "ding" | "soft";

export const soundNames: Record<SoundType, string> = {
  chime: "צ'יימ",
  bell: "פעמון",
  pop: "פופ",
  ding: "דינג",
  soft: "רך",
};

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playChime = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
  gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.12);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
};

const playBell = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

const playPop = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
};

const playDing = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(1500, ctx.currentTime);
  oscillator2.frequency.setValueAtTime(2000, ctx.currentTime);
  oscillator.type = "sine";
  oscillator2.type = "sine";

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  oscillator.start(ctx.currentTime);
  oscillator2.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.4);
  oscillator2.stop(ctx.currentTime + 0.4);
};

const playSoft = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(440, ctx.currentTime);
  oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.15);
  oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
  gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.3);
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.35);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

export const playNotificationSound = (soundType?: SoundType) => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if it was suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const type = soundType || (localStorage.getItem("notificationSoundType") as SoundType) || "chime";

    switch (type) {
      case "bell":
        playBell(ctx);
        break;
      case "pop":
        playPop(ctx);
        break;
      case "ding":
        playDing(ctx);
        break;
      case "soft":
        playSoft(ctx);
        break;
      case "chime":
      default:
        playChime(ctx);
        break;
    }
  } catch (error) {
    console.log("Could not play notification sound:", error);
  }
};
