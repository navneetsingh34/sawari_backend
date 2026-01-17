/**
 * JWT Refresh Guard
 *
 * Guard for protecting the token refresh endpoint.
 * Uses JWT refresh token strategy for validation.
 *
 * Only used on: POST /auth/refresh
 *
 * How it works:
 * 1. Extracts refresh token from request body
 * 2. Validates token using JwtRefreshStrategy
 * 3. Attaches userId and token to request
 * 4. Allows request to proceed to controller
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
