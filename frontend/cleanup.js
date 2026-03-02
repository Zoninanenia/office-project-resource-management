const fs = require('fs');
const file = 'src/app/dashboard/projects/[id]/sprints/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const fetchProjects = async \(\) => \{[\s\S]*?fetchProjects\(\);\s*\}\, \[\]\);/m, '}, []);');

// Also remove Project from imports if it's there
content = content.replace(/import \{ Sprint, Task, Project \} from '@\/types';/, "import { Sprint, Task } from '@/types';");

fs.writeFileSync(file, content);
console.log("Cleaned up remaining unused bits");
