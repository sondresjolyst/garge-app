import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Privacy Policy</h1>
            <p className="text-xs text-gray-500">Last updated: April 2026</p>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg space-y-6 text-sm text-gray-400 leading-relaxed">
                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">What data we collect</h2>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Account information: name, email address, and hashed password.</li>
                        <li>Sensor data: readings (temperature, humidity, voltage) sent by your registered devices.</li>
                        <li>Usage data: basic server logs for debugging and security purposes.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">How we use your data</h2>
                    <ul className="list-disc list-inside space-y-1">
                        <li>To provide the Garge dashboard and historical data views.</li>
                        <li>To send account-related emails (email confirmation, password reset).</li>
                        <li>To improve the service and diagnose technical issues.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Data sharing</h2>
                    <p>We do not sell or trade your personal data. We use the following third-party data processors:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            <a href="https://www.brevo.com/legal/termsofuse/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">Brevo</a>
                            {' '}— transactional email delivery (email confirmations, password resets). Your email address is shared with Brevo solely for this purpose.
                        </li>
                    </ul>
                    <p>We may also disclose data when required by law.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Data retention</h2>
                    <p>Your data is retained for as long as your account is active. When you delete your account, all associated personal data is permanently removed. You can delete your account at any time from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Your rights</h2>
                    <p>Under GDPR you have the right to:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><span className="text-gray-300">Access &amp; portability</span> — download a copy of all your personal data in JSON format from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>.</li>
                        <li><span className="text-gray-300">Erasure</span> — permanently delete your account and all associated data from your <Link href="/profile" className="text-sky-400 hover:text-sky-300">profile page</Link>.</li>
                        <li><span className="text-gray-300">Correction</span> — to correct inaccurate data, <Link href="/contact" className="text-sky-400 hover:text-sky-300">contact us</Link>.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Cookies</h2>
                    <p>We use cookies for authentication and session management. See our <Link href="/cookies" className="text-sky-400 hover:text-sky-300">Cookie Policy</Link> for details.</p>
                </section>
            </div>

            <p className="text-xs text-gray-600">
                <Link href="/" className="hover:text-gray-400 transition-colors">← Back to home</Link>
            </p>
        </div>
    );
}
