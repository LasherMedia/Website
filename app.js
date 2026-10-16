(function(){
const h=(t,c,...k)=>{const e=document.createElement(t);if(c)e.className=c;k.flat().forEach(x=>x!=null&&x!==false&&e.append(x));return e};
const A=(href,c,...k)=>{const a=h('a',c,...k);a.href=href||'#';if(/^https?:/.test(href||'')){a.target='_blank';a.rel='noopener'}return a};
const img=(src,alt,c,eager)=>{const i=h('img',c);i.src=src;i.alt=alt||'';if(!eager)i.loading='lazy';return i};
const PAGE=document.body.dataset.page||'home';
const PREVIEW=window!==window.parent;
const slug=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const count=(n,w)=>n+' '+w+(n===1?'':'s');
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
function explorer(cats,items,mk,noun,gridCls){
  const root=h('div','explorer'),tiles=h('div','cats'),view=h('div','catview');
  const by=c=>items.filter(i=>i.category===c.name);
  cats.forEach(c=>{
    tiles.append(A('#'+slug(c.name),'cat reveal',c.image?img(c.image,'','cbg'):h('i','cbg gen'),h('i','cshade'),
      h('div','cin',h('span','cn',count(by(c).length,noun)),h('b','',c.name),c.text?h('small','',c.text):null),h('span','arr','→')));
  });
  function sync(first){
    const s=decodeURIComponent((location.hash||'').slice(1)),c=cats.find(x=>slug(x.name)===s);
    view.textContent='';
    if(!c){tiles.hidden=false;view.hidden=true;return}
    tiles.hidden=true;view.hidden=false;const list=by(c);
    view.append(h('div','catbar',A('#','back','← All categories'),h('h3','',c.name),c.text?h('p','lead',c.text):null),
      list.length?h('div',gridCls,list.map(mk)):h('p','empty','Nothing here yet. New work is on the way.'));
    if(!first)root.scrollIntoView({behavior:'smooth',block:'start'});
  }
  hashFns.push(sync);sync(true);root.append(tiles,view);return root;
}
const mkProject=B=>p=>h('article','pcard',
  p.image?img(p.image,p.title,'pm'):h('div','pm cover',img(B.logo,'','cl',true)),
  h('div','pb',p.tag?h('span','tag',p.tag):null,h('h3','',p.title),h('p','',p.text),p.link?A(p.link,'more',(p.linkLabel||'View project')+' →'):null));
const mkGallery=B=>g=>{
  const a=A(g.url||'#','row'+(g.image?' has-img':''),g.image?img(g.image,'','th'):null,h('span','t',g.title),
    h('span','l',g.vault&&g.locked?h('i','lk'):null,g.label||(g.vault?(g.locked?'Locked':'View gallery'):'Open gallery')),h('span','arr','→'));
  if(g.vault)a.onclick=e=>{e.preventDefault();g.locked?ask(g,B):openPublic(g)};
  return a};

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
  input.type='text';input.placeholder='Password';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','Gallery password');
  const btn=h('button','btn primary','Unlock');btn.type='submit';
  const msg=h('p','pmsg'),form=h('form','pform',input,btn),x=h('button','px','✕');x.type='button';x.setAttribute('aria-label','Close');
  card.append(x,h('span','plock'),h('h3','',g.title),h('p','','This gallery is locked. Enter the password you were given.'),form,msg,img(B.logo,'','pop-logo',true));
  const close=()=>{bg.remove();removeEventListener('keydown',key);document.body.classList.remove('lock')};
  const key=e=>{if(e.key==='Escape')close()};addEventListener('keydown',key);
  x.onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
  form.onsubmit=async e=>{
    e.preventDefault();const pw=input.value.trim();if(!pw)return;btn.disabled=true;msg.textContent='Unlocking…';
    try{
      if(!window.Vault||!(window.crypto&&crypto.subtle))throw new Error('nosec');
      const v=await Vault.open(g.vault,pw);close();viewer(v);
    }catch(err){
      msg.textContent=err.message==='nosec'?'Locked galleries need a secure (https) connection.':err.message==='missing'?'This gallery is not available right now.':'That password did not work. Check it and try again.';
      card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake');
    }
    btn.disabled=false;
  };
  bg.append(card);document.body.append(bg);document.body.classList.add('lock');setTimeout(()=>input.focus(),60);
}

function render(S){
  const T=S.theme||{},B=S.brand,H=S.hero,P=S.projects||{},G=S.galleries||{},Ab=S.about||{},C=S.contact||{},Hm=S.home||{};
  const acc=(T.accents&&T.accents[PAGE])||T.accent||'#FF2A3D',r=document.documentElement.style,rgb=x=>[1,3,5].map(i=>parseInt(x.substr(i,2),16)).join(',');
  r.setProperty('--red',acc);r.setProperty('--rgb',rgb(acc));r.setProperty('--bg',T.bg||'#07080B');r.setProperty('--bgrgb',rgb(T.bg||'#07080B'));r.setProperty('--ink',T.ink||'#F4F4F6');
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
  const ps=h('section','');ps.append(h('div','wrap',head('Projects',P.heading,P.text),explorer(P.categories||[],P.items||[],mkProject(B),'project','pgrid')));secs.projects=ps;

  /* galleries */
  const gs=h('section','');
  gs.append(h('div','wrap',head('Galleries',G.heading,G.text),explorer(G.categories||[],G.items||[],mkGallery(B),'gallery','gal')));secs.galleries=gs;

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
