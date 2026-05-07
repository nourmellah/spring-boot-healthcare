package com.healthcare.system.security;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtUtils Unit Tests")
class JwtUtilsTest {

    private static final String TEST_SECRET =
            "testSecretKeyForJwtTestingPurposesOnlyNotForProduction123456";
    private static final long TEST_EXPIRATION_MS = 86_400_000L;

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", TEST_EXPIRATION_MS);
    }

    @Nested
    @DisplayName("generateTokenFromEmail")
    class GenerateTokenFromEmail {

        @Test
        @DisplayName("produces a non-null, non-blank token")
        void producesNonBlankToken() {
            String token = jwtUtils.generateTokenFromEmail("user@example.com");
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("produces a token with three JWT segments")
        void producesWellFormedJwt() {
            String token = jwtUtils.generateTokenFromEmail("user@example.com");
            assertThat(token.split("\\.")).hasSize(3);
        }
    }

    @Nested
    @DisplayName("getEmailFromJwtToken")
    class GetEmailFromJwtToken {

        @Test
        @DisplayName("extracts the correct email from a generated token")
        void extractsCorrectEmail() {
            String email = "doctor@hospital.com";
            String token = jwtUtils.generateTokenFromEmail(email);
            assertThat(jwtUtils.getEmailFromJwtToken(token)).isEqualTo(email);
        }
    }

    @Nested
    @DisplayName("validateJwtToken")
    class ValidateJwtToken {

        @Test
        @DisplayName("returns true for a valid token")
        void returnsTrueForValidToken() {
            String token = jwtUtils.generateTokenFromEmail("admin@hospital.com");
            assertThat(jwtUtils.validateJwtToken(token)).isTrue();
        }

        @Test
        @DisplayName("returns false for a malformed token")
        void returnsFalseForMalformedToken() {
            assertThat(jwtUtils.validateJwtToken("this.is.not.a.jwt")).isFalse();
        }

        @Test
        @DisplayName("returns false for an empty string")
        void returnsFalseForEmptyString() {
            assertThat(jwtUtils.validateJwtToken("")).isFalse();
        }

        @Test
        @DisplayName("returns false for an expired token")
        void returnsFalseForExpiredToken() {
            JwtUtils expiredUtils = new JwtUtils();
            ReflectionTestUtils.setField(expiredUtils, "jwtSecret", TEST_SECRET);
            ReflectionTestUtils.setField(expiredUtils, "jwtExpirationMs", -1L);
            String expiredToken = expiredUtils.generateTokenFromEmail("user@example.com");
            assertThat(jwtUtils.validateJwtToken(expiredToken)).isFalse();
        }
    }
}
