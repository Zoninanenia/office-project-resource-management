const fs = require('fs');
const file = 'src/app/dashboard/wages/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Icons at the bottom
const icons = `
function WageIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function UserIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function ChartIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
`;

content = content.replace(/export default function WagesPage\(\) \{/, icons + '\nexport default function WagesPage() {');

// 2. Replace 💰 Labour Wages with Icon
content = content.replace(
    /💰 Labour Wages/,
    `<div className="flex items-center gap-3"><WageIcon className="w-10 h-10 md:w-12 md:h-12 text-white" /> Labour Wages</div>`
);

// 3. Replace 👤 Worker Wages with Icon
content = content.replace(
    /👤 Worker Wages/,
    `<div className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> Worker Wages</div>`
);

// 4. Replace 📊 Project Costs with Icon
content = content.replace(
    /📊 Project Costs/,
    `<div className="flex items-center gap-2"><ChartIcon className="w-4 h-4" /> Project Costs</div>`
);

// 5. Replace 📊 placeholder at the bottom with ChartIcon
content = content.replace(
    /text-5xl mb-4">📊/,
    `flex items-center justify-center mb-4 text-cyan-500"><ChartIcon className="w-16 h-16" />`
);

// 6. Update the Project Costs summary cards to include Expected Total Cost (Budget + Wages)
const newCards = `
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project Budget</p>
                                        <p className="text-2xl font-black text-gray-800 dark:text-white">\${labourData.project.budget.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Labour Cost</p>
                                        <p className={\`text-2xl font-black \${labourData.totalLabourCost > labourData.project.budget ? 'text-red-500' : 'text-emerald-500'}\`}>
                                            \${labourData.totalLabourCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Remaining Budget</p>
                                        {(() => {
                                            const remaining = labourData.project.budget - labourData.totalLabourCost;
                                            return (
                                                <p className={\`text-2xl font-black \${remaining < 0 ? 'text-red-500' : 'text-blue-500'}\`}>
                                                    {remaining < 0 ? '-' : ''}\${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-lg shadow-cyan-500/20 text-white">
                                        <p className="text-xs font-bold text-cyan-100 uppercase tracking-wider mb-1">Estimated Total Cost</p>
                                        <p className="text-2xl font-black">
                                            \${(labourData.project.budget + labourData.totalLabourCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-cyan-200 mt-1 font-medium">(Budget + Wages)</p>
                                    </div>
                                </div>
`;

content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-3 gap-4">[\s\S]*?<\/div>\n                                <\/div>\n                                <\/div>/,
    newCards
);

fs.writeFileSync(file, content);
console.log("Updated wages page");
