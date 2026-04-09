import Link from "next/link";

export default function CookiesPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Cookie Policy</h1>
            <p className="text-xs text-gray-500">Last updated: April 2026</p>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg space-y-6 text-sm text-gray-400 leading-relaxed">
                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">What are cookies?</h2>
                    <p>Cookies are small text files stored in your browser. They help the site remember your session and preferences between visits.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Cookies we use</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Name</th>
                                    <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Purpose</th>
                                    <th className="text-left py-2 text-gray-300 font-semibold">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                                <tr>
                                    <td className="py-2 pr-4 text-gray-300 font-mono">next-auth.session-token</td>
                                    <td className="py-2 pr-4">Keeps you signed in</td>
                                    <td className="py-2">Session / 30 days</td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 text-gray-300 font-mono">next-auth.csrf-token</td>
                                    <td className="py-2 pr-4">Security — prevents cross-site request forgery</td>
                                    <td className="py-2">Session</td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 text-gray-300 font-mono">next-auth.callback-url</td>
                                    <td className="py-2 pr-4">Remembers where to redirect after login</td>
                                    <td className="py-2">Session</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Third-party cookies</h2>
                    <p>We do not use any third-party analytics, advertising, or tracking cookies.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Managing cookies</h2>
                    <p>You can clear or block cookies through your browser settings. Note that blocking session cookies will prevent you from staying signed in.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Questions?</h2>
                    <p><Link href="/contact" className="text-sky-400 hover:text-sky-300">Contact us</Link> if you have any questions about how we use cookies.</p>
                </section>
            </div>

            <p className="text-xs text-gray-600">
                <Link href="/" className="hover:text-gray-400 transition-colors">← Back to home</Link>
            </p>
        </div>
    );
}
