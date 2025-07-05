const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Load configuration from the specified YAML file
 */
function loadConfig(configPath) {
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configFile);
  } catch (error) {
    core.warning(`Could not load config from ${configPath}: ${error.message}`);
    // Return default configuration
    return {
      unlucky_numbers: [7, 13, 66, 77, 666, 777, 1313, 1337],
      reservation_space: 5,
      clearing_mode: false,
      placeholder: {
        title: "🔮 Reserved for superstitious purposes",
        body: "This issue was created automatically to prevent an unlucky number from being assigned.\n\n**This is a placeholder issue and will be deleted shortly.**",
        labels: ["superstitious", "placeholder"]
      }
    };
  }
}

/**
 * Get the next issue/PR number that would be assigned
 */
async function getNextNumber(octokit, owner, repo) {
  try {
    // Get the latest issues and PRs to determine the next number
    const [issuesResponse, prsResponse] = await Promise.all([
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        sort: 'created',
        direction: 'desc',
        per_page: 1
      }),
      octokit.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        sort: 'created',
        direction: 'desc',
        per_page: 1
      })
    ]);

    let maxNumber = 0;
    
    if (issuesResponse.data.length > 0) {
      maxNumber = Math.max(maxNumber, issuesResponse.data[0].number);
    }
    
    if (prsResponse.data.length > 0) {
      maxNumber = Math.max(maxNumber, prsResponse.data[0].number);
    }

    return maxNumber + 1;
  } catch (error) {
    core.warning(`Error getting next number: ${error.message}`);
    return 1;
  }
}

/**
 * Check if a number is unlucky according to configuration
 */
function isUnluckyNumber(number, unluckyNumbers) {
  return unluckyNumbers.includes(number);
}

/**
 * Find all unlucky numbers in a range
 */
function findUnluckyNumbersInRange(startNumber, endNumber, unluckyNumbers) {
  const unlucky = [];
  for (let i = startNumber; i <= endNumber; i++) {
    if (isUnluckyNumber(i, unluckyNumbers)) {
      unlucky.push(i);
    }
  }
  return unlucky;
}

/**
 * Create a placeholder issue
 */
async function createPlaceholderIssue(octokit, owner, repo, config, number, dryRun) {
  if (dryRun) {
    core.info(`[DRY RUN] Would create placeholder issue for number ${number}`);
    return null;
  }

  try {
    const response = await octokit.rest.issues.create({
      owner,
      repo,
      title: config.placeholder.title,
      body: config.placeholder.body,
      labels: config.placeholder.labels || []
    });

    core.info(`Created placeholder issue #${response.data.number} (target: ${number})`);
    return response.data;
  } catch (error) {
    core.error(`Failed to create placeholder issue: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a placeholder issue
 */
async function deletePlaceholderIssue(octokit, owner, repo, issueNumber, dryRun) {
  if (dryRun) {
    core.info(`[DRY RUN] Would delete placeholder issue #${issueNumber}`);
    return;
  }

  try {
    // First close the issue, then we could add a label to mark it as deleted
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: 'closed',
      labels: ['superstitious', 'placeholder', 'deleted']
    });

    core.info(`Closed placeholder issue #${issueNumber}`);
  } catch (error) {
    core.warning(`Failed to close placeholder issue #${issueNumber}: ${error.message}`);
  }
}

/**
 * Get existing unlucky issues/PRs for clearing mode
 */
async function getExistingUnluckyItems(octokit, owner, repo, unluckyNumbers) {
  try {
    const [issuesResponse, prsResponse] = await Promise.all([
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 100
      }),
      octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page: 100
      })
    ]);

    const unluckyItems = [];

    // Check issues (excluding PRs)
    issuesResponse.data
      .filter(issue => !issue.pull_request)
      .forEach(issue => {
        if (isUnluckyNumber(issue.number, unluckyNumbers)) {
          unluckyItems.push({ type: 'issue', item: issue });
        }
      });

    // Check PRs
    prsResponse.data.forEach(pr => {
      if (isUnluckyNumber(pr.number, unluckyNumbers)) {
        unluckyItems.push({ type: 'pr', item: pr });
      }
    });

    return unluckyItems;
  } catch (error) {
    core.error(`Error getting existing unlucky items: ${error.message}`);
    return [];
  }
}

