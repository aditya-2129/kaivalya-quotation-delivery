import { Client, Users } from 'node-appwrite';

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
        const { userId, password } = body;

        if (!userId || !password) {
            return Response.json(
                { error: 'User ID and new password are required.' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return Response.json(
                { error: 'Password must be at least 8 characters.' },
                { status: 400 }
            );
        }

        await users.updatePassword(userId, password);

        return Response.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Reset password API error:', error);
        return Response.json(
            { error: error?.message || 'Failed to reset password.' },
            { status: error?.code || 500 }
        );
    }
}
