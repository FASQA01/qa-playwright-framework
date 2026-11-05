type Msg = { role: 'user' | 'tool'; content: string };

let fixed = false;

// TOOLS: agent ke "haath"
const tools: Record<string, (arg: string) => string> = {
  generate_tests: (req) => `Generated 3 test cases for: ${req}`,
  run_tests: () =>
    fixed
      ? 'RESULT: 3 passed, 0 failed'
      : 'RESULT: 2 passed, 1 failed (empty_password: locator #password not found)',
  read_failure: () => 'LOG: page now uses getByPlaceholder("Password"), old id removed',
  fix_test: () => {
    fixed = true;
    return 'Test updated: locator changed to getByPlaceholder("Password")';
  },
};

// Nakli "LLM": asal mein ye decision Claude karega (Din 12)
function fakeLLM(history: Msg[]): { tool?: string; arg?: string; final?: string } {
  const calls = history.filter((m) => m.role === 'tool').length;
  if (calls === 0) return { tool: 'generate_tests', arg: 'login feature' };
  if (calls === 1) return { tool: 'run_tests' };
  if (calls === 2) return { tool: 'read_failure' };
  if (calls === 3) return { tool: 'fix_test' };
  if (calls === 4) return { tool: 'run_tests' };
  return { final: 'Login tests generated, 1 locator failure triaged and fixed, all 3 pass.' };
}

// HARNESS: loop + guardrail (MAX_STEPS)
const MAX_STEPS = 8;
const history: Msg[] = [{ role: 'user', content: 'Test the login feature and fix failures' }];

for (let step = 1; step <= MAX_STEPS; step++) {
  const decision = fakeLLM(history);

  if (decision.final) {
    console.log(`\nFINAL: ${decision.final}`);
    break;
  }

  console.log(`Step ${step} | PLAN    -> call ${decision.tool}`);
  const result = tools[decision.tool!](decision.arg ?? '');
  console.log(`         OBSERVE <- ${result}\n`);
  history.push({ role: 'tool', content: result });
}