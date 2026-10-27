const CHECK_PREFERENCE_KEY = 'merit.checkOnAdd';

/** Whether to check a posting with AI as it is added: remembered in this browser only, a convenience; the default is to check. */
export function readCheckPreference(): boolean {
  try {
    return localStorage.getItem(CHECK_PREFERENCE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function rememberCheckPreference(checkNow: boolean) {
  try {
    localStorage.setItem(CHECK_PREFERENCE_KEY, String(checkNow));
  } catch {
    // private window or blocked storage: the switch still works for this visit
  }
}
