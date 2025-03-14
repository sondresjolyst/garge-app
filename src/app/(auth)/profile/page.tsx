"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';

const Profile: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isAuthenticated = status === 'authenticated';
    const [user, setUser] = useState<UserDTO | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else {
            const fetchUserProfile = async () => {
                try {
                    const userProfile = await UserService.getUserProfile();
                    setUser(userProfile);
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            };
            fetchUserProfile();
        }
    }, [isAuthenticated, router]);

    if (status === 'loading' || !user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="mb-2"><strong>Email:</strong> {user.email}</p>
            <p className="mb-2"><strong>First Name:</strong> {user.firstName}</p>
            <p className="mb-2"><strong>Last Name:</strong> {user.lastName}</p>
        </div>
    );
};

export default Profile;
