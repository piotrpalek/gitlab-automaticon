import { getLastMergedAtDate, getMergedAfterPrs } from './gitlab.service';
import { getTpEntities } from './tp.service';
import { writeText, matchTargetProcessPr, logDebug, logDebugBreak } from './utils';
import { debuglog } from 'util';

export interface PullRequestMetadata {
  gitlabMr: any;
  tpEntities: TpEntity[] | undefined;
}

export interface ChangelogLine {
  prId: string;
  prTitle: string;
  prMergeDate: string;
  tpEntityId?: string;
  tpEntityUrl?: string;
  tpEntityTitle?: string;
}

export interface TpEntity {
  id: number;
  resourceType: string;
  name: string;
}

export async function getChangelog() {
  const metadata = await getPullRequestsMetadata();
  // logDebugBreak({ metadata });
  return getChangelogFromMetadata(metadata);
}

export async function getPullRequestsMetadata(): Promise<PullRequestMetadata[]> {
  const mergedAt = await getLastMergedAtDate();
  const mergedPrs = await getMergedAfterPrs(mergedAt);
  const pullRequestsMetadata: PullRequestMetadata[] = [];

  // logDebug({ mergedPrs: mergedPrs.map((pr: any) => pr.merged_at), mergedAt });

  for (const mergedPr of mergedPrs) {
    const tpIds = findTpEntityIds(mergedPr.title);
    const tpEntities = await getTpEntities(tpIds);

    const metadataField: PullRequestMetadata = {
      gitlabMr: mergedPr,
      tpEntities,
    };

    pullRequestsMetadata.push(metadataField);
  }

  // logDebug({ pullRequestsMetadata });
  return pullRequestsMetadata;
}

function getChangelogFromMetadata(prsMetadata: PullRequestMetadata[]): ChangelogLine[] {
  const changelogLines: ChangelogLine[] = [];

  for (const prMetadata of prsMetadata) {
    if (prMetadata.tpEntities && prMetadata.tpEntities.length) {
      const tpEntities = prMetadata.tpEntities;

      for (const tpEntity of tpEntities) {
        const tpEntityUrl = `https://targets.accounto.ch/entity/${tpEntity.id}`;
        const changelogLine: ChangelogLine = {
          prId: prMetadata.gitlabMr.iid,
          prTitle: prMetadata.gitlabMr.title,
          prMergeDate: prMetadata.gitlabMr.merged_at,
          tpEntityId: String(tpEntity.id),
          tpEntityTitle: tpEntity.name,
          tpEntityUrl,
        };

        changelogLines.push(changelogLine);
      }
    } else {
      const changelogLine: ChangelogLine = {
        prId: prMetadata.gitlabMr.iid,
        prTitle: prMetadata.gitlabMr.title,
        prMergeDate: prMetadata.gitlabMr.merged_at,
      };

      changelogLines.push(changelogLine);
    }
  }

  // logDebug({ changelogLines });
  return changelogLines;
}

function findTpEntityIds(title: any): string[] {
  let tpEntityIds: any = [];

  const tpIdMatches = Array.from(title.matchAll(/#([\d]+)/g));
  const tpIdsFromMatches = tpIdMatches.map((match: any) => match && match[1]).filter((identity) => identity);

  if (tpIdsFromMatches && tpIdsFromMatches.length) {
    tpEntityIds = [...tpEntityIds, ...tpIdsFromMatches];
  }

  return tpEntityIds;
}
