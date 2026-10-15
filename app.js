(function(){
const h=(t,c,...k)=>{const e=document.createElement(t);if(c)e.className=c;k.flat().forEach(x=>x!=null&&x!==false&&e.append(x));return e};
const A=(href,c,...k)=>{const a=h('a',c,...k);a.href=href||'#';if(/^https?:/.test(href||'')){a.target='_blank';a.rel='noopener'}return a};
const img=(src,alt,c)=>{const i=h('img',c);i.src=src;i.alt=alt||'';i.loading='lazy';return i};
const PAGE=document.body.dataset.page||'home';
const PREVIEW=window!==window.parent;
let io;

function headline(text,accent){
  const ac=(accent||'').toLowerCase().split(/\s+/).map(x=>x.replace(/[^\w']/g,'')).filter(Boolean),f=document.createDocumentFragment();
  text.split(' ').forEach((w,i)=>{
    const hot=ac.includes(w.toLowerCase().replace(/[^\w']/g,''));
    const s=h('span','wi'+(hot?' ac':''),w);s.style.setProperty('--i',i);
    f.append(h('span','w',s),' ');
  });return f;
}
function head(n,title,text){return h('div','sec-head reveal',h('span','num',n),h('h2','',title),text?h('p','lead',text):null)}

function render(S){
  const T=S.theme||{},r=document.documentElement.style,rgb=x=>[1,3,5].map(i=>parseInt(x.substr(i,2),16)).join(',');
  r.setProperty('--red',T.accent);r.setProperty('--rgb',rgb(T.accent));
  r.setProperty('--bg',T.bg);r.setProperty('--bgrgb',rgb(T.bg));r.setProperty('--ink',T.ink);
  const B=S.brand,H=S.hero,P=S.projects,G=S.galleries,Ab=S.about,C=S.contact;
  document.title=(PAGE==='home'?B.name+(B.title?' | '+B.title:''):({projects:'Projects',galleries:'Galleries',contact:'Contact'})[PAGE]+' | '+B.name);
  const app=document.getElementById('app');app.textContent='';

  /* header */
  const L=[['index.html','Home','home'],['projects.html','Projects','projects'],['galleries.html','Galleries','galleries'],['contact.html','Contact','contact']];
  const nav=h('nav','',L.map(([u,t,k])=>{const a=A(u,'',t);if(k===PAGE)a.setAttribute('aria-current','page');return a}));
  const burger=h('button','burger');burger.setAttribute('aria-label','Menu');burger.append(h('i'),h('i'));
  const header=h('header','',h('div','wrap bar',A('index.html','brand',img(B.logo,B.name+' logo'),h('span','',B.name)),nav,burger));
  burger.onclick=()=>document.body.classList.toggle('menu');
  nav.onclick=()=>document.body.classList.remove('menu');
  app.append(header);

  /* hero */
  const hero=h('section','hero');hero.id='top';
  hero.append(h('div','hero-bg',h('i','blob b1'),h('i','blob b2'),h('i','lines')));
  if(H.video){const v=h('video','hero-video');v.src=H.video;v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;v.setAttribute('muted','');v.play&&v.play().catch(()=>{});hero.append(v,h('i','veil'))}
  if(H.image)hero.append(img(H.image,'','hero-photo'),h('i','veil'));
  hero.append(h('div','wrap hero-in',
    h('div','hero-copy',h('h1','',headline(H.headline,H.accent)),h('p','lead reveal',H.sub),
      h('div','actions reveal',A('projects.html','btn primary',H.primary),A('contact.html','btn',H.secondary))),
    img(B.logo,B.name,'hero-logo')),h('span','cue'));
  hero.addEventListener('pointermove',e=>{const b=hero.getBoundingClientRect();hero.style.setProperty('--mx',(e.clientX-b.left)+'px');hero.style.setProperty('--my',(e.clientY-b.top)+'px')});
  if(PAGE==='home')app.append(hero);

  /* marquee */
  const items=S.marquee||[];
  if(items.length){const tr=h('div','track');for(let n=0;n<2;n++)items.forEach(t=>tr.append(h('span','',t)));
    if(PAGE==='home')app.append(h('div','marquee',tr))}

  const main=h('main');app.append(main);const secs={};

  /* projects */
  const ps=h('section','');ps.id='projects';
  const list=h('div','projects');
  P.items.forEach(p=>{
    const media=p.image?img(p.image,p.title,'media'):h('div','media cover',img(B.logo,'','cl'),h('b','',p.title));
    list.append(h('article','project reveal',media,h('div','body',h('span','tag',p.tag),h('h3','',p.title),h('p','',p.text),
      p.link?A(p.link,'more',(p.linkLabel||'View project')+' →'):null)));
  });
  ps.append(h('div','wrap',head('Projects',P.heading,P.text),list));secs.projects=ps;

  /* galleries */
  const gs=h('section','alt');gs.id='galleries';
  const rows=h('div','gal');
  G.items.forEach(g=>rows.append(A(g.url,'row reveal'+(g.image?' has-img':''),g.image?img(g.image,'','th'):null,h('span','t',g.title),h('span','l',g.label||'Open gallery'),h('span','arr','→'))));
  gs.append(h('div','wrap',head('Galleries',G.heading,G.text),rows));secs.galleries=gs;

  /* about */
  const as=h('section','');as.id='about';
  const photo=Ab.photo?h('div','portrait reveal',img(Ab.photo,'Portrait')):h('div','portrait reveal ph',img(B.logo,'','pl'));
  as.append(h('div','wrap about',photo,h('div','reveal',h('span','num','About'),h('h2','',Ab.heading),
    (Ab.paragraphs||[]).map(t=>h('p','',t)),h('ul','skills',(Ab.skills||[]).map(s=>h('li','',s))))));secs.about=as;

  /* contact */
  const cs=h('section','alt');cs.id='contact';
  const mk=(l,t,n,req)=>{const i=h(t==='area'?'textarea':'input');i.name=n;if(t==='email')i.type='email';if(req)i.required=true;if(t==='area')i.rows=5;return h('label','',l,i)};
  const sel=h('select');sel.name='type';(C.types||[]).forEach(t=>{const o=h('option','',t);o.value=t;sel.append(o)});
  const form=h('form','form',mk('Your name','text','name',1),mk('Email','email','email',1),h('label','','Type of project',sel),mk('Tell me about it','area','msg'),h('button','btn primary','Send message'));
  form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);
    const body=`Hi,\n\n${d.get('msg')}\n\nType: ${d.get('type')}\nFrom: ${d.get('name')} (${d.get('email')})`;
    location.href=`mailto:${C.email}?subject=${encodeURIComponent('Project inquiry from '+d.get('name'))}&body=${encodeURIComponent(body)}`};
  cs.append(h('div','wrap contact',h('div','',head('Contact',C.heading,C.text),
    h('div','reveal links',A('mailto:'+C.email,'',h('small','','Email'),C.email),(C.socials||[]).map(s=>A(s.url,'',h('small','','Follow'),s.label)))),
    h('div','reveal',form)));secs.contact=cs;

  (({home:['about'],projects:['projects'],galleries:['galleries'],contact:['contact']})[PAGE]||['about']).forEach(k=>main.append(secs[k]));
  if(PAGE!=='home')main.firstElementChild.classList.add('first');
  /* footer */
  app.append(h('footer','',h('div','wrap foot',img(B.logo,'','fl'),h('span','',S.footer))));

  /* reveal */
  if(io)io.disconnect();
  const els=app.querySelectorAll('.reveal');
  if(PREVIEW||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'))}
  else{io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px'});
    els.forEach((e,i)=>{e.style.transitionDelay=(i%3)*90+'ms';io.observe(e)})}
}
const onScroll=()=>document.body.classList.toggle('scrolled',scrollY>10);
addEventListener('scroll',onScroll,{passive:true});onScroll();
if(PREVIEW)addEventListener('message',e=>{if(e.data&&e.data.type==='site')render(e.data.data)});
render(window.SITE);
})();
