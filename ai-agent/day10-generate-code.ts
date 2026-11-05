import fs from 'node:fs';
import { ask, stripFences, writeGenerated, FRAMEWORK_CONTEXT } from './lib';

async function main() {
  const cases = fs.readFileSync('ai-agent/testcases.json', 'utf8');

  const system = `You are a senior SDET. ${FRAMEWORK_CONTEXT}`;
  const prompt = `Convert these test cases into ONE Playwright spec file.
Use test.describe, one test per case, meaningful assertions.
Use only the pages and fixtures listed above.

Test cases:
${cases}`;

  const code = stripFences(await ask(system, prompt, 4000));
  const file = writeGenerated('login', code);

  console.log('Generated:', file);
  console.log(code.split('\n').slice(0, 25).join('\n'));
}

main().catch(console.error);