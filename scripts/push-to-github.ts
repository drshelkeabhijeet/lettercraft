import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

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

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log('Authenticated as:', user.login);
  
  const repoName = 'lettercraft';
  
  let repo;
  try {
    const { data } = await octokit.repos.get({ owner: user.login, repo: repoName });
    repo = data;
    console.log('Repository already exists:', repo.html_url);
  } catch (e: any) {
    if (e.status === 404) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'LetterCraft - Professional mobile app for generating official letters using AI-learned writing styles',
        private: false,
        auto_init: true,
      });
      repo = data;
      console.log('Created repository:', repo.html_url);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw e;
    }
  }
  
  console.log('Repository URL:', repo.html_url);
}

main().catch(console.error);
