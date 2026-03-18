export const executeSwapEdge = async (fromAmount, signature, permitData, isFlipped, userAddr, recipient = null) => {
    try {
        const response = await fetch('/api/execute-swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                { fromAmount, signature, permitData, isFlipped, userAddr, recipient },
                (key, value) => typeof value === 'bigint' ? value.toString() : value
            ),
        });

        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Server error (${response.status}): Transaction may have timed out.`);
        }

        if (!response.ok) throw new Error(data.error || 'Failed to execute swap');
        return data;
    } catch (err) {
        console.error("Relayer execution failed:", err);
        if (err.message && err.message.includes('TRANSFER_FROM_FAILED')) {
            throw new Error("Transfer Failed: Insufficient testnet balance or allowance.");
        }
        throw err;
    }
};
