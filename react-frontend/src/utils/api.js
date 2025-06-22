const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const api = {
    async fetch(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    },

    // Save a drawing
    async saveDrawing(name, data) {
        return this.fetch('/api/drawings', {
            method: 'POST',
            body: JSON.stringify({ name, data }),
        });
    },

    // Get all drawings
    async getDrawings() {
        return this.fetch('/api/drawings');
    },

    // Get a specific drawing by ID
    async getDrawing(id) {
        return this.fetch(`/api/drawings/${id}`);
    },
}; 