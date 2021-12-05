import {Command} from 'commander';

const program = new Command();

program
  .requiredOption('-s, --safe <address>', 'safe address')
  .requiredOption('-t, --target <address>', 'stream target address');

program.parse(process.argv);

export const options = program.opts();
