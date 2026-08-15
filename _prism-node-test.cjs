'use strict';
/* Smoke test: vendored Prism core + Python grammar must produce token spans
   for ```python blocks (Prism.highlight is the pure core of
   Prism.highlightAllUnder, which the app calls synchronously). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const vendor = path.join(__dirname, 'vendor');

// Prism core is a plain browser script; in Node it exports via module.exports.
const Prism = require(path.join(vendor, 'prism.min.js'));
global.Prism = Prism;

// Python grammar is a plain script referencing the global Prism.
vm.runInThisContext(
  fs.readFileSync(path.join(vendor, 'prism-python.min.js'), 'utf8'),
  { filename: 'prism-python.min.js' }
);

const checks = [];
const ok = (name, cond) => checks.push(`${cond ? 'PASS' : 'FAIL'}  ${name}`);

ok('Prism core loaded (window-less)', typeof Prism === 'object' && Prism !== null);
ok('highlightAllUnder available (used by the app)', typeof Prism.highlightAllUnder === 'function');
ok('python grammar registered', !!Prism.languages.python);
ok('Prism.manual falsy in Node (data-manual is a browser-only flag)', !Prism.manual);

const html = Prism.highlight(
  'def hello():\n    print("Hello World")',
  Prism.languages.python,
  'python'
);
ok('highlight() returns token spans', html.includes('token'));
ok('keyword token for "def"', /class="token keyword">def</.test(html));
ok('keyword token for "print"', /class="token keyword">print</.test(html));
ok('function name token for "hello"', /class="token function">hello</.test(html));
ok('string token for "Hello World"', /class="token string">"Hello World"</.test(html));

console.log(checks.join('\n'));
const failed = checks.some((c) => c.startsWith('FAIL'));
console.log(failed ? '\nOVERALL: FAIL' : '\nOVERALL: PASS');
process.exit(failed ? 1 : 0);
