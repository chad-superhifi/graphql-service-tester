"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const testRunner_1 = require("./testRunner");
const mockServer_1 = require("../test/mockServer");
const commander_1 = require("commander");
const terminal_kit_1 = require("terminal-kit");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');
const program = new commander_1.Command();
let progressBar;
process.title = 'graphql-service-tester';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let serverUrl;
        program
            .version(version)
            .arguments('<serverUrl>')
            .action((url) => {
            serverUrl = url;
        })
            .option('-v, --verbose', 'Displays all the query information')
            .option('-ht, --hidetable', 'Removes table Display')
            // TODO: Add support back for running in some in parallel while preserving dependency ordering
            // .option('-p, --parallel', 'Executes all queries in parallel')
            // TODO: Add back support for retries
            // .option('-r, --retryCount <n>', 'Number of times to retry the query generator if it fails', parseInt)
            // .option('-t, --retrySnoozeTime <n>', 'Time in milliseconds to wait before retries', parseInt)
            .parse(process.argv);
        let server;
        if (serverUrl === 'playlist') {
            console.log('Using local mock playlist service for testing\n');
            server = mockServer_1.mockPlaylistServer();
        }
        const reportData = yield testRunner_1.runGraphQLTests(server || serverUrl, (name, percentComplete, totalQueries) => {
            if (!progressBar) {
                progressBar = terminal_kit_1.terminal.progressBar({
                    title: 'GraphQL API Tests:',
                    eta: true,
                    percent: true,
                    items: totalQueries,
                });
            }
            if (percentComplete === 0) {
                progressBar.startItem(name);
            }
            if (percentComplete === 1) {
                progressBar.itemDone(name);
            }
        });
        if (!program.hidetable) {
            terminal_kit_1.terminal.bold('\n\nAPIs:\n');
            terminal_kit_1.terminal.table(reportData.map((report) => [
                report.status === 'passed' && report.run.meetsSLA ? '^G√ ' : '',
                `${report.status === 'passed' && report.run.meetsSLA ? '' : '^R'}${report.query.signature || report.query.query} ${report.status === 'passed' && !program.verbose
                    ? ''
                    : `${report.errors.length ? '\n\n' + report.errors[0] + '\n' : ''}`}\n`,
                `${report.run.meetsSLA ? '^G' : '^R'}${report.run.ms}ms `,
            ]), {
                hasBorder: true,
                borderChars: 'lightRounded',
                borderAttr: { color: 'blue' },
                contentHasMarkup: true,
                textAttr: { bgColor: 'default' },
                width: 80,
                fit: true,
            });
        }
        const failedTests = reportData.filter((report) => report.status === 'failed' || !report.run.meetsSLA);
        const passedTests = reportData.filter((report) => report.status === 'passed' && report.run.meetsSLA).length;
        failedTests.length && terminal_kit_1.terminal.bold.red('\n\nFailed Tests:\n');
        failedTests.forEach((report) => {
            report.errors.forEach((err) => {
                // term.red(`${report.query.signature || report.query.query} \n`);
                terminal_kit_1.terminal.red(`${program.verbose ? `${report.query.signature}\n${report.query.query}` : report.query.signature} \n`);
                terminal_kit_1.terminal(`- ${err} \n\n`);
            });
        });
        terminal_kit_1.terminal.bold('\n\nResults:\n');
        terminal_kit_1.terminal.green(`${passedTests} passing\n`);
        terminal_kit_1.terminal.red(`${failedTests.length} failing\n\n`);
        process.exitCode = failedTests.length > 0 ? 1 : 0;
    });
}
main();
//# sourceMappingURL=cli.js.map