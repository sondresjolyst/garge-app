import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import UserService from "@/services/userService";
import jwt from 'jsonwebtoken';

type DecodedToken = {
    sub: string;
    unique_name: string;
    email: string;
    nbf: number;
    exp: number;
    iat: number;
    iss: string;
    aud: string;
};

type ExtendedUser = {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    accessTokenExpires: number;
};

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) {
                    throw new Error("Credentials are missing");
                }
                try {
                    const user = await UserService.login({
                        email: credentials.email,
                        password: credentials.password,
                    });
                    if (user) {
                        const decodedToken = jwt.decode(user.token) as DecodedToken;
                        return {
                            id: decodedToken.sub,
                            name: decodedToken.unique_name,
                            email: credentials.email,
                            accessToken: user.token,
                            accessTokenExpires: decodedToken.exp * 1000,
                        } as ExtendedUser;
                    }
                    return null;
                } catch (error) {
                    console.error("Error in authorize function:", error);
                    throw new Error("Invalid email or password");
                }
            }
        }),
    ],
    pages: {
        signIn: "/auth/login",
    },
    session: {
        maxAge: 30 * 24 * 60 * 60,
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const decodedToken = jwt.decode((user as ExtendedUser).accessToken) as DecodedToken;
                token.accessToken = (user as ExtendedUser).accessToken;
                token.accessTokenExpires = decodedToken.exp * 1000;
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            }

            if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            return {
                ...token,
                error: "AccessTokenExpired",
            };
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: { session: any, token: any }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            session.error = token.error;

            return session;
        },
    },
});

export { handler as GET, handler as POST };
