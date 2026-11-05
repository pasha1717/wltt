import {registerRoot} from 'remotion';
import {kalipKur, Kelime} from '../ortak/Kalip';
import veri from '../../public/mevsim/kelimeler.json';
import {ayar} from './ayar';

registerRoot(kalipKur(veri as Kelime[], ayar));
