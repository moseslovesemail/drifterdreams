const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const port = Number(process.env.PORT || 3000);
const root = path.join(__dirname, 'public');
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;
const HOST_KEY = process.env.HOST_KEY || '';
const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK || '';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

async function initDb(){
  if(!pool) return;
  await pool.query(`
    create table if not exists dogs (
      id bigserial primary key,
      owner_name text not null,
      mobile text,
      dog_name text not null,
      age text,
      breed text,
      size text,
      temperament text not null,
      status text not null default 'pending',
      created_at timestamptz not null default now()
    );
    create table if not exists sessions (
      id bigserial primary key,
      title text not null default 'Good Dog Club',
      starts_at timestamptz not null,
      location text not null,
      capacity integer not null default 12,
      dog_names text default '',
      owner_reward text default '',
      status text not null default 'open',
      created_at timestamptz not null default now()
    );
    create table if not exists rsvps (
      id bigserial primary key,
      session_id bigint references sessions(id) on delete cascade,
      guest_name text not null,
      room text,
      comfort text,
      note text,
      created_at timestamptz not null default now()
    );
    create table if not exists feedback (
      id bigserial primary key,
      session_id bigint references sessions(id) on delete set null,
      rating integer check (rating between 1 and 5),
      felt_more_at_home boolean,
      note text,
      created_at timestamptz not null default now()
    );
  `);
}

function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
function body(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e6) req.destroy();});req.on('end',()=>{try{resolve(d?JSON.parse(d):{})}catch(e){reject(e)}});req.on('error',reject);});}
function hostOk(req){return HOST_KEY && req.headers['x-host-key'] === HOST_KEY;}
function safeInt(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}

