const app = document.getElementById('app');
const pilot = new URLSearchParams(window.location.search).get('pilot');

const seed = {
  applicants: [
    { id: 1, owner: 'Jess', dog: 'Pepper', breed: 'Labrador cross', age: 7, temperament: 'Calm, social, happy with strangers', status: 'approved' },
    { id: 2, owner: 'Aroha', dog: 'Mabel', breed: 'Golden Retriever', age: 5, temperament: 'Gentle, relaxed in groups', status: 'approved' },
    { id: 3, owner: 'Sam', dog: 'Otis', breed: 'Greyhound', age: 6, temperament: 'Quiet, affectionate, needs calm room', status: 'pending' },
    { id: 4, owner: 'Leila', dog: 'Tui', breed: 'Border Collie', age: 4, temperament: 'Friendly, alert, energetic', status: 'pending' }
  ],
  rsvps: 18,
  sessions: 4,
  feedback: 4.8
};

let state = JSON.parse(localStorage.getItem('drifter-good-dog-demo') || 'null') || seed;
const save = () => localStorage.setItem('drifter-good-dog-demo', JSON.stringify(state));

function toast(message){
  const t = document.createElement('div'); t.className='toast'; t.textContent=message; document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
}
function modal(title, body, actionLabel='CLOSE'){
  const wrap=document.createElement('div'); wrap.className='modal-backdrop';
  wrap.innerHTML=`<div class="modal"><h2>${title}</h2>${body}<div class="actions"><button class="primary modal-close">${actionLabel}</button></div></div>`;
  wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.classList.contains('modal-close'))wrap.remove()}); document.body.appendChild(wrap);
}
function setRoute(route){
  if(route==='home') renderHome();
  if(route==='guest') renderGuest();
  if(route==='owner') renderOwner();
  if(route==='host') renderHost();
  if(route==='subscribe') renderSubscribe();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click', e=>{ const btn=e.target.closest('[data-route]'); if(btn) setRoute(btn.dataset.route); });

function renderHome(){
  app.innerHTML=document.getElementById('home-template').innerHTML;
  if(pilot==='jenna'){
    app.insertAdjacentHTML('afterbegin', `<section class="pilot-banner">
      <div><p class="eyebrow">PRIVATE DRIFTER TEST · FOR JENNA</p><h2>This is yours to break.</h2>
      <p>No signup and no charge. Try the full loop in this browser: submit a pretend dog, open the Dream Host dashboard, approve it, make a guest RSVP, then look at the venue plan.</p></div>
      <div class="pilot-steps">
        <button class="primary" data-route="owner">1 · ADD A TEST DOG</button>
        <button class="secondary" data-route="host">2 · OPEN DREAM HOST</button>
        <button class="secondary" data-route="subscribe">3 · SEE DRIFTER PLAN</button>
      </div>
    </section>`);
  }
}

function renderGuest(){
  app.innerHTML=`<section class="page">
    <div class="page-head"><p class="eyebrow">FOR DRIFTER GUESTS</p><h1>MISS YOUR DOG?</h1><p>Join a small, hosted social with calm local dogs and their people. Opt in, stay as long as you like, and leave whenever you want.</p></div>
    <div class="page-grid">
      <div class="panel"><h2>Upcoming sessions</h2><div class="session-list">
        ${session('SUN','20','3:30 PM','Terrace','Pepper + Mabel','8 of 12 places left')}
        ${session('WED','23','6:00 PM','Leisure Club','Mabel','10 of 12 places left')}
        ${session('SUN','27','3:30 PM','Terrace','Pepper + Otis','12 places left')}
      </div></div>
      <div class="panel"><h2>Guest RSVP</h2><form id="guest-form" class="form-grid">
        ${field('Name','guestName','text','Your first name')}
        ${field('Room / bunk','room','text','Optional')}
        ${selectField('Session','session',['Sun 20 · 3:30 PM','Wed 23 · 6:00 PM','Sun 27 · 3:30 PM'])}
        ${selectField('Comfort with dogs','comfort',['Very comfortable','Comfortable','A little unsure — please support me'])}
        <div class="field full"><label>Anything the host should know?</label><textarea name="note" placeholder="Allergies, fear of dogs, accessibility, or anything else."></textarea></div>
        <label class="check field full"><input required type="checkbox"> I understand this is a social dog-visit experience, not a clinical therapy service, and I’ll follow the handler and Dream Host instructions.</label>
        <div class="field full"><button class="submit" type="submit">RESERVE MY PLACE</button></div>
      </form></div>
    </div></section>`;
  document.getElementById('guest-form').addEventListener('submit',e=>{e.preventDefault();state.rsvps++;save();toast('Place reserved. Demo RSVP added to the Dream Host dashboard.');e.target.reset();});
}
function session(day,date,time,place,dogs,seats){return `<article class="session"><div class="datebox"><span>${day}</span><b>${date}</b></div><div><h3>${time} · ${place}</h3><p>${dogs}</p><span class="mini">${seats}</span></div><button data-route="guest">RSVP</button></article>`}

function renderOwner(){
  app.innerHTML=`<section class="page"><div class="page-head"><p class="eyebrow">LOCAL DOG PEOPLE</p><h1>BRING A VERY GOOD DOG.</h1><p>Drifter is looking for relaxed, people-loving dogs and responsible handlers for short hosted visits with travellers.</p></div>
  <div class="page-grid"><div class="panel"><h2>What we’re looking for</h2>
    <div class="notice">The owner/handler stays with their dog for the full session. Drifter’s host manages guest numbers, space and session flow.</div>
    <p>Good candidates are comfortable with new people, can settle indoors, respond reliably to their handler, and have no known history of aggression toward people.</p>
    <p>Rewards are set per session by Drifter — think local hospitality perks rather than cash gigs.</p>
    <p class="mini">Demo criteria only. Final venue policy, insurance and animal-entry requirements should be approved by Drifter management before launch.</p>
  </div>
  <div class="panel"><h2>Dog + handler application</h2><form id="owner-form" class="form-grid">
    ${field('Your name','owner','text','Jess')}${field('Mobile','mobile','tel','021 ...')}
    ${field('Dog name','dog','text','Pepper')}${field('Age','age','number','7')}
    ${field('Breed / type','breed','text','Labrador cross')}${selectField('Size','size',['Small','Medium','Large'])}
    <div class="field full"><label>Describe their nature around strangers</label><textarea required name="temperament" placeholder="Calm, gentle, likes attention, settles quickly..."></textarea></div>
    <label class="check field full"><input required type="checkbox"> My dog is currently well, appropriately vaccinated for our circumstances, under effective handler control, and has no known history of aggression toward people.</label>
    <label class="check field full"><input required type="checkbox"> I will remain responsible for and physically present with my dog during every visit.</label>
    <div class="field full"><button class="submit" type="submit">SEND APPLICATION</button></div>
  </form></div></div></section>`;
  document.getElementById('owner-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);state.applicants.push({id:Date.now(),owner:f.get('owner')||'New owner',dog:f.get('dog')||'New dog',breed:f.get('breed')||'Dog',age:f.get('age')||'',temperament:f.get('temperament')||'',status:'pending'});save();toast('Application added. Open Dream Host to review it.');e.target.reset();});
}

function renderHost(){
  const pending=state.applicants.filter(x=>x.status==='pending').length, approved=state.applicants.filter(x=>x.status==='approved').length;
  app.innerHTML=`<section class="dashboard"><div class="dash-top"><div><p class="eyebrow">DRIFTER CHRISTCHURCH · DREAM HOST</p><h1>GOOD DOG CLUB</h1></div><button class="primary" id="new-session">+ NEW SESSION</button></div>
  <div class="metrics"><div class="metric"><b>${pending}</b><span>APPLICATIONS TO REVIEW</span></div><div class="metric"><b>${approved}</b><span>APPROVED DOGS</span></div><div class="metric"><b>${state.rsvps}</b><span>GUEST RSVPS</span></div><div class="metric"><b>${state.feedback}</b><span>AVG GUEST RATING</span></div></div>
  <div class="dash-grid"><div class="card"><h2>Dog applications</h2><table class="table"><thead><tr><th>Dog</th><th>Handler</th><th>Nature</th><th>Status</th><th></th></tr></thead><tbody>
  ${state.applicants.map(a=>`<tr><td><strong>${esc(a.dog)}</strong><br><span class="mini">${esc(a.breed)} · ${esc(a.age)}</span></td><td>${esc(a.owner)}</td><td>${esc(a.temperament)}</td><td><span class="tag ${a.status}">${a.status}</span></td><td>${a.status==='pending'?`<div class="row-actions"><button class="tiny dark approve" data-id="${a.id}">APPROVE</button><button class="tiny decline" data-id="${a.id}">DECLINE</button></div>`:'—'}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="card"><h2>Next session</h2><p class="eyebrow">SUNDAY · 3:30 PM · TERRACE</p><h3>Pepper + Mabel</h3><p>12 guest capacity · 4 currently reserved</p><div class="progress"><i style="width:33%"></i></div><button class="secondary" id="checkin">OPEN CHECK-IN</button>
  <hr><h2>Guest experience</h2><div class="feedback"><div class="metric"><b>92%</b><span>SAID IT HELPED THEM FEEL MORE AT HOME</span></div><div class="metric"><b>4.8</b><span>SESSION RATING</span></div></div><p class="mini">Demo metrics illustrate the reporting layer. Live figures will be calculated from actual session feedback.</p></div></div>
  <div class="card" style="margin-top:18px"><h2>Host safety checklist</h2><div class="form-grid"><label class="check"><input type="checkbox"> Owner/handler present for full visit</label><label class="check"><input type="checkbox"> Guest capacity set</label><label class="check"><input type="checkbox"> Allergies/fears reviewed before session</label><label class="check"><input type="checkbox"> Water + quiet retreat area available</label><label class="check"><input type="checkbox"> Dog condition checked on arrival</label><label class="check"><input type="checkbox"> Incident contact/process available</label></div></div></section>`;
  document.querySelectorAll('.approve').forEach(b=>b.onclick=()=>{const a=state.applicants.find(x=>String(x.id)===b.dataset.id);if(a){a.status='approved';save();renderHost();toast(`${a.dog} approved.`)}});
  document.querySelectorAll('.decline').forEach(b=>b.onclick=()=>{const a=state.applicants.find(x=>String(x.id)===b.dataset.id);if(a){state.applicants=state.applicants.filter(x=>x.id!==a.id);save();renderHost();toast(`${a.dog} removed from the demo queue.`)}});
  document.getElementById('new-session').onclick=()=>modal('Create session','<p>The live version opens a form for date, room/area, capacity, approved dogs, owner reward and guest RSVP cutoff.</p><p class="mini">For this prototype the interaction is represented rather than persisted to a database.</p>');
  document.getElementById('checkin').onclick=()=>modal('Session check-in','<p>Guest list, allergy/fear flags, dog handlers and the arrival safety checklist appear here on the day.</p>');
}

function renderSubscribe(){
  app.innerHTML=`<section class="page"><div class="page-head"><p class="eyebrow">DRIFTER PILOT</p><h1>KEEP THE CLUB RUNNING.</h1>${pilot==='jenna'?'<p>You have been given private test access. Play with the prototype first; if Drifter wants to keep it, the founding venue plan turns it into a persistent live tool with real data, branded guest pages and ongoing support.</p>':'<p>The prototype is free to test. The founding venue plan turns it into a persistent Drifter tool with real data, branded guest pages and ongoing support.</p>'}</div>
  <div class="pricing"><div class="pricing-grid"><div class="price-card"><p class="eyebrow">PROTOTYPE</p><h2>See how it works</h2><div class="price">$0</div><ul><li>Guest RSVP demo</li><li>Dog-owner application demo</li><li>Dream Host dashboard</li><li>Sample insights</li></ul><button data-route="host">OPEN DEMO</button></div>
  <div class="price-card featured"><p class="eyebrow">FOUNDING VENUE</p><h2>Drifter Christchurch</h2><div class="price">$89 <small>NZD / month</small></div><ul><li>Drifter-branded live app</li><li>Unlimited dog applications and sessions</li><li>Guest RSVP + check-in</li><li>Host safety workflow</li><li>Feedback and participation reporting</li><li>Ongoing small improvements during the pilot</li></ul><button id="subscribe-live">ACTIVATE FOR DRIFTER</button><p class="mini">Cancel monthly. Payment processing is the next live integration; this button demonstrates the checkout handoff.</p></div></div></div></section>`;
  document.getElementById('subscribe-live').onclick=()=>modal('Ready for Drifter activation','<p><strong>NZ$89/month · Drifter Christchurch</strong></p><p>This is the purchase handoff. Once the billing link is connected, Drifter can activate the live venue account here and the test data is replaced with the persistent database.</p><p class="mini">No charge is made from this prototype yet.</p>','DONE');
}

function field(label,name,type,placeholder){return `<div class="field"><label>${label}</label><input ${name==='owner'||name==='dog'?'required':''} name="${name}" type="${type}" placeholder="${placeholder}"></div>`}
function selectField(label,name,opts){return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(o=>`<option>${o}</option>`).join('')}</select></div>`}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

renderHome();
