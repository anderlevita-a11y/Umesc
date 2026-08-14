import { settingsService } from "./supabase";

export interface AccessStats {
  total: number;
  monthly: Record<string, number>; // e.g. { "2026-08": 412, "2026-07": 530 }
  daily?: Record<string, number>;  // e.g. { "2026-08-13": 34 }
  lastUpdated?: string;
}

export const DEFAULT_ACCESS_STATS: AccessStats = {
  total: 2840,
  monthly: {
    "2026-08": 412,
    "2026-07": 530,
    "2026-06": 485,
    "2026-05": 420,
    "2026-04": 395,
    "2026-03": 360,
    "2026-02": 238
  },
  daily: {
    "2026-08-13": 34
  }
};

const ACCESS_SETTING_KEY = "umesc_access_stats";

export const accessTrackerService = {
  async getStats(): Promise<AccessStats> {
    try {
      const data = await settingsService.getSetting<AccessStats>(ACCESS_SETTING_KEY, DEFAULT_ACCESS_STATS);
      if (data && typeof data.total === "number" && data.monthly) {
        return data;
      }
      return DEFAULT_ACCESS_STATS;
    } catch {
      return DEFAULT_ACCESS_STATS;
    }
  },

  async recordAccess(): Promise<AccessStats> {
    try {
      const sessionKey = "umesc_access_counted_session";
      const hasCounted = sessionStorage.getItem(sessionKey);

      let stats = await this.getStats();

      if (!hasCounted) {
        sessionStorage.setItem(sessionKey, "true");

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        const newTotal = (stats.total || 0) + 1;
        const newMonthly = { ...(stats.monthly || {}) };
        newMonthly[monthKey] = (newMonthly[monthKey] || 0) + 1;

        const newDaily = { ...(stats.daily || {}) };
        newDaily[dayKey] = (newDaily[dayKey] || 0) + 1;

        stats = {
          total: newTotal,
          monthly: newMonthly,
          daily: newDaily,
          lastUpdated: new Date().toISOString()
        };

        await settingsService.saveSetting(ACCESS_SETTING_KEY, stats);
        
        window.dispatchEvent(new CustomEvent("umesc_content_updated"));
      }

      return stats;
    } catch (err) {
      console.error("Error recording access:", err);
      return DEFAULT_ACCESS_STATS;
    }
  },

  async incrementManualAccess(): Promise<AccessStats> {
    let stats = await this.getStats();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    stats.total = (stats.total || 0) + 1;
    stats.monthly = stats.monthly || {};
    stats.monthly[monthKey] = (stats.monthly[monthKey] || 0) + 1;
    stats.daily = stats.daily || {};
    stats.daily[dayKey] = (stats.daily[dayKey] || 0) + 1;
    stats.lastUpdated = new Date().toISOString();

    await settingsService.saveSetting(ACCESS_SETTING_KEY, stats);
    window.dispatchEvent(new CustomEvent("umesc_content_updated"));
    return stats;
  },

  async saveStats(stats: AccessStats): Promise<boolean> {
    const success = await settingsService.saveSetting(ACCESS_SETTING_KEY, stats);
    if (success) {
      window.dispatchEvent(new CustomEvent("umesc_content_updated"));
    }
    return success;
  }
};
