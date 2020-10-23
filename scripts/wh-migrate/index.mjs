import { cwd } from 'process';
import { resolve, join,  } from 'path';
import { promises as fsPromises } from 'fs';

const { readdir, readFile, writeFile } = fsPromises

async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
        const { name } = dirent;
        const fullPath = resolve(dir, name);

        if (dirent.isDirectory()) {
            yield* getFiles(fullPath);
        } else {
            yield { name, fullPath };
        }
    }
}

(async function main() {
    const pages = join(cwd(), 'pages')
    const root = join(pages, 'docs');

    for await (let { name, fullPath } of getFiles(root)) {
        if (name === 'basics.md') name = 'coroutines-basics.md';
        else if (name === 'coroutines-guide.md') name = 'coroutines-intro.md';

        const relativePath = fullPath.slice(root.length + 1);
        const to = join('/docs', name);
        const content = await readFile(fullPath, 'utf8');
        const match = content.match(/\nredirect_path: (.+)\n/);

        if (match && match[1]) continue

        const { href, pathname } = new URL(
            to.replace(/\.md$/, '.html'),
            'https://kotlinlang.org'
        );

        await writeFile(fullPath, `---
title: ${relativePath}
showAuthorInfo: false
redirect_path: ${href}
---

The page is moved to [${pathname}](${pathname})
`);
    }
})();
