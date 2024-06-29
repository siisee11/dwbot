export function makeDailyCheckId(): string {
  return `dcheck_${makeId(24)}`;
}

export function makeSlackUserId(): string {
  return `slusr_${makeId(24)}`;
}

export function makeChallangeId(): string {
  return `chal_${makeId(24)}`;
}

export function makeId(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
