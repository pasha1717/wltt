// Ajanların yazdığı soru paketleri. Yeni paket: pNN.ts dosyası + aşağıya bir satır.
import type { Soru } from "../sorular";
import { P01 } from "./p01";
import { P02 } from "./p02";
import { P03 } from "./p03";
import { P04 } from "./p04";
import { P05 } from "./p05";
import { P06 } from "./p06";
import { P07 } from "./p07";
import { P08 } from "./p08";
import { P09 } from "./p09";
import { P10 } from "./p10";
import { P11 } from "./p11";
import { P12 } from "./p12";

export const PAKETLER: Soru[] = [
  ...P01,
  ...P02,
  ...P03,
  ...P04,
  ...P05,
  ...P06,
  ...P07,
  ...P08,
  ...P09,
  ...P10,
  ...P11,
  ...P12,
];
