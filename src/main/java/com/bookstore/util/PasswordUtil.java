package com.bookstore.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.mindrot.jbcrypt.BCrypt;

/** Password hashing and backward-compatible verification helpers. */
public final class PasswordUtil {
    private static final int BCRYPT_LOG_ROUNDS = 12;

    private PasswordUtil() {}

    public static String hash(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("密码不能为空");
        }
        return BCrypt.hashpw(rawPassword, BCrypt.gensalt(BCRYPT_LOG_ROUNDS));
    }

    public static boolean verify(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        if (isBcryptHash(storedPassword)) {
            try {
                return BCrypt.checkpw(rawPassword, storedPassword);
            } catch (IllegalArgumentException invalidHash) {
                return false;
            }
        }

        // Legacy plaintext rows are accepted once and upgraded after login.
        return MessageDigest.isEqual(
            rawPassword.getBytes(StandardCharsets.UTF_8),
            storedPassword.getBytes(StandardCharsets.UTF_8)
        );
    }

    public static boolean needsUpgrade(String storedPassword) {
        return !isBcryptHash(storedPassword);
    }

    public static boolean isBcryptHash(String value) {
        return value != null && value.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
    }
}
