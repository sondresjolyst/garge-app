import HelpPage from '@/app/help/HelpPage';
import { helpMetadata } from '@/app/help/helpContent';
import { content } from '@/app/help/content/en';

export const metadata = helpMetadata(content);

export default function Page() {
    return <HelpPage content={content} />;
}
