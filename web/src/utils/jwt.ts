// src/utils/jwt.ts
interface JwtPayload {
    sub: string; // user ID
    iat: number; // issued at
    exp: number; // expiration
    organizationId: string;
    email: string;
    name: string;
  }
  
  export function decodeJwt(token: string): JwtPayload {
    try {
      // Simple JWT decoding (base64)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Invalid token');
    }
  }
  
  export function isTokenExpired(token: string): boolean {
    try {
      const { exp } = decodeJwt(token);
      // Check if expiration timestamp is in the past
      return exp * 1000 < Date.now();
    } catch (error) {
      // If token is invalid, consider it expired
      return true;
    }
  }