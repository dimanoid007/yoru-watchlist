export const STATUSES={watching:'Смотрю',planned:'Запланировано',completed:'Просмотрено',paused:'Отложено',dropped:'Брошено'};
export function count(state,id){return state.events.filter(e=>e.titleId===id).length;}
export function episodeWatched(state,id,episode){return state.events.some(e=>e.titleId===id&&e.episode===episode);}
export function nextEpisode(state,id){const seen=new Set(state.events.filter(e=>e.titleId===id).map(e=>e.episode));let next=1;while(seen.has(next))next++;return next;}
export function available(title,now=Date.now()){
 if(title.episodeData)return title.episodeData.filter(e=>e.airdate&&Date.parse(e.airdate)<=now).length;
 return Number.isInteger(title.released)?title.released:!title.airing&&Number.isInteger(title.total)?title.total:null;
}
export function watch(state,title,now=Date.now(),episode=nextEpisode(state,title.id)){
 const n=count(state,title.id),limit=available(title,now);
 if(!Number.isInteger(episode)||episode<1)return {ok:false,reason:'Некорректный номер серии'};
 if(limit!==null&&episode>limit)return {ok:false,reason:'Эта серия ещё не вышла'};
 if(episodeWatched(state,title.id,episode))return {ok:false,reason:'Эта серия уже отмечена'};
 const duration=title.episodeData?.[episode-1]?.duration||title.duration;
 if(!Number.isFinite(duration)||duration<=0)return {ok:false,reason:'Сначала укажите длительность серии'};
 const event={id:globalThis.crypto.randomUUID(),titleId:title.id,episode,minutes:duration,at:new Date(now).toISOString()};
 state.events.push(event);
 state.entries[title.id]={...state.entries[title.id],status:title.total&&n+1>=title.total?'completed':'watching',updatedAt:now};
 return {ok:true,event};
}
export function undo(state,id){const events=state.events.filter(e=>e.titleId===id);const last=events.at(-1);if(!last)return false;state.events=state.events.filter(e=>e.id!==last.id);if(state.entries[id]?.status==='completed')state.entries[id].status='watching';return true;}
export function minutes(state){return state.events.reduce((n,e)=>n+e.minutes,0);}
export function validateBackup(data){
 if(!data||data.version!==1||!data.state||!Array.isArray(data.catalog))throw Error('Неподдерживаемый файл резервной копии');
 const s=data.state;if(!s.entries||typeof s.entries!=='object'||Array.isArray(s.entries)||!Array.isArray(s.events)||typeof s.name!=='string')throw Error('Повреждённые данные профиля');
 const ids=new Set(data.catalog.map(t=>t.id));
 if(data.catalog.some(t=>typeof t.id!=='string'||typeof t.title!=='string'||!['anime','tv'].includes(t.kind)))throw Error('Повреждённый каталог');
 if(Object.entries(s.entries).some(([id,e])=>!ids.has(id)||!STATUSES[e.status]))throw Error('Неизвестный статус или тайтл');
 const eventIds=new Set();
 for(const e of s.events){if(typeof e.id!=='string'||eventIds.has(e.id)||!ids.has(e.titleId)||!s.entries[e.titleId]||!Number.isInteger(e.episode)||e.episode<1||!Number.isFinite(e.minutes)||e.minutes<=0||!Number.isFinite(Date.parse(e.at)))throw Error('Повреждённая история');eventIds.add(e.id);}
 return data;
}
