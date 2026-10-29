export function toSearchTokens (text: string): string[] {
    const normalized = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

    return normalized
        .split(/[^a-z0-9]+/)
        .filter(token => token.length > 0)
        .map(token => singularize(token));
}

function singularize (token: string): string {
    if (token.length <= 3) {
        return token;
    }

    if (token.endsWith('ies')) {
        return `${token.slice(0, -3)}y`;
    }

    if (token.endsWith('sses')) {
        return token.slice(0, -2);
    }

    if (token.endsWith('ss') || token.endsWith('us') || token.endsWith('is')) {
        return token;
    }

    if (token.endsWith('s')) {
        return token.slice(0, -1);
    }

    return token;
}
