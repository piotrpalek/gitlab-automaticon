import fs from 'fs';
import util from 'util';

export function writeText(filename: string, text = '') {
  fs.writeFile(filename, text, function (err) {
    if (err) return console.log(err);
    console.log(`Text saved as ${filename}`);
  });
}

export function matchTargetProcessPr(prTitle: any) {
  const regexp = /#([\d]+)/g;
  const matches = Array.from(prTitle.matchAll(regexp));
  return matches.map((match: any) => match[1]);
}

export function matchReleaseTitle(prTitle: string) {
  const matchTitle = /(\w+?)\sv(\d\d)\.(\d\d)\s?\-\s?(\d\d?\d?)/i;
  return prTitle.match(matchTitle);
}

export function logDebug(obj: any) {
  console.log(util.inspect(obj, { showHidden: false, depth: null }));
}

export function logDebugBreak(obj: any) {
  logDebug(obj);
  process.exit();
}
