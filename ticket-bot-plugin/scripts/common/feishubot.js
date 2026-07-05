async function sendFeiShuMsg(webhookUrl, msg) {
    if (!webhookUrl) {
        console.log("WEBHOOK_URL is not set");
        return;
    }

    const payload = {
        msg_type: 'text',
        content: {
            text: msg,
        },
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(res => res.json())
        .then(json => console.log('Result:', json))
        .catch(err => console.error('Error:', err));
}
