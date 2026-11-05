import 'dotenv/config';
import OpenAI from 'openai';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = process.env.LLM_MODEL ?? 'deepseek-chat';
export const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL ?? 'https://api.deepseek.com',
});
export const GENERATED_DIR = path.resolve('tests', 'generated');

export const FRAMEWORK_CONTEXT = `
Framework rules (Playwright + TypeScript, Page Object Model):
- App under test: https://www.saucedemo.com (baseURL is already configured).
- Test files live in tests/generated/. Always import:
  import { test, expect } from '../fixtures';
  import { users } from '../../testdata/users';
- Available fixtures: loginPage, inventoryPage, cartPage, loggedIn (already logged in, returns InventoryPage).
- LoginPage: goto(), login(user, pass); locators: username, password, loginButton, errorMessage
- InventoryPage: title, cartBadge, itemNames, addFirstItems(n), removeFirstItem(), openCart(),
  sortBy('az'|'za'|'lohi'|'hilo'), getPrices(), logout(), firstItemName()
- CartPage: items, itemNames
- users: standard, locked, invalid (each has username, password)
- Return ONLY TypeScript code when asked for code. No explanations, no markdown.
`;

export function stripFences(text: string): string {
  const m = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return (m ? m[1] : text).trim();
}

export async function ask(system: string, user: string, maxTokens = 2000): Promise<string> {
  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? '';
}

export function safeFileName(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/\.spec\.ts$|\.ts$/, '')
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'generated';
  return `${base}.spec.ts`;
}

export function writeGenerated(name: string, code: string): string {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const file = path.join(GENERATED_DIR, safeFileName(name));
  fs.writeFileSync(file, code, 'utf8');
  return file;
}

export function readGenerated(name: string): string {
  const file = path.join(GENERATED_DIR, safeFileName(name));
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : 'ERROR: file not found';
}

export function runGeneratedTests(): { passed: boolean; output: string } {
  const r = spawnSync(
    'npx',
    ['playwright', 'test', 'tests/generated', '--reporter=list', '--project=chromium'],
    { encoding: 'utf8', shell: true, timeout: 180_000 },
  );
  const output = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  return { passed: r.status === 0, output: output.slice(-6000) };
}