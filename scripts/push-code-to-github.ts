import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

function shouldIgnore(filePath: string): boolean {
  const ignorePatterns = [
    'node_modules', '.git', '.replit', 'replit.nix', '.cache', 
    'dist', '.expo', '.upm', '__pycache__', '.breakpoints',
    'generated-icon.png', '.config', 'tmp', 'logs'
  ];
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (stat.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  const repo = 'lettercraft';
  const branch = 'main';
  
  console.log('Getting repository info...');
  
  let sha: string | undefined;
  try {
    const { data: refData } = await octokit.git.getRef({
      owner, repo, ref: `heads/${branch}`
    });
    sha = refData.object.sha;
  } catch (e) {
    console.log('Branch not found, will create initial commit');
  }

  const baseDir = '/home/runner/workspace';
  const files = getAllFiles(baseDir);
  console.log(`Found ${files.length} files to upload`);

  const tree: Array<{ path: string; mode: '100644'; type: 'blob'; content: string }> = [];
  
  for (const file of files) {
    const fullPath = path.join(baseDir, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      tree.push({
        path: file,
        mode: '100644',
        type: 'blob',
        content
      });
    } catch (e) {
      const content = fs.readFileSync(fullPath).toString('base64');
      console.log(`Skipping binary file: ${file}`);
    }
  }

  console.log(`Creating tree with ${tree.length} files...`);
  
  const { data: treeData } = await octokit.git.createTree({
    owner, repo,
    tree,
    base_tree: sha
  });

  console.log('Creating commit...');
  const { data: commitData } = await octokit.git.createCommit({
    owner, repo,
    message: 'Initial commit: LetterCraft app with AI letter generation',
    tree: treeData.sha,
    parents: sha ? [sha] : []
  });

  console.log('Updating branch reference...');
  try {
    await octokit.git.updateRef({
      owner, repo,
      ref: `heads/${branch}`,
      sha: commitData.sha
    });
  } catch (e) {
    await octokit.git.createRef({
      owner, repo,
      ref: `refs/heads/${branch}`,
      sha: commitData.sha
    });
  }

  console.log(`Successfully pushed to https://github.com/${owner}/${repo}`);
}

main().catch(console.error);
