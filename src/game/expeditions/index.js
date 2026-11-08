import './text.js';import './text-horizon.js';
import {t} from '../../core/i18n.js';import {music,sfx,unlock} from '../../core/audio.js';import {show} from '../../ui/router.js';import {lobbyBg,startScreen,createScreen} from '../../ui/screens.js';
const q=(s,el)=>el.querySelector(s);
export function expeditionBriefing(mission='mars'){
 lobbyBg();music('ambient');
 const el=show(`<div class="screen"><button class="back" data-i="back"></button><div class="panel dialog" style="max-width:730px;max-height:calc(100dvh - 90px);overflow:auto"><div class="phase-tag">${t(mission==='mars'?'m2':'m3')}</div><h2>${t('ex.'+mission)}</h2><p>${t('ex.'+mission+'.d')}</p><p>${t('ex.controls')}</p><p style="font-size:12px;line-height:1.5">${t(mission==='mars'?'ex.mars.note':'ex.fiction')}</p><div class="btns"><button class="btn go" data-a="solo">${t('ex.start')}</button><button class="btn" data-a="room">${t('ex.room')}</button></div></div></div>`,'expedition-briefing');
 q('.back',el).onclick=startScreen;q('[data-a=solo]',el).onclick=()=>{unlock();sfx('click');startExpedition({mission});};q('[data-a=room]',el).onclick=()=>{unlock();sfx('click');createScreen('pilot',mission);};
}
export async function startExpedition(options={}){if(options.mission==='horizon'){const m=await import('./horizon-controller.js');return m.startHorizon(options);}const m=await import('./mars-controller.js');return m.startExpedition(options);}
