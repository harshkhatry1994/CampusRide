/**
 * Validates Aadhaar format
 * Format: 12 digits
 */
export const validateAadhaarFormat = (aadhaarNumber) => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaarNumber.replace(/\s/g, ''));
};
