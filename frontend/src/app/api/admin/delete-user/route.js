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
        const { userId } = body;

        if (!userId) {
            return Response.json(
                { error: 'User ID is required.' },
                { status: 400 }
            );
        }

        await users.delete(userId);

        return Response.json({
            success: true,
            message: 'User deleted from authentication.'
        });

    } catch (error) {
        console.error('Delete user API error:', error);

        return Response.json(
            { error: error?.message || 'Failed to delete user from authentication.' },
            { status: error?.code || 500 }
        );
    }
}
