import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFrameUrl,kodikFrameUrl,withEpisode,kinopoiskId,turboFrameUrl,providerFrameUrl} from '../dist/embedded-player.js';
import {watch,count,minutes,nextEpisode} from '../dist/model.js';
import {beginWatching,completeWatching} from '../dist/watch-session.js';
test('Плеер использует ID тайтла и координаты конкретного сезона без ключа API',()=>{
 const anime={kind:'anime',apiId:52991,title:'Фрирен'};
 const url=new URL(withEpisode(kodikFrameUrl(anime),anime,12));
 assert.equal(url.searchParams.get('shikimoriID'),'52991');assert.equal(url.searchParams.get('episode'),'12');assert.equal(url.searchParams.has('token'),false);
 const tv={kind:'tv',title:'Сериал',imdbId:'tt123',episodeData:[{label:'S02E03'}]};
 const tvUrl=new URL(withEpisode(kodikFrameUrl(tv),tv,1));assert.equal(tvUrl.searchParams.get('season'),'2');assert.equal(tvUrl.searchParams.get('episode'),'3');assert.equal(tvUrl.searchParams.get('imdbID'),'tt123');
});
test('Turbo использует iframe источника и обрабатывает отсутствие видео',async()=>{
 const title={officialSources:[{url:'https://www.kinopoisk.ru/series/5401195/'}]};assert.equal(kinopoiskId(title),'5401195');
 assert.equal(await turboFrameUrl(title,async()=>({data:[{type:'Turbo',iframeUrl:'//player.example/embed/1'}]})),'https://player.example/embed/1');
 assert.equal(await providerFrameUrl(title,'kodik',async()=>({data:[{type:'Kodik',iframeUrl:'//kodikplayer.com/serial/1'}]})),'https://kodikplayer.com/serial/1');
 await assert.rejects(()=>turboFrameUrl(title,async()=>({data:[]})));
 assert.throws(()=>normalizeFrameUrl('javascript:alert(1)'));assert.throws(()=>normalizeFrameUrl('http://example.com'));assert.throws(()=>normalizeFrameUrl('https://user:secret@example.com'));
});
test('Отметка выбранной серии не отмечает предыдущие и не удваивает время при повторе',()=>{
 const state={entries:{},events:[]},title={id:'anime-1',duration:24,total:5,released:5};
 beginWatching(state,title,'',Date.now(),3);assert.equal(completeWatching(state,title,3).ok,true);
 assert.equal(count(state,title.id),1);assert.equal(minutes(state),24);assert.equal(state.events[0].episode,3);assert.equal(nextEpisode(state,title.id),1);assert.equal(state.activeWatch.episode,4);
 assert.equal(watch(state,title,Date.now(),3).ok,false);assert.equal(minutes(state),24);
 watch(state,title,Date.now(),5);assert.equal(state.entries[title.id].status,'watching');
});
