import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api";
import { loginWithGoogleFirebase } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("meditrack_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (token, userData) => {
    localStorage.setItem("meditrack_token", token);
    localStorage.setItem("meditrack_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    persist(data.token, data.user);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persist(data.token, data.user);
  };

  const googleMock = async (payload) => {
    const { data } = await api.post("/auth/google-mock", payload);
    persist(data.token, data.user);
  };

  const googleFirebase = async (payload) => {
    const fb = await loginWithGoogleFirebase();
    if (!fb?.idToken) {
      await googleMock(payload);
      return;
    }
    const body = {
      idToken: fb.idToken,
      role: payload.role,
      preferredLanguage: payload.preferredLanguage,
    };
    if (payload.role === "patient") {
      body.smoke = payload.smoke;
      body.drink = payload.drink;
      body.diabetes = payload.diabetes;
      body.pastMedicalHistory = payload.pastMedicalHistory;
    }
    const { data } = await api.post("/auth/google-firebase", body);
    persist(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("meditrack_token");
    localStorage.removeItem("meditrack_user");
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get("/auth/me");
    if (data?.user) {
      setUser(data.user);
      localStorage.setItem("meditrack_user", JSON.stringify(data.user));
    }
  };

  const value = useMemo(
    () => ({ user, setUser, login, register, googleMock, googleFirebase, logout, refreshUser }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

