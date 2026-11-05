// Cihazda kalıcı veri: sohbet, ekrandaki satırlar ve NOVA'nın hatırladığı bilgiler.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Mesaj } from "./claude";

export type Satir = { id: number; kim: "ben" | "nova" | "sistem"; metin: string };

// Claude'a giden sohbet. `sistem` sohbet boyunca değişmez (önceki turlardaki düşünme blokları geçerli kalsın diye).
export type Sohbet = { sistem: string; mesajlar: Mesaj[] };

async function oku<T>(anahtar: string, varsayilan: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(anahtar);
    return v ? (JSON.parse(v) as T) : varsayilan;
  } catch {
    return varsayilan;
  }
}
async function yaz(anahtar: string, deger: unknown) {
  try { await AsyncStorage.setItem(anahtar, JSON.stringify(deger)); } catch {}
}

export const hafiza = {
  bilgiler: () => oku<string[]>("nova.bilgiler", []),
  bilgiEkle: async (b: string) => {
    const l = await hafiza.bilgiler();
    if (!l.includes(b)) await yaz("nova.bilgiler", [...l, b].slice(-50));
  },
  bilgiSil: async (b: string) => yaz("nova.bilgiler", (await hafiza.bilgiler()).filter((x) => x !== b)),
  bilgileriTemizle: () => yaz("nova.bilgiler", []),

  sohbet: () => oku<Sohbet | null>("nova.sohbet", null),
  sohbetYaz: (s: Sohbet | null) => yaz("nova.sohbet", s),

  satirlar: () => oku<Satir[]>("nova.satirlar", []),
  satirlarYaz: (s: Satir[]) => yaz("nova.satirlar", s.slice(-200)),

  ayar: <T,>(ad: string, varsayilan: T) => oku<T>("nova.ayar." + ad, varsayilan),
  ayarYaz: (ad: string, v: unknown) => yaz("nova.ayar." + ad, v),
};
