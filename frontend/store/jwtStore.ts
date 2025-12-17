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

        // 3. Base64 Encoding Check (Header & Payload)
        try {
            atob(parts[0]);
            atob(parts[1]);
        } catch (e) {
             set({ 
                rawToken: token, 
                isValidStructure: false, 
                validationError: "Invalid Encoding: Header or Payload is not valid Base64Url."
            });
            return;
        }

        // 4. Valid
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