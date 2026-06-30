import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ReminderSchedule {
  namaObat: string;
  dosis: string;
  /** Berapa kali sehari: 1, 2, atau 3 */
  frequencyPerDay: 1 | 2 | 3;
  /** Jam pertama minum (0–23) */
  startHour: number;
  /** Durasi pengingat dalam hari */
  durationDays: number;
}

// ─── Setup Handler ─────────────────────────────────────────────────────────

/**
 * Konfigurasi handler notifikasi foreground.
 * Panggil sekali di _layout.tsx atau App entry point.
 */
export function setupNotificationHandler() {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Permission ────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    // Web: gunakan Notification API browser
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Jadwal ────────────────────────────────────────────────────────────────

/**
 * Hitung jam-jam notifikasi berdasarkan frekuensi & jam pertama.
 * Misal: startHour=8, freq=3 → [8, 14, 20]
 */
function computeHours(startHour: number, freq: number): number[] {
  const interval = Math.floor(24 / freq);
  return Array.from({ length: freq }, (_, i) => (startHour + i * interval) % 24);
}

/**
 * Jadwalkan notifikasi pengingat minum obat menggunakan expo-notifications.
 * Pada platform web, fallback ke browser Notification API.
 * 
 * @returns Array ID notifikasi yang dijadwalkan (untuk pembatalan)
 */
export async function scheduleReminder(schedule: ReminderSchedule): Promise<string[]> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    Alert.alert(
      "Izin Diperlukan",
      "Aktifkan izin notifikasi di pengaturan perangkat untuk memasang pengingat minum obat.",
    );
    return [];
  }

  const hours = computeHours(schedule.startHour, schedule.frequencyPerDay);
  const ids: string[] = [];

  if (Platform.OS === "web") {
    // Web: Jadwalkan notifikasi browser sederhana menggunakan setTimeout
    // (hanya efektif selama browser/tab terbuka)
    for (let day = 0; day < schedule.durationDays; day++) {
      for (const hour of hours) {
        const now = new Date();
        const fireTime = new Date(now);
        fireTime.setDate(now.getDate() + day);
        fireTime.setHours(hour, 0, 0, 0);

        const delayMs = fireTime.getTime() - now.getTime();
        if (delayMs <= 0) continue;

        const timeoutId = setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification(`💊 Pengingat: ${schedule.namaObat}`, {
              body: schedule.dosis
                ? `Waktunya minum obat! ${schedule.dosis}`
                : "Waktunya minum obat!",
              icon: "/icon.png",
            });
          }
        }, delayMs);

        ids.push(`web-${timeoutId}`);
      }
    }
    return ids;
  }

  // Native: gunakan expo-notifications dengan trigger waktu
  for (let day = 0; day < schedule.durationDays; day++) {
    for (const hour of hours) {
      const now = new Date();
      const fireTime = new Date(now);
      fireTime.setDate(now.getDate() + day);
      fireTime.setHours(hour, 0, 0, 0);

      if (fireTime.getTime() <= now.getTime()) continue;

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 Pengingat: ${schedule.namaObat}`,
            body: schedule.dosis
              ? `Waktunya minum obat! ${schedule.dosis}`
              : "Waktunya minum obat!",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireTime,
          },
        });
        ids.push(id);
      } catch (err) {
        console.error("[reminder] Gagal jadwalkan notifikasi:", err);
      }
    }
  }

  return ids;
}

/**
 * Batalkan semua pengingat yang sudah dijadwalkan (hanya native).
 */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
