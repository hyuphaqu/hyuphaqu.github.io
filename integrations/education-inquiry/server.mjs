import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const port = Number(process.env.DEMO_PORT || 8771);
const n8nUrl = process.env.DEMO_N8N_URL || 'http://127.0.0.1:5681/webhook/education-inquiry-demo';
const n8nHealth = new URL('/healthz', n8nUrl).href;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
const limits = new Map();
const allowedOrigins = new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`,'http://127.0.0.1:8769','http://localhost:8769']);
function json(res,status,body) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body)); }
function error(res,status,code,message) {json(res,status,{error:{code,message},external_sent:false});}
function rateLimit(ip) {
  const now=Date.now();let record=limits.get(ip);
  if(!record || record.until<now) {record={count:0,until:now+60000};limits.set(ip,record);}
  record.count++;return record.count<=20;
}
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin && !allowedOrigins.has(origin)) return error(res,403,'ORIGIN_NOT_ALLOWED','허용되지 않은 요청 출처입니다.');
  if(origin) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS') {res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health') {
    if(req.method!=='GET')return error(res,405,'METHOD_NOT_ALLOWED','GET 요청만 지원합니다.');
    try {const response=await fetch(n8nHealth,{signal:AbortSignal.timeout(2500)}); if(!response.ok)throw new Error();json(res,200,{status:'ready',engine:'n8n-rules',model_called:false,external_send_enabled:false});}
    catch {error(res,503,'N8N_UNAVAILABLE','로컬 n8n 데모에 연결되지 않았습니다.');}return;
  }
  if(url.pathname==='/api/education-inquiry'){
    if(req.method!=='POST')return error(res,405,'METHOD_NOT_ALLOWED','POST 요청만 지원합니다.');
    if(!String(req.headers['content-type']||'').startsWith('application/json'))return error(res,415,'JSON_REQUIRED','JSON 형식으로 요청해 주세요.');
    if(!rateLimit(req.socket.remoteAddress))return error(res,429,'RATE_LIMITED','요청이 많습니다. 1분 후 다시 시도해 주세요.');
    let size=0;const chunks=[];
    try{
      for await(const chunk of req){size+=chunk.length;if(size>24000){error(res,413,'INPUT_TOO_LONG','요청 크기를 줄여 주세요.');return;}chunks.push(chunk);}
      const body=Buffer.concat(chunks).toString('utf8');
      let input;try{input=JSON.parse(body);}catch{return error(res,400,'INVALID_JSON','JSON 요청을 확인해 주세요.');}
      const start=Date.now();
      const upstream=await fetch(n8nUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(15000)});
      let output;try{output=await upstream.json();}catch{return error(res,502,'INVALID_UPSTREAM_RESPONSE','n8n 응답 형식을 확인해 주세요.');}
      if(!upstream.ok){json(res,upstream.status,output);return;}
      if(output?.engine!=='n8n-rules'||output?.external_sent!==false||!Array.isArray(output?.facts)||typeof output?.summary!=='string')return error(res,502,'INVALID_UPSTREAM_RESPONSE','n8n 응답 형식을 확인해 주세요.');
      output.duration_ms=Date.now()-start;
      output.execution_source='n8n-webhook';
      json(res,200,output);
    }catch{error(res,503,'N8N_UNAVAILABLE','n8n 처리를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');}return;
  }
  if(!['GET','HEAD'].includes(req.method))return error(res,405,'METHOD_NOT_ALLOWED','지원하지 않는 요청입니다.');
  try{
    const pathname=decodeURIComponent(url.pathname);
    if(pathname.split('/').some(segment=>segment.startsWith('.')))return error(res,404,'NOT_FOUND','페이지를 찾을 수 없습니다.');
    let file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)&&file!==root)return error(res,404,'NOT_FOUND','페이지를 찾을 수 없습니다.');
    let info=await stat(file);if(info.isDirectory())file=path.join(file,'index.html');
    const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content);
  }catch{error(res,404,'NOT_FOUND','페이지를 찾을 수 없습니다.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local demo: http://127.0.0.1:${port}/demos/education-inquiry/`));
