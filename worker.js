// Cloudflare Worker: substitui a Netlify Function da agenda. Le SOMENTE o CSV publico do Google Sheets.
const ALLOWED = new Set(['docs.google.com']);
const FIELDS = ['data','data_cartaz','horario','evento','local','cidade','estado','pais','endereco','ingressos_url','mapa_url','status','publicar'];
function parseCsv(csv) {
  const rows=[];let row=[],cell='',quoted=false;
  csv=csv.replace(/^\uFEFF/,'');
  for(let i=0;i<csv.length;i++){
    const c=csv[i];
    if(quoted){if(c==='"'&&csv[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
    else if(c==='"')quoted=true;
    else if(c===','){row.push(cell);cell='';}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
function normalize(str){return String(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
function todaySaoPaulo(){
  const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
  const d=Object.fromEntries(fmt.formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return `${d.year}-${d.month}-${d.day}`;
}
function normalizeDate(raw){
  const s=String(raw||'').trim();let y,m,d,match;
  if((match=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T].*)?$/))){[,y,m,d]=match;}
  else if((match=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/))){[,d,m,y]=match;}
  else return null;
  y=Number(y);m=Number(m);d=Number(d);
  if(y<2000||y>2200)return null;
  const dt=new Date(Date.UTC(y,m-1,d));
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return null;
  return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
export function parseEvents(csv, today=todaySaoPaulo()) {
  const rows=parseCsv(csv);if(!rows.length)return [];
  const hdr=rows.shift().map(x=>normalize(x).replace(/\s+/g,'_'));
  const indexes=Object.fromEntries(FIELDS.map(f=>[f,hdr.indexOf(f)]));
  if(indexes.data<0||indexes.evento<0||indexes.status<0||indexes.publicar<0)throw Error('Expected columns missing');
  const data=rows.slice(0,500).map(row=>Object.fromEntries(FIELDS.map(k=>[k,indexes[k]<0?'':(row[indexes[k]]||'').trim()])));
  return data.filter(e=> {
    if(normalize(e.status)!=='confirmado'||normalize(e.publicar)!=='sim'||!e.evento)return false;
    const normalized=normalizeDate(e.data); if(!normalized||normalized<today)return false; e.data=normalized; return true;
  }).sort((a,b)=>a.data.localeCompare(b.data)||a.horario.localeCompare(b.horario)).slice(0,60)
    .map(({data,horario,evento,local,cidade,estado,pais,endereco,ingressos_url,mapa_url})=>({data,horario,evento,local,cidade,estado,pais,endereco,ingressos_url,mapa_url}));
}
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30, s-maxage=300','X-Content-Type-Options':'nosniff'}});
async function agenda(request, env){
  if(request.method!=='GET')return response(405,{error:'Method not allowed'});
  const source=env.GOOGLE_SHEET_CSV_URL;
  if(!source)return response(200,{events:[],configured:false});
  let uri;
  try {uri=new URL(source);if(uri.protocol!=='https:'||!ALLOWED.has(uri.hostname)||!uri.pathname.includes('/spreadsheets/'))throw Error('Invalid Google Sheets URL');}
  catch{return response(500,{error:'Invalid Google Sheets feed configuration'});}
  try {
    const fetched=await fetch(uri,{signal:AbortSignal.timeout(8000),headers:{'Accept':'text/csv,text/plain'}});
    if(!fetched.ok)throw new Error('Feed unavailable');
    const length=Number(fetched.headers.get('content-length')||0);
    if(length>250000)throw new Error('Feed too large');
    const csv=await fetched.text();if(csv.length>250000)throw new Error('Feed too large');
    return response(200,{events:parseEvents(csv),configured:true});
  } catch(e){return response(502,{events:[],error:'Could not load the public events feed'});}
}
export default {
  async fetch(request, env){
    const {pathname}=new URL(request.url);
    // mesmo endereco usado pelo script.js, entao o site nao precisa mudar
    if(pathname==='/.netlify/functions/agenda'||pathname==='/api/agenda')return agenda(request, env);
    return env.ASSETS.fetch(request);
  }
};
