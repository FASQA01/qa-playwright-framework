import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import type OpenAI from 'openai';
import {
  client,
  MODEL,
  FRAMEWORK_CONTEXT,
  GENERATED_DIR,
  safeFileName,
  writeGenerated,
  readGenerated,
  runGeneratedTests,
} from './lib';

const MAX_STEPS = 12;
const MAX_FILE_CHARS = 20000;

const SYSTEM = `You are an autonomous QA automation agent.
${FRAMEWORK_CONTEXT}
Workflow: write the test file with write_test_file, run it with run_tests, and if tests fail, read the failure,
fix the TEST code and run again. Make at most 2 fix attempts.
Rules:
- NEVER weaken or remove assertions just to make tests pass.
- If a failure looks like a real application bug, do not hide it. Report it in your final answer.
- Finish with a short summary: tests written, passed/failed, and any real bugs suspected.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'write_test_file',
      description: 'Write a Playwright spec file into tests/generated/. Needs human approval.',
      parameters: {
        type: 'object',
        properties: {
          file_name: { type: 'string', description: 'e.g. login' },
          code: { type: 'string', description: 'Full TypeScript content of the spec file' },
        },
        required: ['file_name', 'code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_tests',
      description: 'Run all generated Playwright tests (chromium) and return the output.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_test_file',
      description: 'Read a previously written spec file from tests/generated/.',
      parameters: {
        type: 'object',
        properties: { file_name: { type: 'string' } },
        required: ['file_name'],
      },
    },
  },
];

const stats = { steps: 0, toolCalls: 0, writes: 0, runs: 0, lastRunPassed: false };

async function approve(message: string): Promise<boolean> {
  if (process.env.AUTO_APPROVE === '1') return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${message} [y/N] `);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

async function runTool(name: string, input: any): Promise<string> {
  stats.toolCalls++;

  if (name === 'write_test_file') {
    const code = String(input.code ?? '');
    if (code.length > MAX_FILE_CHARS) return 'ERROR: file too large';

    const lines = code.split('\n');
    console.log(`\n--- Proposed file: ${safeFileName(String(input.file_name))} ---`);
    console.log(lines.slice(0, 25).join('\n'));
    console.log(`... (${lines.length} lines total)`);

    if (!(await approve('Write this file?'))) {
      return 'REJECTED by human reviewer. Do not retry without changes.';
    }
    writeGenerated(String(input.file_name), code);
    stats.writes++;
    return `Written ${safeFileName(String(input.file_name))}`;
  }

  if (name === 'run_tests') {
    stats.runs++;
    const r = runGeneratedTests();
    stats.lastRunPassed = r.passed;
    return (r.passed ? 'ALL TESTS PASSED\n' : 'TESTS FAILED\n') + r.output;
  }

  if (name === 'read_test_file') {
    return readGenerated(String(input.file_name));
  }

  return `ERROR: unknown tool ${name}`;
}

async function main() {
  const goal =
    process.argv.slice(2).join(' ') ||
    'Write Playwright tests for login (valid, invalid, locked-out, empty username, empty password) and cart (add and remove item). Run them and fix test issues if any.';

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: goal },
  ];
  let finished = false;

  for (let step = 1; step <= MAX_STEPS; step++) {
    stats.steps = step;

    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 4000,
      tools,
      messages,
    });
    const msg = res.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log(`\nFINAL ANSWER:\n${msg.content ?? ''}`);
      finished = true;
      break;
    }

    for (const call of msg.tool_calls) {
      if (call.type !== 'function') continue;
      console.log(`\nStep ${step} | ACT -> ${call.function.name}`);
      let input: any = {};
      try {
        input = JSON.parse(call.function.arguments || '{}');
      } catch {
        input = {};
      }
      const output = await runTool(call.function.name, input);
      console.log(`         OBSERVE <- ${output.slice(0, 300).replace(/\n/g, ' ')}...`);
      messages.push({ role: 'tool', tool_call_id: call.id, content: output });
    }
  }

  if (!finished) console.log(`\nSTOPPED: max steps (${MAX_STEPS}) reached (guardrail).`);

  const files = fs.existsSync(GENERATED_DIR) ? fs.readdirSync(GENERATED_DIR) : [];
  let testCount = 0;
  for (const f of files) {
    const text = fs.readFileSync(path.join(GENERATED_DIR, f), 'utf8');
    testCount += (text.match(/\btest\(/g) ?? []).length;
  }

  console.log('\n===== EVAL REPORT =====');
  console.log(`Steps used      : ${stats.steps} / ${MAX_STEPS}`);
  console.log(`Tool calls      : ${stats.toolCalls}`);
  console.log(`Files written   : ${stats.writes}`);
  console.log(`Test runs       : ${stats.runs}`);
  console.log(`Tests generated : ${testCount}`);
  console.log(`Last run passed : ${stats.lastRunPassed}`);
  console.log(`Verdict         : ${stats.lastRunPassed && testCount >= 5 ? 'PASS' : 'REVIEW NEEDED'}`);
}

main().catch(console.error);
