
import { Options as RequestOptions } from 'request';

declare function oauthRequest(options: RequestOptions, attempts: number): Promise<unknown>;
declare function credentialedClientRequest(options: RequestOptions): Promise<unknown>;
declare function unauthenticatedRequest(options: RequestOptions): Promise<unknown>;
declare function updateAccessToken(): Promise<unknown>;
declare const rawRequest: Promise<unknown>;