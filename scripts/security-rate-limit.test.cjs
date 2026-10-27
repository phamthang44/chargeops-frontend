// Execute the actual TS transport/helpers with a fake clock and HTTP responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'chargeops-driver-mobile/node_modules/typescript'));
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, file);
const helper = require('../chargeops-web/packages/api/src/rateLimit.ts');
const { HttpClient } = require('../chargeops-web/packages/api/src/http.ts');
const driver = require('../chargeops-driver-mobile/src/utils/securityRateLimit.ts');
let now = 1_700_000_000_000;
const originalNow = Date.now; Date.now = () => now;
const originalFetch = global.fetch;
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS', name); }
function originalFunction(file, name) {
  const source=fs.readFileSync(file,'utf8');
  const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const declaration=tree.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);
  const output=ts.transpileModule(declaration.getText(tree),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const context={exports:{},retryDeadline:helper.retryDeadline,Date}; vm.runInNewContext(output,context); return context.exports[name];
}
(async () => {
  try {
    test('numeric Retry-After has a stable deadline across rerenders',()=>{
      const error={status:429,retryAfter:'9'}; const deadline=helper.retryDeadline(error);
      now+=1000; assert.equal(helper.retryDeadline(error),deadline); assert.equal(deadline-now,8000);
    });
    test('HTTP-date, details fallback, invalid headers and non-security errors',()=>{
      assert.equal(helper.retryDeadline({status:429,retryAfter:new Date(now+10000).toUTCString()}),now+10000);
      assert.equal(helper.retryDeadline({code:'SEC_002',details:{retryAfterSeconds:900}}),now+900000);
      assert.equal(helper.retryDeadline({status:429,retryAfter:'invalid'}),now+5000);
      assert.equal(helper.retryDeadline({status:403}),0);
    });
    test('no automatic query retry for security responses',()=>{
      for(const code of ['SEC_001','SEC_002','SEC_003']) assert.equal(helper.shouldRetryApiError(0,{code}),false);
      assert.equal(helper.shouldRetryApiError(0,{status:429}),false);
      assert.equal(helper.shouldRetryApiError(0,{status:500}),true);
      assert.equal(helper.shouldRetryApiError(1,{status:500}),false);
    });
    let fetches=0,tokens=0;
    global.window={location:{origin:'https://console.chargeops.online'}};
    global.fetch=async()=>++fetches===1?new Response(JSON.stringify({error:{code:'SEC_002',details:{retryAfterSeconds:2}}}),{status:429,headers:{'Retry-After':'2'}}):new Response(JSON.stringify({data:{ok:true}}),{status:200});
    const client=new HttpClient({baseUrl:'https://api.chargeops.online',getToken:async()=>{tokens++;return 'fixture';}});
    await assert.rejects(client.request('POST','/bookings'),e=>e.status===429&&e.code==='SEC_002');
    await assert.rejects(client.request('POST','/bookings'),e=>e.status===429);
    assert.equal(fetches,1); assert.equal(tokens,2);
    assert.deepEqual(await client.request('POST','/bookings/fixture/complete'),{ok:true});
    now+=2100; await client.request('POST','/bookings'); assert.equal(fetches,3);
    count++; console.log('PASS console cooldown suppresses network replay and never blocks another action');
    fetches=0;
    global.fetch=async()=>{fetches++;return new Response(JSON.stringify({error:{code:'SEC_001',details:{retryAfterSeconds:2}}}),{status:429,headers:{'Retry-After':'2'}});};
    await driver.securityFetch('https://api.chargeops.online/api/v1/bookings',{method:'POST'});
    now+=1200;
    const cached=await driver.securityFetch('https://api.chargeops.online/api/v1/bookings',{method:'POST'});
    assert.equal(fetches,1); assert.equal(driver.securityRetryDetails(cached,{}).retryAfterSeconds,1);
    now+=1000; await driver.securityFetch('https://api.chargeops.online/api/v1/bookings',{method:'POST'}); assert.equal(fetches,2);
    count++; console.log('PASS Driver decrements wait and does not replay mutations');
    const jwt=(sub,sig)=>`e30.${Buffer.from(JSON.stringify({iss:'fixture',sub})).toString('base64url')}.${sig}`;
    let credential=jwt('A','one'); fetches=0;
    global.fetch=async()=>{fetches++;return new Response('{"error":{"code":"SEC_002"}}',{status:429,headers:{'Retry-After':'900'}});};
    const isolated=new HttpClient({baseUrl:'https://api.chargeops.online',getToken:async()=>credential});
    await assert.rejects(isolated.request('POST','/isolation'));
    credential=jwt('A','refreshed');await assert.rejects(isolated.request('POST','/isolation'));assert.equal(fetches,1);
    credential=jwt('B','one');await assert.rejects(isolated.request('POST','/isolation'));assert.equal(fetches,2);
    fetches=0;
    const request=(token)=>driver.securityFetch('https://api.chargeops.online/isolation',{method:'POST',headers:{Authorization:`Bearer ${token}`}});
    await request(jwt('A','one'));await request(jwt('A','refresh'));assert.equal(fetches,1);
    await request(jwt('B','one'));assert.equal(fetches,2);
    count++; console.log('PASS Console and Driver isolate accounts while preserving same-subject refresh cooldown');
    const bookingFile=path.join(root,'chargeops-driver-mobile/src/services/bookingService.ts');
    const source=fs.readFileSync(bookingFile,'utf8');const tree=ts.createSourceFile(bookingFile,source,ts.ScriptTarget.Latest,true);
    const declarations=tree.statements.filter(s=>s.name&&['BookingApiError','createBooking'].includes(s.name.text)).map(s=>s.getText(tree)).join('\n');
    const output=ts.transpileModule(declarations,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
    const context={exports:{},console,isMockMode:()=>false,resolveAccessToken:()=>null,generateIdempotencyKey:()=> 'fixture-id',apiBaseUrl:'https://api.fixture',
      securityRetryDetails:driver.securityRetryDetails,securityFetch:async()=>new Response('not JSON',{status:429,headers:{'Retry-After':'7'}})};
    vm.runInNewContext(output,context);
    await assert.rejects(context.exports.createBooking({acceptedTotalAmount:1,acceptedPricingVersion:'a'.repeat(64)}),e=>e.status===429&&e.details.retryAfterSeconds===7);
    count++;console.log('PASS actual Driver createBooking adapter preserves gateway HTTP429 and header without JSON code');
    const consoleTicket=originalFunction(path.join(root,'chargeops-web/apps/web/src/shared/tickets/utils/ticketErrors.ts'),'getTicketErrorMeta');
    const driverTicket=originalFunction(path.join(root,'chargeops-driver-mobile/src/services/ticketService.ts'),'getLocalizedTicketErrorMessage');
    const t=(key,args)=>key+':'+JSON.stringify(args);
    assert.match(consoleTicket({code:'SEC_003',status:503,details:{retryAfterSeconds:5}},t).message,/security.unavailable/);
    assert.match(driverTicket({code:'SEC_003',status:503,details:{retryAfterSeconds:5}},t),/security.unavailable/);
    count++; console.log('PASS both ticket adapters keep SEC_003 separate from moderation');
    console.log(`${count} security client scenarios PASS`);
  } finally { Date.now=originalNow; global.fetch=originalFetch; }
})().catch(error=>{console.error(error);process.exitCode=1;});
