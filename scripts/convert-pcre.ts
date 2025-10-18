import PCRE from 'pcre-to-regexp';

const pattern = process.argv[2] || '/(?P<test>[a-zA-Z0-9_]{1,20})$/i';

try {
  const keys: string[] = [];
  const regex = PCRE(pattern, keys);
  console.log('Converted pattern source:', regex.source);
  console.log('Flags:', regex.flags);
  console.log('Named capture groups:', keys);
} catch (error) {
  console.error('Error converting PCRE pattern:', error instanceof Error ? error.message : error);
  console.error('Pattern:', pattern);
  process.exit(1);
}
