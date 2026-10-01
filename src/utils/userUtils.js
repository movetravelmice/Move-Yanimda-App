/**
 * Utility functions for user and child profile validation and email suppression
 */

export const isChildEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const lower = email.trim().toLowerCase();
    if (lower.startsWith('child_')) return true;
    if (lower.endsWith('.local') || lower.includes('@move.local')) return true;
    return false;
};

export const isUserChild = (u, allUsers = []) => {
    if (!u) return false;
    const userList = Array.isArray(allUsers) ? allUsers : [];
    const fullUser = (userList.length > 0 ? userList.find(usr => usr.id === u.id || (u.email && usr.email === u.email)) : null) || u;
    if (!fullUser) return false;

    // An adult is someone who is a parent to ANYONE
    if (userList.length > 0) {
        const isParent = userList.some(other => {
            if (!other.linkedTo) return false;
            if (Array.isArray(other.linkedTo)) return other.linkedTo.includes(fullUser.id) || other.linkedTo.includes(String(fullUser.id));
            if (typeof other.linkedTo === 'string') return other.linkedTo === String(fullUser.id);
            return false;
        });
        if (isParent) return false;
    }

    // Explicit child profile flag
    if (fullUser.isChildProfile === true) return true;

    // Child email identifier or internal .local placeholder
    if (fullUser.email && isChildEmail(fullUser.email)) {
        return true;
    }

    // Linked to a parent (and not a parent themselves)
    const lt = fullUser.linkedTo;
    if (Array.isArray(lt) && lt.length > 0) return true;
    if (typeof lt === 'string') {
        const val = lt.trim().toLowerCase();
        return val !== '' && val !== 'null' && val !== 'undefined' && val !== '[]' && val !== '-';
    }

    return false;
};

export const canUserReceiveEmail = (u, allUsers = []) => {
    if (!u) return false;
    const email = typeof u === 'string' ? u : u.email;
    if (!email || typeof email !== 'string' || !email.includes('@')) return false;
    if (isChildEmail(email)) return false;
    if (typeof u === 'object' && isUserChild(u, allUsers)) return false;
    return true;
};
