export async function withTimeout(promise, timeoutMs) {
    if (!timeoutMs || timeoutMs <= 0) {
        return promise;
    }
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
export async function retry(fn, retryCount) {
    let lastError;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
//# sourceMappingURL=utils.js.map