import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { caseStudySchema, type CaseStudy } from '../src/lib/case-study-schema';
import { buildHomePortfolioFeatures } from '../src/sections/home-v2/portfolio-content';
import { PortfolioShowcase } from '../src/sections/home-v2/portfolio';
const { getCases } = vi.hoisted(() => ({ getCases: vi.fn() }));
vi.mock('../src/lib/case-studies', () => ({ getCaseStudies: getCases }));
vi.mock('../src/lib/content-items', () => ({ getManagedArticles: async()=>[], getManagedTestimonials: async()=>[] }));
vi.mock('../src/lib/content-mode', () => ({ IS_DEMO: false }));
vi.mock('../src/sections/home-v2/hero', () => ({ HeroV2: ()=>null }));
vi.mock('../src/sections/home-v2/sections', () => ({ WorkV2: ({features}:{features:unknown})=>React.createElement('pre',null,JSON.stringify(features)), ServicesV2:()=>null,AIBandV2:()=>null,TechnologiesGridV2:()=>null,ProcessV2:()=>null,TestimonialsVideoV2:()=>null,InsightsV2:()=>null }));
vi.mock('../src/sections/home-v2/industry-fan',()=>({IndustryFan:()=>null}));
vi.mock('../src/sections/home/brand-statement',()=>({BrandStatement:()=>null}));
vi.mock('../src/sections/home/final-cta',()=>({FinalCTA:()=>null}));
vi.mock('../src/sections/home/home-faq',()=>({HomeFaq:()=>null}));
import HomePage from '../src/app/(site)/page';
const image={dataUrl:'data:image/png;base64,Y292ZXI=',width:1600,height:1000,alt:'Supplied project cover'};
const study=(slug='test-web',discipline:CaseStudy['discipline']='web',changes:Partial<CaseStudy>={}):CaseStudy=>({ ...caseStudySchema.parse({title:`Test ${discipline} project`,discipline,featured:true,status:'verified',images:{cardWide:image}}),slug,...changes });
const render=(features=buildHomePortfolioFeatures([study()]))=>renderToStaticMarkup(React.createElement(PortfolioShowcase,{features}));

