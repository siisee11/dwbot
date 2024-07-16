export class AlreadyUsedAllVacationsError extends Error {
  statusCode = 400;
  constructor(message?: string) {
    super(message);
    this.name = "AlreadyUsedAllVacationsError";
  }
}

export function isAlreadyUsedAllVacationsError(
  e: unknown
): e is AlreadyUsedAllVacationsError {
  return (
    "name" in (e as any) && (e as any).name === "AlreadyUsedAllVacationsError"
  );
}