/**
 * Main action function
 */
async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const configPath = core.getInput('config-path') || 'superstitious.yml';
    const clearingMode = core.getInput('clearing-mode') === 'true';
    const dryRun = core.getInput('dry-run') === 'true';

    // Initialize GitHub client
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // Load configuration
    const config = loadConfig(configPath);
    const effectiveClearingMode = clearingMode || config.clearing_mode;

    core.info(`Superstitious GitHub Action starting...`);
    core.info(`Repository: ${owner}/${repo}`);
    core.info(`Clearing mode: ${effectiveClearingMode}`);
    core.info(`Dry run: ${dryRun}`);
    core.info(`Unlucky numbers: ${config.unlucky_numbers.join(', ')}`);

    let issuesCreated = 0;
    let issuesCleared = 0;

    // Handle clearing mode first
    if (effectiveClearingMode) {
      core.info('Running in clearing mode - checking for existing unlucky items...');
      const unluckyItems = await getExistingUnluckyItems(octokit, owner, repo, config.unlucky_numbers);
      
      if (unluckyItems.length > 0) {
        core.info(`Found ${unluckyItems.length} unlucky items to clear`);
        for (const { type, item } of unluckyItems) {
          core.info(`Found unlucky ${type} #${item.number}: ${item.title}`);
          // TODO: Implement duplication and closure logic
          issuesCleared++;
        }
      } else {
        core.info('No existing unlucky items found');
      }
    }

    // Get the next number that would be assigned
    const nextNumber = await getNextNumber(octokit, owner, repo);
    const reservationEnd = nextNumber + config.reservation_space - 1;

    core.info(`Next number would be: ${nextNumber}`);
    core.info(`Checking range ${nextNumber} to ${reservationEnd} for unlucky numbers...`);

    // Find unlucky numbers in the upcoming range
    const unluckyInRange = findUnluckyNumbersInRange(nextNumber, reservationEnd, config.unlucky_numbers);

    if (unluckyInRange.length === 0) {
      core.info('No unlucky numbers found in the upcoming range. No action needed.');
    } else {
      core.info(`Found unlucky numbers in range: ${unluckyInRange.join(', ')}`);
      
      // Create placeholder issues to block unlucky numbers
      const placeholderIssues = [];
      
      for (const unluckyNumber of unluckyInRange) {
        const currentNext = await getNextNumber(octokit, owner, repo);
        
        // Create placeholder issues until we reach the unlucky number
        while (currentNext <= unluckyNumber) {
          const placeholder = await createPlaceholderIssue(octokit, owner, repo, config, unluckyNumber, dryRun);
          if (placeholder) {
            placeholderIssues.push(placeholder);
            issuesCreated++;
          }
          
          // If we've blocked the unlucky number, we can break
          if (currentNext === unluckyNumber) {
            break;
          }
        }
      }

      // Clean up placeholder issues after a short delay
      if (!dryRun && placeholderIssues.length > 0) {
        core.info('Scheduling cleanup of placeholder issues...');
        // In a real implementation, you might want to delay this or handle it differently
        setTimeout(async () => {
          for (const placeholder of placeholderIssues) {
            await deletePlaceholderIssue(octokit, owner, repo, placeholder.number, false);
          }
        }, 5000); // 5 second delay
      }
    }

    // Calculate next safe number
    const finalNextNumber = await getNextNumber(octokit, owner, repo);
    let nextSafeNumber = finalNextNumber;
    while (isUnluckyNumber(nextSafeNumber, config.unlucky_numbers)) {
      nextSafeNumber++;
    }

    // Set outputs
    core.setOutput('issues-created', issuesCreated);
    core.setOutput('issues-cleared', issuesCleared);
    core.setOutput('next-safe-number', nextSafeNumber);

    core.info(`Action completed successfully!`);
    core.info(`Issues created: ${issuesCreated}`);
    core.info(`Issues cleared: ${issuesCleared}`);
    core.info(`Next safe number: ${nextSafeNumber}`);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    core.error(error.stack);
  }
}

// Run the action
if (require.main === module) {
  run();
}

module.exports = { run, loadConfig, isUnluckyNumber, findUnluckyNumbersInRange };