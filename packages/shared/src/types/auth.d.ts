export declare enum Role {
    Parent = "parent",
    Child = "child",
    Admin = "admin"
}
export interface JwtPayload {
    sub: string;
    role: Role;
    parentId?: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