async function api(req,res,url){
  if(!pool) return json(res,503,{error:'Database unavailable'});
  if(req.method==='GET' && url.pathname==='/api/public'){
    const [dogs,sessions,counts,fb] = await Promise.all([
      pool.query("select id, dog_name, breed, age, temperament from dogs where status='approved' order by created_at desc"),
      pool.query("select s.*, count(r.id)::int as rsvp_count from sessions s left join rsvps r on r.session_id=s.id where s.status='open' and s.starts_at >= now() - interval '12 hours' group by s.id order by s.starts_at asc"),
      pool.query("select (select count(*) from dogs where status='approved')::int approved_dogs,(select count(*) from rsvps)::int rsvps,(select count(*) from sessions)::int sessions"),
      pool.query("select round(avg(rating)::numeric,1) rating, coalesce(round(100.0*avg(case when felt_more_at_home then 1 else 0 end)),0)::int home_pct from feedback")
    ]);
    return json(res,200,{dogs:dogs.rows,sessions:sessions.rows,metrics:{...counts.rows[0],feedback:Number(fb.rows[0].rating||0),home_pct:Number(fb.rows[0].home_pct||0)},paymentLink:STRIPE_PAYMENT_LINK});
  }
  if(req.method==='POST' && url.pathname==='/api/apply'){
    const b=await body(req);
    if(!b.owner||!b.dog||!b.temperament) return json(res,400,{error:'Owner, dog and temperament are required.'});
    const q=await pool.query("insert into dogs(owner_name,mobile,dog_name,age,breed,size,temperament) values($1,$2,$3,$4,$5,$6,$7) returning id,status",
      [b.owner,b.mobile||'',b.dog,b.age||'',b.breed||'',b.size||'',b.temperament]);
    return json(res,201,q.rows[0]);
  }
  if(req.method==='POST' && url.pathname==='/api/rsvp'){
    const b=await body(req);
    if(!b.sessionId||!b.guestName) return json(res,400,{error:'Session and guest name are required.'});
    const s=await pool.query("select s.capacity,count(r.id)::int used from sessions s left join rsvps r on r.session_id=s.id where s.id=$1 and s.status='open' group by s.id",[b.sessionId]);
    if(!s.rowCount) return json(res,404,{error:'Session not found.'});
    if(s.rows[0].used>=s.rows[0].capacity) return json(res,409,{error:'This session is full.'});
    const q=await pool.query("insert into rsvps(session_id,guest_name,room,comfort,note) values($1,$2,$3,$4,$5) returning id",
      [b.sessionId,b.guestName,b.room||'',b.comfort||'',b.note||'']);
    return json(res,201,q.rows[0]);
  }
  if(req.method==='POST' && url.pathname==='/api/feedback'){
    const b=await body(req);
    await pool.query("insert into feedback(session_id,rating,felt_more_at_home,note) values($1,$2,$3,$4)",
      [b.sessionId||null,safeInt(b.rating,5),!!b.feltMoreAtHome,b.note||'']);
    return json(res,201,{ok:true});
  }
  if(url.pathname.startsWith('/api/host/')){
    if(!hostOk(req)) return json(res,401,{error:'Host access required.'});
    if(req.method==='GET' && url.pathname==='/api/host/dashboard'){
      const [dogs,sessions,rsvps,fb]=await Promise.all([
        pool.query("select * from dogs order by created_at desc"),
        pool.query("select s.*,count(r.id)::int rsvp_count from sessions s left join rsvps r on r.session_id=s.id group by s.id order by s.starts_at desc"),
        pool.query("select r.*,s.starts_at,s.location from rsvps r join sessions s on s.id=r.session_id order by r.created_at desc limit 100"),
        pool.query("select round(avg(rating)::numeric,1) rating,coalesce(round(100.0*avg(case when felt_more_at_home then 1 else 0 end)),0)::int home_pct from feedback")
      ]);
      return json(res,200,{dogs:dogs.rows,sessions:sessions.rows,rsvps:rsvps.rows,feedback:{rating:Number(fb.rows[0].rating||0),home_pct:Number(fb.rows[0].home_pct||0)},paymentLink:STRIPE_PAYMENT_LINK});
    }
    if(req.method==='POST' && url.pathname==='/api/host/session'){
      const b=await body(req);
      if(!b.startsAt||!b.location) return json(res,400,{error:'Date/time and location are required.'});
      const q=await pool.query("insert into sessions(title,starts_at,location,capacity,dog_names,owner_reward) values($1,$2,$3,$4,$5,$6) returning *",
        [b.title||'Good Dog Club',b.startsAt,b.location,safeInt(b.capacity,12),b.dogNames||'',b.ownerReward||'']);
      return json(res,201,q.rows[0]);
    }
    const dogMatch=url.pathname.match(/^\/api\/host\/dogs\/(\d+)$/);
    if(req.method==='PATCH' && dogMatch){
      const b=await body(req);
      const status=['approved','declined','pending'].includes(b.status)?b.status:'pending';
      const q=await pool.query("update dogs set status=$1 where id=$2 returning *",[status,dogMatch[1]]);
      return json(res,q.rowCount?200:404,q.rowCount?q.rows[0]:{error:'Dog not found'});
    }
    const sessionMatch=url.pathname.match(/^\/api\/host\/sessions\/(\d+)$/);
    if(req.method==='PATCH' && sessionMatch){
      const b=await body(req);
      const status=['open','closed','cancelled'].includes(b.status)?b.status:'open';
      const q=await pool.query("update sessions set status=$1 where id=$2 returning *",[status,sessionMatch[1]]);
      return json(res,q.rowCount?200:404,q.rowCount?q.rows[0]:{error:'Session not found'});
    }
  }
  return json(res,404,{error:'Not found'});
}

initDb().then(()=>console.log('Database ready')).catch(e=>console.error('DB init failed',e));

http.createServer(async (req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/health'){
      if(pool){await pool.query('select 1');}
      return json(res,200,{ok:true,product:'Drifter Good Dog Club',database:!!pool});
    }
    if(url.pathname.startsWith('/api/')) return await api(req,res,url);
    const clean=decodeURIComponent(url.pathname);
    let file=clean==='/'?'index.html':clean.replace(/^\/+/, '');
    let full=path.normalize(path.join(root,file));
    if(!full.startsWith(root)){res.writeHead(403);return res.end('Forbidden');}
    fs.stat(full,(err,stat)=>{
      if(err||!stat.isFile()) full=path.join(root,'index.html');
      fs.readFile(full,(readErr,data)=>{
        if(readErr){res.writeHead(500);return res.end('Server error');}
        res.writeHead(200,{'content-type':types[path.extname(full)]||'application/octet-stream'});
        res.end(data);
      });
    });
  }catch(e){console.error(e);json(res,500,{error:'Server error'});}
}).listen(port,'0.0.0.0',()=>console.log(`Drifter Good Dog Club listening on ${port}`));
