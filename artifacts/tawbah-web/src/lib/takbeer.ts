// ── Three Allahu Akbar (تكبيرات) ───────────────────────────────────────────────
// Plays "الله أكبر" spoken three times via the browser SpeechSynthesis API.
// Falls back to three bell chimes (Web Audio API) if speech is unavailable.

let _active = false; // prevent overlapping playback

function playChimes(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const chime = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Two descending tones per chime, like a call
      osc.type = "sine";
      osc.frequency.setValueAtTime(932, startTime);         // Bb5
      osc.frequency.exponentialRampToValueAtTime(659, startTime + 0.22); // E5
      osc.frequency.exponentialRampToValueAtTime(466, startTime + 0.55); // Bb4

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.45, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.3);

      osc.start(startTime);
      osc.stop(startTime + 1.3);
    };

    const t = ctx.currentTime;
    chime(t);
    chime(t + 1.6);
    chime(t + 3.2);

    setTimeout(() => ctx.close().catch(() => {}), 6000);
  } catch {
    // Silent fail — audio context may be blocked
  }
}

function speakThreeTakbeer(): void {
  window.speechSynthesis.cancel();
  let failed = false;

  const queue = ["الله أكبر", "الله أكبر", "الله أكبر"];
  const next = () => {
    if (failed) return;
    const text = queue.shift();
    if (!text) {
      _active = false;
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.78;
    u.pitch = 0.88;
    u.volume = 1;
    u.onend = () => setTimeout(next, 380);
    u.onerror = () => {
      failed = true;
      _active = false;
      playChimes();
    };
    window.speechSynthesis.speak(u);
  };
  next();
}

export function playTakbeer(): void {
  if (_active) return; // Already playing
  _active = true;

  if (!("speechSynthesis" in window)) {
    _active = false;
    playChimes();
    return;
  }

  // Warm up voices list — first call may return empty array
  const voices = window.speechSynthesis.getVoices();
  const hasArabic = voices.some((v) => v.lang.startsWith("ar"));

  if (hasArabic || voices.length === 0) {
    // Either Arabic voice exists, or voices not yet loaded — try speech
    speakThreeTakbeer();
  } else {
    // Voices loaded but no Arabic voice — use chimes
    _active = false;
    playChimes();
  }

  // Safety reset in case speech engine stalls
  setTimeout(() => { _active = false; }, 12_000);
}
