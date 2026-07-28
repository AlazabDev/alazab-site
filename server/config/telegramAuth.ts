//import crypto from "node:crypto";

const BOT_TOKEN = "8739673390:AAEOiEXAyCPn365l6lq2mNe0Eukavpqzlog";
const MAX_AGE = 300; // 5 minutes

/**
 * The raw Telegram login payload received from the client.
 *
 * All values are strings or undefined. The `hash` field is required
 * to validate the data using HMAC-SHA256 with the bot token.
 */
export interface TelegramAuthData {
    /**
     * Unique user identifier (Telegram ID)
     */
    id: string;

    /**
     * User’s first name
     */
    first_name?: string;

    /**
     * User’s last name
     */
    last_name?: string;

    /**
     * Telegram username
     */
    username?: string;

    /**
     * Optional URL to the user’s Telegram profile picture
     */
    photo_url?: string;

    /**
     * UNIX timestamp in seconds when the auth data was generated
     */
    auth_date: string;

    /**
     * HMAC-SHA256 hash for verifying data integrity
     */
    hash: string;

    /**
     * Any additional properties included in the request
     */
    [key: string]: string | undefined;
}

/**
 * Verified and normalized Telegram user identity after integrity checks.
 */
export interface TelegramVerifiedData {
    /**
     * Unique Telegram user ID
     */
    id: string;

    /**
     * User’s first name
     */
    firstName?: string;

    /**
     * User’s last name
     */
    lastName?: string;

    /**
     * Telegram username
     */
    username?: string;

    /**
     * Profile picture URL
     */
    photoUrl?: string;

    /**
     * Parsed auth date as a JavaScript `Date` object
     */
    authDate: Date;

    /**
     * Original payload (with guaranteed non-undefined string values)
     */
    raw: Record<string, string>;
}

/**
 * Verifies Telegram login data using Telegram’s secure login protocol.
 * Performs HMAC-based hash verification and auth_date freshness check.
 */
function verify(input: Record<string, string>): TelegramVerifiedData {
    const { hash: checkHash, ...data } = input as TelegramAuthData;

    if (!checkHash) {
        throw new Error("Missing hash in Telegram login data");
    }

    /**
     * The `TelegramAuthData`'s hash should match against the sorted `key=val` list of its entries.
     * {@link https://core.telegram.org/widgets/login#checking-authorization}
     */
    const sorted = Object.entries(data)
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join("\n");

    /**
     * Port of sample PHP provided by Telegram organization to Javascript:
     * {@link https://gist.github.com/anonymous/6516521b1fb3b464534fbc30ea3573c2}
     */
    const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
    const computedHash = crypto.createHmac("sha256", secretKey).update(sorted).digest("hex");

    if (computedHash !== checkHash) {
        throw new Error("Telegram data integrity check failed (hash mismatch)");
    }

    const authDate = parseInt(data.auth_date || "", 10);

    if (!authDate || Date.now() / 1000 - authDate > MAX_AGE) {
        throw new Error("Telegram login data is outdated");
    }

    const raw = Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === "string")) as Record<string, string>;

    return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        username: data.username,
        photoUrl: data.photo_url,
        authDate: new Date(authDate * 1000),
        raw,
    };
}

// ===========================================

// Simple callback for Express.js can be used with other frameworks too.

/**
 * Verifies Telegram login payload sent via client-side POST
 */
export function handleCallback(req: Request, res: Response) {
    try {
        // import `verify()`
        const user = verify(req.body as Record<string, string>);

        res.json({ message: "Verified successfully", user });
    } catch (error) {
        res.status(400).json({
            message: "Telegram login failed",
            error: error instanceof Error ? error.message : error,
        });
    }
}