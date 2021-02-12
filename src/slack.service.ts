import { writeText, logDebug } from './utils';
import { ChangelogLine } from './description.service';

export function handleSlackChangelog(title: string, changelogMetadata: ChangelogLine[]) {
  const slackChangelog = getSlackChangelog(changelogMetadata);
  const slackUpdate = `# Frontend ${title} \n\n${slackChangelog}`;

  writeText('slack.txt', slackUpdate);
}

function getSlackChangelog(changelogMetadata: ChangelogLine[]) {
  const linesWithTargetProcess = changelogMetadata.filter((changelogLine) => !!changelogLine.tpEntities.length);
  const allTpEntities = flatten(linesWithTargetProcess.map((line) => line.tpEntities));
  const uniqueTpEntities = allTpEntities.filter((tpEntity, index, self) => {
    return index === self.findIndex((t) => t.id === tpEntity.id);
  });
  const entityLines = uniqueTpEntities.map((entity) => {
    const url = `https://targets.accounto.ch/entity/${entity.id}`;
    return `- ${entity.title} (${url})`;
  });

  const otherPrs = changelogMetadata.filter((changelogLine) => !changelogLine.tpEntities.length);
  const otherLines = otherPrs.map((line) => {
    const gitlabPrUrl = `https://gitlab.com/accounto/frontend/frontend-app/-/merge_requests/${line.prId}`;
    return `- ${line.prTitle} (${gitlabPrUrl})`;
  });

  // logDebug({ changelogLines });
  return [...entityLines, ...otherLines].join('\n');
}

function flatten<T>(arr: T[][]): T[] {
  return Array.prototype.concat(...arr);
}
