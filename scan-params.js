const fs = require('fs');
const path = require('path');
require('reflect-metadata');

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      scan(p);
    } else if (p.endsWith('.js') && !p.endsWith('.spec.js') && !p.includes('main.js')) {
      try {
        const mod = require('./' + p.replace(/\\/g, '/'));
        for (const k of Object.keys(mod)) {
          const cls = mod[k];
          if (typeof cls === 'function') {
            const params = Reflect.getMetadata('design:paramtypes', cls);
            if (Array.isArray(params)) {
              params.forEach((param, i) => {
                if (param === undefined) {
                  console.error(`UNDEFINED PARAM in ${p} -> ${cls.name} arg ${i}`);
                }
              });
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

scan('dist/src');
console.log('Param scan complete');
