/** User entity — align with Prisma `User` / auth provider as you implement. */
export type UserId = string;

export type UserEntity = {
  id: UserId;
  email: string;
  displayName?: string;
};
