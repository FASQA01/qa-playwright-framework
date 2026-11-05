import { chromium, type Browser, type Page } from '@playwright/test';

let browser: Browser | null = null;
let page: Page | null = null;
let allowedOrigin = '';
let actions = 0;
const MAX_ACTIONS = 30;

// Page ke interactive elements nikalne ki script (browser ke andar chalti hai)
const SNAPSHOT_SCRIPT = `(() => {
  const tx = (e) => ((e.innerText ?? e.textContent) || '').trim();
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const sel = (e) => {
    for (const a of ['data-test', 'data-testid', 'data-qa']) {
      if (e.getAttribute(a)) return '[' + a + '="' + e.getAttribute(a) + '"]';
    }
    if (e.id) return '#' + CSS.escape(e.id);
    if (e.getAttribute('name')) return e.tagName.toLowerCase() + '[name="' + e.getAttribute('name') + '"]';
    if (e.getAttribute('placeholder')) return e.tagName.toLowerCase() + '[placeholder="' + e.getAttribute('placeholder') + '"]';
    const txt = (tx(e) || e.value || '').slice(0, 40);
    return txt ? e.tagName.toLowerCase() + ':has-text("' + txt.replace(/"/g, '') + '")' : e.tagName.toLowerCase();
  };
  const pick = (q, f) => Array.from(document.querySelectorAll(q)).filter(vis).slice(0, 40).map(f);
  return {
    url: location.href,
    title: document.title,
    headings: pick('h1,h2,h3', (e) => tx(e).slice(0, 80)),
    alerts: pick('[role=alert],.error,[class*=error],[data-test=error]', (e) => tx(e).slice(0, 200)).filter((t) => t),
    inputs: pick('input,select,textarea', (e) => ({ type: e.type || e.tagName.toLowerCase(), placeholder: e.placeholder || '', label: (e.labels && e.labels[0] ? e.labels[0].innerText.trim() : ''), selector: sel(e) })),
    buttons: pick('button,[role=button],input[type=submit]', (e) => ({ text: (tx(e) || e.value || '').slice(0, 40), selector: sel(e) })),
    links: pick('a[href]', (e) => ({ text: tx(e).slice(0, 40), href: e.getAttribute('href') })).slice(0, 25),
  };
})()`;

async function ensurePage(): Promise<Page> {
  if (!browser) browser = await chromium.launch();
  if (!page) page = await (await browser.newContext()).newPage();
  return page;
}

async function snapshot(): Promise<string> {
  const p = await ensurePage();
  const data = await p.evaluate(SNAPSHOT_SCRIPT);
  return JSON.stringify(data).slice(0, 6000);
}

export async function exploreUrl(url: string): Promise<string> {
  const p = await ensurePage();
  const target = new URL(url);
  if (!allowedOrigin) allowedOrigin = target.origin; // pehla URL = allowed site
  if (target.origin !== allowedOrigin) return `ERROR: only ${allowedOrigin} is allowed (guardrail).`;
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await p.waitForTimeout(800);
  return snapshot();
}

export async function interact(action: string, selector: string, value?: string): Promise<string> {
  const p = await ensurePage();
  if (!allowedOrigin) return 'ERROR: call explore_page first.';
  if (++actions > MAX_ACTIONS) return 'ERROR: max exploration actions reached (guardrail).';
  try {
    const el = p.locator(selector).first();
    if (action === 'fill') await el.fill(value ?? '', { timeout: 5000 });
    else if (action === 'click') await el.click({ timeout: 5000 });
    else return 'ERROR: action must be fill or click.';
    await p.waitForTimeout(800);
    if (new URL(p.url()).origin !== allowedOrigin) {
      await p.goBack();
      return 'ERROR: navigated outside allowed site, went back (guardrail).';
    }
    return snapshot();
  } catch (e: any) {
    return `ERROR: ${String(e.message).split('\n')[0]}`;
  }
}

export async function closeExplorer() {
  await browser?.close();
  browser = null;
  page = null;
}