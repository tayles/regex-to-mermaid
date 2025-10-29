import { parseRegExpLiteral } from '@eslint-community/regexpp';

const pattern = process.argv[2] || 'foo|bar';

const ast = parseRegExpLiteral(pattern, {});

console.log(
  JSON.stringify(
    ast,
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
