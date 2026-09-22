let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let speechEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEffectsEnabled(enabled: boolean) {
  soundEnabled = enabled;
  speechEnabled = enabled;
  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function isSoundEffectsEnabled(): boolean {
  return soundEnabled;
}

export function setSpeechEnabled(enabled: boolean) {
  speechEnabled = enabled;
  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function isSpeechEnabled(): boolean {
  return speechEnabled;
}

// iOS UI Tap sound (subtle click)
export function playSelectSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // ignore
  }
}

// iOS Success chime (Pair matched)
export function playMatchSound(combo: number = 1) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Base pitch raises slightly with combo
    const pitchOffset = Math.min(combo * 30, 200);

    const freqs = [523.25 + pitchOffset, 659.25 + pitchOffset, 783.99 + pitchOffset]; // C5, E5, G5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.25);
    });
  } catch {
    // ignore
  }
}

// iOS Wrong match buzz (soft bump)
export function playErrorSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // ignore
  }
}

// Victory fanfare on stage completion
export function playVictorySound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.09);

      gain.gain.setValueAtTime(0.15, now + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.09);
      osc.stop(now + index * 0.09 + 0.38);
    });
  } catch {
    // ignore
  }
}

// Speech synthesis for native English pronunciation (original voice: Google / Samantha / Siri / Natural)
function findOriginalVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return undefined;

  return (
    voices.find(
      (v) =>
        (v.lang.startsWith('en-US') || v.lang.startsWith('en')) &&
        (v.name.includes('Natural') ||
          v.name.includes('Siri') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'))
  );
}

// Pre-warm voices list on load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}

export function speakEnglish(text: string, force: boolean = false) {
  if (!soundEnabled) return;
  if (!speechEnabled && !force) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const performSpeak = (targetVoice?: SpeechSynthesisVoice) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.7; // ~30% slower than standard rate (1.0)

      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const currentVoices = window.speechSynthesis.getVoices();

  // If voices have not loaded yet from browser, wait for voiceschanged before speaking
  if (!currentVoices || currentVoices.length === 0) {
    let fired = false;
    const onReady = () => {
      if (fired) return;
      fired = true;
      const v = findOriginalVoice();
      performSpeak(v);
    };

    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', onReady, { once: true });
    } else {
      window.speechSynthesis.onvoiceschanged = onReady;
    }

    setTimeout(() => {
      if (!fired) {
        fired = true;
        const v = findOriginalVoice();
        performSpeak(v);
      }
    }, 100);
    return;
  }

  const voice = findOriginalVoice();
  performSpeak(voice);
}

// Find a natural, high-quality Chinese voice for encouragement
function findChineseVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return undefined;

  // Prioritize premium/natural Chinese voices (e.g. Ting-Ting, Xiaoxiao, Siri, Yaoyao, Google 普通话)
  return (
    voices.find(
      (v) =>
        (v.lang.startsWith('zh-CN') || v.lang.startsWith('zh')) &&
        (v.name.includes('Natural') ||
          v.name.includes('Xiaoxiao') ||
          v.name.includes('Ting-Ting') ||
          v.name.includes('Tingting') ||
          v.name.includes('Google') ||
          v.name.includes('Siri') ||
          v.name.includes('Mei-Jia') ||
          v.name.includes('Yaoyao'))
    ) ||
    voices.find((v) => v.lang.startsWith('zh-CN') || v.lang === 'zh_CN') ||
    voices.find((v) => v.lang.startsWith('zh'))
  );
}

// Speaks an encouraging phrase like "加油！" in an excited, energetic tone
export function speakEncouragement(phrase: string = '加油！') {
  if (!soundEnabled && !speechEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const performSpeak = (targetVoice?: SpeechSynthesisVoice) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'zh-CN';
      utterance.pitch = 1.35; // Bright, excited, higher pitch
      utterance.rate = 1.15;  // Energetic, brisk tempo
      utterance.volume = 1.0;

      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const currentVoices = window.speechSynthesis.getVoices();
  if (!currentVoices || currentVoices.length === 0) {
    let fired = false;
    const onReady = () => {
      if (fired) return;
      fired = true;
      const v = findChineseVoice();
      performSpeak(v);
    };

    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', onReady, { once: true });
    } else {
      window.speechSynthesis.onvoiceschanged = onReady;
    }

    setTimeout(() => {
      if (!fired) {
        fired = true;
        const v = findChineseVoice();
        performSpeak(v);
      }
    }, 100);
    return;
  }

  const voice = findChineseVoice();
  performSpeak(voice);
}
