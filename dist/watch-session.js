import {available,count,watch} from './model.js';
export function beginWatching(state,title,sourceUrl,now=Date.now()){
 const episode=count(state,title.id)+1;
 const limit=available(title,now);
 if(limit!==null&&episode>limit)return {ok:false,reason:'Все вышедшие серии уже отмечены'};
 state.activeWatch={titleId:title.id,episode,sourceUrl,startedAt:new Date(now).toISOString()};
 state.entries[title.id]={...state.entries[title.id],status:'watching',updatedAt:now};
 return {ok:true,session:state.activeWatch};
}
export function syncWatchSession(state,title){
 if(state.activeWatch?.titleId!==title.id)return;
 const next=count(state,title.id)+1,limit=available(title);
 if(limit!==null&&next>limit)state.activeWatch=null;
 else state.activeWatch.episode=next;
}
export function completeWatching(state,title,expectedEpisode,now=Date.now()){
 if(!state.activeWatch||state.activeWatch.titleId!==title.id||state.activeWatch.episode!==expectedEpisode||count(state,title.id)+1!==expectedEpisode){
  syncWatchSession(state,title);
  return {ok:false,reason:'Прогресс уже изменился. Проверьте номер текущей серии.'};
 }
 const result=watch(state,title,now);
 if(result.ok)syncWatchSession(state,title);
 return result;
}
