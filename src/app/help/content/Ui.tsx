import type { ReactNode } from 'react';

/** A button or menu name from the app, or a phrase the manual marks in bold. */
export function Ui({ children }: { children: ReactNode }) {
    return <span className="font-semibold text-gray-100">{children}</span>;
}

/** A link to another place on the page. */
export function Go({ to, children }: { to: string; children: ReactNode }) {
    return <a href={`#${to}`} className="text-sky-400 hover:text-sky-300">{children}</a>;
}

/** The actions of a task, one per step. */
export function Steps({ children }: { children: ReactNode }) {
    return <ol className="list-decimal space-y-1.5 pl-5 marker:text-gray-500">{children}</ol>;
}

/** The label above the steps that solve a problem. */
export function DoThis({ children }: { children: ReactNode }) {
    return <p className="font-semibold text-gray-100">{children}</p>;
}

/** The table of what the light means. It wraps its cells, so it fits a phone without side scrolling. */
export function LightTable({ headers, rows }: { headers: [string, string, string]; rows: [ReactNode, ReactNode, ReactNode][] }) {
    return (
        <table className="w-full table-fixed border-collapse text-left text-sm">
            <thead>
                <tr className="border-b border-gray-700">
                    {headers.map(header => <th key={header} scope="col" className="py-2 pr-3 font-semibold text-gray-100 align-bottom">{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((cells, row) => (
                    <tr key={row} className="border-b border-gray-800">
                        {cells.map((cell, column) => <td key={column} className="py-2 pr-3 align-top">{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
