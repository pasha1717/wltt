// Zamanlayıcı ve hatırlatıcılar: uygulama kapalıyken de çalışsın diye yerel bildirim.
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let hazir = false;
async function hazirla(): Promise<boolean> {
  if (Platform.OS === "android" && !hazir) {
    await Notifications.setNotificationChannelAsync("nova", {
      name: "NOVA hatırlatmaları",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
      sound: "default",
    });
  }
  hazir = true;
  const izin = await Notifications.getPermissionsAsync();
  if (izin.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function zamanlayiciKur(saniye: number, etiket: string): Promise<string> {
  if (!(await hazirla())) throw new Error("Bildirim izni verilmedi.");
  return Notifications.scheduleNotificationAsync({
    content: { title: "NOVA", body: `${etiket} doldu.`, sound: "default" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(saniye)), channelId: "nova" },
  });
}

export async function hatirlaticiKur(zaman: Date, mesaj: string): Promise<string> {
  if (!(await hazirla())) throw new Error("Bildirim izni verilmedi.");
  return Notifications.scheduleNotificationAsync({
    content: { title: "NOVA hatırlatıyor", body: mesaj, sound: "default" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: zaman, channelId: "nova" },
  });
}

export async function bekleyenler() {
  const l = await Notifications.getAllScheduledNotificationsAsync();
  return l.map((n) => ({ id: n.identifier, metin: n.content.body ?? "" }));
}

export const iptalEt = (id: string) => Notifications.cancelScheduledNotificationAsync(id);

// Uygulama açıkken gelen bildirimi NOVA sesli de söylesin.
export const bildirimGelince = (f: (metin: string) => void) =>
  Notifications.addNotificationReceivedListener((n) => f(n.request.content.body ?? ""));
