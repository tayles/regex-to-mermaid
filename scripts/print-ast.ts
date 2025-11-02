import { buildRegexAst, printAst } from '../src/parser';

const pattern = process.argv[2] || 'foo|bar';

const ast = buildRegexAst(pattern);

console.log(printAst(ast));
