import { simpleGit } from 'simple-git';

const git = simpleGit();

export async function getGitDiff() {
  try {
    // Get staged diff
    const diff = await git.diff(['--cached']);
    return diff || null;
  } catch (error) {
    throw new Error('Failed to get git diff: ' + error.message);
  }
}

export async function getStagedFiles() {
  try {
    const status = await git.status();
    return status.staged;
  } catch (error) {
    throw new Error('Failed to get staged files: ' + error.message);
  }
}

export async function commitChanges(message) {
  try {
    await git.commit(message);
  } catch (error) {
    throw new Error('Failed to commit: ' + error.message);
  }
}

export async function isGitRepo() {
  try {
    await git.status();
    return true;
  } catch {
    return false;
  }
}
