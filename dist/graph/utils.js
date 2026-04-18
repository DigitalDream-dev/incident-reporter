export function lastMessageText(messages) {
    const last = messages[messages.length - 1];
    if (!last) {
        return "";
    }
    const c = last.content;
    if (typeof c === "string") {
        return c;
    }
    return JSON.stringify(c);
}
