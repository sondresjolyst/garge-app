import Link from 'next/link';

const Navigation: React.FC = () => {
    return (
        <nav>
            <ul className="flex space-x-4">
                <li>
                    <Link href="/auth/register">Register</Link>
                </li>
                <li>
                    <Link href="/auth/login">Login</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navigation;