import json,subprocess,pathlib,time,re
root=pathlib.Path('dist/assets')
def get(url):
 r=subprocess.run(['curl.exe','-L','--silent','--show-error','--connect-timeout','5','--max-time','15',url],capture_output=True,check=True)
 return json.loads(r.stdout)
def download(url,target):
 subprocess.run(['curl.exe','-L','--silent','--show-error','--connect-timeout','5','--max-time','15',url,'-o',str(target)],check=True)
items=[]
for id in [52991,44511,40748,16498,38000,21,1535,5114,52034,52588]:
 try:
  a=get(f'https://shikimori.io/api/animes/{id}')
  poster='https://shikimori.io'+a['image']['original'];download(poster,root/f'anime-{id}.jpg')
  items.append(dict(id=f'anime-{id}',apiId=id,provider='shikimori',kind='anime',title=a.get('russian') or a['name'],original=next((s for s in a.get('english',[]) if s),a['name']),aliases=[a['name']]+a.get('english',[])+a.get('synonyms',[]),poster=f'assets/anime-{id}.jpg',total=a.get('episodes') or None,released=a.get('episodes') if a['status']=='released' else a.get('episodes_aired'),duration=a.get('duration') or None,year=int(a['aired_on'][:4]) if a.get('aired_on') else None,score=float(a['score']),genres=[g.get('russian') or g['name'] for g in a.get('genres',[])],description=re.sub(r'\[/?[^\]]+\]','',a.get('description') or ''),airing=a['status']!='released',source='https://shikimori.io'+a['url']))
  print('Fetched anime',id,flush=True)
 except Exception as e:print(id,str(e),flush=True)
 time.sleep(.3)
for name,ru in [('Severance','Разделение'),('Stranger Things','Очень странные дела'),('The Last of Us','Одни из нас'),('Breaking Bad','Во все тяжкие')]:
 try:
  a=get('https://api.tvmaze.com/singlesearch/shows?q='+__import__('urllib.parse',fromlist=['quote']).quote(name)+'&embed=episodes');id=a['id'];eps=a['_embedded']['episodes'];released=[e for e in eps if e.get('airstamp') and e['airstamp'][:10]<=time.strftime('%Y-%m-%d')]
  download(a['image']['original'],root/f'tv-{id}.jpg')
  items.append(dict(id=f'tv-{id}',apiId=id,kind='tv',title=ru,original=a['name'],aliases=[a['name']],poster=f'assets/tv-{id}.jpg',total=len(eps) if a['status']=='Ended' else None,released=len(released),duration=a.get('averageRuntime') or a.get('runtime') or 45,episodeData=[{'duration':e.get('runtime') or a.get('averageRuntime') or 45,'airdate':e.get('airstamp'),'label':f"S{e['season']:02}E{e['number'] or 0:02}"} for e in eps],year=int(a['premiered'][:4]),score=a.get('rating',{}).get('average'),genres=a['genres'],description=re.sub('<[^>]+>','',a.get('summary') or ''),airing=a['status']!='Ended',source=a['url']))
  print('Fetched TV',id,flush=True)
 except Exception as e:print(name,str(e),flush=True)
pathlib.Path('dist/catalog.json').write_text(json.dumps(items,ensure_ascii=False),encoding='utf-8')
print('Saved',len(items),'titles',flush=True)
