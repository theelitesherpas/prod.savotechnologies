import { beforeEach, expect, it, vi } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const load=()=>import(/* @vite-ignore */pathToFileURL(resolve('scripts/email-poller.mjs')).href);
const m={post:vi.fn(),flags:vi.fn(),download:vi.fn(),lock:vi.fn(),logout:vi.fn(),source:Buffer.from('From: Sender <sender@example.invalid>\r\nTo: hr@savotechnologies.com\r\nContent-Type: text/plain\r\n\r\nSynthetic reply'),size:100};
class FakeClient {
 mailbox={uidValidity:BigInt(42)};async connect(){}async getMailboxLock(){return{release:m.lock};}async search(){return[17];}
 async fetchOne(){return{size:m.size,envelope:{from:[{name:'Synthetic Sender',address:'sender@example.invalid'}],subject:'Synthetic reply',messageId:'<synthetic@example.invalid>'}};}
 async download(...args:unknown[]){m.download(...args);return{content:(async function*(){yield m.source;})()};}
 messageFlagsAdd=m.flags;logout=m.logout;
}
const mailbox={dept:'hr',user:'hr@savotechnologies.com',pass:'synthetic-not-real'};
beforeEach(()=>{vi.clearAllMocks();m.size=100;m.post.mockResolvedValue(Response.json({ok:true,id:'reply-synthetic'},{status:201}));});
it('uses authenticated multipart import and marks the exact UID seen only after a persisted ack',async()=>{
 const {pollMailbox}=await load();expect(await pollMailbox(mailbox,{Client:FakeClient,post:m.post,secret:'synthetic-secret',port:'4340'})).toBe(1);
 const[url,options]=m.post.mock.calls[0];expect(url).toBe('http://127.0.0.1:4340/api/email/inbound');expect(url).not.toContain('secret');expect(options.headers['x-webhook-secret']).toBe('synthetic-secret');expect(options.redirect).toBe('error');expect(options.body.get('deliveryKey')).toBe('imap:hr:42:17');expect(m.flags).toHaveBeenCalledWith(17,['\\Seen'],{uid:true});expect(m.lock).toHaveBeenCalled();expect(m.logout).toHaveBeenCalled();
});
it('does not mark messages seen after failed import or a missing persistence ack',async()=>{
 const {pollMailbox}=await load();m.post.mockResolvedValue(new Response(null,{status:503}));expect(await pollMailbox(mailbox,{Client:FakeClient,post:m.post,secret:'synthetic',port:'4340'})).toBe(0);expect(m.flags).not.toHaveBeenCalled();
 m.post.mockResolvedValue(Response.json({ok:true}));expect(await pollMailbox(mailbox,{Client:FakeClient,post:m.post,secret:'synthetic',port:'4340'})).toBe(0);expect(m.flags).not.toHaveBeenCalled();
});
it('imports an oversized-message notice without downloading an unbounded MIME source',async()=>{
 const {pollMailbox}=await load();m.size=16_000_001;await pollMailbox(mailbox,{Client:FakeClient,post:m.post,secret:'synthetic',port:'4340'});expect(m.download).not.toHaveBeenCalled();expect(m.post.mock.calls[0][1].body.get('attachmentIssue')).toBe('oversize');expect(m.flags).toHaveBeenCalledTimes(1);
});
it('refuses to connect without authenticated loopback delivery configuration',async()=>{
 const {pollMailbox}=await load();await expect(pollMailbox(mailbox,{Client:FakeClient,post:m.post,secret:'',port:'4340'})).rejects.toThrow('CONFIGURATION');expect(m.post).not.toHaveBeenCalled();expect(m.flags).not.toHaveBeenCalled();
});
