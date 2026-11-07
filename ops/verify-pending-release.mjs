/** Inspect pending Git objects using the INSTALLED, trusted bootstrap policy.
 * No checkout, imports or execution from the pending release are performed. */
import assert from 'node:assert/strict';
import{execFileSync}from'node:child_process';import{mkdtempSync,mkdirSync,writeFileSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';
import{sourceFindings}from'../scripts/verify-source-integrity.mjs';
const [commit,tree]=process.argv.slice(2);assert(/^[a-f0-9]{40}$/.test(commit||'')&&/^[a-f0-9]{40}$/.test(tree||''));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});assert.equal(git('rev-parse',commit+'^{tree}').trim(),tree);
const root=mkdtempSync(join(tmpdir(),'savo-pending-source-'));
try{
 for(const line of git('ls-tree','--name-only',commit).trim().split('\n'))if(line)writeFileSync(join(root,line),'',{flag:'wx'});
 // Replace placeholder directory names only for these inert metadata files.
 rmSync(join(root,'prisma'));mkdirSync(join(root,'prisma'));
 for(const file of['package.json','package-lock.json','postcss.config.mjs','next.config.ts','eslint.config.mjs','.gitignore','prisma/schema.prisma'])writeFileSync(join(root,file),git('show',commit+':'+file));
 const findings=sourceFindings(root,{trackedPaths:git('ls-tree','-r','--name-only',commit).trim().split('\n'),env:process.env});assert.equal(findings.length,0,findings.join('; '));console.log('Pending reviewed tree passes installed bootstrap policy without executing pending code.');
}finally{rmSync(root,{recursive:true,force:true});}
