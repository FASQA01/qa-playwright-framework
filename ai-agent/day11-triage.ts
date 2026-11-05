import { ask, stripFences, runGeneratedTests } from './lib';

async function main() {
  console.log('Running generated tests...');
  const { passed, output } = runGeneratedTests();

  if (passed) {
    console.log('All generated tests passed. Nothing to triage.');
    return;
  }

  const system = 'You are a senior QA engineer triaging Playwright failures. Return ONLY valid JSON.';
  const prompt = `Playwright output (tail):
${output}

For each failed test return a JSON array of:
{"test":"...","category":"PRODUCT_BUG|TEST_BUG|ENVIRONMENT","reason":"...","suggested_fix":"..."}
Be specific. If you are unsure, say so in the reason.`;

  const raw = await ask(system, prompt, 2000);
  try {
    console.table(JSON.parse(stripFences(raw)));
  } catch {
    console.log(raw);
  }
}

main().catch(console.error);