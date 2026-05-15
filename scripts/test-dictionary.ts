import { isWordCorrect, getWordSuggestions } from '../src/lib/dictionary';

async function main() {
  console.log('Testing dictionary...');

  const tests: [string, boolean][] = [
    ['lindo', true], ['linda', true], ['lindos', true], ['lindas', true],
    ['querido', true], ['querida', true], ['amor', true], ['casa', true],
    ['bonito', true], ['beleza', true], ['saudade', true],
    ['cantar', true], ['cantamos', true], ['cantaram', true], ['cantaremos', true],
    ['são', true], ['têm', true], ['vêm', true],
    ['rapidamente', true], ['lindíssimo', true], ['lindíssima', true],
    ['estresse', true], ['mouse', true], ['hambúrguer', true],
    ['João', true], ['Brasil', true],
    ['paralelepípedo', true], ['ônibus', true],
    ['xablau', false], ['asdfgh', false],
  ];

  let passed = 0;
  let failed = 0;
  for (const [word, expected] of tests) {
    const result = await isWordCorrect(word);
    if (result === expected) {
      passed++;
    } else {
      console.log('FAIL:', word, '(expected', expected, 'got', result + ')');
      failed++;
    }
  }
  console.log(`${passed}/${passed + failed} passed`);
  if (failed > 0) process.exit(1);
}

main().catch(console.error);
