#!/usr/bin/env node
/*
 *  Bulk Rename Script
 *
 *  When you download submissions from DC Connect, they give you some pretty annoying filenames.
 *  I'd rather them show up in alphabetical order.
 *  Extract the submissions into your MARKING_DIR, and run this to fix the names.
 */
import 'dotenv/config';
import { readdir, rename } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';

try {
  const absdir = process.env.MARKING_DIR;
  const reldir = process.argv[2];

  if (!absdir) {
    throw `Set MARKING_DIR in your .env.`;
  }
  if (!reldir) {
    throw `What directory do you want to rename?`;
  }

  const path = String.raw`${absdir}/${reldir}`;

  if (!existsSync(path)) {
    throw `That directory is either empty or doesn't exist`
  }

  const files = await readdir(path);

  const promises = files
    .filter(file => file !== 'index.html')
    .map(doRename);

  await Promise.all(promises);

  console.log(chalk.green('😀 All Good!'));

} catch (err) {
  console.error(chalk.red(err));
  process.exit(1);
}

/*
 *  
 */
async function doRename(file) {
  const [
    dumpTheseRandomNumbers, 
    studentName, 
    submissionDateStr, 
    submissionName
  ] = file.split(' - ');
  
  const oldFilePath = `${path}/${file}`;
  const newFilePath = `${path}/${studentName} - ${submissionName}`;

  await rename(oldFilePath, newFilePath);

  return newFilePath;
}
