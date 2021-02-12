import { matchTargetProcessPr } from './utils';
import { fetchFromTp } from './requests';

function getTpEntitiesChangelog(prsWithMetadata: any) {
  const tpEntities = prsWithMetadata.entities;
  const mergedPrs = prsWithMetadata.mergedPrs;

  const gitlabLines = tpEntities.map((entity: any) => {
    const id = entity.id;
    const name = entity.name;
    const url = `https://targets.accounto.ch/entity/${id}`;
    //console.log(mergedPrs.map((pr) => pr.title));
    const pr = mergedPrs.find(function (pr: any) {
      const prTitle = pr.title;
      const tpIds = matchTargetProcessPr(prTitle);
      return tpIds.includes(String(id));
    });

    return `- [${id} - ${name}](${url}) | Pr: !${pr.iid}`;
  });

  const slackLines = tpEntities.map((entity: any) => {
    const id = entity.id;
    const name = entity.name;
    const url = `https://targets.accounto.ch/entity/${id}`;

    return `- ${name} (${url})`;
  });

  return [gitlabLines, slackLines];
}

export function getTpEntities(rawEntityIds: string[] = []) {
  // console.log({ rawEntityIds });
  const entityIds = rawEntityIds.filter((identity) => identity);
  // console.log({ entityIds });
  const entityIdsQuery = entityIds.join();
  const entitiesByIdsUrl = `https://targets.accounto.ch/api/v2/General`;

  console.log('Getting tp entities..', entityIdsQuery);
  return fetchFromTp(entitiesByIdsUrl, {
    where: `Id in [${entityIdsQuery}]`,
  }).then((response: any) => response && response.items);
}
