const { Client, Databases, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Constants
const DATABASE_ID = "machine-shop-database";
const COLLECTIONS = {
    QUOTATIONS: "quotation_history",
    PURCHASE_ORDERS: "purchase_orders"
};

// Colors for logging
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

async function runSetup() {
    console.log(`${YELLOW}Starting Appwrite Schema Sync...${RESET}`);

    // Load .env manually
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });

    const client = new Client()
        .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        // 1. Setup Purchase Orders Collection
        console.log(`\n${YELLOW}Setting up '${COLLECTIONS.PURCHASE_ORDERS}' collection...${RESET}`);
        let poCollection;
        try {
            poCollection = await databases.getCollection(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS);
            console.log(`${GREEN}✓ Collection already exists.${RESET}`);
        } catch (error) {
            console.log(`${YELLOW}Creating collection...${RESET}`);
            poCollection = await databases.createCollection(
                DATABASE_ID, 
                COLLECTIONS.PURCHASE_ORDERS, 
                "Purchase Orders",
                ['read("any")', 'create("any")', 'update("any")'] // Broad permissions for dev
            );
            console.log(`${GREEN}✓ Collection created.${RESET}`);
        }

        const attributes = [
            { key: "po_number", type: "string", size: 255, required: true },
            { key: "po_date", type: "string", size: 255, required: true },
            { key: "quotation_id", type: "string", size: 255, required: true },
            { key: "quotation_no", type: "string", size: 255, required: true },
            { key: "customer_name", type: "string", size: 255, required: true },
            { key: "project_name", type: "string", size: 255, required: true },
            { key: "total_amount", type: "double", required: true },
            { key: "status", type: "enum", elements: ["Received", "In Production", "Shipped", "Completed", "Cancelled"], required: true, default: "Received" },
            { key: "po_scan_file_id", type: "string", size: 255, required: false },
            { key: "engineer_name", type: "string", size: 255, required: true },
            { key: "items_snapshot", type: "string", size: 100000, required: false }
        ];

        // Get existing attributes to avoid duplicates
        const existingAttrs = (await databases.listAttributes(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS)).attributes;
        const existingKeys = existingAttrs.map(a => a.key);

        for (const attr of attributes) {
            if (existingKeys.includes(attr.key)) {
                console.log(`${GREEN}✓ Attribute '${attr.key}' already exists.${RESET}`);
                continue;
            }

            console.log(`${YELLOW}Adding attribute '${attr.key}'...${RESET}`);
            if (attr.type === "string") {
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, attr.key, attr.size, attr.required);
            } else if (attr.type === "double") {
                await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, attr.key, attr.required);
            } else if (attr.type === "enum") {
                await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, attr.key, attr.elements, attr.required, attr.default);
            }
            console.log(`${GREEN}✓ Attribute '${attr.key}' added.${RESET}`);
            // Small delay to allow Appwrite to process
            await new Promise(r => setTimeout(r, 1000));
        }

        // 2. Update Quotation Status Enum
        console.log(`\n${YELLOW}Updating '${COLLECTIONS.QUOTATIONS}' status enum...${RESET}`);
        try {
            const quotationStatusAttr = await databases.getAttribute(DATABASE_ID, COLLECTIONS.QUOTATIONS, "status");
            const currentElements = quotationStatusAttr.elements || [];
            if (!currentElements.includes("Converted to PO")) {
                console.log(`${YELLOW}Status enum needs update. Current: ${currentElements.join(', ')}${RESET}`);
                
                // IMPORTANT: Appwrite doesn't allow direct update of enum elements easily via API without deleting/recreating if using older versions,
                // but we can try to create a new one or just log it.
                // In modern Appwrite, we have to delete and recreate the attribute if it's an enum.
                // HOWEVER, deleting a status attribute with existing data is risky!
                // Safer approach: Log a warning if it's missing and suggest manual update if needed, 
                // but I'll try to add it if I can.
                console.log(`${RED}Please manually add 'Converted to PO' to the 'status' enum in '${COLLECTIONS.QUOTATIONS}' collection to avoid data loss.${RESET}`);
            } else {
                console.log(`${GREEN}✓ 'Converted to PO' already exists in status enum.${RESET}`);
            }
        } catch (error) {
            console.error(`${RED}Error checking quotation status attribute: ${error.message}${RESET}`);
        }

        console.log(`\n${GREEN}Setup complete! You can now test the Purchase Order workflow.${RESET}`);

    } catch (error) {
        console.error(`\n${RED}Fatal Error during setup:${RESET}`, error.message);
        process.exit(1);
    }
}

runSetup();
