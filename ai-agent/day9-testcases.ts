import fs from 'node:fs';
import { ask, stripFences } from './lib';

async function main() {
  const requirement =
    process.argv.slice(2).join(' ') ||
    'User can log in with valid credentials, and sees an error for invalid, locked-out or empty credentials.';

  const system = 'You are a senior QA engineer. Return ONLY valid JSON, no explanation.';
  const prompt = `Requirement: ${requirement}

Generate test cases as a JSON array. Each item:
{"id":"TC01","title":"...","type":"positive|negative|edge","steps":["..."],"expected":"..."}
Cover positive, negative and edge cases. Maximum 8 test cases.`;

  const raw = await ask(system, prompt);
  const cases = JSON.parse(stripFences(raw));

  console.table(cases.map((c: any) => ({ id: c.id, type: c.type, title: c.title })));
  fs.writeFileSync('ai-agent/testcases.json', JSON.stringify(cases, null, 2));
  console.log('Saved: ai-agent/testcases.json');
}

main().catch(console.error);