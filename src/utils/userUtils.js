/**
 * Utility functions for user and child profile validation and email suppression
 */

export const isChildEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const lower = email.trim().toLowerCase();
    // Only emails explicitly starting with child_ or cocuk_ are child accounts.
    // Generic placeholder emails (@move.local) for corporate adults without email are NOT children.
    if (lower.startsWith('child_') || lower.startsWith('cocuk_') || lower.includes('@child.') || lower.includes('.child@')) return true;
    return false;
};

export const isUserChild = (u, allUsers = []) => {
    if (!u) return false;
    const userList = Array.isArray(allUsers) ? allUsers : [];
    const fullUser = (userList.length > 0 ? userList.find(usr => usr.id === u.id || (u.email && usr.email === u.email)) : null) || u;
    if (!fullUser) return false;

    // Explicit child profile flag
    if (fullUser.isChildProfile === true) return true;
    if (fullUser.isChild === true) return true;
    if (fullUser.type === 'child' || fullUser.userType === 'child') return true;

    // Explicit child email identifier (child_...)
    if (fullUser.email && isChildEmail(fullUser.email)) {
        return true;
    }

    return false;
};

/**
 * Normalized string comparison helper for Turkish text
 */
export const normalizeTurkish = (str) => {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .replace(/i̇/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();
};

/**
 * Robust, multi-layered participant matching scoring algorithm.
 * Prevents phone-sharing or phone typos from showing someone else's ticket.
 */
export const getParticipantMatchScore = (p, user) => {
    if (!p || !user) return 0;

    // 1. Direct ID match (highest certainty)
    if (p.id && user.id && p.id === user.id) {
        return 1000;
    }

    // 2. TC Kimlik match (unique personal ID in Turkey)
    const pTc = String(p.tcNo || p.tc || '').replace(/\D/g, '');
    const uTc = String(user.tcNo || user.tc || '').replace(/\D/g, '');
    if (pTc.length === 11 && uTc.length === 11) {
        if (pTc === uTc) return 950;
        // Different TC numbers mean strictly different individuals
        return -1000;
    }

    let score = 0;

    // 3. Real Email match (excluding system placeholder emails like @move.local)
    const pEmail = (p.email || '').trim().toLowerCase();
    const uEmail = (user.email || '').trim().toLowerCase();
    const isPlaceholder = (em) => !em || em.endsWith('@move.local') || em.endsWith('.local');
    if (pEmail && uEmail && !isPlaceholder(pEmail) && !isPlaceholder(uEmail)) {
        if (pEmail === uEmail) {
            score += 800;
        } else {
            score -= 300;
        }
    }

    // 4. Name comparison
    const pName = normalizeTurkish(p.name);
    const uName = normalizeTurkish(user.name);
    let nameClashes = false;

    if (pName && uName) {
        if (pName === uName) {
            score += 500;
        } else {
            const pParts = pName.split(/\s+/).filter(Boolean);
            const uParts = uName.split(/\s+/).filter(Boolean);
            const pSurname = pParts[pParts.length - 1];
            const uSurname = uParts[uParts.length - 1];

            // If surnames are DIFFERENT (e.g. "Ceyhan" vs "Özdoğan"), severe penalty to prevent cross-account leak
            if (pSurname && uSurname && pSurname !== uSurname) {
                score -= 600;
                nameClashes = true;
            } else if (pParts[0] === uParts[0]) {
                score += 350;
            }
        }
    }

    // 5. Phone comparison
    const pPhone = (p.phone || '').replace(/\D/g, '');
    const uPhone = (user.phone || '').replace(/\D/g, '');
    if (pPhone.length >= 7 && uPhone.length >= 7 && (pPhone.endsWith(uPhone.slice(-10)) || uPhone.endsWith(pPhone.slice(-10)))) {
        // If surnames clash (different people sharing phone or phone typo), DO NOT match!
        if (nameClashes) {
            score -= 200;
        } else {
            score += 300;
        }
    }

    return score;
};

export const isUserMatch = (p, user) => {
    return getParticipantMatchScore(p, user) >= 250;
};

export const findMatchingParticipant = (participants = [], user) => {
    if (!Array.isArray(participants) || participants.length === 0 || !user) return null;
    let best = null;
    let maxScore = 0;

    for (const p of participants) {
        const score = getParticipantMatchScore(p, user);
        if (score >= 250 && score > maxScore) {
            maxScore = score;
            best = p;
        }
    }

    return best;
};

export const canUserReceiveEmail = (u, allUsers = []) => {
    if (!u) return false;
    const email = typeof u === 'string' ? u : u.email;
    if (!email || typeof email !== 'string' || !email.includes('@')) return false;
    if (isChildEmail(email)) return false;
    if (typeof u === 'object' && isUserChild(u, allUsers)) return false;
    return true;
};

/**
 * Normalizes any phone number into Turkish standard international format: +90 5XX XXX XX XX
 * If already another international format (+1, +44, etc.), preserves it with +
 * If null, undefined, '-' or invalid, returns '-'
 */
export const normalizePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') return '-';
    const trimmed = phone.trim();
    if (!trimmed || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') return '-';

    // If starts with + but not +90 (e.g. international number from Germany, USA, etc.)
    if (trimmed.startsWith('+') && !trimmed.startsWith('+90')) {
        return trimmed;
    }

    // Extract digits
    const digits = trimmed.replace(/\D/g, '');
    if (!digits || digits.length < 7) return trimmed.startsWith('+') ? trimmed : (digits ? `+90 ${digits}` : '-');

    let core = digits;
    if (core.startsWith('0090')) {
        core = core.slice(4);
    } else if (core.startsWith('90')) {
        core = core.slice(2);
    } else if (core.startsWith('0')) {
        core = core.slice(1);
    }

    if (core.length >= 10) {
        const c = core.slice(0, 10);
        return `+90 ${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 8)} ${c.slice(8, 10)}`;
    }
    return `+90 ${core}`;
};

/**
 * Formats user input into formatted chunks: 5XX XXX XX XX (without the +90 prefix, for inputs that have fixed +90 prefix)
 */
export const formatPhoneInputWithoutPrefix = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    let clean = digits;
    if (clean.startsWith('0090')) clean = clean.slice(4);
    else if (clean.startsWith('90') && clean.length > 10) clean = clean.slice(2);
    else if (clean.startsWith('0')) clean = clean.slice(1);
    clean = clean.slice(0, 10);

    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    if (clean.length <= 8) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
};

