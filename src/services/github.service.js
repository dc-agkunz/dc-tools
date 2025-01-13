// icky exec, i know...
import { exec as e, spawn as s } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(e);
const spawn = promisify(s);


export class GitHubService 
{
  /*
   *  You have to have GitHub CLI installed and logged in for this to work.
   *  ---Actually lets try this for a bit instead.
   */
  async canAccessRepository(user, repo) {
    try {
      // await exec(`gh repo view ${user}/${repo}`);
      await exec(`git ls-remote https://github.com/${user}/${repo}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /*
   * 
   */
  async cloneRepository(repository, destination) {
    try {
      await exec(`git clone ${repository} ${destination.replaceAll(' ', '\\ ')}`);
      return true;
    } catch (error) {
      console.log(`Error: ${error.message}`);
      return false;
    }
  }
  
  /*
   * 
   */
  async doesCommitExist(destination, hash) {
    try {
      const { stdout } = await exec(`git -C ${destination.replaceAll(' ', '\\ ')} cat-file -t ${hash}`);
      return stdout.trim() === 'commit';
    } catch (error) {
      return false;
    }
  }
  
  /*
   * 
   */
  async checkoutCommit(destination, hash) {
    try {
      await exec(`git -C ${destination.replaceAll(' ', '\\ ')} checkout ${hash}`);
      return true;
    } catch (error) {
      console.log(`Error: ${error.message}`);
      return false;    
    }
  }
}

export default new GitHubService();