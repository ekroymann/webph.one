import fs = require('fs');
import { Observable } from 'rxjs/Rx';

const exec = require('child_process').exec;

const revision = new Observable<string>(s => {
    exec('git rev-parse --short HEAD',
        (error: Error, stdout: Buffer, stderr: Buffer) => {
            if (error !== null) {
                console.log('git error: ' + error + stderr);
            }
            s.next(stdout.toString().trim());
            s.complete();
        });
});

const branch = new Observable<string>(s => {
    exec('git rev-parse --abbrev-ref HEAD',
        (error: Error, stdout: Buffer, stderr: Buffer) => {
            if (error !== null) {
                console.log('git error: ' + error + stderr);
            }
            s.next(stdout.toString().trim());
            s.complete();
        });
});

Observable
    .combineLatest(revision, branch)
    .subscribe(([rev, bra]) => {
        console.log(`version: '${process.env.npm_package_version}', revision: '${rev}', branch: '${bra}'`);

        const contentJs = '' +
            '// this file is automatically generated by git.version.ts script\n' +
            'export const versions = {\n' +
            '   revision: \'' + rev + '\',\n' +
            '   branch: \'' + bra + '\'\n' +
            '};\n';

        const contentJson = '' +
            '{\n' +
            '   "revision": "' + rev + '",\n' +
            '   "branch": "' + bra + '"\n' +
            '}\n';

        fs.writeFileSync(
            'src/environments/versions.ts',
            contentJs,
            {encoding: 'utf8'}
        );

        try {
            fs.writeFileSync(
                'dist/version.json',
                contentJson,
                {encoding: 'utf8'}
            );
        } catch (e) {
            // do nothing
        }
    });
