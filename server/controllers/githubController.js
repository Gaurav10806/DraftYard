const crypto = require('crypto');
const User = require('../models/User');

// Temporary in-memory state store for OAuth CSRF protection with 10 min TTL
const pendingStates = new Map();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of pendingStates.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

// GET /auth/github
const getGithubAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID is not configured.' });
    }

    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback';

    // Generate random state and store with user id
    const state = crypto.randomBytes(16).toString('hex');
    pendingStates.set(state, {
      userId: req.user._id.toString(),
      createdAt: Date.now(),
    });

    const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent('read:user user:email')}&state=${encodeURIComponent(state)}&prompt=consent`;

    return res.json({ url });
  } catch (err) {
    console.error('getGithubAuthUrl error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate GitHub OAuth' });
  }
};

// GET /auth/github/callback
const githubCallback = async (req, res) => {
  const { code, state, error } = req.query;
  const clientUrl =
  process.env.CLIENT_URL || "https://draft-yard.vercel.app";

  if (error) {
    return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent('Missing authorization code or state parameter')}`);
  }

  const storedState = pendingStates.get(state);
  if (!storedState) {
    return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent('Invalid or expired OAuth state token (CSRF protection)')}`);
  }

  const userId = storedState.userId;
  pendingStates.delete(state);

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback';

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub token exchange error:', tokenData);
      return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange GitHub code for access token')}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated GitHub profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'DraftYard-App',
      },
    });

    if (!profileRes.ok) {
      return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent('Failed to fetch GitHub profile')}`);
    }

    const githubProfile = await profileRes.json();
    const githubId = String(githubProfile.id);

    // 3. Prevent duplicate GitHub connections across users
    const existingConnection = await User.findOne({
      _id: { $ne: userId },
      'github.connected': true,
      'github.githubId': githubId,
    });

    if (existingConnection) {
      return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent('This GitHub account is already connected to another DraftYard account.')}&status=409`);
    }

    // 4. Update the logged in User document
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent('User session not found')}`);
    }

    user.github = {
      connected: true,
      githubId,
      username: githubProfile.login || '',
      displayName: githubProfile.name || githubProfile.login || '',
      avatarUrl: githubProfile.avatar_url || '',
      profileUrl: githubProfile.html_url || `https://github.com/${githubProfile.login}`,
      accessToken,
      connectedAt: new Date(),
    };

    await user.save();

    return res.redirect(`${clientUrl}/settings?github_success=true`);
  } catch (err) {
    console.error('githubCallback error:', err);
    return res.redirect(`${clientUrl}/settings?github_error=${encodeURIComponent(err.message || 'GitHub connection failed')}`);
  }
};

// GET /auth/github/status
const getGithubStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const githubData = (user.github && typeof user.github === 'object' && !Array.isArray(user.github))
      ? user.github
      : {};
    return res.json({
      connected: !!githubData.connected,
      githubId: githubData.githubId || null,
      username: githubData.username || null,
      displayName: githubData.displayName || null,
      avatarUrl: githubData.avatarUrl || null,
      profileUrl: githubData.profileUrl || null,
      connectedAt: githubData.connectedAt || null,
    });
  } catch (err) {
    console.error('getGithubStatus error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch GitHub status' });
  }
};

// POST /auth/github/disconnect
const disconnectGithub = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.github = {
      connected: false,
      githubId: '',
      username: '',
      displayName: '',
      avatarUrl: '',
      profileUrl: '',
      accessToken: '',
      connectedAt: null,
    };

    await user.save();

    return res.json({
      success: true,
      message: 'GitHub account disconnected successfully',
      github: {
        connected: false,
        githubId: null,
        username: null,
        displayName: null,
        avatarUrl: null,
        profileUrl: null,
        connectedAt: null,
      },
    });
  } catch (err) {
    console.error('disconnectGithub error:', err);
    return res.status(500).json({ error: err.message || 'Failed to disconnect GitHub account' });
  }
};

// GET /github/repos
const getUserRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+github.accessToken');
    if (!user || !user.github || !user.github.connected) {
      return res.status(400).json({ error: 'GitHub account is not connected.' });
    }

    const accessToken = user.github.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: 'Expired or missing GitHub access token. Please reconnect your account.' });
    }

    const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'DraftYard-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!reposRes.ok) {
      if (reposRes.status === 401) {
        return res.status(401).json({ error: 'GitHub access token expired. Please reconnect your account.' });
      }
      return res.status(reposRes.status).json({ error: 'Failed to fetch repositories from GitHub.' });
    }

    const repos = await reposRes.json();

    const formattedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description || '',
      html_url: repo.html_url,
      language: repo.language || '',
      languages_url: repo.languages_url,
      topics: repo.topics || [],
      private: !!repo.private,
      default_branch: repo.default_branch || 'main',
      updated_at: repo.updated_at,
      owner: repo.owner ? repo.owner.login : '',
      stargazers_count: repo.stargazers_count || 0,
    }));

    return res.json(formattedRepos);
  } catch (err) {
    console.error('getUserRepos error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch GitHub repositories' });
  }
};

