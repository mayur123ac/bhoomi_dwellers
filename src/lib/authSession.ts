export function getStoredCrmUser() {
  try {
    const stored = localStorage.getItem("crm_user");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem("crm_user");
    return null;
  }
}

export function clearCrmSession() {
  localStorage.removeItem("crm_user");
  sessionStorage.clear();
}

export function installLoggedOutBackGuard(onLoggedOut: () => void) {
  const checkSession = () => {
    if (!localStorage.getItem("crm_user")) onLoggedOut();
  };

  window.addEventListener("pageshow", checkSession);
  window.addEventListener("focus", checkSession);

  return () => {
    window.removeEventListener("pageshow", checkSession);
    window.removeEventListener("focus", checkSession);
  };
}
