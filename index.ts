#!/usr/bin/env bun
import { runCLI } from './src/cli';

// Run the CLI with process arguments
runCLI(process.argv).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
