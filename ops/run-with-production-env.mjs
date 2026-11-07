/** Treat the private environment as DATA, never source it as a root shell script. */
import assert from'node:assert/strict';import{parseEnv}from'node:util';import{readFileSync}from'node:fs';import{spawnSync}from'node:child_process';
const mode=process.argv[2];assert(['verify','build'].includes(mode),'Use verify or build');
const values=parseEnv(readFileSync('.env.production','utf8'));
for(const key of['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH','BASH_ENV','ENV','PAYPAL_MOCK_ORIGIN'])assert(!values[key],'Unreviewed runtime injection setting');
assert(Object.values(values).every(value=>!value.includes('${')),'Resolve environment references as literal data before deployment');
const env={...process.env,...values,NODE_ENV:'production',NEXT_PUBLIC_CONTENT_MODE:'production',NEXT_PUBLIC_INDEXABLE:'true',NEXT_TELEMETRY_DISABLED:'1'};
for(const key of['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH','BASH_ENV','ENV','PAYPAL_MOCK_ORIGIN'])delete env[key];
function run(args){const child=spawnSync(process.execPath,args,{env,stdio:'inherit'});assert.equal(child.status,0,'Reviewed production command failed');}
if(mode==='verify')run(['scripts/verify-runtime-env.mjs','live']);
else{run(['scripts/verify-content.mjs']);run(['node_modules/next/dist/bin/next','build']);}
