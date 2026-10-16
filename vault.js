/* Password-protected galleries: files are encrypted with AES-GCM (key from the password via PBKDF2),
   so the public copies on your host are unreadable without the password. */
(function(g){
const enc=new TextEncoder(),dec=new TextDecoder();
const norm=p=>String(p).toLowerCase().replace(/[\s-]+/g,'');
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const rid=()=>hex(crypto.getRandomValues(new Uint8Array(12)));
async function keyFor(pw,salt){
  const m=await crypto.subtle.importKey('raw',enc.encode(norm(pw)),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(key,bytes){
  const iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
  const out=new Uint8Array(12+ct.length);out.set(iv);out.set(ct,12);return out;
}
async function unseal(key,buf){const b=new Uint8Array(buf);return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},key,b.slice(12)))}

/* locked gallery: returns {id, files:{path:Uint8Array}} */
async function build(pw,meta,files){
  const id=rid(),salt=crypto.getRandomValues(new Uint8Array(16)),key=await keyFor(pw,salt),out={};
  const man={title:meta.title,allowDownload:!!meta.allowDownload,files:files.map((f,i)=>({n:f.name,f:String(i+1).padStart(3,'0')+'.enc',t:f.type}))};
  const mb=await seal(key,enc.encode(JSON.stringify(man))),m=new Uint8Array(16+mb.length);m.set(salt);m.set(mb,16);
  out['vault/'+id+'/manifest.enc']=m;
  for(let i=0;i<files.length;i++)out['vault/'+id+'/'+man.files[i].f]=await seal(key,files[i].bytes);
  return{id,files:out};
}
/* unlocked gallery: plain files */
async function buildOpen(meta,files){
  const id=rid(),out={};
  const man={title:meta.title,allowDownload:!!meta.allowDownload,files:files.map((f,i)=>({n:f.name,f:String(i+1).padStart(3,'0')+'.jpg',t:f.type}))};
  out['gallery/'+id+'/manifest.json']=enc.encode(JSON.stringify(man));
  files.forEach((f,i)=>out['gallery/'+id+'/'+man.files[i].f]=f.bytes);
  return{id,files:out};
}
const view=(man,fetchBytes)=>({title:man.title,allowDownload:man.allowDownload,count:man.files.length,
  async load(i){const f=man.files[i],bytes=await fetchBytes(f.f);return{name:f.n,url:URL.createObjectURL(new Blob([bytes],{type:f.t||'image/jpeg'}))}}});
/* open a locked gallery: throws Error('bad') for a wrong password */
async function open(id,pw,base){
  base=base||'';const r=await fetch(base+'vault/'+id+'/manifest.enc');
  if(!r.ok)throw new Error('missing');
  const buf=new Uint8Array(await r.arrayBuffer()),key=await keyFor(pw,buf.slice(0,16));let man;
  try{man=JSON.parse(dec.decode(await unseal(key,buf.slice(16))))}catch(e){throw new Error('bad')}
  return view(man,async f=>unseal(key,await (await fetch(base+'vault/'+id+'/'+f)).arrayBuffer()));
}
async function openPublic(id,base){
  base=base||'';const r=await fetch(base+'gallery/'+id+'/manifest.json');if(!r.ok)throw new Error('missing');
  return view(await r.json(),async f=>new Uint8Array(await (await fetch(base+'gallery/'+id+'/'+f)).arrayBuffer()));
}
/* tiny store-only zip writer */
const T=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=-1;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^-1)>>>0};
function zip(files){
  const parts=[],cen=[],u16=n=>[n&255,n>>8&255],u32=n=>[n&255,n>>8&255,n>>16&255,n>>>24&255],keys=Object.keys(files);let off=0;
  for(const p of keys){const b=files[p],name=enc.encode(p),c=crc(b);
    const lh=new Uint8Array([0x50,0x4b,3,4,20,0,0,0,0,0,0,0,0,0,...u32(c),...u32(b.length),...u32(b.length),...u16(name.length),0,0]);
    parts.push(lh,name,b);
    cen.push(new Uint8Array([0x50,0x4b,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(c),...u32(b.length),...u32(b.length),...u16(name.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(off)]),name);
    off+=lh.length+name.length+b.length;}
  const cs=cen.reduce((a,x)=>a+x.length,0);
  const end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(keys.length),...u16(keys.length),...u32(cs),...u32(off),0,0]);
  return new Blob([...parts,...cen,end],{type:'application/zip'});
}
g.Vault={build,buildOpen,open,openPublic,zip,norm};
})(typeof window!=='undefined'?window:globalThis);
