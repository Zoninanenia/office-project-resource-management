const fs = require('fs');
const file = 'src/app/dashboard/projects/[id]/sprints/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add useParams and Link
content = content.replace(
    /import \{ Sprint, Task, Project \} from '@\/types';/,
    `import { Sprint, Task, Project } from '@/types';\nimport { useParams } from 'next/navigation';\nimport Link from 'next/link';`
);

// 2. Add projectId, remove projects/selectedProjectId states
content = content.replace(
    /    const \[sprints, setSprints\] = useState<Sprint\[\]>\(\[\]\);\n    const \[tasks, setTasks\] = useState<Task\[\]>\(\[\]\);\n    const \[projects, setProjects\] = useState<Project\[\]>\(\[\]\);\n    const \[selectedProjectId, setSelectedProjectId\] = useState<number \| null>\(null\);/,
    `    const params = useParams();\n    const projectId = params?.id ? parseInt(params.id as string) : null;\n\n    const [sprints, setSprints] = useState<Sprint[]>([]);\n    const [tasks, setTasks] = useState<Task[]>([]);`
);

// 3. Remove fetchProjects useEffect entirely
content = content.replace(
    /        const fetchProjects = async \(\) => \{\n            try \{\n                const data = await api\.get<Project\[\]>\('\/projects'\);\n                setProjects\(data\);\n                if \(data\.length > 0\) \{\n                    setSelectedProjectId\(data\[0\]\.projectId\);\n                \}\n            \} catch \(err\) \{\n                console\.error\('Failed to fetch projects', err\);\n            \}\n        \};\n\n        fetchProjects\(\);\n/,
    ''
);

// 4. Replace selectedProjectId with projectId everywhere else
content = content.replaceAll('selectedProjectId', 'projectId');

// 5. Add Back to project details link in header
content = content.replace(
    /                    <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight mb-2">Sprints & Timeline<\/h1>/,
    `                    <Link href={\`/dashboard/projects/\${projectId}\`} className="text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors mb-4 inline-block">\n                        ← Back to Project Details\n                    </Link>\n                    <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight mb-2">Sprints & Timeline</h1>`
);

// 6. Remove Project Selector Dropdown
content = content.replace(
    /                    \{\/\* Project Selector \*\/\}[\s\S]*?<\/select>/,
    ''
);

// 7. Update No project text
content = content.replace(
    /                    <p className="text-gray-400 font-bold text-lg">No project selected\.<\/p>\n                    <p className="text-gray-400 text-sm mt-1">Please select a project to manage sprints\.<\/p>/,
    `                    <p className="text-gray-400 font-bold text-lg">Project not found.</p>`
);

fs.writeFileSync(file, content);
console.log("Updated successfully");
