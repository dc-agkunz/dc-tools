// icky exec, i know...
import { exec as e, spawn as s } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(e);
const spawn = promisify(s);


export class NodeService 
{
  /*
   * 
   */
  async installDependencies(destination) {
    try {
      await exec(`npm --prefix ${destination.replaceAll(' ', '\\ ')} install`);
      return true;
    } catch (error) {
      return false;    
    }
  }
}

export default new NodeService();