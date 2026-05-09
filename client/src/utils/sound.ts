type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export const playNotificationSound = () => {
  const AudioContextClass =
    window.AudioContext ||
    (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 660;
  gain.gain.value = 0.035;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);

  oscillator.onended = () => {
    void context.close();
  };
};
