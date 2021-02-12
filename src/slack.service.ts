import { writeText, logDebug } from './utils';
import { ChangelogLine } from './description.service';

export function handleSlackChangelog(title: string, changelogMetadata: ChangelogLine[]) {
  const slackChangelog = getSlackChangelog(changelogMetadata);
  const slackUpdate = `# Frontend ${title} \n\n${slackChangelog}`;

  writeText('slack.txt', slackUpdate);
}

function getSlackChangelog(changelogMetadata: ChangelogLine[]) {
  const withoutDuplicates = changelogMetadata.filter((line, index, self) => {
    if (!line.tpEntityId) {
      return true;
    }

    return index === self.findIndex((l) => l.tpEntityId === line.tpEntityId);
  });

  const changelogLines = withoutDuplicates.map((changelogLine) => {
    // const slackLines = tpEntities.map((entity: any) => {
    //   const id = entity.id;
    //   const name = entity.name;
    //   const url = `https://targets.accounto.ch/entity/${id}`;
    //   return `- ${name} (${url})`;
    // });
    if (changelogLine.tpEntityId) {
      return `- ${changelogLine.tpEntityTitle} (${changelogLine.tpEntityUrl})`;
    } else {
      const gitlabPrUrl = `https://gitlab.com/accounto/frontend/frontend-app/-/merge_requests/${changelogLine.prId}`;
      return `- ${changelogLine.prTitle} (${gitlabPrUrl})`;
    }
  });

  // logDebug({ changelogLines });
  return changelogLines.join('\n');
}
