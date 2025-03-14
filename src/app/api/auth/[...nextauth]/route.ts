import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import UserService from "@/services/userService";
import jwt from 'jsonwebtoken';

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const user = await UserService.login({
                        email: credentials.email,
                        password: credentials.password,
                    });
                    if (user) {
                        return { token: user.token, email: credentials.email };
                    }
                    return null;
                } catch (error) {
                    throw new Error("Invalid email or password");
                }
            },
        }),
    ],
    pages: {
        signIn: "/auth/login",
    },
    session: {
        jwt: true,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.token;
                const decodedToken = jwt.decode(user.token) as { unique_name: string };
                token.unique_name = decodedToken.unique_name;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.accessToken = token.accessToken;
            session.user.name = token.unique_name;
            return session;
        },
    },
});

export { handler as GET, handler as POST };
