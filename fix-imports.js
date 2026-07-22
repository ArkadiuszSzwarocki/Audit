const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'generated') replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix broken imports missing quotes
      content = content.replace(/from @\/generated\/prisma\/client;/g, "from '@/generated/prisma/client';");
      
      // Fix any remaining double-quoted imports
      content = content.replace(/"@prisma\/client"/g, "'@/generated/prisma/client'");
      
      // Fix any remaining single-quoted imports just in case
      content = content.replace(/'@prisma\/client'/g, "'@/generated/prisma/client'");
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
replaceInDir('./src');
