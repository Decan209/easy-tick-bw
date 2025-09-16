export interface ISession {
  id: string;
  shop: string;
  accessToken: string;
  expires?: Date;
  isOnline: boolean;
}
