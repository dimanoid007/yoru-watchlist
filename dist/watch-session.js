import {available,count,watch,episodeWatched,nextEpisode} from './model.js?v=4';
export function beginWatching(state,title,sourceUrl,now=Date.now(),episode=nextEpisode(state,title.id)){
 const limit=available(title,now);
 if(limit!==null&&episode>limit)return {ok:false,reason:'Все вышедшие серии уже отмечены'};
 state.activeWatch={titleId:title.id,episode,sourceUrl,startedAt:new Date(now).toISOString()};
 state.entries[title.id]={...state.entries[title.id],status:'watching',updatedAt:now};
 return {ok:true,session:state.activeWatch};
}
export function syncWatchSession(state,title){
 if(state.activeWatch?.titleId!==title.id)return;
 const limit=available(title);
 if(limit!==null&&count(state,title.id)>=limit){state.activeWatch=null;return;}
 if(episodeWatched(state,title.id,state.activeWatch.episode)){
  const following=state.activeWatch.episode+1;
  state.activeWatch.episode=(limit===null||following<=limit)&&!episodeWatched(state,title.id,following)?following:nextEpisode(state,title.id);
 }
}
export function completeWatching(state,title,expectedEpisode,now=Date.now()){
 if(!state.activeWatch||state.activeWatch.titleId!==title.id||state.activeWatch.episode!==expectedEpisode){
  return {ok:false,reason:'Прогресс уже изменился. Проверьте номер текущей серии.'};
 }
 const result=watch(state,title,now,expectedEpisode);
 if(result.ok)syncWatchSession(state,title);
 return result;
}
