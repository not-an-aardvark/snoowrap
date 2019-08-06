import * as Snoowrap from '../snoowrap';

export default class RedditContent<T> extends Promise<T> {
  created_utc: number;
  created: number;
  id: string;
  name: string;
  protected _r: Snoowrap;
  protected _fetch?: boolean;
  protected _hasFetched: boolean;

  constructor(options: any, _r: Snoowrap, _hasFetched: boolean);
  fetch(): Promise<T>;
  refresh(): Promise<T>;
  toJSON(): T;
}
