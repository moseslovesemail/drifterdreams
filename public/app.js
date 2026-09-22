const app=document.getElementById('app');
const qs=new URLSearchParams(location.search);
const pilot=qs.get('pilot');
let publicData={dogs:[],sessions:[],metrics:{approved_dogs:0,rsvps:0,sessions:0,feedback:0,home_pct:0},paymentLink:''};
let hostKey=sessionStorage.getItem('drifterHostKey')||'';

const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=d=>new Intl.DateTimeFormat('en-NZ',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(new Date(d));
const api=async(url,opts={})=>{
  const headers={'content-type':'application/json',...(opts.headers||{})};
  if(url.startsWith('/api/host/')) headers['x-host-key']=hostKey;
  const r=await fetch(url,{...opts,headers});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(new Error(j.error||'Something went wrong'),{status:r.status});
  return j;
};
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function modal(title,body){const w=document.createElement('div');w.className='modal-backdrop';w.innerHTML=`<div class="modal"><h2>${title}</h2>${body}<div class="actions"><button class="primary modal-close">CLOSE</button></div></div>`;w.onclick=e=>{if(e.target===w||e.target.classList.contains('modal-close'))w.remove()};document.body.appendChild(w)}

async function refreshPublic(){try{publicData=await api('/api/public')}catch(e){console.error(e)}}
function setRoute(r){({home:renderHome,guest:renderGuest,owner:renderOwner,host:renderHost,subscribe:renderSubscribe}[r]||renderHome)();scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)setRoute(b.dataset.route)});

