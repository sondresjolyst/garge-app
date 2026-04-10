import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Terms of Service</h1>
            <p className="text-xs text-gray-500">Last updated: April 2026</p>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg space-y-6 text-sm text-gray-400 leading-relaxed">
                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">1. Acceptance of terms</h2>
                    <p>By using Garge you agree to these terms. If you do not agree, please do not use the service.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">2. Use of the service</h2>
                    <p>Garge provides a platform for monitoring sensor data from devices registered to your account. You are responsible for keeping your login credentials secure.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">3. Device ownership</h2>
                    <p>You may only claim devices you own or have been given permission to register. Claiming a device does not transfer hardware ownership.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">4. Data</h2>
                    <p>Sensor readings are stored and associated with your account. We do not sell your data to third parties. See our <Link href="/privacy" className="text-sky-400 hover:text-sky-300">Privacy Policy</Link> for details.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">5. Availability</h2>
                    <p>We aim for high availability but do not guarantee uninterrupted access. The service may be updated or taken offline for maintenance at any time.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">6. Changes to terms</h2>
                    <p>We may update these terms from time to time. Continued use of Garge after changes are posted constitutes acceptance.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-100">7. Contact</h2>
                    <p>Questions about these terms? <Link href="/contact" className="text-sky-400 hover:text-sky-300">Contact us</Link>.</p>
                </section>
            </div>

            <p className="text-xs text-gray-600">
                <Link href="/" className="hover:text-gray-400 transition-colors">← Back to home</Link>
            </p>
        </div>
    );
}
