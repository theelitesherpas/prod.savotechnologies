import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

// Execute the actual callback handler with a deterministic hook state store.
// No API/CAPTCHA provider is contacted; browser tests cover actual rendering.
const hook = vi.hoisted(() => ({ states: [] as unknown[], refs: [] as { current: unknown }[], index: 0, refIndex: 0 }));
const gate = vi.hoisted(() => ({ required: false, token: null as string | null, refresh: vi.fn(), reset: vi.fn() }));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: vi.fn(),
  useState: (initial: unknown) => {
    const i = hook.index++;
    if (!(i in hook.states)) hook.states[i] = initial;
    return [hook.states[i], (value: unknown) => { hook.states[i] = value; }];
  },
  useRef: (initial: unknown) => {
    const i = hook.refIndex++;
    return hook.refs[i] ??= { current: initial };
  },
}));
vi.mock('../src/components/shared/captcha', () => ({
  useCaptcha: () => gate,
  captchaBlocked: (captcha: typeof gate) => captcha.required && !captcha.token,
  CaptchaGate: ({ captcha, error }: { captcha: typeof gate; error?: string }) => !captcha.required ? null : React.createElement('div', { 'data-captcha-required': 'true' }, error ? React.createElement('p', { role: 'alert' }, error) : null),
}));
vi.mock('../src/lib/analytics', () => ({ track: vi.fn() }));
import { CallbackForm } from '../src/components/shared/callback-form';
const fetchMock = vi.fn();
const render = () => { hook.index = 0; hook.refIndex = 0; return CallbackForm(); };
const html = () => renderToStaticMarkup(render());
const event = () => ({ preventDefault: vi.fn(), currentTarget: {} as HTMLFormElement });
const reply = (json: unknown, status = 200) => new Response(JSON.stringify(json), { status, headers: { 'Content-Type': 'application/json' } });
const submit = () => render().props.onSubmit(event());

beforeEach(() => {
  hook.states = ['India', false, '', '7502911234', false, 'Synthetic reader', 'idle', null, '', false];
  hook.refs = []; gate.required = false; gate.token = null; gate.refresh.mockClear(); gate.reset.mockClear(); fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('FormData', class { get(name: string) { return name === 'cb-name' ? 'Synthetic reader' : ''; } });
});
afterEach(() => vi.unstubAllGlobals());

