import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatMessageBody } from '@/lib/mail/message-format.mjs';
import { EmailMessageView } from '@/components/admin/email-message-view';
it('repairs legacy quoted-printable UTF-8 and soft wrapping without changing stored source',()=>{
 const original='Hi Team,\n\nConfirmed =E2=80=93 thank you.\n\nOn Fri, 30 Oct 2026, Team\nwrote:\n> Earlier=20correspondence=\n continues.';const message={bodyText:original,bodyHtml:null,bodyFormatVersion:0};const clean=formatMessageBody(message);
 expect(clean.bodyText).toBe('Hi Team,\n\nConfirmed – thank you.');expect(clean.quotedText).toContain('Earlier correspondence continues.');expect(clean.originalText).toBe(original);expect(message.bodyText).toBe(original);
});
it('does not double-decode new messages or alter legitimate literal encoded examples',()=>{
 const text='Example literal: =E2=80=93';expect(formatMessageBody({bodyText:text,bodyFormatVersion:1}).bodyText).toBe(text);expect(formatMessageBody({bodyText:'Cost = 12; code =3D',bodyFormatVersion:0}).bodyText).toBe('Cost = 12; code =3D');
});
it('repairs encoded legacy HTML into a sandboxed reading format rather than raw CSS text',()=>{
 const html='<html><body><p style=3D"color:red">Hello =E2=80=93 team</p></body></html>';expect(formatMessageBody({bodyHtml:html,bodyFormatVersion:0})).toMatchObject({bodyHtml:'<html><body><p style="color:red">Hello – team</p></body></html>',originalText:html});
});
it('supports legacy base64 HTML with a preserved original representation',()=>{
 const original='<html><body><p>Readable reply, not MIME source.</p></body></html>';expect(formatMessageBody({bodyHtml:Buffer.from(original).toString('base64'),bodyFormatVersion:0}).bodyHtml).toBe(original);
});
it('places untrusted HTML behind script/form/network restrictions with explicit image consent',()=>{
 const html=renderToStaticMarkup(<EmailMessageView html='<h1>Hello</h1><script>parent.attack=true</script>' text='Hello'/>);expect(html).toContain('sandbox=""');expect(html).toContain("script-src &#x27;none&#x27;");expect(html).toContain("form-action &#x27;none&#x27;");expect(html).toContain('Load images');expect(html).toContain('blocked for privacy');expect(html).not.toContain('allow-scripts');expect(html).not.toContain('allow-same-origin');
});
it('keeps plain-text correspondence readable without interpreting newly received HTML code samples',()=>{
 const clean=formatMessageBody({bodyText:'<div>Code sample</div>',bodyFormatVersion:1});expect(clean.bodyHtml).toBeNull();const html=renderToStaticMarkup(<EmailMessageView text={clean.bodyText}/>);expect(html).toContain('&lt;div&gt;Code sample&lt;/div&gt;');expect(html).not.toContain('<iframe');
});
