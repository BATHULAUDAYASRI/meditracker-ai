import { useMemo, useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import MedicinesPage from "./pages/MedicinesPage.jsx";
import RemindersPage from "./pages/RemindersPage.jsx";
import PharmaciesPage from "./pages/PharmaciesPage.jsx";
import AssistantPage from "./pages/AssistantPage.jsx";
import AppShell from "./components/AppShell.jsx";
import { getBmiCategory } from "./utils/bmi.js";

const AUTH_KEY = "meditrack_auth_v1";
const ONBOARD_KEY = "meditrack_onboarding_v1";

export default function App() {
  const [auth, setAuth] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    try {
      const a = localStorage.getItem(AUTH_KEY);
      const o = localStorage.getItem(ONBOARD_KEY);
      if (a) setAuth(JSON.parse(a));
      if (o) setOnboarding(JSON.parse(o));
    } catch {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(ONBOARD_KEY);
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setAuth(data);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  };

  const handleOnboardingComplete = (data) => {
    setOnboarding(data);
    localStorage.setItem(ONBOARD_KEY, JSON.stringify(data));
  };

  const logout = () => {
    setAuth(null);
    setOnboarding(null);
    setActiveNav("dashboard");
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ONBOARD_KEY);
  };

  const healthFlags = useMemo(() => {
    if (!onboarding) return [];
    const flags = [];
    const bmiCategory = getBmiCategory(onboarding.bmi);
    if (bmiCategory !== "Normal") flags.push(`BMI ${bmiCategory}`);
    if (onboarding.smoke) flags.push("Smoker");
    if (onboarding.alcohol) flags.push("Alcohol usage");
    if (onboarding.diabetes) flags.push("Diabetes");
    if (onboarding.bpIssues) flags.push("Blood pressure risk");
    return flags;
  }, [onboarding]);

  if (!auth) {
    return <AuthPage onLogin={handleAuthSuccess} />;
  }

  if (!onboarding) {
    return <OnboardingPage auth={auth} onComplete={handleOnboardingComplete} onLogout={logout} />;
  }

  const common = { auth, onboarding, healthFlags };

  return (
    <AppShell
      activeNav={activeNav}
      onNavChange={setActiveNav}
      auth={auth}
      onboarding={onboarding}
      onLogout={logout}
    >
      {activeNav === "dashboard" && <DashboardPage {...common} onNavigate={setActiveNav} />}
      {activeNav === "medicines" && <MedicinesPage {...common} />}
      {activeNav === "reminders" && <RemindersPage {...common} />}
      {activeNav === "pharmacies" && <PharmaciesPage {...common} />}
      {activeNav === "assistant" && <AssistantPage {...common} />}
      {activeNav === "profile" && <ProfilePage {...common} onNavigate={setActiveNav} />}
      {activeNav === "settings" && (
        <SettingsPage
          {...common}
          onResetOnboarding={() => {
            setOnboarding(null);
            localStorage.removeItem(ONBOARD_KEY);
          }}
        />
      )}
    </AppShell>
  );
}
