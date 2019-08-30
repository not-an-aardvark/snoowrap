import * as Snoowrap from '../snoowrap';
import { Options as RequestOptions } from 'request';

export default class RedditContent<T> extends Promise<T> {
  created_utc: number;
  created: number;
  id: string;
  name: string;
  protected _r: Snoowrap;
  protected _fetch?: boolean;
  protected _hasFetched: boolean;

  constructor(options: any, _r: Snoowrap, _hasFetched: boolean);
  _get(options: RequestOptions): Promise<T>;
  _post(options: RequestOptions): Promise<T>;
  _delete(options: RequestOptions): Promise<T>;
  fetch(): Promise<T>;
  refresh(): Promise<T>;
  toJSON(): T;
}
