import { Client, Users, Account, Databases, Query } from 'node-appwrite';

const adminClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(adminClient);
const adminDb = new Databases(adminClient);

async function validateAdminSession(request) {
    try {
        const jwt = request.headers.get('X-Appwrite-JWT');
        if (!jwt) return false;

        const jwtClient = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
            .setJWT(jwt);

        const account = new Account(jwtClient);
        const currentUser = await account.get();

        const profiles = await adminDb.listDocuments(
            'machine-shop-database',
            'users',
            [Query.equal('auth_id', currentUser.$id), Query.limit(1)]
        );

        return profiles.documents[0]?.role === 'admin';
    } catch {
        return false;
    }
}

export async function POST(request) {
    try {
        if (!process.env.APPWRITE_API_KEY) {
            return Response.json(
                { error: 'Server configuration error: APPWRITE_API_KEY is not set.' },
                { status: 500 }
            );
        }

        const isAdmin = await validateAdminSession(request);
        if (!isAdmin) {
            return Response.json({ error: 'Unauthorized.' }, { status: 401 });
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
