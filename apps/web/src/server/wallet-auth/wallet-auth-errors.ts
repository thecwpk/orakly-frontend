export class WalletAuthHttpError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "WalletAuthHttpError";
  }
}
