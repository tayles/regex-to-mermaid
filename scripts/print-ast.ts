import regexpTree from 'regexp-tree';

import { parseRegExpLiteral } from '@eslint-community/regexpp';

const pattern = process.argv[2] || 'foo|bar';

const regexpTreeAst = regexpTree.parse(pattern, {
  captureLocations: true,
});

console.log('regex-tree', JSON.stringify(regexpTreeAst, null, 2));

const regexppAst = parseRegExpLiteral(pattern, {});
console.log(
  'regexpp',
  JSON.stringify(
    regexppAst,
    (key, value) => {
      // Omit parent references to avoid circular structure
      if (key === 'parent') {
        return undefined;
      }
      return value;
    },
    2,
  ),
);
