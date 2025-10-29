import { parseRegExpLiteral } from '@eslint-community/regexpp';
import { printAst } from '../src/parser';

const pattern = process.argv[2] || 'foo|bar';

const ast = parseRegExpLiteral(pattern, {});

console.log(printAst(ast));
