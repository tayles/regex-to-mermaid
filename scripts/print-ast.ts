import regexpTree from 'regexp-tree';

const ast = regexpTree.parse(/foo|bar/, {
  captureLocations: true,
});

console.log(JSON.stringify(ast, null, 2));
