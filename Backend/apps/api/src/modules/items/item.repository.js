
export const normalizeUrl = (url) => {
    try {
        const parsed = new URL(url);

        // remove tracking params
        parsed.searchParams.forEach((_, key) => {
            if (key.startsWith("utm_")) {
                parsed.searchParams.delete(key);
            }
        });

        // remove hash
        parsed.hash = "";

        // remove trailing slash
        let normalized = parsed.toString();
        if (normalized.endsWith("/")) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;

    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
};


export const extractDomain = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace("www.", "");
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
};