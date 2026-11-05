// Her akşam yerel bildirimle "günün soruları hazır" hatırlatması. Sunucu gerekmez.
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function hatirlatmaAc(saat = 20, dakika = 0): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("gunluk", { name: "Günlük sorular", importance: AndroidImportance.DEFAULT });
  }
  const izin = (await Notifications.getPermissionsAsync()).granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!izin) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: "Ne Olurdu?", body: "Günün 5 sorusu hazır. Serini bozma!" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: saat, minute: dakika, channelId: "gunluk" },
  });
  return true;
}

export const hatirlatmaKapat = () => Notifications.cancelAllScheduledNotificationsAsync();
