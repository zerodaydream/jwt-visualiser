import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface JwtState {
  rawToken: string;
  isValidStructure: boolean;
  validationError: string | null; // <--- NEW FIELD
  
  // Actions
  setToken: (token: string) => void;
  reset: () => void;
}

export const useJwtStore = create<JwtState>()(
  persist(
    (set) => ({
      rawToken: '',
      isValidStructure: false,
      validationError: null,

      setToken: (token) => {
        // 1. Basic Empty Check
        if (!token) {
            set({ rawToken: '', isValidStructure: false, validationError: null });
            return;
        }

        const parts = token.split('.');
        
        // 2. Structure Check (Must have 3 parts)
        if (parts.length !== 3) {
            set({ 
                rawToken: token, 
                isValidStructure: false, 
                validationError: `Invalid Structure: JWT must have 3 parts (Header.Payload.Signature). Found ${parts.length}.`
            });
            return;
        }

        // 3. Base64URL Encoding Check (Header & Payload)
        const isValidBase64Url = (str: string): boolean => {
            try {
                // Convert Base64URL to Base64
                let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                // Add padding if necessary
                while (base64.length % 4 !== 0) {
                    base64 += '=';
                }
                // Try to decode
                const decoded = atob(base64);
                // Try to parse as JSON for header and payload
                JSON.parse(decoded);
                return true;
            } catch (e) {
                return false;
            }
        };

        // Check if header and payload are valid
        if (!isValidBase64Url(parts[0]) || !isValidBase64Url(parts[1])) {
            set({ 
                rawToken: token, 
                isValidStructure: false, 
                validationError: "Invalid Encoding: Header or Payload is not valid Base64URL or not valid JSON."
            });
            return;
        }

        // 4. Check if signature part exists and is not empty
        if (!parts[2] || parts[2].length === 0) {
            set({ 
                rawToken: token, 
                isValidStructure: false, 
                validationError: "Invalid Signature: Signature part is missing or empty."
            });
            return;
        }

        // 5. Valid
        set({ 
            rawToken: token, 
            isValidStructure: true, 
            validationError: null 
        });
      },

      reset: () => set({ rawToken: '', isValidStructure: false, validationError: null }),
    }),
    {
      name: 'jwt-visualiser-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);