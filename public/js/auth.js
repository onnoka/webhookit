// PIN Authentication Module
const PINAuth = {
  storageKey: 'vinyl_auth_pin',

  // Check if user is authenticated
  isAuthenticated() {
    const pin = localStorage.getItem(this.storageKey);
    return pin === '2026';
  },

  // Store PIN in localStorage
  authenticate(pin) {
    if (pin === '2026') {
      localStorage.setItem(this.storageKey, pin);
      return true;
    }
    return false;
  },

  // Remove PIN from localStorage
  logout() {
    localStorage.removeItem(this.storageKey);
  },

  // Get PIN for API calls
  getPin() {
    return localStorage.getItem(this.storageKey);
  },

  // Show PIN modal
  showModal(onSuccess, onCancel) {
    // Create modal HTML
    const modalHTML = `
      <div class="pin-modal-overlay" id="pinModalOverlay">
        <div class="pin-modal">
          <h2>Enter PIN</h2>
          <p>This action requires authentication</p>
          <div class="pin-input-container">
            <input
              type="password"
              id="pinInput"
              class="pin-input"
              placeholder="Enter PIN"
              maxlength="4"
              inputmode="numeric"
              autocomplete="off"
            >
            <div class="pin-error" id="pinError">Incorrect PIN. Please try again.</div>
          </div>
          <div class="pin-buttons">
            <button class="pin-btn pin-btn-secondary" id="pinCancelBtn">Cancel</button>
            <button class="pin-btn pin-btn-primary" id="pinSubmitBtn">Submit</button>
          </div>
        </div>
      </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('pinModalOverlay');
    const input = document.getElementById('pinInput');
    const submitBtn = document.getElementById('pinSubmitBtn');
    const cancelBtn = document.getElementById('pinCancelBtn');
    const error = document.getElementById('pinError');

    // Focus input
    setTimeout(() => input.focus(), 100);

    // Submit handler
    const handleSubmit = () => {
      const pin = input.value.trim();

      if (this.authenticate(pin)) {
        overlay.remove();
        if (onSuccess) onSuccess();
      } else {
        error.classList.add('visible');
        input.value = '';
        input.focus();

        // Shake animation
        input.style.animation = 'shake 0.5s';
        setTimeout(() => {
          input.style.animation = '';
        }, 500);
      }
    };

    // Cancel handler
    const handleCancel = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    // Event listeners
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    });

    // Click overlay to cancel
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        handleCancel();
      }
    });
  },

  // Wrapper for protected API calls
  async protectedFetch(url, options = {}) {
    // Check if authenticated
    if (!this.isAuthenticated()) {
      // Show PIN modal and wait for authentication
      return new Promise((resolve, reject) => {
        this.showModal(
          async () => {
            // Authenticated, proceed with request
            try {
              const result = await this._makeRequest(url, options);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          () => {
            // Cancelled
            reject(new Error('Authentication cancelled'));
          }
        );
      });
    } else {
      // Already authenticated, proceed
      return this._makeRequest(url, options);
    }
  },

  // Internal method to make request with PIN header
  async _makeRequest(url, options) {
    const pin = this.getPin();

    // Add PIN to headers
    const headers = {
      ...options.headers,
      'X-Auth-PIN': pin
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Check if PIN was rejected (session expired or invalid)
    if (response.status === 401) {
      const data = await response.json();
      if (data.requiresAuth) {
        // Clear stored PIN and retry
        this.logout();
        return this.protectedFetch(url, options);
      }
    }

    return response;
  }
};

// Add shake animation to CSS if not already present
if (!document.getElementById('pin-shake-animation')) {
  const style = document.createElement('style');
  style.id = 'pin-shake-animation';
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other scripts
window.PINAuth = PINAuth;
