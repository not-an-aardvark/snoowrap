import snoowrap from '../snoowrap';

export default class RedditContent<T=any> {
  created_utc: number;
  created: number;
  id: string;
  name: string;
  protected _r: snoowrap;
  protected _fetch?: boolean;
  protected _hasFetched: boolean;

  constructor(options: any, _r: snoowrap, _hasFetched: boolean);
  fetch(): Promise<T>;
  refresh(): Promise<T>;
  toJSON(): T;
  _clone(): T;
}
