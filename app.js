(function(){
const h=(t,c,...k)=>{const e=document.createElement(t);if(c)e.className=c;k.flat().forEach(x=>x!=null&&x!==false&&e.append(x));return e};
const A=(href,c,...k)=>{const a=h('a',c,...k);a.href=href||'#';if(/^https?:/.test(href||'')){a.target='_blank';a.rel='noopener'}return a};
const img=(src,alt,c,eager)=>{const i=h('img',c);i.src=src;i.alt=alt||'';if(!eager)i.loading='lazy';return i};
const HOST=location.hostname.toLowerCase();
/* socials.lashermedia.com (or links./link./bio.) opens the link page at its root, so no /links needed */
const AS_LINKS=document.body.dataset.page==='home'&&/^(socials|links|link|bio)\./.test(HOST)&&location.pathname.replace(/index\.html$/,'').replace(/\/+$/,'')==='';
const PAGE=AS_LINKS?'links':(document.body.dataset.page||'home');
const setVh=()=>document.documentElement.style.setProperty('--vh',(window.innerHeight/100)+'px');setVh();addEventListener('resize',setVh);addEventListener('orientationchange',()=>setTimeout(setVh,250));
if(!window.SITE){
  const m=document.getElementById('app');
  if(m)m.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;padding:30px;text-align:center;font-family:Inter,system-ui,sans-serif;color:#f4f4f6"><div><h1 style="font-size:1.6rem;margin-bottom:10px">This page could not load its content</h1><p style="color:#9b9ea8;max-width:46ch;margin:auto">The file <b>content.js</b> was not found next to this page. Upload content.js (and the images folder) to the same place as this page, then refresh.</p></div></div>';
  return;
}
/* true only inside the editor's own preview, not when another site frames this page */
const PREVIEW=(()=>{if(window===window.parent)return false;try{return !!window.parent.document.getElementById('f')}catch(e){return false}})();
const slug=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const count=(n,w)=>n+' '+(n===1?w:(/y$/.test(w)?w.slice(0,-1)+'ies':w+'s'));
let io;const hashFns=[];

function headline(text,accent){
  const ac=(accent||'').toLowerCase().split(/\s+/).map(x=>x.replace(/[^\w']/g,'')).filter(Boolean),f=document.createDocumentFragment();
  text.split(' ').forEach((w,i)=>{
    const hot=ac.includes(w.toLowerCase().replace(/[^\w']/g,'')),s=h('span','wi'+(hot?' ac':''),w);
    s.style.setProperty('--i',i);f.append(h('span','w',s),' ');
  });return f;
}
const head=(n,title,text)=>h('div','sec-head reveal',h('span','num',n),h('h2','',title),text?h('p','lead',text):null);

/* category tiles -> click to see that category's items */
function explorer(cats,items,mk,noun,gridCls,top){
  const root=h('div','explorer'),tiles=h('div','cats'),view=h('div','catview');
  const by=c=>items.filter(i=>i.category===c.name);
  cats.forEach(c=>{
    tiles.append(A('#'+slug(c.name),'cat reveal',c.image?img(c.image,'','cbg'):h('i','cbg gen'),h('i','cshade'),
      h('div','cin',h('span','cn',count(by(c).length,noun)),h('b','',c.name),c.text?h('small','',c.text):null),h('span','arr','→')));
  });
  function sync(first){
    const s=decodeURIComponent((location.hash||'').slice(1)),c=cats.find(x=>slug(x.name)===s);
    view.textContent='';if(top)top.hidden=!!c;
    if(!c){tiles.hidden=false;view.hidden=true;return}
    tiles.hidden=true;view.hidden=false;const list=by(c);
    view.append(h('div','catbar',A('#','back','← All categories'),h('h3','',c.name),c.text?h('p','lead',c.text):null),
      list.length?h('div',gridCls,list.map(mk)):h('p','empty','Nothing here yet. New work is on the way.'));
    if(!first)root.scrollIntoView({behavior:'smooth',block:'start'});
  }
  hashFns.push(sync);sync(true);top?root.append(top,tiles,view):root.append(tiles,view);return root;
}
const igSrc=u=>{const m=/instagram\.com\/(p|reel|tv)\/([\w-]+)/.exec(u||'');return m?'https://www.instagram.com/'+(m[1]==='tv'?'p':m[1])+'/'+m[2]+'/embed':null};
function sorted(cats,items){
  cats=(cats||[]).slice();items=items||[];
  const ok=n=>cats.some(c=>c.name===n),lost=items.some(i=>!ok(i.category));
  if(!lost)return[cats,items];
  if(!ok('More'))cats.push({name:'More',text:'',image:''});
  return[cats,items.map(i=>ok(i.category)?i:Object.assign({},i,{category:'More'}))];
}
const mkProject=B=>p=>{
  const src=igSrc(p.embed);
  if(src){const f=h('iframe','igframe');f.src=src;f.loading='lazy';f.title=p.title||'Instagram post';f.setAttribute('scrolling','no');f.setAttribute('frameborder','0');
    return h('article','pcard ig',f,h('div','pb',p.title?h('h3','',p.title):null,p.text?h('p','',p.text):null,A(p.embed,'more','View on Instagram →')))}
  return h('article','pcard',
    p.image?img(p.image,p.title,'pm'):h('div','pm cover',img(B.logo,'','cl',true)),
    h('div','pb',p.tag?h('span','tag',p.tag):null,h('h3','',p.title),h('p','',p.text),p.link?A(p.link,'more',(p.linkLabel||'View project')+' →'):null));
};
const isLocked=g=>!!((g.vault&&g.locked)||g.protectedUrl||(PREVIEW&&g.password));
const mkGallery=B=>g=>{
  const locked=isLocked(g);
  const c=A(g.url||'#','gcard',g.image?img(g.image,g.title,'gimg'):h('div','gimg gen',img(B.logo,'','gcl',true)),h('i','gshade'),
    h('div','gin',h('span','gl',locked?h('i','lk'):null,g.label||(locked?'Password protected':(g.vault?'View gallery':'View photos'))),h('b','',g.title)),h('span','arr','→'));
  c.dataset.slug=slug(g.title);
  if(g.vault||locked)c.onclick=e=>{e.preventDefault();locked?ask(g,B):openPublic(g)};
  return c};

/* password-protected gallery viewer */
function viewer(v){
  const ov=h('div','vault'),grid=h('div','vgrid'),status=h('small','',''),urls=[],items=[];
  const close=h('button','btn','Close');
  const done=()=>{ov.remove();document.body.classList.remove('lock');removeEventListener('keydown',key);urls.forEach(u=>URL.revokeObjectURL(u))};
  close.onclick=done;
  const key=e=>{if(e.key==='Escape')done()};addEventListener('keydown',key);
  ov.append(h('div','vhead',h('div','',h('small','','Private gallery'),h('h2','',v.title),status),close),grid);
  ov.addEventListener('contextmenu',e=>e.preventDefault());
  document.body.append(ov);document.body.classList.add('lock');
  function light(i){
    const lb=h('div','light'),im=h('img');im.draggable=false;
    const set=n=>{i=(n+items.length)%items.length;im.src=items[i].url};set(i);
    const prev=h('button','lnav l','‹'),next=h('button','lnav r','›'),x=h('button','lx','✕');
    prev.onclick=e=>{e.stopPropagation();set(i-1)};next.onclick=e=>{e.stopPropagation();set(i+1)};
    const closeLb=()=>{lb.remove();removeEventListener('keydown',lk)};x.onclick=closeLb;lb.onclick=e=>{if(e.target===lb)closeLb()};
    const lk=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();closeLb()}if(e.key==='ArrowLeft')set(i-1);if(e.key==='ArrowRight')set(i+1)};addEventListener('keydown',lk,true);
    lb.append(im,prev,next,x);
    if(v.allowDownload){const d=A('#','btn primary dl','Download');d.onclick=e=>{e.preventDefault();e.stopPropagation();const a=h('a');a.href=items[i].url;a.download=items[i].name;a.click()};lb.append(d)}
    ov.append(lb);
  }
  (async()=>{
    for(let i=0;i<v.count;i++){
      status.textContent='Loading '+(i+1)+' of '+v.count+'…';
      try{const f=await v.load(i);urls.push(f.url);items.push(f);
        const im=h('img');im.src=f.url;im.alt=f.name;im.draggable=false;const n=items.length-1;im.onclick=()=>light(n);grid.append(h('div','vi',im))}catch(e){}
    }
    status.textContent=count(items.length,'photo');
  })();
}
async function openPublic(g){
  try{viewer(await Vault.openPublic(g.vault))}catch(e){alert('Sorry, this gallery could not be loaded.')}
}
function ask(g,B){
  const bg=h('div','pop-bg'),card=h('div','pop'),input=h('input');
  input.type='password';input.placeholder='Enter password';input.autocomplete='off';input.spellcheck=false;input.autocapitalize='off';input.setAttribute('aria-label','Gallery password');
  const eye=h('button','eye','Show');eye.type='button';eye.onclick=()=>{const s=input.type==='password';input.type=s?'text':'password';eye.textContent=s?'Hide':'Show'};
  const btn=h('button','btn primary','Unlock');btn.type='submit';
  const msg=h('p','pmsg'),form=h('form','pform',h('div','pwrap',input,eye),btn),x=h('button','px','✕');x.type='button';x.setAttribute('aria-label','Close');
  const title=h('h3','','This is password protected.'),sub=h('p','psub',g.title);
  card.append(x,h('span','plock'),title,sub,form,msg,img(B.logo,'','pop-logo',true));
  const close=()=>{bg.remove();removeEventListener('keydown',key);document.body.classList.remove('lock')};
  const key=e=>{if(e.key==='Escape')close()};addEventListener('keydown',key);
  x.onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
  const unlocked=url=>{
    card.classList.add('ok');title.textContent='Unlocked.';sub.textContent='Your gallery is ready.';
    form.replaceWith(A(url,'btn primary pgo','Open gallery →'));msg.textContent='';
  };
  form.onsubmit=async e=>{
    e.preventDefault();const pw=input.value.trim();if(!pw)return;btn.disabled=true;msg.textContent='Checking…';
    try{
      if(g.vault){
        if(!window.Vault||!(window.crypto&&crypto.subtle))throw new Error('nosec');
        const v=await Vault.open(g.vault,pw);close();viewer(v);
      }else if(g.protectedUrl){
        if(!window.Vault||!(window.crypto&&crypto.subtle))throw new Error('nosec');
        unlocked(await Vault.unlockLink(g.protectedUrl,pw));
      }else{
        if(String(pw).toLowerCase()!==String(g.password).trim().toLowerCase())throw new Error('bad');
        unlocked(g.url||'#');
      }
    }catch(err){
      msg.textContent=err.message==='nosec'?'Protected galleries need a secure (https) connection.':err.message==='missing'?'This gallery is not available right now.':'That password isn\'t right. Try again.';
      card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake');input.select();
    }
    btn.disabled=false;
  };
  bg.append(card);document.body.append(bg);document.body.classList.add('lock');setTimeout(()=>input.focus(),60);
}

const ICONS={
 email:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 6 8-6"/></svg>',
 instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none"/></svg>',
 facebook:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M13.4 21v-8h2.7l.5-3.2h-3.2V7.9c0-.9.4-1.7 1.8-1.7h1.5V3.4S15.4 3.2 14.2 3.2c-2.6 0-4.3 1.6-4.3 4.4v2.2H7.1V13h2.8v8z"/></svg>',
 tiktok:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.3V2h-3.4v13.7a2.9 2.9 0 0 1-5.2 1.7 2.9 2.9 0 0 1 2.3-4.6c.3 0 .6 0 .9.1V9.4a6.8 6.8 0 0 0-1-.1A6.3 6.3 0 0 0 5 20.1a6.3 6.3 0 0 0 10.9-4.4v-7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.9 4.9 0 0 1-1.1-.1z"/></svg>',
 behance:'<svg viewBox="1.6 3.6 21.2 16.8" fill="#fff"><path d="M9.2 5.5H3v13h6.4c3 0 4.6-1.5 4.6-3.8 0-1.7-.9-2.8-2.4-3.2 1-.5 1.7-1.4 1.7-2.8 0-2.1-1.6-3.2-4.1-3.2zM5.7 7.7h2.9c1.1 0 1.7.5 1.7 1.4 0 .9-.6 1.4-1.7 1.4H5.7zm3.1 8.6H5.7v-3.5h3.1c1.3 0 2 .6 2 1.7 0 1.2-.7 1.8-2 1.8z"/><path d="M15 6.4h5v1.5h-5z"/><path d="M17.5 9.3c-2.6 0-4.2 1.7-4.2 4.1 0 2.5 1.6 4.2 4.3 4.2 2 0 3.4-.9 3.9-2.6h-2.2c-.2.6-.8 1-1.6 1-1.1 0-1.7-.6-1.8-1.7h5.8c.2-2.9-1.3-5-4.2-5zm-1.7 3.3c.1-.9.7-1.5 1.7-1.5s1.5.6 1.6 1.5z"/></svg>',
 link:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'
};
function linkDefaults(S){
  const soc=((S.contact||{}).socials||[]).filter(s=>s&&s.url&&s.url!=='#'),find=n=>(soc.find(s=>String(s.label).toLowerCase()===n)||{}).url;
  return{tagline:'Turning Flashbacks into Frames',items:[
    {label:'Email',url:'',icon:'email'},
    {label:'Website',url:'https://lashermedia.com',icon:'website'},
    {label:'Behance',url:find('behance')||'https://www.behance.net/lashermedia',icon:'behance'},
    {label:'TikTok',url:find('tiktok')||'https://www.tiktok.com/@lashermedia_',icon:'tiktok'},
    {label:'Instagram',url:find('instagram')||'https://www.instagram.com/lashermedia',icon:'instagram'},
    {label:'Facebook',url:find('facebook')||'https://www.facebook.com/lashermedia/',icon:'facebook'}]};
}
function renderLinks(S){
  const B=S.brand,C=S.contact||{},app=document.getElementById('app');app.textContent='';
  const L=(S.links&&(S.links.items||[]).length)?S.links:linkDefaults(S);
  document.title=B.name+' | Links';
  const page=h('div','lp');
  page.append(h('div','hero-bg',h('i','blob b1'),h('i','blob b2'),h('i','lines')));
  const list=h('ul','lp-list');
  (L.items||[]).forEach((it,i)=>{
    const url=it.url||(it.icon==='email'&&C.email?'mailto:'+C.email:'#');
    const ic=h('span','lp-ic');
    if(it.icon==='website')ic.append(img(B.logo,'','lp-lm',true));else ic.innerHTML=ICONS[it.icon]||ICONS.link;
    const a=A(url,'lp-btn',ic,h('span','lp-t',it.label),h('span','lp-arr','→'));a.style.setProperty('--i',i);
    list.append(h('li','',a));
  });
  page.append(h('div','lp-in',img(B.logo,B.name,'lp-logo',true),h('h1','',B.name),h('p','lp-tag',L.tagline),list,
    h('p','lp-foot',S.footer)));
  page.addEventListener('pointermove',e=>{const b=page.getBoundingClientRect();page.style.setProperty('--mx',(e.clientX-b.left)+'px');page.style.setProperty('--my',(e.clientY-b.top)+'px')});
  app.append(page);
  /* If a wrapper page frames this on a phone without phone settings, the layout is far wider than the screen
     and everything looks tiny. Detect that and scale the content up so it fills the screen. */
  const fit=()=>{const sw=screen.width||innerWidth,z=(window.matchMedia&&matchMedia('(pointer:coarse)').matches&&innerWidth>sw*1.4)?innerWidth/sw:1;page.style.setProperty('--z',z.toFixed(3))};
  fit();addEventListener('resize',fit);
}

function render(S){
  const T=S.theme||{},B=S.brand,H=S.hero,P=S.projects||{},G=S.galleries||{},Ab=S.about||{},C=S.contact||{},Hm=S.home||{};
  const acc=(T.accents&&T.accents[PAGE==='links'?'home':PAGE])||T.accent||'#FF2A3D',r=document.documentElement.style,rgb=x=>[1,3,5].map(i=>parseInt(x.substr(i,2),16)).join(',');
  r.setProperty('--red',acc);r.setProperty('--rgb',rgb(acc));r.setProperty('--bg',T.bg||'#07080B');r.setProperty('--bgrgb',rgb(T.bg||'#07080B'));r.setProperty('--ink',T.ink||'#F4F4F6');
  if(PAGE==='links'){renderLinks(S);return}
  const label={projects:'Projects',galleries:'Galleries',contact:'Contact'}[PAGE];
  document.title=label?label+' | '+B.name:B.name+(B.title?' | '+B.title:'');
  hashFns.length=0;
  const app=document.getElementById('app');app.textContent='';

  /* header */
  const L=[['index.html','Home','home'],['projects.html','Projects','projects'],['galleries.html','Galleries','galleries'],['contact.html','Contact','contact']];
  const nav=h('nav','',L.map(([u,t,k])=>{const a=A(u,'',t);if(k===PAGE)a.setAttribute('aria-current','page');return a}));
  const burger=h('button','burger');burger.setAttribute('aria-label','Menu');burger.append(h('i'),h('i'));
  const brand=A('index.html','brand',img(B.logo,'','',true),B.showName&&B.name?h('span','',B.name):null);brand.setAttribute('aria-label',B.name||'Home');
  app.append(h('header','',h('div','wrap bar',brand,nav,burger)));
  burger.onclick=()=>document.body.classList.toggle('menu');nav.onclick=()=>document.body.classList.remove('menu');

  /* hero + marquee (home only) */
  if(PAGE==='home'){
    const hero=h('section','hero');hero.id='top';
    hero.append(h('div','hero-bg',h('i','blob b1'),h('i','blob b2'),h('i','lines')));
    if(H.video){const v=h('video','hero-video');v.src=H.video;v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;v.setAttribute('muted','');v.play&&v.play().catch(()=>{});hero.append(v,h('i','veil'))}
    if(H.image)hero.append(img(H.image,'','hero-photo',true),h('i','veil'));
    hero.append(h('div','wrap hero-in',
      h('div','hero-copy',h('h1','',headline(H.headline,H.accent)),h('p','lead reveal',H.sub),
        h('div','actions reveal',A('projects.html','btn primary',H.primary),A('contact.html','btn',H.secondary))),
      img(B.logo,'','hero-logo',true)),h('span','cue'));
    hero.addEventListener('pointermove',e=>{const b=hero.getBoundingClientRect();hero.style.setProperty('--mx',(e.clientX-b.left)+'px');hero.style.setProperty('--my',(e.clientY-b.top)+'px')});
    app.append(hero);
    const items=S.marquee||[];
    if(items.length){const tr=h('div','track');for(let n=0;n<2;n++)items.forEach(t=>tr.append(h('span','',t)));app.append(h('div','marquee',tr))}
  }
  const main=h('main');app.append(main);const secs={};

  /* home sections */
  const as=h('section','');as.id='about';
  as.append(h('div','wrap about',Ab.photo?h('div','portrait reveal',img(Ab.photo,'Portrait')):h('div','portrait reveal ph',img(B.logo,'','pl',true)),
    h('div','reveal',h('span','num','About'),h('h2','',Ab.heading),(Ab.paragraphs||[]).map(t=>h('p','',t)),h('ul','skills',(Ab.skills||[]).map(s=>h('li','',s))))));
  secs.about=as;
  const Sv=Hm.services||{items:[]},sv=h('section','alt');sv.id='services';
  sv.append(h('div','wrap',head('Services',Sv.heading,Sv.text),
    h('div','svc',(Sv.items||[]).map((s,i)=>h('div','svc-card reveal',h('span','sn',String(i+1).padStart(2,'0')),h('h3','',s.title),h('p','',s.text))))));
  secs.services=sv;
  const Fe=Hm.featured||{},fs=h('section','');
  fs.append(h('div','wrap',head('Featured',Fe.heading,Fe.text),h('div','pgrid',(P.items||[]).slice(0,3).map(mkProject(B))),
    h('div','actions reveal',A('projects.html','btn','See all projects'))));
  secs.featured=fs;
  const St=Hm.steps||{items:[]},ss=h('section','alt');
  ss.append(h('div','wrap',head('Process',St.heading),h('ol','steps',(St.items||[]).map((s,i)=>h('li','step reveal',h('span','sn',i+1),h('h3','',s.title),h('p','',s.text))))));
  secs.steps=ss;
  const Ct=Hm.cta||{},cs0=h('section','');
  cs0.append(h('div','wrap',h('div','cta-box reveal',h('h2','',Ct.heading),h('p','lead',Ct.text),h('div','actions',A('contact.html','btn primary',Ct.button||'Get in touch')))));
  secs.cta=cs0;

  /* projects */
  const ps=h('section','');const [pc,pi]=sorted(P.categories,P.items);
  ps.append(h('div','wrap',head('Projects',P.heading,P.text),explorer(pc,pi,mkProject(B),'project','pgrid')));secs.projects=ps;

  /* galleries */
  const gs=h('section','');
  const [gc,gItems]=sorted(G.categories,G.items);
  const recent=gItems.slice(0,2);
  const latest=recent.length?h('div','latest reveal',h('h3','sub','Most recent'),h('div','ggrid '+(recent.length>1?'two':'one'),recent.map(mkGallery(B)))):null;
  gs.append(h('div','wrap',head('Galleries',G.heading,G.text),explorer(gc,gItems,mkGallery(B),'gallery','ggrid',latest)));secs.galleries=gs;
  if(PAGE==='galleries'&&!PREVIEW){
    const go=()=>{const s=decodeURIComponent((location.hash||'').slice(1)),g=gItems.find(x=>slug(x.title)===s);if(!g)return;
      if(g.vault||isLocked(g)){isLocked(g)?ask(g,B):openPublic(g)}
      else{if(g.category&&decodeURIComponent(location.hash.slice(1))!==slug(g.category))location.hash='#'+slug(g.category);
        setTimeout(()=>{const el=[...document.querySelectorAll('[data-slug="'+s+'"]')].find(e=>e.offsetParent);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('flash')}},250)}};
    hashFns.push(go);setTimeout(go,350);
  }

  /* contact */
  const cs=h('section','');
  const mk=(l,t,n,req)=>{const i=h(t==='area'?'textarea':'input');i.name=n;if(t==='email')i.type='email';if(req)i.required=true;if(t==='area')i.rows=5;return h('label','',l,i)};
  const sel=h('select');sel.name='type';(C.types||[]).forEach(t=>{const o=h('option','',t);o.value=t;sel.append(o)});
  const form=h('form','form',mk('Your name','text','name',1),mk('Email','email','email',1),h('label','','Type of project',sel),mk('Tell me about it','area','msg'),h('button','btn primary','Send message'));
  form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);
    const body='Hi,\n\n'+d.get('msg')+'\n\nType: '+d.get('type')+'\nFrom: '+d.get('name')+' ('+d.get('email')+')';
    location.href='mailto:'+C.email+'?subject='+encodeURIComponent('Project inquiry from '+d.get('name'))+'&body='+encodeURIComponent(body)};
  cs.append(h('div','wrap contact',h('div','',head('Contact',C.heading,C.text),
    h('div','reveal links',A('mailto:'+C.email,'',h('small','','Email'),C.email),(C.socials||[]).map(s=>A(s.url,'',h('small','','Follow'),s.label)))),
    h('div','reveal',form)));secs.contact=cs;

  ({home:['about','services','featured','steps','cta'],projects:['projects'],galleries:['galleries'],contact:['contact']}[PAGE]||['about']).forEach(k=>main.append(secs[k]));
  if(PAGE!=='home')main.firstElementChild.classList.add('first');
  app.append(h('footer','',h('div','wrap foot',img(B.logo,'','fl',true),h('span','',S.footer))));

  if(io)io.disconnect();
  const els=app.querySelectorAll('.reveal');
  if(PREVIEW||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'))}
  else{io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px'});
    els.forEach((e,i)=>{e.style.transitionDelay=(i%3)*90+'ms';io.observe(e)})}
}
const onScroll=()=>document.body.classList.toggle('scrolled',scrollY>10);
addEventListener('scroll',onScroll,{passive:true});onScroll();
addEventListener('hashchange',()=>hashFns.forEach(f=>f()));
if(PREVIEW)addEventListener('message',e=>{if(e.data&&e.data.type==='site')render(e.data.data)});
render(window.SITE);
})();
