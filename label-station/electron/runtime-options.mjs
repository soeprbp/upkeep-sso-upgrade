export function resolveDevelopmentUrl(argumentsList, isPackaged) {
  if (isPackaged) return '';
  const argument = argumentsList.find((value) => value.startsWith('--dev-url='));
  return argument ? argument.slice('--dev-url='.length) : '';
}
