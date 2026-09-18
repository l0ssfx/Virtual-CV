const fs = require('fs');
const path = require('path');

const dest = 'dist';
const dirs = ['css', 'js', 'assets', 'data', 'api'];
const files = ['index.html', 'vercel.json'];

// Ensure dist exists
if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
}

// Copy Directories
dirs.forEach(dir => {
    const srcPath = path.join(__dirname, dir);
    const destPath = path.join(__dirname, dest, dir);
    
    if (fs.existsSync(srcPath)) {
        console.log(`Copying ${dir}...`);
        fs.cpSync(srcPath, destPath, { recursive: true });
    }
});

// Copy Files
files.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(__dirname, dest, file);
    
    if (fs.existsSync(srcPath)) {
        console.log(`Copying ${file}...`);
        fs.copyFileSync(srcPath, destPath);
    }
});

console.log('✅ Static build complete. Files copied to /dist');
