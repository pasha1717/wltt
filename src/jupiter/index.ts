import {registerRoot} from 'remotion';
import {kalipKur, Kelime} from '../ortak/Kalip';
import veri from '../../public/jupiter/kelimeler.json';
import {ayar} from './ayar';

registerRoot(kalipKur(veri as Kelime[], ayar));