describe('Featured homepage case selection',()=>{
  it('selects exactly one matching featured published project per tab',()=>{
    const f=buildHomePortfolioFeatures([study(),study('test-mobile','mobile'),study('test-ai','ai')]);
    expect(Object.keys(f)).toEqual(['web','mobile','ai']);for(const id of ['web','mobile','ai'] as const)expect(f[id]?.href).toBe(`/case-studies/test-${id}`);
  });
  it('honors admin order rather than a hardcoded client or duplicate category',()=>{
    const f=buildHomePortfolioFeatures([study('unfeatured','web',{featured:false}),study('second'),study('third')]);
    expect(f.web?.href).toBe('/case-studies/second');expect(f.mobile).toBeUndefined();expect(f.ai).toBeUndefined();
  });
  it('fails closed for unfeatured/demo/unsafe/missing-cover/other discipline records',()=>{
    expect(buildHomePortfolioFeatures([study('unfeatured','web',{featured:false}),study('demo','mobile',{status:'demo'}),study('../unsafe','ai'),study('missing','ai',{images:undefined}),study('software','software')])).toEqual({});
  });
  it('does not call gallery art a cover or resurrect fictional concepts',()=>{
    expect(buildHomePortfolioFeatures([study('gallery-only','web',{images:undefined,gallery:[image]})])).toEqual({});expect(buildHomePortfolioFeatures([])).toEqual({});
  });
  it('skips a missing cover to use the next eligible featured project',()=>{
    expect(buildHomePortfolioFeatures([study('missing','web',{images:undefined}),study('ready')]).web?.href).toBe('/case-studies/ready');
  });
  it('uses the featured cover slot first and the existing versioned image endpoint',()=>{
    const f=buildHomePortfolioFeatures([study('cover','web',{images:{cardWide:image,showcase:{...image,alt:'Not the featured cover',dataUrl:'data:image/png;base64,T3RoZXI='}}})]);
    expect(f.web?.image.alt).toBe(image.alt);expect(f.web?.image.src).toMatch(/^\/api\/cs-img\?s=cover&k=cardWide&v=/);expect(f.web?.image).toMatchObject({width:1600,height:1000});
  });
  it.each(['showcase','card','heroImage'] as const)('supports the genuine legacy cover fallback %s',slot=>{
    const s=study('legacy','web',{images:undefined});if(slot==='heroImage')s.heroImage=image;else s.images={[slot]:image};
    expect(buildHomePortfolioFeatures([s]).web?.image.alt).toBe(image.alt);
  });
  it('sends only safe small display props and respects anonymous display names',()=>{
    const s=study('nda','web',{nda:true,title:'Private internal client',clientName:'Private client',displayClientName:'',challenge:'Private challenge',images:{cardWide:{...image,alt:''}}});
    const f=buildHomePortfolioFeatures([s]);expect(f.web?.name).toBe('Confidential project');expect(f.web?.image.alt).toBe('Confidential project cover');
    expect(JSON.stringify(f)).not.toMatch(/Private|data:image|challenge|clientName|gallery/);
  });
  it('does not mutate managed records',()=>{const s=study(),before=JSON.stringify(s);buildHomePortfolioFeatures([s]);expect(JSON.stringify(s)).toBe(before);});
});
describe('Original frame/copy with straight linked covers',()=>{
  it('keeps the exact Web copy, tags, section heading and three original tabs',()=>{
    const h=render();for(const text of ['A closer look at what we build.','Websites and web applications','Company sites, customer portals and online stores, designed around your users and the tasks they need to complete.','Websites','Portals','Online stores','Explore'])expect(h).toContain(text);
    expect(h.match(/role="tab"/g)).toHaveLength(3);expect(h.match(/role="tabpanel"/g)).toHaveLength(3);for(const id of ['web','mobile','ai'])expect(h).toContain(`id="portfolio-tab-${id}"`);
  });
  it('links the actual cover/caption/Explore to the selected case study, not a mockup',()=>{
    const h=render();expect(h).toContain('aria-label="View Test web project case study"');expect(h).toContain('aria-label="Explore Test web project case study"');expect(h.match(/href="\/case-studies\/test-web"/g)).toHaveLength(3);
    expect(h).toContain('/api/cs-img?s=test-web&amp;k=cardWide');expect(h.match(/<img /g)).toHaveLength(1);expect(h).not.toMatch(/Web platform concept|Travel concept|AI workspace concept|Illustrative product concepts|architecture\.webp/);
  });
  it('retains the frame and useful capability tabs when a feature is unavailable',()=>{
    const h=render({});expect(h).toContain('No featured Web case study is available.');expect(h).not.toContain('<img ');expect(h).toContain('href="/case-studies"');expect(h).toContain('href="/ai-agents"');expect(h).toContain('Apps for customers and teams');
  });
  it('removes only obsolete tilted artwork CSS and keeps the stage/shell geometry',()=>{
    const css=fs.readFileSync('src/sections/home-v2/portfolio.module.css','utf8');expect(css).not.toMatch(/rotate\(|\.device\s*\{|\.scene\[data-view=/);expect(css).toContain('.coverImage { object-fit: cover; object-position: center; }');expect(css).toContain('aspect-ratio: 1.48');expect(css).toContain('grid-template-columns: minmax(0, 1fr) 320px');expect(css).toContain('touch-action: pan-y');
    const src=fs.readFileSync('src/sections/home-v2/portfolio.tsx','utf8');expect(src).toContain('if (e.detail > 0) { e.preventDefault(); e.stopPropagation(); }');expect(src).toContain('onPointerCancel');expect(src).toContain('onError={() => setFailedImage(feature.image.src)}');
  });
  it('adds a decorative bordered browser with cover viewport, not fake controls or URLs',()=>{
    const h=render();expect(h).toContain('data-cover-frame="browser"');expect(h).toContain('data-browser-bar="true"');
    expect(h).toMatch(/aria-hidden="true" data-browser-bar/);
    const css=fs.readFileSync('src/sections/home-v2/portfolio.module.css','utf8');
    expect(css).toContain('border: 1px solid #cfcfcf');expect(css).toContain('.coverViewport { position: relative; flex: 1; min-height: 0; }');
    expect(css).toContain('.plainCover { inset: 0; border: 0; border-radius: 0; background: transparent; }');
    expect(h).not.toContain('type="text"');
  });
  it('fetches managed published cases on the server and passes only selected display props',async()=>{
    getCases.mockResolvedValueOnce([study(),study('mobile','mobile'),study('ai','ai')]);const h=renderToStaticMarkup(await HomePage());expect(getCases).toHaveBeenCalled();expect(h).toContain('/case-studies/test-web');expect(h).toContain('/case-studies/mobile');expect(h).toContain('/case-studies/ai');expect(h).not.toContain('data:image');
  });
});
