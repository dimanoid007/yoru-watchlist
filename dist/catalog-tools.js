export const GENRES = [
 ['action','Экшен',1,['Action','Боевик']],
 ['adventure','Приключения',2,['Adventure']],
 ['comedy','Комедия',4,['Comedy']],
 ['drama','Драма',8,['Drama']],
 ['fantasy','Фэнтези',10,['Fantasy']],
 ['scifi','Фантастика',24,['Sci-Fi','Science-Fiction','Science Fiction','ScienceFiction']],
 ['mystery','Детектив',7,['Mystery','Мистика']],
 ['thriller','Триллер',41,['Thriller','Suspense','Саспенс']],
 ['horror','Ужасы',14,['Horror']],
 ['romance','Романтика',22,['Romance']],
 ['supernatural','Сверхъестественное',37,['Supernatural']],
 ['psychological','Психологическое',40,['Psychological']],
 ['slice','Повседневность',36,['Slice of Life']],
 ['historical','Исторический',13,['Historical','History']],
 ['sports','Спорт',30,['Sports']],
 ['music','Музыка',19,['Music','Musical']],
 ['crime','Криминал',null,['Crime']],
 ['family','Семейный',null,['Family']],
 ['war','Военный',38,['War','Military','Военное']],
].map(([id,label,animeId,aliases])=>({id,label,animeId,aliases}));
const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').trim();
export function genreKey(value){const n=norm(value);return GENRES.find(g=>[g.id,g.label,...g.aliases].some(s=>norm(s)===n))?.id||n;}
export function matchesFilters(title,{kind='all',genres=[],minScore=0,maxScore=10}={}){
 if(kind!=='all'&&title.kind!==kind)return false;
 const keys=new Set((title.genres?.length?title.genres:title.genreHints||[]).map(genreKey));
 if(!genres.every(g=>keys.has(g)))return false;
 const rating=Number(title.score);
 if(title.score==null||!Number.isFinite(rating)||rating===0)return minScore===0&&maxScore===10;
 return rating>=minScore&&rating<=maxScore;
}
export function filterTitles(titles,filters){
 const result=titles.filter(t=>matchesFilters(t,filters));
 const rating=t=>Number(t.score)||-1;
 if(filters.order==='score-desc')result.sort((a,b)=>rating(b)-rating(a));
 else if(filters.order==='score-asc')result.sort((a,b)=>rating(a)<0&&rating(b)<0?0:rating(a)<0?1:rating(b)<0?-1:rating(a)-rating(b));
 else if(filters.order==='year')result.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
 else if(filters.order==='title')result.sort((a,b)=>a.title.localeCompare(b.title,'ru'));
 return result;
}
export function animeSearchUrl(query,filters,page=1){
 const genres=filters.genres.map(id=>GENRES.find(g=>g.id===id)?.animeId);
 if(genres.some(id=>!id))return null;
 const params=new URLSearchParams({limit:'24',page:String(page),censored:'true',order:'ranked'});
 if(query)params.set('search',query);
 if(genres.length)params.set('genre',genres.join(','));
 if(filters.minScore)params.set('score',String(filters.minScore));
 return 'https://shikimori.io/api/animes?'+params;
}
const PLATFORMS=[
 ['crunchyroll.com','Crunchyroll'],['netflix.com','Netflix'],['kinopoisk.ru','Кинопоиск'],
 ['tv.apple.com','Apple TV'],['primevideo.com','Prime Video'],['hulu.com','Hulu'],
 ['disneyplus.com','Disney+'],['max.com','Max'],['hbomax.com','HBO Max'],['hbo.com','HBO'],
 ['ivi.ru','Иви'],['okko.tv','Okko'],['wink.ru','Wink'],['start.ru','START'],['premier.one','PREMIER'],
];
export function officialPlatform(url){try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)return null;return PLATFORMS.find(([domain])=>u.hostname===domain||u.hostname.endsWith('.'+domain))?.[1]||null;}catch{return null;}}
export function officialSources(title){
 const links=[];
 for(const source of title.officialSources||[]){const name=officialPlatform(source.url);if(name)links.push({name,url:source.url,label:source.label||`Страница на ${name}`,direct:true});}
 if(title.officialSite){const name=officialPlatform(title.officialSite);if(name)links.push({name,url:title.officialSite,label:title.streamingName||name,direct:true});}
 const name=encodeURIComponent(title.original&&title.original!=='Добавлено вами'?title.original:title.title);
 if(title.kind==='anime')links.push({name:'Crunchyroll',url:'https://www.crunchyroll.com/search?q='+name,label:'Найти на Crunchyroll'});
 links.push({name:'Кинопоиск',url:'https://www.kinopoisk.ru/index.php?kp_query='+encodeURIComponent(title.title),label:'Найти на Кинопоиске'});
 if(title.kind==='tv')links.push({name:'Netflix',url:'https://www.netflix.com/search?q='+name,label:'Найти на Netflix'});
 return links.filter((s,i,all)=>all.findIndex(v=>v.name===s.name)===i);
}
