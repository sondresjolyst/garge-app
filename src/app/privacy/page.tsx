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
                    <p>We do not sell, trade, or share your personal data with third parties, except where required by law.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Data retention</h2>
                    <p>Your data is retained for as long as your account is active. You may request deletion of your account and associated data by contacting us.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">Your rights</h2>
                    <p>You have the right to access, correct, or delete your personal data. To exercise these rights, <Link href="/contact" className="text-sky-400 hover:text-sky-300">contact us</Link>.</p>
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
