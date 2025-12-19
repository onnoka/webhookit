// Settings page logic
let currentUsername = 'default';
let hasImported = false;

// Load existing credentials and stats on page load
document.addEventListener('DOMContentLoaded', async () => {
    currentUsername = document.getElementById('username').value;
    await loadCredentials();
    await loadStats();
});

// Load existing credentials
async function loadCredentials() {
    try {
        const response = await PINAuth.protectedFetch(`/api/user/credentials?username=${currentUsername}`);
        const data = await response.json();

        if (data.success && data.credentials) {
            const creds = data.credentials;

            // Show Discogs status if credentials exist
            if (creds.hasDiscogs) {
                document.getElementById('discogsUsername').value = creds.discogsUsername || '';
                document.getElementById('discogsToken').value = '••••••••••••';
                document.getElementById('discogsStatus').style.display = 'flex';
                document.getElementById('importSection').style.display = 'block';

                hasImported = creds.hasImported || false;
                updateImportButton();
            }

            // Show Spotify status if credentials exist
            if (creds.hasSpotify) {
                document.getElementById('spotifyClientId').value = '••••••••••••';
                document.getElementById('spotifyClientSecret').value = '••••••••••••';
                document.getElementById('spotifyStatus').style.display = 'flex';
            }

            // Update last sync display
            if (creds.lastSync) {
                const date = new Date(creds.lastSync);
                document.getElementById('statLastSync').textContent = date.toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short'
                });
            }
        }
    } catch (error) {
        if (error.message !== 'Authentication cancelled') {
            console.error('Error loading credentials:', error);
        }
    }
}

// Load collection statistics
async function loadStats() {
    try {
        const response = await fetch('/api/vinyls/all');
        const data = await response.json();

        if (data.success && data.vinyls) {
            const vinyls = data.vinyls;
            const albums = vinyls.filter(v => (v.type || 'album') === 'album').length;
            const singles = vinyls.filter(v => v.type === 'single').length;

            document.getElementById('statTotal').textContent = vinyls.length;
            document.getElementById('statAlbums').textContent = albums;
            document.getElementById('statSingles').textContent = singles;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update import button text based on import status
function updateImportButton() {
    const importBtn = document.getElementById('importBtn');
    if (hasImported) {
        importBtn.textContent = 'Update Collection from Discogs';
    } else {
        importBtn.textContent = 'Import Collection from Discogs';
    }
}

// Save Discogs credentials
document.getElementById('saveDiscogsBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const discogsUsername = document.getElementById('discogsUsername').value;
    const discogsToken = document.getElementById('discogsToken').value;

    if (!discogsUsername || !discogsToken) {
        alert('Please enter both username and token');
        return;
    }

    // Skip if token is masked (already saved)
    if (discogsToken === '••••••••••••') {
        alert('Discogs credentials already saved');
        return;
    }

    try {
        const response = await PINAuth.protectedFetch('/api/user/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                discogs: {
                    username: discogsUsername,
                    token: discogsToken
                }
            })
        });

        const data = await response.json();
        if (data.success) {
            // Mask the token
            document.getElementById('discogsToken').value = '••••••••••••';

            // Show status
            document.getElementById('discogsStatus').style.display = 'flex';
            document.getElementById('importSection').style.display = 'block';

            alert('✓ Discogs credentials saved securely');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        if (error.message !== 'Authentication cancelled') {
            alert('Error saving credentials: ' + error.message);
        }
    }
});

// Save Spotify credentials
document.getElementById('saveSpotifyBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const clientId = document.getElementById('spotifyClientId').value;
    const clientSecret = document.getElementById('spotifyClientSecret').value;

    if (!clientId || !clientSecret) {
        alert('Please enter both Client ID and Secret');
        return;
    }

    // Skip if credentials are masked
    if (clientId === '••••••••••••') {
        alert('Spotify credentials already saved');
        return;
    }

    try {
        const response = await PINAuth.protectedFetch('/api/user/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                spotify: {
                    clientId,
                    clientSecret
                }
            })
        });

        const data = await response.json();
        if (data.success) {
            // Mask the credentials
            document.getElementById('spotifyClientId').value = '••••••••••••';
            document.getElementById('spotifyClientSecret').value = '••••••••••••';

            // Show status
            document.getElementById('spotifyStatus').style.display = 'flex';

            alert('✓ Spotify credentials saved securely');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        if (error.message !== 'Authentication cancelled') {
            alert('Error saving credentials: ' + error.message);
        }
    }
});

// Import/Update collection from Discogs
document.getElementById('importBtn').addEventListener('click', async () => {
    const btn = document.getElementById('importBtn');
    const progress = document.getElementById('importProgress');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');

    // Confirm action
    const action = hasImported ? 'update' : 'import';
    if (!confirm(`This will ${action} your vinyl collection from Discogs. Continue?`)) {
        return;
    }

    // Disable button and show progress
    btn.disabled = true;
    progress.style.display = 'block';
    progressText.textContent = 'Starting import...';
    progressFill.style.width = '0%';

    try {
        const response = await fetch('/api/import/discogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUsername })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));

                    if (data.progress) {
                        const percent = (data.progress.current / data.progress.total * 100).toFixed(0);
                        progressFill.style.width = percent + '%';
                        progressText.textContent = `Importing ${data.progress.current}/${data.progress.total} vinyls (${data.progress.duplicates} duplicates skipped)`;
                    }

                    if (data.complete) {
                        progressFill.style.width = '100%';
                        progressText.textContent = `✓ Import complete! ${data.summary.added} new vinyls added, ${data.summary.duplicates} duplicates skipped`;

                        hasImported = true;
                        updateImportButton();

                        // Reload stats
                        await loadStats();
                        await loadCredentials();

                        setTimeout(() => {
                            progress.style.display = 'none';
                            btn.disabled = false;
                        }, 3000);

                        return;
                    }

                    if (data.error) {
                        throw new Error(data.error);
                    }
                }
            }
        }
    } catch (error) {
        progressText.textContent = '✗ Error: ' + error.message;
        progressFill.style.width = '0%';
        btn.disabled = false;
        alert('Import failed: ' + error.message);
    }
});
