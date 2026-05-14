#!/usr/bin/env node
// scripts/convert-wp-files.mjs
// GitHub Actions 빌드 시 WordPress 공식 소스를 가져와 Astro/TS로 변환
// Worker subrequest 한도 초과 방지를 위해 빌드 타임으로 이동

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const WP_RAW = 'https://raw.githubusercontent.com/WordPress/WordPress/master';
const TARGET_FILES = [
  {
    "path": "wp-login.php",
    "type": "php"
  },
  {
    "path": "wp-signup.php",
    "type": "php"
  },
  {
    "path": "wp-comments-post.php",
    "type": "php"
  },
  {
    "path": "wp-cron.php",
    "type": "php"
  },
  {
    "path": "wp-includes/functions.php",
    "type": "php"
  },
  {
    "path": "wp-includes/class-wp-query.php",
    "type": "php"
  },
  {
    "path": "wp-includes/class-wp-post.php",
    "type": "php"
  },
  {
    "path": "wp-includes/class-wp-user.php",
    "type": "php"
  },
  {
    "path": "wp-includes/post.php",
    "type": "php"
  },
  {
    "path": "wp-includes/user.php",
    "type": "php"
  },
  {
    "path": "wp-includes/formatting.php",
    "type": "php"
  },
  {
    "path": "wp-includes/taxonomy.php",
    "type": "php"
  },
  {
    "path": "wp-includes/comment.php",
    "type": "php"
  },
  {
    "path": "wp-admin/admin.php",
    "type": "php"
  },
  {
    "path": "wp-admin/index.php",
    "type": "php"
  },
  {
    "path": "wp-admin/post.php",
    "type": "php"
  },
  {
    "path": "wp-admin/edit.php",
    "type": "php"
  },
  {
    "path": "wp-includes/js/wp-util.js",
    "type": "js"
  },
  {
    "path": "wp-includes/js/customize-preview.js",
    "type": "js"
  },
  {
    "path": "wp-admin/css/common.css",
    "type": "css"
  }
];

function convertPhpToAstro(phpCode, fileName) {
  let code = phpCode
    .replace(/<\?php\s*/g, '')
    .replace(/<\?=/g, '{')
    .replace(/\?>/g, '}')
    .trim();
  code = code
    .replace(/\$(\w+)\s*=\s*/g, 'const $1 = ')
    .replace(/\$(\w+)/g, '$1');
  code = code.replace(/echo\s+(.+?);/g, '{$1}');
  code = code.replace(/function\s+(\w+)\s*\(/g, 'function $1(');
  code = code.replace(/array\s*\(/g, '[').replace(/\)/g, ']');
  code = code.replace(/"\s*\.\s*"/g, '" + "').replace(/'\s*\.\s*'/g, "' + '");
  code = code.replace(/foreach\s*\((\w+)\s+as\s+(\w+)\s*=>\s*(\w+)\)/g, 'for (const [$2, $3] of Object.entries($1))');
  code = code.replace(/foreach\s*\((\w+)\s+as\s+(\w+)\)/g, 'for (const $2 of $1)');
  code = code.replace(/require_once\s+['"](.+?)['"]/g, "// import '$1'");
  code = code.replace(/require\s+['"](.+?)['"]/g, "// import '$1'");
  code = code.replace(/include_once\s+['"](.+?)['"]/g, "// import '$1'");
  code = code.replace(/include\s+['"](.+?)['"]/g, "// import '$1'");
  code = code.replace(/^#\s*/gm, '// ');
  code = code.replace(/(\w+)::/g, '$1.');
  return `---\n// Converted from ${fileName} (WordPress official source → Astro)\n// Source: https://github.com/WordPress/WordPress\n\n${code}\n---\n\n<slot />\n`;
}

function convertJsToTs(jsCode, fileName) {
  let code = jsCode.replace(/\bvar\s+/g, 'let ');
  if (code.includes('jQuery') || code.includes('$')) {
    code = `// @ts-ignore - jQuery type\ndeclare const jQuery: any;\ndeclare const $: typeof jQuery;\n\n` + code;
  }
  if (code.includes('wp.')) {
    code = `// @ts-ignore - WordPress globals\ndeclare const wp: any;\n\n` + code;
  }
  if (code.includes('wpApiSettings') || code.includes('ajaxurl')) {
    code = `// @ts-ignore - WordPress API globals\ndeclare const wpApiSettings: any;\ndeclare const ajaxurl: string;\n\n` + code;
  }
  return `// Converted from ${fileName} (WordPress official source → TypeScript)\n// Source: https://github.com/WordPress/WordPress\n\n${code}\n`;
}

async function run() {
  let converted = 0;
  const chunks = [];
  for (let i = 0; i < TARGET_FILES.length; i += 5) chunks.push(TARGET_FILES.slice(i, i + 5));

  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map(async (file) => {
      const res = await fetch(`${WP_RAW}/${file.path}`, { headers: { 'User-Agent': 'CloudPress/3.1' } });
      if (!res.ok) return null;
      const raw = await res.text();
      const base = file.path.split('/').pop();
      let outPath, content;
      if (file.type === 'php') {
        outPath = `src/wp-converted/${file.path.replace(/\.php$/, '.astro')}`;
        content = convertPhpToAstro(raw, base);
      } else if (file.type === 'js') {
        outPath = `src/wp-converted/${file.path.replace(/\.js$/, '.ts')}`;
        content = convertJsToTs(raw, base);
      } else {
        outPath = `public/${file.path}`;
        content = raw;
      }
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, content, 'utf8');
      return outPath;
    }));
    results.forEach(r => { if (r.status === 'fulfilled' && r.value) converted++; });
  }
  console.log(`WordPress 파일 변환 완료: ${converted}개`);
}

run().catch(e => { console.error(e); process.exit(1); });
