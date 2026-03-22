const SWAP_ENDPOINT = '/api/execute-swap';

const bigintReplacer = (_, value) =>
    typeof value === 'bigint' ? value.toString() : value;

async function postToRelayer(payload) {
    const res = await fetch(SWAP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload, bigintReplacer),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON relayer response:', text);
        throw new Error(`Server error (${res.status}): Transaction may have timed out.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to execute swap');
    return data;
}

export async function executeSwapEdge(fromAmount, signature, permitData, isFlipped, userAddr, recipient = null) {
    try {
        return await postToRelayer({ fromAmount, signature, permitData, isFlipped, userAddr, recipient });
    } catch (err) {
        console.error('Relayer execution failed:', err);
        if (err.message?.includes('TRANSFER_FROM_FAILED')) {
            throw new Error('Transfer Failed: Insufficient testnet balance or allowance.');
        }
        throw err;
    }
}
