const fs = require('fs');
const file = 'src/app/dashboard/projects/[id]/sprints/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The file currently has:
//     const [sprints, setSprints] = useState<Sprint[]>([]);
//     const [tasks, setTasks] = useState<Task[]>([]);
//     const [projects, setProjects] = useState<Project[]>([]);
//     const [projectId, setSelectedProjectId] = useState<number | null>(null);

content = content.replace(
    /    const \[sprints, setSprints\] = useState<Sprint\[\]>\(\[\]\);\r?\n    const \[tasks, setTasks\] = useState<Task\[\]>\(\[\]\);\r?\n    const \[projects, setProjects\] = useState<Project\[\]>\(\[\]\);\r?\n    const \[projectId, setSelectedProjectId\] = useState<number \| null>\(null\);/g,
    `    const params = useParams();\n    const projectId = params?.id ? parseInt(params.id as string) : null;\n\n    const [sprints, setSprints] = useState<Sprint[]>([]);\n    const [tasks, setTasks] = useState<Task[]>([]);`
);

fs.writeFileSync(file, content);
console.log("Updated state lines successfully");
