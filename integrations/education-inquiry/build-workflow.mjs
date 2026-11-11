import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const engine = (await readFile(new URL('engine.mjs', root), 'utf8')).replace('export function processInquiry', 'function processInquiry');
const code = engine + `\nconst started=Date.now();\ntry {\n const input=$input.first().json.body || {};\n const result=processInquiry(input,{engine:'n8n-rules',requestId:'n8n-'+$execution.id});\n result.duration_ms=Date.now()-started;\n return [{json:{http_status:200,body:result}}];\n} catch(error) { return [{json:{http_status:error.status || 500,body:{error:{code:error.code || 'PROCESSING_FAILED',message:error.status===400?error.message:'처리 중 오류가 발생했습니다.'},external_sent:false}}}]; }`;
const workflow = {
  id: 'educationInquiryPortfolioDemo', name: 'Education inquiry - source-grounded demo', active: false,
  nodes: [
    { id: 'inquiry-webhook', name: 'Receive inquiry', type: 'n8n-nodes-base.webhook', typeVersion: 2.1, position: [0,0], webhookId: 'education-inquiry-portfolio-demo', parameters: {httpMethod:'POST',path:'education-inquiry-demo',responseMode:'responseNode',options:{}} },
    { id: 'parse-inquiry', name: 'Validate and extract source facts', type: 'n8n-nodes-base.code', typeVersion: 2, position: [260,0], parameters:{jsCode:code} },
    { id:'reply-inquiry', name:'Return draft - no external send', type:'n8n-nodes-base.respondToWebhook', typeVersion:1.4, position:[530,0], parameters:{respondWith:'json',responseBody:'={{ $json.body }}',options:{responseCode:'={{ $json.http_status }}'}} }
  ],
  connections: {'Receive inquiry':{main:[[{node:'Validate and extract source facts',type:'main',index:0}]]},'Validate and extract source facts':{main:[[{node:'Return draft - no external send',type:'main',index:0}]]}},
  settings:{executionOrder:'v1',saveDataErrorExecution:'none',saveDataSuccessExecution:'none',saveManualExecutions:false},
  pinData:{},tags:[]
};
await writeFile(new URL('workflow.json',root),JSON.stringify(workflow,null,2)+'\n');
console.log('Generated workflow.json from engine.mjs; no credentials or external actions.');
