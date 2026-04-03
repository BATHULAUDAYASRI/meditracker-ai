export function calculateBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || w <= 0 || h <= 0) return null;
  const meters = h / 100;
  return Number((w / (meters * meters)).toFixed(1));
}

export function classifyBmi(bmi) {
  if (bmi == null) return "Unknown";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function getHealthFlags(profile) {
  const flags = [];
  if (profile.bmiCategory && profile.bmiCategory !== "Normal") flags.push(`BMI ${profile.bmiCategory}`);
  if (profile.smoke) flags.push("Smoking");
  if (profile.drink) flags.push("Alcohol");
  if (profile.diabetes) flags.push("Diabetes");
  return flags;
}

