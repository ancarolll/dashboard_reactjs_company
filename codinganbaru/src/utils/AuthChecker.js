// Helper functions for checking authentication and authorization

/**
 * Checks if user is authenticated (logged in)
 * @returns {boolean} true if user is authenticated
 */
export const isAuthenticated = () => {
    const storedUser = localStorage.getItem('currentUser');
    return !!storedUser;
    };
    
    /**
     * Checks if user has access to specific page
     * @param {string} path - The path to check access for
     * @returns {boolean} true if user has access
     */
    export const hasAccess = (path) => {
        if (!isAuthenticated()) return false;
        
        try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && user.role === 'Master Admin') {
            return true;
        }
        return user && user.accessPages && user.accessPages.includes(path);
        } catch (error) {
        console.error('Error checking access:', error);
        return false;
        }
    };
    
    /**
     * Get current user data
     * @returns {Object|null} user data or null if not authenticated
     */
    export const getCurrentUser = () => {
        if (!isAuthenticated()) return null;
        
        try {
        return JSON.parse(localStorage.getItem('currentUser'));
        } catch (error) {
        console.error('Error getting current user:', error);
        return null;
        }
    };
    
    /**
     * Login user with credentials
     * @param {string} username - username
     * @param {string} password - password
     * @returns {Promise} resolves with user data or rejects with error
     */
    export const loginUser = (username, password) => {
        return new Promise((resolve, reject) => {
        try {
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
            // Store current user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            resolve(user);
            } else {
            reject(new Error('Username atau password salah'));
            }
        } catch (error) {
            reject(new Error('Terjadi kesalahan saat login'));
        }
        });
    };
    
    /**
     * Logout current user
     */
    export const logoutUser = () => {
        localStorage.removeItem('currentUser');
    };
    
    /**
     * Check if user has access to a specific page and return appropriate message
     * @param {string} path - The path to check access for
     * @returns {string|null} error message or null if has access
     */
    export const getAccessErrorMessage = (path) => {
        if (!isAuthenticated()) {
        return 'Silakan login terlebih dahulu untuk mengakses halaman ini';
        }
        
        if (!hasAccess(path)) {
        return 'Anda tidak memiliki akses ke halaman ini';
        }
        
        return null;
    };