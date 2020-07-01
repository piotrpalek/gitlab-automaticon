import { handlePrChangelog } from './gitlab.service';
import { getCurrentReleaseTitle } from './title.service';
import { getChangelog } from './description.service';
import { logDebug } from './utils';
import { handleSlackChangelog } from './slack.service';

async function main() {
  const title = await getCurrentReleaseTitle();
  const changelogMetadata = await getChangelog();

  handlePrChangelog(title, changelogMetadata);
  handleSlackChangelog(title, changelogMetadata);
}

main();
