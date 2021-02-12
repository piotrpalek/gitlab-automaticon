import { writeText, matchTargetProcessPr, logDebug, matchReleaseTitle, logDebugBreak } from './utils';
import { getCurrentReleaseTitle } from './title.service';
import { fetchFromGitlab, createGitlab, updateGitlab } from './requests';
import { ChangelogLine } from './description.service';
import { parseISO, isAfter } from 'date-fns';

function projId() {
  let projId;
  projId = process.env.FRONTEND_PROJ_ID;
  // projId = process.env.DOCUMENTS_PROJ_ID;

  if (!projId) {
    throw new Error('projId is empty');
  }

  return projId;
}

export async function getOrCreatePr() {
  class NoPrOpenError extends Error {}

  try {
    const openPrs = await getOpenPrs();

    if (!openPrs) {
      throw new Error('openPrs is: ' + JSON.stringify(openPrs));
    }

    if (openPrs && openPrs.length && openPrs.length > 1) {
      throw new Error('Too many PRs open');
    }

    if (openPrs && openPrs.length <= 0) {
      throw NoPrOpenError;
    }

    correctTitleIfNeeded(openPrs[0].title, openPrs[0].iid);
    return openPrs[0];
  } catch (NoPrOpenError) {
    return await createNewPr();
  }
}

async function createNewPr() {
  const title = await getCurrentReleaseTitle();

  const payload = {
    title: `WIP: ${title}`,
    source_branch: 'dev',
    target_branch: 'master',
  };

  const response = await createPr(payload);
  console.log('PR created: ', response && response.title);
  return response;
}

export async function getLastMergedAtDate() {
  const lastReleaseMr = await getLastReleasePr();

  if (lastReleaseMr) {
    const mergedAt = lastReleaseMr.merged_at;
    // logDebug({ mergedAt });
    return mergedAt;
  }

  throw new Error('Merged at not fetched');
}

function getOpenPrs() {
  const lastMergedToMasterURL = `https://gitlab.com/api/v4/projects/${projId()}/merge_requests`;

  console.log('Getting open PRs..');
  return fetchFromGitlab(lastMergedToMasterURL, {
    target_branch: 'master',
    state: 'opened',
    sort: 'desc',
    order_by: 'updated_at',
  });
}

export async function getMergedAfterPrs(updatedAfter: any) {
  const lastMergedToMasterURL = `https://gitlab.com/api/v4/projects/${projId()}/merge_requests`;

  console.log('Getting merged after PRs..', { updatedAfter });
  const mergedPrs = await fetchFromGitlab(lastMergedToMasterURL, {
    per_page: 200,
    state: 'merged',
    updated_after: updatedAfter,
  });

  // logDebug({ mergedBeforeFilter: mergedPrs.map((pr: any) => pr.title) });

  return mergedPrs.filter((pr: any) => {
    const updatedAfterDate = parseISO(updatedAfter);
    const prMergedDate = parseISO(pr.merged_at);
    return isAfter(prMergedDate, updatedAfterDate);
  });
}

async function createPr(payload: any) {
  const updatePrUrl = `https://gitlab.com/api/v4/projects/${projId()}/merge_requests`;

  console.log('Creating PR...', { url: updatePrUrl, payload });
  return createGitlab(updatePrUrl, payload);
}

export async function updatePr(payload: any) {
  const updatePrUrl = `https://gitlab.com/api/v4/projects/${projId()}/merge_requests/${payload.iid}`;

  console.log('Updating PR...');
  return updateGitlab(updatePrUrl, payload);
}

export function getLastMergedPrs() {
  const lastMergedToMasterURL = `https://gitlab.com/api/v4/projects/${projId()}/merge_requests`;

  // console.log('Getting last merged pr..');
  return fetchFromGitlab(lastMergedToMasterURL, {
    target_branch: 'master',
    state: 'merged',
    sort: 'desc',
    order_by: 'updated_at',
  });
}

export async function getLastReleasePr() {
  const lastMergedPrs = await getLastMergedPrs();
  // logDebugBreak({ lastMergedPrs });
  let lastMergedReleasePr;

  for (const pullRequest of lastMergedPrs) {
    const currentMatch = matchReleaseTitle(pullRequest.title);

    if (currentMatch) {
      lastMergedReleasePr = pullRequest;
      break;
    }
  }

  if (!lastMergedReleasePr) {
    throw new Error('Could not find release title!');
  }

  return lastMergedReleasePr;
}

export async function handlePrChangelog(title: string, changelogMetadata: ChangelogLine[]) {
  const prChangelog = getPrChangelog(changelogMetadata);
  const tableHeader = '| PR | Description |\n| ------ | ------ |';
  const prDescription = `# Changes\n\n${tableHeader}\n${prChangelog}`;

  const { id, iid } = await getOrCreatePr();

  const updatePayload = {
    title: `WIP: ${title}`,
    id,
    iid,
    description: prDescription,
  };

  // console.log({ updatePayload });
  writeText('debug.txt', prDescription);
  throw new Error();

  const updateResponse = await updatePr(updatePayload);
  console.log('PR updated: ', updateResponse && updateResponse.title);
}

function getPrChangelog(changelogMetadata: ChangelogLine[]) {
  const prsWithTargetProcess = [];
  const otherPrs = [];

  for (const changelogLine of changelogMetadata) {
    if (changelogLine.tpEntityId) {
      const line = `| [${changelogLine.prId} - ${changelogLine.prTitle}](https://gitlab.com/accounto/frontend/frontend-app/-/merge_requests/${changelogLine.prId}) | [${changelogLine.tpEntityId} - ${changelogLine.tpEntityTitle}](${changelogLine.tpEntityUrl}) |`;
      prsWithTargetProcess.push(line);
    } else {
      const line = `| [${changelogLine.prId} - ${changelogLine.prTitle}](https://gitlab.com/accounto/frontend/frontend-app/-/merge_requests/${changelogLine.prId}) | |`;
      otherPrs.push(line);
    }
  }

  // logDebug({ gitlabChangelogLines });
  return [...prsWithTargetProcess, ...otherPrs].join('\n');
}

async function correctTitleIfNeeded(prTitle: string, prIID: string) {
  const releaseDateTitle = await getCurrentReleaseTitle();
  const newTitle = `WIP: ${releaseDateTitle}`;

  if (prTitle !== newTitle) {
    updatePr({ iid: prIID, title: newTitle });
  }
}
