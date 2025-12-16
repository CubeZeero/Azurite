const { getOgp } = require('./src/lib/actions/ogp');

// This won't work directly because 'use server' actions need Next.js environment context usually or transpilation.
// However, since it's just a function using fetch/cheerio, if I strip 'use server' it works in node.
// Or I can just run it via a temporary route in Next.js or just assume the logs will show up in the running dev server.
// Let's rely on the running dev server logs. 
