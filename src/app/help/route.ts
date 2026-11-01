import { helpPathFor } from './language';

/** Sends a visitor to the help page in their language. The Location is relative, so it holds behind any proxy. */
export function GET(request: Request) {
    return new Response(null, {
        status: 307,
        headers: {
            Location: helpPathFor(request.headers.get('accept-language')),
            Vary: 'Accept-Language',
        },
    });
}
