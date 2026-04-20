import { Client, Users, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

export async function POST(request) {
    try {
        if (!process.env.APPWRITE_API_KEY) {
            return Response.json(
                { error: 'Server configuration error: APPWRITE_API_KEY is not set.' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return Response.json(
                { error: 'Email, password, and name are required.' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return Response.json(
                { error: 'Password must be at least 8 characters.' },
                { status: 400 }
            );
        }

        const authUser = await users.create(
            ID.unique(),
            email,
            undefined, // phone
            password,
            name
        );

        return Response.json({
            success: true,
            userId: authUser.$id
        });

    } catch (error) {
        console.error('Create user API error:', error);

        if (error?.code === 409 || error?.message?.includes('already exists')) {
            return Response.json(
                { error: 'A user with this email already exists.' },
                { status: 409 }
            );
        }

        return Response.json(
            { error: error?.message || 'Failed to create user.' },
            { status: error?.code || 500 }
        );
    }
}
