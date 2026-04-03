const PHRASES = [
  "Great job staying on track!",
  "Your health matters — nice work.",
  "Consistency builds healthier habits.",
  "Well done taking your medication.",
  "Proud of you for keeping up today!",
  "Small steps, big impact.",
];

export function randomEncouragement() {
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}
