type AudioWindow = Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

export function getAudioContextConstructor(window: Window): typeof AudioContext | null {
  return (window as AudioWindow).AudioContext ?? (window as AudioWindow).webkitAudioContext ?? null;
}
