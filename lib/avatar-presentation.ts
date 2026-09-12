/** Roles whose avatar assets live under a different folder name than the role key. */
export const ROLE_ASSET_FOLDER: Record<string, string> = {
  hiring_manager: 'hiring-manager',
  technical: 'technical',
  product: 'product',
  customer: 'customer',
  behavioral: 'behavioral',
};

/** Resolve the path to an avatar asset for a given role and file. */
export function avatarAssetPath(role: string, file: string): string {
  const folder = ROLE_ASSET_FOLDER[role] ?? role;
  return `/avatars/${folder}/${file}`;
}
