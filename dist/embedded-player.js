export function normalizeFrameUrl(value){
 const url=new URL(String(value).startsWith('//')?'https:'+value:value);
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Источник вернул некорректный адрес плеера');
 return url.href;
}
export function kinopoiskId(title){
 const direct=String(title.kinopoiskId||'');if(/^\d+$/.test(direct))return direct;
 for(const source of title.officialSources||[]){try{const u=new URL(source.url);if(u.hostname==='kinopoisk.ru'||u.hostname.endsWith('.kinopoisk.ru')){const match=u.pathname.match(/\/(?:film|series)\/(\d+)/);if(match)return match[1];}}catch{}}
 return null;
}
export function episodeCoordinates(title,index){
 const item=title.episodeData?.[index-1],match=item?.label?.match(/^S(\d+)E(\d+)$/);
 return {season:item?.season||Number(match?.[1])||1,episode:item?.number||Number(match?.[2])||index};
}
export function kodikFrameUrl(title){
 const params=new URLSearchParams({title:title.original&&title.original!=='Добавлено вами'?title.original:title.title});
 if(title.kind==='anime'&&title.apiId){params.set('shikimoriID',String(title.apiId));params.set('types','anime,anime-serial');}
 else if(kinopoiskId(title))params.set('kinopoiskID',kinopoiskId(title));
 else if(/^tt\d+$/.test(title.imdbId||''))params.set('imdbID',title.imdbId);
 else throw Error('В каталоге пока нет идентификатора для этого тайтла. Попробуйте другой плеер или обновите данные карточки.');
 return 'https://kodik.cc/find-player?'+params;
}
export function withEpisode(base,title,index){
 const url=new URL(normalizeFrameUrl(base)),coords=episodeCoordinates(title,index);
 url.searchParams.set('season',String(coords.season));url.searchParams.set('episode',String(coords.episode));
 return url.href;
}
export async function providerFrameUrl(title,provider,fetchJson){
 const id=kinopoiskId(title);
 if(id){
  try{
   const response=await fetchJson('https://api.kinobox.tv/api/players?kinopoisk='+encodeURIComponent(id));
   const players=Array.isArray(response)?response:response.data;
   const match=players?.find(p=>String(p.type).toLowerCase()===provider&&p.iframeUrl);
   if(match)return normalizeFrameUrl(match.iframeUrl);
  }catch(err){if(provider==='turbo')throw err;}
 }
 if(provider==='kodik')return kodikFrameUrl(title);
 if(!id)throw Error('Для Turbo в каталоге не найден ID Кинопоиска. Выберите Kodik.');
 throw Error('Turbo не найден для этого тайтла. Выберите Kodik.');
}
export const turboFrameUrl=(title,fetchJson)=>providerFrameUrl(title,'turbo',fetchJson);
