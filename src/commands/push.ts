import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as inquirer from 'inquirer';
import * as sql from 'mssql';
import * as ora from 'ora';
import { EOL } from 'os';

import Config from '../common/config';
import Connection from '../common/connection';
import { PushOptions } from './interfaces';

export default class Push {
  constructor(private name: string, private options: PushOptions) { }

  /**
   * Spinner instance.
   */
  // tslint:disable-next-line:typedef
  private spinner = ora();

  /**
   * current connection
   */
  private conn: Connection = null;
  /**
   * Invoke actions.
   */
  public invoke(): void {
    const config: Config = new Config(this.options.config);
    this.conn = config.getConnection(this.name);

    inquirer.prompt<inquirer.Answers>([
      {
        name: 'continue',
        message: [
          'WARNING! All local SQL files will be executed against the requested database.',
          'This can not be undone!',
          'Make sure to backup your database first.',
          EOL,
          'Are you sure you want to continue?'
        ].join(' '),
        type: 'confirm',
        when: !this.options.skip
      }
    ])
      .then(answers => {
        if (answers.continue === false) {
          throw new Error('Command aborted!');
        }
      })
      .then(() => this.batch(config, this.conn))
      .then(() => this.spinner.succeed('Successfully pushed!'))
      .catch(error => this.spinner.fail(error));
  }

  /**
   * Execute all files against database.
   *
   * @param config Configuration used to execute commands.
   * @param conn Connection used to execute commands.
   */
  private batch(config: Config, conn: Connection): Promise<any> {
    const files: string[] = this.getFilesOrdered(config, this.conn);
    let promise: Promise<sql.ConnectionPool> = new sql.ConnectionPool(conn).connect();

    this.spinner.start(`Pushing to ${chalk.blue(conn.server)} ...`);

    files.forEach(file => {
      const content: string = fs.readFileSync(file, 'utf8');
      this.spinner.start(`Pushing to ${chalk.blue(`executing file:${file},content:${content}`)}`);
      try {
          promise = promise.then(pool => {
              return pool.request().batch(content).then(() => pool);
          });
      } catch (e) {
          this.spinner.start(`Pushing to ${chalk.blue(`executing file:${file},error:${e.tostring()}`)}`);
      }

    });

    return promise;
  }

  /**
   * Get all SQL files in correct execution order.
   *
   * @param config Configuration used to search for connection.
   */
  private getFilesOrdered(config: Config, connx: Connection): string[] {
    const output: string[] = [];
    const directories: string[] = [
        config.output.schemas,
        config.output.tables,
        config.output.types,
        config.output.views,
        config.output.functions,
        config.output.procs,
        config.output.triggers,
        config.output.data
    ] as string[];
    directories.forEach(dir => {
      if (dir) {
        const files: string[] = glob.sync(`${connx.name}/${dir}/**/*.sql`);
        output.push(...files);
      }
    });

    return output;
  }
}
