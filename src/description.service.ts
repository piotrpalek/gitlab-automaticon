import { getLastMergedAtDate, getMergedAfterPrs } from './gitlab.service';
import { getTpEntities } from './tp.service';
import { writeText, matchTargetProcessPr, logDebug, logDebugBreak } from './utils';
import { debuglog } from 'util';

export interface PullRequestMetadata {
  gitlabMr: any;
  tpEntities: TpEntity[] | undefined;
}

interface EntityChangelogData {
  id?: string;
  url?: string;
  title?: string;
}

export interface ChangelogLine {
  prId: string;
  prTitle: string;
  prMergeDate: string;
  tpEntities: EntityChangelogData[];
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

  // logDebug({ mergedPrs: mergedPrs.map((pr: any) => pr.title), mergedAt });

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
      const changelogLine: ChangelogLine = {
        prId: prMetadata.gitlabMr.iid,
        prTitle: prMetadata.gitlabMr.title,
        prMergeDate: prMetadata.gitlabMr.merged_at,
        tpEntities: prMetadata.tpEntities.map((tpEntity) => ({
          id: String(tpEntity.id),
          title: tpEntity.name,
          url: `https://targets.accounto.ch/entity/${tpEntity.id}`,
        })),
      };

      changelogLines.push(changelogLine);
    } else {
      const changelogLine: ChangelogLine = {
        prId: prMetadata.gitlabMr.iid,
        prTitle: prMetadata.gitlabMr.title,
        prMergeDate: prMetadata.gitlabMr.merged_at,
        tpEntities: [],
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
  // console.log({ tpIdMatches });
  const tpIdsFromMatches = tpIdMatches.map((match: any) => match && match[1]).filter((identity) => identity);
  // console.log({ tpIdsFromMatches });

  if (tpIdsFromMatches && tpIdsFromMatches.length) {
    tpEntityIds = [...tpEntityIds, ...tpIdsFromMatches];
  }

  return tpEntityIds;
}
