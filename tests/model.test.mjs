import test from 'node:test';
import assert from 'node:assert/strict';
import {watch,undo,count,minutes,available,validateBackup} from '../dist/model.js';
const makeState=()=>({name:'Тест',demo:false,entries:{},events:[]});
const anime={id:'anime-1',title:'Тест',kind:'anime',total:3,released:2,duration:24,airing:true};
test('Одна отметка добавляет эпизод, время и статус; вышедшие эпизоды ограничивают прогресс',()=>{
 const state=makeState();assert.equal(watch(state,anime).ok,true);assert.equal(count(state,anime.id),1);assert.equal(minutes(state),24);assert.equal(state.entries[anime.id].status,'watching');
 watch(state,anime);assert.equal(watch(state,anime).ok,false);assert.equal(count(state,anime.id),2);assert.equal(minutes(state),48);
});
test('Разная длительность эпизодов и отмена дают точную сумму',()=>{
 const state=makeState();const tv={...anime,kind:'tv',total:2,episodeData:[{duration:49,airdate:'2020-01-01'},{duration:65,airdate:'2020-01-02'},{duration:90,airdate:'2099-01-01'}]};
 assert.equal(available(tv),2);watch(state,tv);watch(state,tv);assert.equal(minutes(state),114);assert.equal(state.entries[tv.id].status,'completed');assert.equal(watch(state,tv).ok,false);
 undo(state,tv.id);assert.equal(minutes(state),49);assert.equal(count(state,tv.id),1);assert.equal(state.entries[tv.id].status,'watching');watch(state,tv);assert.equal(minutes(state),114);assert.equal(state.events.at(-1).episode,2);
});
test('Неизвестное число эпизодов не ограничивает просмотр, а ноль запрещает его',()=>{
 const state=makeState();assert.equal(watch(state,{...anime,released:0}).ok,false);assert.equal(watch(state,{...anime,total:null,released:null}).ok,true);assert.equal(watch(state,{...anime,total:null,released:null,duration:null}).ok,false);
});
test('Длительность в истории не меняется при обновлении каталога',()=>{
 const state=makeState();const t={...anime};watch(state,t);t.duration=50;watch(state,t);assert.equal(minutes(state),74);
});
test('Импорт проверяет связи, длительность и уникальность истории',()=>{
 const state=makeState();watch(state,anime);const backup={version:1,state,catalog:[anime]};assert.equal(validateBackup(backup),backup);
 const copy=()=>structuredClone(backup);let d=copy();d.state.events.push({...d.state.events[0]});assert.throws(()=>validateBackup(d));d=copy();d.state.events[0].minutes=-1;assert.throws(()=>validateBackup(d));d=copy();d.state.events[0].titleId='missing';assert.throws(()=>validateBackup(d));d=copy();d.state.entries[anime.id].status='bad';assert.throws(()=>validateBackup(d));
});