export const POPULAR_EMAIL_DOMAINS = [
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'icloud.com',
    'yandex.com',
    'windowslive.com',
    'live.com',
    'hotmail.com.tr',
    'outlook.com.tr',
    'yahoo.com.tr'
];

const KNOWN_DOMAIN_TYPOS = {
    'hotml.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'hotmaik.com': 'hotmail.com',
    'hotmil.com': 'hotmail.com',
    'hotmsil.com': 'hotmail.com',
    'hotmeil.com': 'hotmail.com',
    'hotamail.com': 'hotmail.com',
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmaik.com': 'gmail.com',
    'gmaul.com': 'gmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'outllok.com': 'outlook.com',
    'outlook.con': 'outlook.com',
    'outlokk.com': 'outlook.com',
    'putlook.com': 'outlook.com',
    'otlook.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    'yhoo.com': 'yahoo.com',
    'iclou.com': 'icloud.com',
    'iclod.com': 'icloud.com',
    'icloud.con': 'icloud.com',
    'yandx.com': 'yandex.com',
    'yandeks.com': 'yandex.com'
};

function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    const d = [];
    for (let i = 0; i <= m; i++) d[i] = [i];
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return d[m][n];
}

/**
 * Checks if an email address likely has a domain typo (e.g. hotml.com -> hotmail.com).
 * Returns null if no typo detected, or an object with suggestion details.
 */
export const checkEmailDomainTypo = (email) => {
    if (!email || typeof email !== 'string') return null;
    const clean = email.trim().toLowerCase();
    if (!clean.includes('@')) return null;
    const parts = clean.split('@');
    if (parts.length !== 2) return null;

    const userPart = parts[0];
    const domainPart = parts[1];

    if (!domainPart || domainPart.length < 3) return null;
    if (domainPart.endsWith('.local')) return null;

    // 1. Direct dictionary lookup for known typos
    if (KNOWN_DOMAIN_TYPOS[domainPart]) {
        const suggestedDomain = KNOWN_DOMAIN_TYPOS[domainPart];
        return {
            isTypo: true,
            originalDomain: domainPart,
            suggestedDomain,
            suggestedEmail: `${userPart}@${suggestedDomain}`
        };
    }

    // 2. Exact match in popular domains -> valid, no typo
    if (POPULAR_EMAIL_DOMAINS.includes(domainPart)) {
        return null;
    }

    // 3. TLD typo check like .con -> .com
    if (domainPart.endsWith('.con') || domainPart.endsWith('.comm') || domainPart.endsWith('.coom') || domainPart.endsWith('.cmo')) {
        const fixedDomain = domainPart.replace(/\.(con|comm|coom|cmo)$/, '.com');
        return {
            isTypo: true,
            originalDomain: domainPart,
            suggestedDomain: fixedDomain,
            suggestedEmail: `${userPart}@${fixedDomain}`
        };
    }

    // 4. Fuzzy distance matching for popular domains
    for (const popDomain of POPULAR_EMAIL_DOMAINS) {
        const dist = levenshteinDistance(domainPart, popDomain);
        if (dist > 0 && dist <= 2 && Math.abs(domainPart.length - popDomain.length) <= 2) {
            return {
                isTypo: true,
                originalDomain: domainPart,
                suggestedDomain: popDomain,
                suggestedEmail: `${userPart}@${popDomain}`
            };
        }
    }

    return null;
};

/**
 * Converts any string to proper Turkish Title Case:
 * First letter of every word is uppercase, remaining letters lowercase.
 * Accurately handles Turkish letters (Ç, Ğ, I, İ, Ö, Ş, Ü) and punctuation.
 * Examples:
 * "GAMA TELEKOM" -> "Gama Telekom"
 * "gama telekom" -> "Gama Telekom"
 * "DÖLEK PAZARLAMA" -> "Dölek Pazarlama"
 * "ŞENGÜLLER" -> "Şengüller"
 * "SAMSUNG" -> "Samsung"
 * "move travel & mice" -> "Move Travel & Mice"
 */
export const toTurkishTitleCase = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
        .split(/(\s+|[-/&()]+)/)
        .map(part => {
            if (!part) return '';
            if (/^[\s\-_/&()]+$/.test(part)) return part;
            const first = part.charAt(0).toLocaleUpperCase('tr-TR');
            const rest = part.slice(1).toLocaleLowerCase('tr-TR');
            return first + rest;
        })
        .join('');
};

export const normalizeTurkishTitleCase = (str) => {
    if (!str && str !== 0) return '';
    return toTurkishTitleCase(str).trim().replace(/\s+/g, ' ');
};

