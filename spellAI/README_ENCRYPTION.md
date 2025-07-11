# SpellAI API Key Encryption

## Overview

The SpellAI Chrome extension now includes secure encryption for storing API keys. This implementation uses the Web Crypto API to encrypt API keys before storing them in Chrome's sync storage and decrypt them when needed.

## Security Features

### Encryption Algorithm
- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key Size**: 256-bit
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Hash Function**: SHA-256
- **Salt**: Fixed salt for key derivation (`spellAI_salt_v1`)

### Security Benefits
1. **API keys are never stored in plain text**
2. **Uses industry-standard encryption (AES-GCM)**
3. **Includes authentication to prevent tampering**
4. **Backward compatibility with existing unencrypted keys**

## Implementation Details

### Files Modified

1. **popup.js**
   - Added encryption utilities (`deriveKey`, `encryptText`, `decryptText`)
   - Modified save functionality to encrypt API keys before storage
   - Modified load functionality to decrypt API keys when retrieved
   - Added error handling for encryption/decryption failures

2. **content.js**
   - Added decryption utilities
   - Modified `getGeminiApiKey()` function to handle encrypted keys
   - Added backward compatibility for existing unencrypted keys

### Key Functions

#### Encryption
```javascript
async function encryptText(text, password)
```
- Encrypts plain text using AES-GCM
- Uses PBKDF2 for key derivation
- Returns base64-encoded encrypted data

#### Decryption
```javascript
async function decryptText(encryptedData, password)
```
- Decrypts base64-encoded data
- Handles IV extraction and decryption
- Returns original plain text

#### Key Derivation
```javascript
async function deriveKey(password, salt)
```
- Uses PBKDF2 with 100,000 iterations
- Derives encryption key from master password
- Uses SHA-256 for hashing

## Usage

### For Users
1. **First-time setup**: Enter your API key normally - it will be encrypted automatically
2. **Existing users**: Your current API key will be automatically encrypted on the next save
3. **No password required**: The extension uses a built-in master key for simplicity

### For Developers
The encryption is transparent to the rest of the application:
- `getGeminiApiKey()` returns the decrypted API key
- All existing code continues to work without modification
- Error handling ensures graceful fallback for unencrypted keys

## Testing

A test file (`test_encryption.html`) is included to verify encryption functionality:
- Tests basic encryption/decryption
- Tests different API key formats
- Tests security (wrong password rejection)
- Can be opened in any browser to verify functionality

## Security Considerations

### What's Protected
- ✅ API keys stored in Chrome sync storage
- ✅ API keys in memory are decrypted only when needed
- ✅ Uses cryptographically secure algorithms

### What's Not Protected
- ⚠️ API keys in transit to Gemini API (use HTTPS)
- ⚠️ API keys in browser memory during use
- ⚠️ Physical access to the device

### Recommendations
1. **Use HTTPS**: Always use HTTPS when making API calls
2. **Regular updates**: Keep the extension updated
3. **Secure device**: Ensure your device is password-protected
4. **Monitor usage**: Regularly check your API usage

## Migration

### Existing Users
- No action required
- API keys will be automatically encrypted on next save
- Backward compatibility ensures smooth transition

### New Users
- API keys are encrypted from the first save
- No additional setup required

## Technical Notes

### Browser Compatibility
- Requires modern browsers with Web Crypto API support
- Chrome 37+ (2014)
- Firefox 34+ (2014)
- Safari 11+ (2017)

### Performance
- Encryption/decryption is asynchronous
- Minimal performance impact
- Uses efficient algorithms (AES-GCM, PBKDF2)

### Storage Format
Encrypted data is stored as base64-encoded string containing:
- 12-byte IV (Initialization Vector)
- Encrypted API key data

## Troubleshooting

### Common Issues

1. **"Failed to decrypt API key"**
   - This is normal for existing unencrypted keys
   - The key will be encrypted on next save

2. **"Error saving API key"**
   - Check browser console for details
   - Ensure browser supports Web Crypto API

3. **API key not working**
   - Verify the API key is correct
   - Check network connectivity
   - Ensure the extension has proper permissions

### Debug Mode
Enable browser developer tools to see detailed error messages:
1. Right-click extension icon
2. Select "Inspect popup"
3. Check console for error details

## Future Enhancements

Potential improvements for future versions:
- User-defined master password
- Hardware-backed encryption (if available)
- Additional encryption layers
- Secure key rotation mechanisms 