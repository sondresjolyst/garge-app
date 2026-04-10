import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Contact</h1>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                    Have a question, feedback, or need help with your Garge device? Reach out and we will get back to you as soon as possible.
                </p>
                <div className="flex items-center gap-3 pt-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-600/20 flex items-center justify-center flex-shrink-0">
                        <EnvelopeIcon className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Email us at</p>
                        <a href="mailto:sondresjoelyst@gmail.com" className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors">
                            sondresjoelyst@gmail.com
                        </a>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-600">
                <Link href="/" className="hover:text-gray-400 transition-colors">← Back to home</Link>
            </p>
        </div>
    );
}
