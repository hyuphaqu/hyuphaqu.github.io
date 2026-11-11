import assert from 'node:assert/strict';
import test from 'node:test';
const base=process.env.DEMO_TEST_URL||'http://127.0.0.1:8771';
const post=(body,headers={'Content-Type':'application/json'})=>fetch(base+'/api/education-inquiry',{method:'POST',headers,body:JSON.stringify(body)});
test('health and static serving are reachable',async()=>{
 const health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).engine,'n8n-rules');
 assert.equal((await fetch(base+'/index.html')).status,200);
});
test('request actually traverses n8n webhook',async()=>{
 const response=await post({inquiry_text:'기관 실무자 대상 AI 교육을 문의합니다. 다음 달 온라인 희망, 예산은 200만원이며 인원은 20명입니다.',detail:'detailed'});
 assert.equal(response.status,200);const result=await response.json();
 assert.equal(result.engine,'n8n-rules');assert.equal(result.execution_source,'n8n-webhook');
 assert.match(result.request_id,/^n8n-\d+$/);assert.equal(result.external_sent,false);
 assert.ok(result.facts.some(f=>f.value==='20명'));assert.ok(result.facts.some(f=>f.value==='200만원'));
});
test('n8n validation fails explicitly for blank input',async()=>{
 const response=await post({inquiry_text:''});assert.equal(response.status,400);assert.equal((await response.json()).error.code,'INVALID_INPUT');
});
test('proxy rejects wrong types, disallowed origins and methods',async()=>{
 assert.equal((await post({inquiry_text:'교육'}, {'Content-Type':'text/plain'})).status,415);
 assert.equal((await post({inquiry_text:'교육'}, {'Content-Type':'application/json',Origin:'https://untrusted.example'})).status,403);
 assert.equal((await fetch(base+'/api/education-inquiry')).status,405);
});

test('streamed UTF-8 preserves Korean input across chunk boundaries',async()=>{
 const {request}=await import('node:http');
 const input={inquiry_text:'인사팀 실무자 대상 AI 교육을 문의합니다. 예산은 200만원입니다.'};
 const bytes=Buffer.from(JSON.stringify(input));
 const split=bytes.findIndex(b=>b>=128)+1;
 const reply=await new Promise((resolve,reject)=>{
  const req=request(base+'/api/education-inquiry',{method:'POST',headers:{'Content-Type':'application/json'}},res=>{
   const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(Buffer.concat(chunks).toString('utf8'))}));
  });
  req.on('error',reject);req.write(bytes.subarray(0,split));setTimeout(()=>req.end(bytes.subarray(split)),20);
 });
 assert.equal(reply.status,200);assert.ok(reply.body.facts.some(f=>f.field==='대상'&&f.value.includes('인사팀')));
 assert.ok(reply.body.facts.every(f=>!f.evidence.includes('\ufffd')));
});
