import { getLastReleasePr } from './gitlab.service';
import { logDebug, matchReleaseTitle } from './utils';

const { format } = require('date-fns');

export async function getCurrentReleaseTitle(): Promise<string> {
  const { year, month, patchVersion } = await getLastMergedTitleData();
  const currentYearMonth = format(new Date(), 'yy.MM');
  const previousYearMonth = `${year}.${month}`;
  let currentPatchVersion = '1';

  if (currentYearMonth === previousYearMonth) {
    currentPatchVersion = String(Number(patchVersion) + 1);
    currentPatchVersion = String(currentPatchVersion);
  }

  const title = `Release v${currentYearMonth}-${currentPatchVersion}`;
  return title;
}

async function getLastMergedTitleData() {
  const lastReleasePr = await getLastReleasePr();
  const match = matchReleaseTitle(lastReleasePr.title);

  if (!match) {
    throw new Error('getLastMergedTitleData failed to match title!');
  }

  const data = {
    prefix: match[1],
    year: match[2],
    month: match[3],
    patchVersion: match[4],
  };

  // console.log('getLastMergedTitleData', data);
  return data;
}
