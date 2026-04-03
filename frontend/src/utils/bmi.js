export function calculateBmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const meters = h / 100;
  return Number((w / (meters * meters)).toFixed(1));
}

export function getBmiCategory(bmi) {
  const n = typeof bmi === "number" ? bmi : Number(bmi);
  if (bmi == null || bmi === "" || !Number.isFinite(n)) return "Unknown";
  if (n < 18.5) return "Underweight";
  if (n < 25) return "Normal";
  if (n < 30) return "Overweight";
  return "Obese";
}

