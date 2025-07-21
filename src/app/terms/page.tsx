import React from "react";

export default function TermsOfServicePage() {
    return (
        <div className="p-4 max-w-3xl mx-auto text-gray-200 space-y-6">
            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
            <p>
                By using Garge, you agree to the following terms:
            </p>
            <ul className="list-disc list-inside space-y-1">
                <li>Do not misuse the service or attempt unauthorized access.</li>
                <li>Website content is for informational purposes only.</li>
                <li>We reserve the right to change terms and website content at any time.</li>
            </ul>
            <h2 className="text-xl font-semibold mt-4 mb-2">Contact Information</h2>
            <p>
                If you have questions about privacy or terms, contact us at <a className="underline">sondresjoelyst@gmail.com</a>.
            </p>
        </div>
    );
}
