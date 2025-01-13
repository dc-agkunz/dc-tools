#!/usr/bin/env node
/* 
 * Submission Tool
 *
 * Keeping a hundred repo's up to date is a pain in the butt. This should make it easier.
 * 
 * - Make sure MARKING_DIR is set in your .env
 *   - There should be 2 folders in your MARKING_DIR, ice and lab.
 *   - In each of those folders, there should be one folder for each section of the course you're teaching.
 *   - I use section numbers, but if you want to use CRN that'll probably work too.
 * - Download the submissions from DC Connect, and extract them into the appropriate spot.
 * - Run this script, tell it which project you want to update, and for which section.
 *   - `$ npm run submit:check ice 07` or manually,
 *   - `$ ./checkSubmissions.js ice 07`
 * - When it's all done, delete the submission files and be left with the repo's.
 */
import { readdir, readFile, stat, access } from 'node:fs/promises';
import GitHubService from '../services/github.service.js';
import NodeService from '../services/node.service.js';
import 'dotenv/config';
import chalk from 'chalk';

/*
 *  Verify the cli params.
 *  At one point, I was keeping each and every ICE separately. I'm not going to do that this semester.
 *  If you want to go back for whatever reason, extract a previous lab's submissions and re-run.
 */
const [bin, path, repo, /* which,  */ section] = process.argv;
if (!repo || /* !which || */ !section) {
  console.log(`need repo/section`);
  process.exit(1);
}

/*
 *  do the thing!!!!!
 */
// where are the file's we're looking at
const filePath = `${process.env.MARKING_DIR}/${repo}/${section}`;
// read them all in quick
const submissions = await readSubmissions(filePath);

// i was gonna do this async but it kind of messes up the messaging so i'll just be patient for now
// #TODO:// build up the message as a string or something, and then print it all out at the end
for (let submission of submissions) {
  await processSubmission(submission);
}


/*
 *  Read a submission entry,
 *  Clone the repo, if it doesn't already exist.
 *  Check out the relevant commit.
 *  Install the dependencies.
 */
async function processSubmission (submission) {
  if (submission.error) { 
    console.log(chalk.red(`\n${submission.studentName}: ${submission.error}`));
    submission.ok = false;
    return submission;
  } 

  console.log(`\n${submission.studentName}: Fetching.`);     

  if (!await doesDestinationExist(submission.destination)) {
    console.log(`    Cloning repository.`);
    await GitHubService.cloneRepository(
      submission.github.repository,
      submission.destination
    );
  }

  if (!await GitHubService.doesCommitExist(submission.destination, submission.details.hash)) {
    console.log(chalk.red(`    ❌ Can't find commit ${chalk.bold(submission.details.hash)}.`));
    submission.ok = false;
    return submission;
  }

  console.log(`    Checking out commit ${chalk.bold(submission.details.hash)}.`);
  if (!await GitHubService.checkoutCommit(submission.destination, submission.details.hash)) {
    console.log(chalk.red(`    ❌ There was a problem checking out the commit.`));
    submission.ok = false;
  } else {
    console.log(`    Installing dependencies.`);
    if(!await NodeService.installDependencies(submission.destination)) {
      console.log(chalk.red(`    ❌ There was a problem installing dependencies.`));
      submission.ok = false;
    } else {
      console.log(chalk.green(`    😀 All Good`));
      submission.ok = true;
    }
  };

  return submission;
}


/*
 *  Put all of your submissions in a directory,
 *   Use this to parse them all and collect some information about them
 */
async function readSubmissions ( path ) 
{
  const names = {};

  try {
    const files = await readdir(path);

    console.log(`Reading submissions...`);

    const promises = files.map(async file => {
      return readSubmission(path, file).then(submission => {
        if (!submission) { return; }
        // this attempts to only record the most recent submission in case they put in more than one
        if(!names[submission.studentName]) {
          names[submission.studentName] = submission;
        } else if (names[submission.studentName].handedInAt.getTime() < handedInAt.getTime()) {
          names[submission.studentName] = submission;
        }
      })
    });

    const results = await Promise.all(promises);

    // turn the hashmap back into a regular ole array
    return Object.values(names)
      // and sort it by name
      .sort((a,b) => a.studentName.localeCompare(b.studentName));

  } catch (err) {
    console.error(err);
  }
}


/* 
 * 
 */
async function readSubmission (path, file) 
{
  if (file == 'index.html') { return; }
  const stats = await stat(`${path}/${file}`);
  if (stats.isDirectory()) { return; }
  // for some reason i decided to use the last modified time instead of the datestr, can't really remember why
  const handedInAt = new Date(stats.mtimeMs);

  // this is an attempt to remove the (1) that shows up if the filename is duplicated
  const fn = file.replace(/\ \(\d\)/, '');
  // split the filename into its parts
  // this will probably break if a student puts a " - " in their submission name
  const [dump, studentName, dateStr, submissionName] = fn.split(' - ');
  // 
  const [githubUserName, submissionExtension] = submissionName.split('.')

  // get the hash from the file
  const hash = (await readFile(`${path}/${file}`)).toString().trim();

  // set up the submission object
  const submission = { 
    studentName, 
    handedInAt, 
    handedInAtStr: handedInAt.toLocaleString(),
    github: {
      userName: githubUserName,
      userLink: `https://www.github.com/${githubUserName}`,
      repository: `https://www.github.com/${githubUserName}/inft-2202-${repo}`,
    },
    details: {
      commit: null,
      tree: null,
      hash
    },
    destination: (`${filePath}/${studentName} - ${githubUserName}`),
    error: null,
  }

  // do some final checks
  if (!await GitHubService.canAccessRepository(githubUserName, `inft-2202-${repo}`)) {
    submission.error = `Not a collaborator or wrong filename.`;
  } else if (submissionExtension != 'txt') {
    submission.error = `Not a .txt file.`;
  } else if (hash.length !== 40) {
    submission.error = `Problem parsing commit ID.`;
  } else {
    submission.details.tree = `https://www.github.com/${githubUserName}/inft-2202-${repo}/tree/${hash}/src`;
    submission.details.commit = `https://www.github.com/${githubUserName}/inft-2202-${repo}/commit/${hash}`;
    submission.details.hash = hash
  }

  return submission;
}


/*
 *  A little cheater function,
 *  Because apparently a yes or no question is too much to ask...
 */
async function doesDestinationExist(destination) {
  try {
    await access(destination);
    console.log('    Directory already exists.');
    return true;
  } catch (error) {
    return false;
  }
}
