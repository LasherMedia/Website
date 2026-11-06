/* Reads photo lists straight from Google Drive folders or Google Cloud Storage buckets (public / "anyone with the link"). */
(function(g){
const IMG=/\.(jpe?g|png|webp|gif|avif)$/i;
function driveId(v){v=String(v||'').trim();const m=/(?:\/folders\/|[?&]id=)([\w-]{10,})/.exec(v);if(m)return m[1];return /^[\w-]{10,}$/.test(v)?v:''}
function gcsParts(v){
  let s=String(v||'').trim().replace(/^gs:\/\//,'').replace(/^https?:\/\/(?:storage\.googleapis\.com|storage\.cloud\.google\.com)\//,'').replace(/^\/+/,'');
  const i=s.indexOf('/');return i<0?{bucket:s,prefix:''}:{bucket:s.slice(0,i),prefix:s.slice(i+1).replace(/\/*$/,'')+'/'};
}
const fail=(code,detail)=>Object.assign(new Error(code),{detail:detail||''});
async function listDrive(folder,key){
  const id=driveId(folder);if(!id)throw fail('badfolder');if(!key)throw fail('nokey');
  let out=[],tok='';
  do{
    const u='https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent("'"+id+"' in parents and mimeType contains 'image/' and trashed=false")
      +'&fields='+encodeURIComponent('nextPageToken,files(id,name)')+'&orderBy=name_natural&pageSize=1000&key='+encodeURIComponent(key)+(tok?'&pageToken='+encodeURIComponent(tok):'');
    const r=await fetch(u);
    if(!r.ok){let m='';try{m=(await r.json()).error.message}catch(e){}throw fail(r.status===403||r.status===400?'forbidden':r.status===404?'notfound':'drive',m)}
    const j=await r.json();out=out.concat(j.files||[]);tok=j.nextPageToken||'';
  }while(tok);
  return out.map(f=>({name:f.name.replace(/\.[^.]+$/,''),
    thumb:'https://lh3.googleusercontent.com/d/'+f.id+'=w720',thumbAlt:'https://drive.google.com/thumbnail?id='+f.id+'&sz=w720',
    full:'https://lh3.googleusercontent.com/d/'+f.id+'=w2400',fullAlt:'https://drive.google.com/thumbnail?id='+f.id+'&sz=w2400',
    download:'https://drive.google.com/uc?export=download&id='+f.id}));
}
async function listGcs(folder){
  const p=gcsParts(folder);if(!p.bucket)throw fail('badfolder');
  let out=[],tok='';
  do{
    const u='https://storage.googleapis.com/storage/v1/b/'+encodeURIComponent(p.bucket)+'/o?delimiter=%2F&maxResults=1000&fields='+encodeURIComponent('items(name,contentType),nextPageToken')
      +(p.prefix?'&prefix='+encodeURIComponent(p.prefix):'')+(tok?'&pageToken='+encodeURIComponent(tok):'');
    const r=await fetch(u);
    if(!r.ok)throw fail(r.status===404?'notfound':'forbidden');
    const j=await r.json();out=out.concat((j.items||[]).filter(i=>IMG.test(i.name)||/^image\//.test(i.contentType||'')));tok=j.nextPageToken||'';
  }while(tok);
  return out.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(i=>{
    const url='https://storage.googleapis.com/'+p.bucket+'/'+i.name.split('/').map(encodeURIComponent).join('/');
    return{name:i.name.split('/').pop().replace(/\.[^.]+$/,''),thumb:url,full:url,download:url};
  });
}
async function list(source,folder,key){return source==='gcs'?listGcs(folder):listDrive(folder,key)}
const message=e=>({nokey:'This gallery isn\u2019t connected to Google yet.',badfolder:'That folder link doesn\u2019t look right.',forbidden:'Google wouldn\u2019t let the site read this folder. Check that the folder is shared with \u201Canyone with the link\u201D and that the API key allows this website.',notfound:'That folder couldn\u2019t be found.'}[e.message]||'The photos couldn\u2019t be loaded right now. Try again in a moment.');
g.GSrc={list,driveId,gcsParts,message};
})(window);
