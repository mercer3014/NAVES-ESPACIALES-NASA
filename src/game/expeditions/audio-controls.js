import {store} from '../../core/store.js';import {unlock} from '../../core/audio.js';
// Remember a nonzero mix across mission changes and page reloads, not just one controller lifetime.
export function toggleExpeditionAudio(){unlock();const current=store.get('vol');if(Object.values(current).some(v=>v>0)){store.set('expUnmutedVol',{...current});store.set('vol',{music:0,sfx:0,voice:0});}else{const remembered=store.get('expUnmutedVol');store.set('vol',remembered&&Object.values(remembered).some(v=>v>0)?remembered:{music:.6,sfx:.8,voice:1});}}
