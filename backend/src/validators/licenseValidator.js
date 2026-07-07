/**
 * Validates Indian Driving License format
 * Format: generally 2 letters followed by 13 digits, but can vary slightly (e.g. MH1220110000000)
 */
export const validateLicenseFormat = (licenseNumber) => {
  // Relaxed regex for Indian DL (e.g., RJ14 20210012345 or RJ-14-2021-0012345)
  const dlRegex = /^[A-Z]{2}[-\s0-9]{2,4}[-\s0-9]{11}$/i;
  // Fallback broad regex if we strip non-alphanumerics
  const stripped = licenseNumber.replace(/[\s-]/g, '');
  const strictRegex = /^[A-Z]{2}[0-9]{13}$/i;

  return strictRegex.test(stripped) || dlRegex.test(licenseNumber);
};
