package com.bookstore.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordUtilTest {
    @Test
    void hashesAndVerifiesPasswords() {
        String hash = PasswordUtil.hash("correct horse battery staple");

        assertTrue(PasswordUtil.isBcryptHash(hash));
        assertTrue(PasswordUtil.verify("correct horse battery staple", hash));
        assertFalse(PasswordUtil.verify("wrong", hash));
        assertFalse(PasswordUtil.needsUpgrade(hash));
    }

    @Test
    void acceptsLegacyPlaintextOnlyForMigration() {
        assertTrue(PasswordUtil.verify("legacy-password", "legacy-password"));
        assertFalse(PasswordUtil.verify("wrong", "legacy-password"));
        assertTrue(PasswordUtil.needsUpgrade("legacy-password"));
    }
}
