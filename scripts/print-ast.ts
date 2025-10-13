import regexpTree from 'regexp-tree';

const pattern = process.argv[2] || 'foo|bar';

const ast = regexpTree.parse(pattern, {
  captureLocations: true,
});

console.log(JSON.stringify(ast, null, 2));
