import * as fs from 'fs-extra';
import * as path from 'path';

import Config from './config';
import { ICache } from './interfaces';
import Connection from './connection';

/**
 * File checksum cache.
 */
export default class Cache implements ICache {

  /**
   * Default cache file.
   */
  public static readonly defaultCacheFile: string = 'cache.json';

  constructor(config: Config, con: Connection) {
    this.config = config;
    this.conn = con;
  }

  /**
   * File checksums.
   */
  public files: { [key: string]: string } = {};

  /**
   * Current configuration.
   */
  private config: Config;

  /**
   * Current connection.
   */
  private conn: Connection;
  /**
   * Load configuration options from file.
   */
  public load(): void {
    if (!this.doesDefaultExist()) {
      return;
    }
    let file: string  = '' ;
    try {
        if (this.conn.name > '') {
            file = path.join(this.conn.name, Cache.defaultCacheFile);
        } else {
            file = path.join(this.config.output.root, Cache.defaultCacheFile);
        }
        const cache: ICache = fs.readJsonSync(file);
        this.files = cache.files;
    } catch (error) {
      console.error(`Could not parse cache file. Try deleting the existing ${Cache.defaultCacheFile} file!`);
      process.exit();
    }
  }

  /**
   * Check if a `newSum` is different from the existing file's checksum.
   *
   * @param file File to check.
   * @param newSum New checksum value.
   */
  public didChange(file: string, newSum: string): boolean {
    if (!this.files) {
      return true;
    }

    const oldSum: string = this.files[file];

    if (!oldSum) {
      return true;
    }

    return newSum !== oldSum;
  }

  /**
   * Add file checksum to cache.
   *
   * @param file File to check.
   * @param newSum New checksum value.
   */
  public add(file: string, newSum: string): void {
    if (!file || !newSum) {
      return;
    }

    this.files[file] = newSum;
  }

  /**
   * Write a config file with provided configuration.
   */
  public write(): void {
    let file: string = '' ;

    try {
        if (this.conn.name > '') {
            file = path.join(this.conn.name, Cache.defaultCacheFile);
        } else {
            file = path.join(this.config.output.root, Cache.defaultCacheFile);
        }
    } catch (error) {
        console.error(`Could not find file!:${file}`);
        process.exit();
    }
    const content: ICache = { files: this.files };
    fs.writeJson(file, content, { spaces: 2 });
  }

  /**
   * Check if default cache file exists.
   */
  private doesDefaultExist(): boolean {
    let file: string = '' ;

    try {
        if (this.conn.name > '') {
            file = path.join(this.conn.name, Cache.defaultCacheFile);
        } else {
            file = path.join(this.config.output.root, Cache.defaultCacheFile);
        }
    } catch (error) {
      console.error(`Could not find file!:${file}`);
      process.exit();
    }
    return fs.existsSync(file);
  }
}
