import {registerRoot} from 'remotion';
import {kalipKur, Kelime} from '../ortak/Kalip';
import veri from '../../public/kaynama/kelimeler.json';
import {ayar} from './ayar';

registerRoot(kalipKur(veri as Kelime[], ayar));
