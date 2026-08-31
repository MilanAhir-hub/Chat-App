type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

// One shared AudioContext for short notification beeps. Creating a new
// AudioContext per sound allocates OS-level audio resources every time and
// can exhaust the browser's concurrent-context limit in busy chats.
let sharedContext: AudioContext | null = null;

const getSharedAudioContext = (): AudioContext | null => {
  const AudioContextClass =
    window.AudioContext ||
    (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new AudioContextClass();
  }

  if (sharedContext.state === 'suspended') {
    void sharedContext.resume();
  }

  return sharedContext;
};

export const playNotificationSound = () => {
  const context = getSharedAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 660;
  gain.gain.value = 0.035;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
};

export const playIncomingRing = () => {
  const AudioContextClass =
    window.AudioContext ||
    (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextClass) return () => {};

  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.value = 0.05;

  let isPlaying = true;
  let nextStartTime = context.currentTime + 0.1;

  const scheduleNext = () => {
    if (!isPlaying) return;
    
    // WhatsApp style double beep pattern
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 600;
    osc2.frequency.value = 600;
    
    osc1.connect(gain);
    osc2.connect(gain);
    
    osc1.start(nextStartTime);
    osc1.stop(nextStartTime + 0.4);
    
    osc2.start(nextStartTime + 0.6);
    osc2.stop(nextStartTime + 1.0);
    
    nextStartTime += 2.5;
    
    // Schedule the next loop before this one ends
    setTimeout(scheduleNext, 2000);
  };

  scheduleNext();

  return () => {
    isPlaying = false;
    void context.close();
  };
};

export const playOutgoingRing = () => {
  const AudioContextClass =
    window.AudioContext ||
    (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextClass) return () => {};

  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.value = 0.03;

  let isPlaying = true;
  let nextStartTime = context.currentTime + 0.1;

  const scheduleNext = () => {
    if (!isPlaying) return;
    
    // WhatsApp style long beep pattern
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    
    osc.connect(gain);
    
    osc.start(nextStartTime);
    osc.stop(nextStartTime + 1.2);
    
    nextStartTime += 3.0;
    
    setTimeout(scheduleNext, 2500);
  };

  scheduleNext();

  return () => {
    isPlaying = false;
    void context.close();
  };
};