async function renderHome(){
  await refreshPublic();
  app.innerHTML=document.getElementById('home-template').innerHTML;
  if(pilot==='jenna')app.insertAdjacentHTML('afterbegin',`<section class="pilot-banner"><div><p class="eyebrow">PRIVATE DRIFTER TEST · FOR JENNA</p><h2>This is now the live pilot.</h2><p>Applications, sessions and RSVPs are stored centrally. Use Dream Host to create a real session, then share the guest and dog-owner links.</p></div><div class="pilot-steps"><button class="primary" data-route="host">OPEN DREAM HOST</button><button class="secondary" data-route="owner">DOG OWNER LINK</button><button class="secondary" data-route="guest">GUEST RSVP LINK</button></div></section>`);
  const next=publicData.sessions[0];
  const demo=document.querySelector('.split');
  if(demo)demo.innerHTML=`<div><p class="eyebrow">NEXT SESSION</p><h2>${next?esc(fmt(next.starts_at).replace(',','<br>')):'CREATE<br>THE FIRST'}</h2><p>${next?esc(next.location):'Dream Host can add the first live session.'}</p></div><div class="dog-cards">${publicData.dogs.length?publicData.dogs.slice(0,3).map(d=>`<article class="dog-card"><div class="dog-avatar rust">${esc(d.dog_name[0])}</div><div><h3>${esc(d.dog_name)}</h3><p>${esc(d.age||'')} · ${esc(d.breed||'')}</p><span>${esc(d.temperament)}</span></div></article>`).join(''):'<div class="notice">Approved dogs will appear here once Jenna reviews applications.</div>'}</div>`;
}
async function renderGuest(){
 await refreshPublic();
 app.innerHTML=`<section class="page"><div class="page-head"><p class="eyebrow">FOR DRIFTER GUESTS</p><h1>MISS YOUR DOG?</h1><p>Join a small hosted session with calm local dogs and their people.</p></div><div class="page-grid"><div class="panel"><h2>Upcoming sessions</h2><div class="session-list">${publicData.sessions.length?publicData.sessions.map(s=>`<article class="session"><div class="datebox"><span>${new Date(s.starts_at).toLocaleDateString('en-NZ',{weekday:'short'}).toUpperCase()}</span><b>${new Date(s.starts_at).getDate()}</b></div><div><h3>${esc(fmt(s.starts_at))}</h3><p>${esc(s.location)} · ${esc(s.dog_names||'Dogs TBC')}</p><span class="mini">${Math.max(0,s.capacity-s.rsvp_count)} of ${s.capacity} places left</span></div></article>`).join(''):'<div class="notice">No live sessions yet. Check back soon.</div>'}</div></div><div class="panel"><h2>Guest RSVP</h2><form id="guest-form" class="form-grid">
 ${field('Name','guestName','text','Your first name',true)}${field('Room / bunk','room','text','Optional')}
 ${selectField('Session','sessionId',publicData.sessions.map(s=>({v:s.id,l:`${fmt(s.starts_at)} · ${s.location}`})))}
 ${selectField('Comfort with dogs','comfort',[{v:'Very comfortable',l:'Very comfortable'},{v:'Comfortable',l:'Comfortable'},{v:'A little unsure',l:'A little unsure — please support me'}])}
 <div class="field full"><label>Anything the host should know?</label><textarea name="note" placeholder="Allergies, fear of dogs, accessibility, or anything else."></textarea></div>
 <label class="check field full"><input required type="checkbox"> I understand this is a social dog-visit experience, not a clinical therapy service, and I’ll follow host and handler instructions.</label>
 <div class="field full"><button class="submit" ${publicData.sessions.length?'':'disabled'}>RESERVE MY PLACE</button></div></form></div></div></section>`;
 document.getElementById('guest-form').onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.target));try{await api('/api/rsvp',{method:'POST',body:JSON.stringify(x)});toast('You’re booked in.');e.target.reset();await renderGuest()}catch(err){modal('Could not RSVP',`<p>${esc(err.message)}</p>`)}};
}
function renderOwner(){
 app.innerHTML=`<section class="page"><div class="page-head"><p class="eyebrow">LOCAL DOG PEOPLE</p><h1>BRING A VERY GOOD DOG.</h1><p>Put your dog forward for short hosted visits with Drifter travellers.</p></div><div class="page-grid"><div class="panel"><h2>What Drifter needs</h2><div class="notice">The owner/handler stays with their dog for the full session. Drifter controls guest numbers, space and session flow.</div><p>Dogs should be comfortable with new people, settle indoors and have no known history of aggression toward people.</p></div><div class="panel"><h2>Dog + handler application</h2><form id="owner-form" class="form-grid">
 ${field('Your name','owner','text','Your name',true)}${field('Mobile','mobile','tel','021 ...')}
 ${field('Dog name','dog','text','Dog name',true)}${field('Age','age','text','7')}
 ${field('Breed / type','breed','text','Labrador cross')}${selectField('Size','size',[{v:'Small',l:'Small'},{v:'Medium',l:'Medium'},{v:'Large',l:'Large'}])}
 <div class="field full"><label>Describe their nature around strangers</label><textarea required name="temperament"></textarea></div>
 <label class="check field full"><input required type="checkbox"> My dog is currently well, under effective handler control, and has no known history of aggression toward people.</label>
 <label class="check field full"><input required type="checkbox"> I will remain responsible for and physically present with my dog during every visit.</label>
 <div class="field full"><button class="submit">SEND APPLICATION</button></div></form></div></div></section>`;
 document.getElementById('owner-form').onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.target));try{await api('/api/apply',{method:'POST',body:JSON.stringify(x)});e.target.reset();modal('Application received','<p>Drifter’s Dream Host can now review your dog for future Good Dog Club sessions.</p>')}catch(err){modal('Could not submit',`<p>${esc(err.message)}</p>`)}};
}
async function renderHost(){
 if(!hostKey)return renderHostLogin();
 let d;try{d=await api('/api/host/dashboard')}catch(e){if(e.status===401){hostKey='';sessionStorage.removeItem('drifterHostKey');return renderHostLogin('That access code was not accepted.')}throw e}
 const pending=d.dogs.filter(x=>x.status==='pending').length, approved=d.dogs.filter(x=>x.status==='approved').length, totalR=d.sessions.reduce((a,s)=>a+s.rsvp_count,0);
 app.innerHTML=`<section class="dashboard"><div class="dash-top"><div><p class="eyebrow">DRIFTER CHRISTCHURCH · DREAM HOST</p><h1>GOOD DOG CLUB</h1></div><div class="row-actions"><button class="secondary" id="copy-owner">COPY DOG LINK</button><button class="secondary" id="copy-guest">COPY GUEST LINK</button><button class="primary" id="new-session">+ NEW SESSION</button></div></div>
 <div class="metrics"><div class="metric"><b>${pending}</b><span>APPLICATIONS TO REVIEW</span></div><div class="metric"><b>${approved}</b><span>APPROVED DOGS</span></div><div class="metric"><b>${totalR}</b><span>LIVE RSVPS</span></div><div class="metric"><b>${d.feedback.rating||'—'}</b><span>AVG GUEST RATING</span></div></div>
 <div class="dash-grid"><div class="card"><h2>Dog applications</h2><table class="table"><thead><tr><th>Dog</th><th>Handler</th><th>Nature</th><th>Status</th><th></th></tr></thead><tbody>${d.dogs.length?d.dogs.map(x=>`<tr><td><strong>${esc(x.dog_name)}</strong><br><span class="mini">${esc(x.breed||'')} · ${esc(x.age||'')}</span></td><td>${esc(x.owner_name)}<br><span class="mini">${esc(x.mobile||'')}</span></td><td>${esc(x.temperament)}</td><td><span class="tag ${x.status}">${x.status}</span></td><td>${x.status==='pending'?'<button class="tiny dark dog-action" data-id="'+x.id+'" data-status="approved">APPROVE</button> <button class="tiny dog-action" data-id="'+x.id+'" data-status="declined">DECLINE</button>':'—'}</td></tr>`).join(''):'<tr><td colspan="5">No applications yet.</td></tr>'}</tbody></table></div>
 <div class="card"><h2>Sessions</h2>${d.sessions.length?d.sessions.map(s=>`<div class="notice"><strong>${esc(fmt(s.starts_at))}</strong><br>${esc(s.location)} · ${s.rsvp_count}/${s.capacity} guests<br><span class="mini">${esc(s.dog_names||'Dogs TBC')}</span></div>`).join(''):'<p>No sessions yet.</p>'}<hr><h2>Guest experience</h2><div class="feedback"><div class="metric"><b>${d.feedback.home_pct||0}%</b><span>FELT MORE AT HOME</span></div><div class="metric"><b>${d.feedback.rating||'—'}</b><span>SESSION RATING</span></div></div></div></div>
 <div class="card" style="margin-top:18px"><h2>Recent RSVPs</h2><table class="table"><thead><tr><th>Guest</th><th>Session</th><th>Comfort</th><th>Note</th></tr></thead><tbody>${d.rsvps.length?d.rsvps.map(r=>`<tr><td>${esc(r.guest_name)}<br><span class="mini">${esc(r.room||'')}</span></td><td>${esc(fmt(r.starts_at))}</td><td>${esc(r.comfort||'')}</td><td>${esc(r.note||'')}</td></tr>`).join(''):'<tr><td colspan="4">No RSVPs yet.</td></tr>'}</tbody></table></div></section>`;
 document.querySelectorAll('.dog-action').forEach(b=>b.onclick=async()=>{await api('/api/host/dogs/'+b.dataset.id,{method:'PATCH',body:JSON.stringify({status:b.dataset.status})});toast('Application updated.');renderHost()});
 document.getElementById('new-session').onclick=()=>showSessionForm();
 document.getElementById('copy-owner').onclick=()=>copyLink('?view=owner','Dog-owner application link copied.');
 document.getElementById('copy-guest').onclick=()=>copyLink('?view=guest','Guest RSVP link copied.');
}
function renderHostLogin(msg=''){
 app.innerHTML=`<section class="page"><div class="page-head"><p class="eyebrow">DREAM HOST</p><h1>HOST ACCESS.</h1><p>Drifter staff only.</p></div><div class="panel" style="max-width:620px"><form id="host-login" class="form-grid"><div class="field full"><label>Access code</label><input type="password" name="key" required></div>${msg?'<div class="notice field full">'+esc(msg)+'</div>':''}<div class="field full"><button class="submit">OPEN DREAM HOST</button></div></form></div></section>`;
 document.getElementById('host-login').onsubmit=e=>{e.preventDefault();hostKey=new FormData(e.target).get('key');sessionStorage.setItem('drifterHostKey',hostKey);renderHost()};
}
function showSessionForm(){
 const w=document.createElement('div');w.className='modal-backdrop';w.innerHTML=`<div class="modal"><h2>Create a live session</h2><form id="session-form" class="form-grid">${field('Date + time','startsAt','datetime-local','',true)}${field('Location','location','text','Terrace',true)}${field('Capacity','capacity','number','12')}${field('Dogs','dogNames','text','Pepper + Mabel')}<div class="field full"><label>Owner reward / notes</label><input name="ownerReward" placeholder="e.g. drink + meal voucher"></div><div class="field full"><button class="submit">CREATE SESSION</button></div></form><button class="secondary modal-close">CANCEL</button></div>`;document.body.appendChild(w);w.querySelector('.modal-close').onclick=()=>w.remove();w.querySelector('#session-form').onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.target));x.startsAt=new Date(x.startsAt).toISOString();await api('/api/host/session',{method:'POST',body:JSON.stringify(x)});w.remove();toast('Session created.');renderHost()};
}
async function renderSubscribe(){
 await refreshPublic();
 const link=publicData.paymentLink;
 app.innerHTML=`<section class="page"><div class="page-head"><p class="eyebrow">DRIFTER FOUNDING VENUE</p><h1>MAKE IT LIVE.</h1><p>Everything needed to run Good Dog Club at Drifter Christchurch with persistent data and a private host dashboard.</p></div><div class="pricing"><div class="pricing-grid"><div class="price-card"><p class="eyebrow">LIVE PILOT</p><h2>Already built</h2><ul><li>Persistent dog applications</li><li>Dream Host approval workflow</li><li>Live session creation</li><li>Guest RSVPs</li><li>Shareable guest and owner links</li><li>Participation reporting</li></ul><button data-route="host">OPEN DREAM HOST</button></div><div class="price-card featured"><p class="eyebrow">FOUNDING VENUE</p><h2>Drifter Christchurch</h2><div class="price">$89 <small>NZD / month</small></div><ul><li>Hosted Drifter-branded app</li><li>Unlimited sessions and applications</li><li>Persistent venue data</li><li>Ongoing small pilot improvements</li><li>Cancel monthly via Stripe</li></ul><button id="buy" ${link?'':'disabled'}>SUBSCRIBE WITH STRIPE</button><p class="mini">Secure Stripe-hosted checkout. No card details are handled by this app.</p></div></div></div></section>`;
 if(link)document.getElementById('buy').onclick=()=>location.href=link;
}
function field(label,name,type,placeholder='',required=false){return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" placeholder="${placeholder}" ${required?'required':''}></div>`}
function selectField(label,name,opts){return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(o=>`<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')}</select></div>`}
async function copyLink(q,msg){await navigator.clipboard.writeText(location.origin+'/'+q);toast(msg)}

(async()=>{
 if(qs.get('subscribed')) modal('Drifter subscription received','<p>Stripe has accepted the subscription checkout. The venue can continue using the live Dream Host system.</p>');
 const view=qs.get('view');
 if(view==='owner')return renderOwner();
 if(view==='guest')return renderGuest();
 renderHome();
})();
