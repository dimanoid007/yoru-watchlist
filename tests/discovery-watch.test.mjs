import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesFilters,filterTitles,animeSearchUrl} from '../dist/catalog-tools.js';
import {beginWatching,completeWatching} from '../dist/watch-session.js';
import {count,minutes} from '../dist/model.js';
const title={id:'test',kind:'anime',title:'История',original:'Story',genres:['Action','Fantasy'],score:8.5,total:2,released:2,duration:24};
test('Тип, все выбранные жанры и границы оценки применяются совместно',()=>{
 assert.equal(matchesFilters(title,{kind:'anime',genres:['action','fantasy'],minScore:8,maxScore:9}),true);
 assert.equal(matchesFilters(title,{kind:'tv'}),false);
 assert.equal(matchesFilters(title,{genres:['action','drama']}),false);
 assert.equal(matchesFilters({...title,genres:['Экшен','Фэнтези']},{genres:['action','fantasy']}),true);
 assert.equal(matchesFilters({...title,genres:['Science-Fiction']},{genres:['scifi']}),true);
 assert.equal(matchesFilters({...title,score:null},{minScore:7}),false);
 assert.equal(matchesFilters({...title,score:null}),true);
 assert.equal(matchesFilters(title,{minScore:8.5,maxScore:8.5}),true);
});
test('Оценки сортируются численно, поиск передаёт жанры и минимум в каталог',()=>{
 assert.deepEqual(filterTitles([title,{...title,id:'two',score:9},{...title,id:'three',score:null}],{order:'score-desc'}).map(t=>t.id),['two','test','three']);
 const url=new URL(animeSearchUrl('фрирен',{genres:['action','fantasy'],minScore:8},2));
 assert.equal(url.searchParams.get('genre'),'1,10');assert.equal(url.searchParams.get('score'),'8');assert.equal(url.searchParams.get('page'),'2');
 assert.equal(animeSearchUrl('',{genres:['crime'],minScore:0}),null);
});
test('Запуск просмотра не отмечает серию; повторное завершение не считает её дважды',()=>{
 const state={entries:{},events:[]};beginWatching(state,title,'https://www.crunchyroll.com/');
 assert.equal(count(state,title.id),0);assert.equal(minutes(state),0);
 assert.equal(completeWatching(state,title,1).ok,true);assert.equal(minutes(state),24);assert.equal(state.activeWatch.episode,2);
 assert.equal(completeWatching(state,title,1).ok,false);assert.equal(minutes(state),24);
 assert.equal(completeWatching(state,title,2).ok,true);assert.equal(minutes(state),48);assert.equal(state.activeWatch,null);assert.equal(state.entries[title.id].status,'completed');
});
