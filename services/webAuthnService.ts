
/**
 * Mock WebAuthn Service
 * In a real application, this would interact with the navigator.credentials API
 * and a backend to verify challenges.
 */

export async function isWebAuthnAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!(window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()));
}

export async function registerBiometric(): Promise<boolean> {
    console.log("MOCK: Registering biometric credential...");
    // Simulate OS dialog delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real flow: navigator.credentials.create({ publicKey: ... })
    localStorage.setItem('biometric_registered', 'true');
    return true;
}

export async function verifyBiometric(challenge: string): Promise<boolean> {
    console.log("MOCK: Verifying biometric for challenge:", challenge);
    
    const isRegistered = localStorage.getItem('biometric_registered');
    if (!isRegistered) {
        throw new Error("Biometrics not set up on this device.");
    }

    // Simulate OS dialog & processing
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In real flow: navigator.credentials.get({ publicKey: ... })
    // Random failure to simulate "Face Not Recognized" occasionally? No, let's keep it robust for demo.
    return true;
}
