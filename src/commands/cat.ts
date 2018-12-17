import chalk from 'chalk';

import FileUtility from '../common/file-utility';
import * as glob from 'glob';
import { EOL } from 'os';
import Config from '../common/config';
import Connection from '../common/connection';
import { CatOptions } from './interfaces';
import defaultNow = Rx.helpers.defaultNow;
/**
 * Concatenate all SQL files into a single file.
 */
export default class Cat {
    constructor(private name: string, private options: CatOptions) { }
    public invoke(): void {
        const start: [number, number] = process.hrtime();
        const config: Config = new Config(this.options.config);
        const conn: Connection = config.getConnection(this.name);
        let output: string = '';
        // order is important
        const directories: string[] = [
            config.output.schemas,
            config.output.tables,
            config.output.views,
            config.output['scalar-valued'],
            config.output['table-valued'],
            config.output.views,
            config.output.procs,
            config.output.triggers
        ];
        const fs: FileUtility = new FileUtility(config , conn);
        let rootx: string = '';
        if ( config.output.root > '' ) {
            rootx = config.output.root;
        } else {
            rootx = conn.name;
        }

        for (const dir of directories) {
            const files: string[] = glob.sync(`${rootx}/${dir}/**/*.sql`);

            for (const file of files) {
                const content: string = fs.readFileSync(file).toString();
                const end: string = content.substr(-2).toLowerCase();

                output += content;
                output += EOL;
                output += (end !== 'go' ? 'go' : '');
                output += EOL + EOL;
            }
        }

        fs.write(`${config.output.root}`, `${conn.name}_concatenate_${this.timestamp(new Date())}.sql`, output);
        const time: [number, number] = process.hrtime(start);
        console.log(chalk.green(`Finished after ${time[0]}s!`));
    }

    private timestamp(dateOjb: Date): string {
        const dateNow: Date = dateOjb;
        const year: number = dateNow.getFullYear();
        const month: string | number = dateNow.getMonth() + 1;
        const day: string | number = dateNow.getDate();
        const hour: string|number = dateNow.getHours();
        const minute: string|number = dateNow.getMinutes();
        const second: string|number = dateNow.getSeconds();

        return year + '' + month + '' + day + '' + hour + '' + minute + '' + second;
    }
}