// POST /github/import
const importGithubRepo = async (req, res) => {
  try {
    const { repoId } = req.body;
    if (!repoId) {
      return res.status(400).json({ error: 'repoId is required for repository import.' });
    }

    const user = await User.findById(req.user._id).select('+github.accessToken');
    if (!user || !user.github || !user.github.connected) {
      return res.status(400).json({ error: 'GitHub account is not connected.' });
    }

    const accessToken = user.github.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: 'Expired or missing GitHub access token. Please reconnect your account.' });
    }

    const Draft = require('../models/draft');
    const Workspace = require('../models/Workspace');

    // 1. Duplicate Prevention check
    const existingDraft = await Draft.findOne({
      submittedBy: user._id,
      'github.imported': true,
      'github.repoId': String(repoId),
    });

    if (existingDraft) {
      return res.status(409).json({
        error: 'This repository has already been imported.',
        alreadyImported: true,
        draft: existingDraft,
        draftId: existingDraft._id,
      });
    }

    // 2. Fetch repository details from GitHub
    const repoRes = await fetch(`https://api.github.com/repositories/${repoId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'DraftYard-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!repoRes.ok) {
      if (repoRes.status === 401) {
        return res.status(401).json({ error: 'GitHub access token expired. Please reconnect your account.' });
      }
      return res.status(repoRes.status).json({ error: 'Failed to fetch repository details from GitHub.' });
    }

    const repoData = await repoRes.json();

    // 3. Fetch languages
    let techStack = [];
    if (repoData.languages_url) {
      try {
        const langRes = await fetch(repoData.languages_url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'DraftYard-App',
          },
        });
        if (langRes.ok) {
          const langsObj = await langRes.json();
          techStack = Object.keys(langsObj);
        }
      } catch (_) {}
    }
    if (techStack.length === 0 && repoData.language) {
      techStack = [repoData.language];
    }

    // 4. Fetch README if available
    let readmeContent = '';
    try {
      const readmeRes = await fetch(`https://api.github.com/repositories/${repoId}/readme`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'DraftYard-App',
          'Accept': 'application/vnd.github.v3.raw',
        },
      });
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text();
      }
    } catch (_) {}

    // Determine domain category based on primary language / topics
    const primaryLang = (repoData.language || '').toLowerCase();
    let domain = 'web';
    if (['swift', 'kotlin', 'dart'].includes(primaryLang)) {
      domain = 'mobile';
    } else if (['python', 'jupyter notebook', 'r'].includes(primaryLang) || repoData.topics?.some(t => ['ml', 'ai', 'machine-learning'].includes(t))) {
      domain = 'ml';
    } else if (['c++', 'c#'].includes(primaryLang) && repoData.topics?.some(t => t.includes('game'))) {
      domain = 'game';
    }

    // 5. Create Draft
    const draft = await Draft.create({
      projectName: repoData.name,
      oneLiner: repoData.description || `Imported repository ${repoData.name}`,
      description: readmeContent || repoData.description || `Repository imported from GitHub: ${repoData.html_url}`,
      domain,
      techStack: techStack.length > 0 ? techStack : ['JavaScript'],
      teamSize: 'solo',
      currentStage: 'Building',
      stage: 'Building',
      status: 'active',
      failureReason: 'Imported repository for active development & collaboration',
      timeSpent: { value: 1, unit: 'weeks' },
      estimatedTime: '1 month',
      projectLink: repoData.html_url,
      isAnonymous: false,
      submittedBy: user._id,
      tags: repoData.topics || [],
      openForRevival: true,
      github: {
        imported: true,
        repoId: String(repoData.id),
        owner: repoData.owner?.login || '',
        repository: repoData.name,
        repoUrl: repoData.html_url,
        defaultBranch: repoData.default_branch || 'main',
        visibility: repoData.private ? 'private' : 'public',
        importedAt: new Date(),
        lastSynced: new Date(),
      },
    });

    // 6. Create Workspace linked to Draft
    const workspace = await Workspace.create({
      draftId: draft._id,
      longDescription: readmeContent || repoData.description || '',
      featuresCompleted: 'Initial GitHub repository imported.',
      currentBlockers: 'None',
      externalLinks: repoData.html_url,
      milestones: [
        { id: '1', label: 'Repository Imported', progress: 10 },
      ],
      tasks: [],
    });

    return res.status(201).json({
      success: true,
      draft,
      workspace,
    });
  } catch (err) {
    console.error('importGithubRepo error:', err);
    return res.status(500).json({ error: err.message || 'Failed to import repository' });
  }
};

module.exports = {
  getGithubAuthUrl,
  githubCallback,
  getGithubStatus,
  disconnectGithub,
  getUserRepos,
  importGithubRepo,
};
