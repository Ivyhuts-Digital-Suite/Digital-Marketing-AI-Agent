import { apiRequest } from "./client";
import { GetCurrentUserResponse, LoginResponse, RegisterResponse } from "./types";

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
}

export function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
    skipAuth: true,
  });
}

export function getCurrentUser(): Promise<GetCurrentUserResponse> {
  return apiRequest<GetCurrentUserResponse>("/api/auth/me");
}
