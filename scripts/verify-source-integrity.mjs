/** Dependency-free bootstrap gate. Run BEFORE npm/Next/Prisma configuration loads.
 * A guard is not a substitute for trusted account access or a reviewed commit pin. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
export const scriptFingerprint = scripts => createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(scripts).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
const SCRIPT_HASH='950528770ee73dbbf0b62c644a4285bd4ab1b892091cba82c3dc5fefcbb68b32';
const POSTCSS_HASH='dfac7ac2d86d326a0e5adb024e7943c181393ed17a5fcb8f0315b24c7da6ddde';
export function sourceFindings(root, { trackedPaths=[], env={} }={}) {
 const errors=[], fail=x=>errors.push(x), read=p=>readFileSync(resolve(root,p),'utf8');
 try {
  const pkg=JSON.parse(read('package.json'));
  if(!pkg.scripts||scriptFingerprint(pkg.scripts)!==SCRIPT_HASH)fail('Unreviewed npm scripts or lifecycle hooks');
  if(['postcss','babel','prisma','imports','exports','bin','main','workspaces','type'].some(key=>Object.hasOwn(pkg,key)))fail('Unreviewed package-level executable configuration');
  if(createHash('sha256').update(readFileSync(resolve(root,'postcss.config.mjs'))).digest('hex')!==POSTCSS_HASH)fail('Unreviewed executable PostCSS configuration');
  for(const[file,hash]of Object.entries({'next.config.ts':'44b70f94f5d7b660645ef893706daf1fa1d88073a5580e1eba148ed712f6db72','eslint.config.mjs':'5626043506ca955f892915f462ddb880f7f072844bc91aedc5367407817b6aa3'}))if(createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')!==hash)fail('Unreviewed executable Next/ESLint configuration');
  for(const name of readdirSync(root))if(['init','api.js','config.bat','branch_structure.json','.npmrc','.babelrc','.babelrc.json','.babelrc.js','.swcrc'].includes(name.toLowerCase())||/^prisma\.config\./i.test(name)||/^babel\.config\./i.test(name)||/^next\.config\./i.test(name)&&name!=='next.config.ts'||/^eslint\.config\./i.test(name)&&name!=='eslint.config.mjs'||/^postcss\.config\./i.test(name)&&name!=='postcss.config.mjs'||/^tailwind\.config\./i.test(name)||/^\.postcssrc/i.test(name))fail('Unexpected root bootstrap/configuration file');
  if(!read('.gitignore').split(/\r?\n/).includes('.env*'))fail('Environment ignore protection removed');
  if(trackedPaths.some(p=>/(^|\/)\.env(?:\.|$)/i.test(p)&&!/(^|\/)\.env\.example$/.test(p)))fail('Private environment file tracked by Git');
  if(trackedPaths.some(p=>p.startsWith('public/uploads/')))fail('Runtime uploads tracked by Git');
  const schema=read('prisma/schema.prisma'),generators=[...schema.matchAll(/generator\s+\w+\s*\{[^}]*provider\s*=\s*"([^"]+)"/g)];
  if(generators.length!==1||generators[0][1]!=='prisma-client-js')fail('Unreviewed Prisma code generator');
  const lock=JSON.parse(read('package-lock.json'));
  if(lock.lockfileVersion!==3||!lock.packages)fail('Unexpected dependency lock format');
  for(const [name,p]of Object.entries(lock.packages||{})) {
   if(!name)continue;
   if(p.link) { fail('Local linked dependency is not approved');break; }
   if(p.inBundle&&!p.resolved){
    const parent=lock.packages[name.slice(0,name.lastIndexOf('/node_modules/'))];
    if(!parent?.integrity||!parent?.resolved?.startsWith('https://registry.npmjs.org/'))fail('Bundled dependency lacks an integrity-protected container');
    continue; // Bytes are covered by the containing package's integrity.
   }
   let url;try{url=new URL(p.resolved);}catch{}
   if(!url||url.protocol!=='https:'||url.hostname!=='registry.npmjs.org'||url.username||url.password||url.port||url.hash){fail('Dependency resolved outside the approved HTTPS registry');break;}
   if(typeof p.integrity!=='string'||!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(p.integrity)||Buffer.from(p.integrity.slice(7),'base64').length!==64){fail('Dependency integrity missing or weak');break;}
  }
  if(env.NODE_OPTIONS&&!env.NODE_OPTIONS.split(/\s+/).filter(Boolean).every(v=>/^--max[-_]old[-_]space[-_]size=\d+$/.test(v)))fail('Unapproved Node startup options');
  if(env.NODE_PATH||env.LD_PRELOAD||env.PAYPAL_MOCK_ORIGIN||env.NODE_TLS_REJECT_UNAUTHORIZED==='0')fail('Unexpected runtime injection/test or insecure TLS setting');
 } catch { fail('Bootstrap metadata could not be safely validated'); }
 return errors;
}
function main(){
 const root=fileURLToPath(new URL('..',import.meta.url)),git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const args=process.argv.slice(2),commit=args.find(a=>a.startsWith('--expected-commit='))?.slice(18),tree=args.find(a=>a.startsWith('--expected-tree='))?.slice(16);
 if(args.some(a=>a!=='--ci'&&!a.startsWith('--expected-commit=')&&!a.startsWith('--expected-tree=')))throw Error('Unknown integrity-check argument');
 if((commit||tree)&&(!/^[a-f0-9]{40}$/.test(commit||'')||!/^[a-f0-9]{40}$/.test(tree||'')))throw Error('A full reviewed commit AND tree are required');
 const findings=sourceFindings(root,{trackedPaths:git('ls-files','-z').split('\0'),env:process.env});
 if(commit){if(git('rev-parse','HEAD')!==commit||git('rev-parse','HEAD^{tree}')!==tree)findings.push('Reviewed release commit/tree mismatch');git('diff','--exit-code','HEAD','--');}
 if(findings.length)throw Error(findings.join('; '));
 console.log('Source bootstrap, environment tracking and dependency-origin integrity checks passed.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch(error){console.error('SECURITY GATE STOPPED: '+error.message);process.exitCode=1;}}
