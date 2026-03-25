require('reflect-metadata');
const fs = require('fs');
const path = require('path');

function scanModule(modulePath, visited = new Set()) {
  if (visited.has(modulePath)) return;
  visited.add(modulePath);

  try {
    const mod = require(modulePath);
    for (const key of Object.keys(mod)) {
      const cls = mod[key];
      if (typeof cls === 'function') {
        ['imports', 'providers', 'controllers', 'exports'].forEach(metaKey => {
          const meta = Reflect.getMetadata(metaKey, cls);
          if (Array.isArray(meta)) {
            meta.forEach((item, index) => {
              if (item === undefined) {
                console.error(`UNDEFINED FOUND IN ${modulePath} -> ${cls.name} -> ${metaKey}[${index}]`);
              }
            });
          }
        });
        
        // Scan constructor parameters
        const paramTypes = Reflect.getMetadata('design:paramtypes', cls);
        if (Array.isArray(paramTypes)) {
          paramTypes.forEach((param, index) => {
            if (param === undefined) {
              console.error(`UNDEFINED CONSTRUCTOR PARAMETER IN ${modulePath} -> ${cls.name} -> arg[${index}]`);
            }
          });
        }
      }
    }
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.error(`Error loading ${modulePath}:`, err.message);
    }
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (file.endsWith('.js') && file !== 'main.js') {
      scanModule(fullPath);
    }
  }
}

traverseDir(path.join(__dirname, 'dist/src'));
console.log('Scan complete.');
