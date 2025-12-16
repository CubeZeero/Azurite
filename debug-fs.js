const fs = require('fs');
const path = require('path');
const rootDir = '/Users/cubezeero/Library/CloudStorage/Dropbox/azurite_box';

async function test() {
    console.log('Testing write access to:', rootDir);
    try {
        if (!fs.existsSync(rootDir)) {
            console.log('Root dir does not exist. Attempting to create...');
            try {
                fs.mkdirSync(rootDir, { recursive: true });
                console.log('Root dir created successfully.');
            } catch (e) {
                console.error('Failed to create root dir:', e.message);
                // If we can't create root, we can't proceed
                return;
            }
        } else {
            console.log('Root dir exists.');
            try {
                fs.accessSync(rootDir, fs.constants.W_OK);
                console.log('Root dir is writable.');
            } catch (e) {
                console.error('Root dir is NOT writable:', e.message);
            }
        }

        const start = Date.now();
        const categoryName = `Debug_Test_${start}`;
        const categoryPath = path.join(rootDir, categoryName);

        console.log('Attempting to create category dir:', categoryPath);
        fs.mkdirSync(categoryPath, { recursive: true });
        console.log('Category dir created.');

        const metaPath = path.join(categoryPath, '.meta.json');
        const content = JSON.stringify({ id: 'test', passed: true });
        console.log('Attempting to write file:', metaPath);
        fs.writeFileSync(metaPath, content);
        console.log('File written successfully.');

        // Clean up
        console.log('Cleaning up...');
        fs.unlinkSync(metaPath);
        fs.rmdirSync(categoryPath);
        console.log('Cleanup complete. Verification PASSED.');

    } catch (e) {
        console.error('VERIFICATION FAILED:', e);
    }
}

test();