describe('Shared callback recovery', () => {
  it('shows Google CAPTCHA only after the mobile number field is entered', () => {
    gate.required = true;
    hook.states[3] = '';
    expect(html()).not.toContain('data-captcha-required="true"');
    hook.states[3] = '7'; hook.states[4] = true;
    expect(html()).toContain('data-captcha-required="true"');
  });
  it('does not lock or post when a required CAPTCHA is unsolved', async () => {
    gate.required = true;
    hook.states[4] = true;
    await submit();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hook.states[6]).toBe('idle');
    expect(hook.refs.at(-1)?.current).toBe(false);
    expect(html()).toContain('then request a call back again');
    expect(html()).not.toContain('Sending…');
    expect(html()).not.toMatch(/type="submit" disabled/);
  });
  it('can retry the same draft after solving a blocked challenge', async () => {
    gate.required = true; hook.states[4] = true; await submit();
    gate.token = 'synthetic-solved-token'; fetchMock.mockResolvedValue(reply({ ok: true }));
    await submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/callback');
    expect(JSON.parse(options.body)).toEqual({ name: 'Synthetic reader', country: 'India', phone: '+917502911234', website: '', captchaToken: 'synthetic-solved-token' });
    expect(hook.states[6]).toBe('success'); expect(gate.refresh).toHaveBeenCalledOnce();
  });
  it('synchronously rejects duplicate sends and locks visible draft controls until response', async () => {
    let resolve!: (r: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>(r => { resolve = r; }));
    const form = render(); const sending = form.props.onSubmit(event());
    await form.props.onSubmit(event());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(html()).toContain('aria-busy="true"');
    expect(html()).toMatch(/id="cb-phone"[^>]*disabled/);
    expect(html()).toMatch(/id="cb-name"[^>]*disabled/);
    expect(html()).toMatch(/type="button" disabled="" aria-haspopup/);
    resolve(reply({ ok: true })); await sending;
    expect(hook.refs.at(-1)?.current).toBe(false);
  });
  it('retains the draft and re-enables retry after a network error', async () => {
    hook.states[4] = true;
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(reply({ ok: true }));
    await submit(); expect(hook.states[6]).toBe('error'); expect(hook.states[3]).toBe('7502911234');
    expect(gate.reset).toHaveBeenCalledOnce(); expect(html()).toContain('check your connection and try again');
    await submit(); expect(fetchMock).toHaveBeenCalledTimes(2); expect(hook.states[6]).toBe('success');
  });
  it.each([{ ok: false }, { ok: 'yes' }, { message: 'missing success flag' }])('requires explicit boolean success: %j', async body => {
    hook.states[4] = true; fetchMock.mockResolvedValue(reply(body)); await submit();
    expect(hook.states[6]).toBe('error'); expect(gate.reset).toHaveBeenCalledOnce(); expect(gate.refresh).not.toHaveBeenCalled();
  });
  it('requires HTTP success even with an ok=true body', async () => {
    hook.states[4] = true; fetchMock.mockResolvedValue(reply({ ok: true }, 429)); await submit(); expect(hook.states[6]).toBe('error');
  });
  it('recovers from malformed responses', async () => {
    hook.states[4] = true; fetchMock.mockResolvedValue(new Response('not JSON')); await submit(); expect(hook.states[6]).toBe('error');
    expect(hook.refs.at(-1)?.current).toBe(false);
  });
  it('does not submit a short phone or enter pending state', async () => {
    hook.states[3] = '12'; await submit(); expect(fetchMock).not.toHaveBeenCalled(); expect(hook.states[6]).toBe('idle');
    expect(html()).toContain('India numbers have 10 digits');
  });
  it('confirms only receipt/number, not staffing, guaranteed timing or call/email delivery', async () => {
    hook.states[4] = true; fetchMock.mockResolvedValue(reply({ ok: true })); await submit(); const markup = html();
    expect(markup).toContain('Request received.'); expect(markup).toContain('+91'); expect(markup).toContain('7502911234');
    expect(markup).toContain('Call timing depends on availability.');
    expect(markup).not.toMatch(/senior consultant|two business hours|email sent|call confirmed/);
  });
});

describe('Shared chrome geometry contracts', () => {
  it('keeps the real header action visible at all widths without changing launch routing', () => {
    const source = readFileSync('src/components/layout/site-header.tsx', 'utf8');
    expect(source).toContain('group/btn inline-flex h-11'); expect(source).not.toContain('group/btn hidden h-11');
    expect(source).toContain('href="/start-a-project"');
    expect(source).toContain('const navigateToProject = (source: string) => {');
    expect(source).not.toContain('if (isHome) openProject({ source }); else openEnquiry(source);');
    expect(source).not.toContain('onClick={() => navigateToProject("header")} className={cn("group/btn hidden');
    expect(readFileSync('src/components/layout/nav-panels.tsx', 'utf8')).toContain('href="/start-a-project" onClick={onProject}');
    const css = readFileSync('src/components/layout/site-header.module.css', 'utf8');
    expect(css).toContain('.logo { display:inline-flex; min-width:44px; min-height:44px;');
    expect(css).toContain('.projectButton svg { display: none; }');
  });
  it('adds real hit areas to footer links while preserving all navigation constants', () => {
    const css = readFileSync('src/components/layout/site-footer.module.css', 'utf8');
    for (const selector of ['.directContact', '.officePhones a', '.legal a', '.brandLink']) {
      expect(css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{[^}]+'))?.[0]).toContain('min-height: 44px');
    }
    expect(css).toContain('.column button { display: inline-flex; min-height: 44px;');
  });
});
