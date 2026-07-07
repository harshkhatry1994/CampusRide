/**
 * Normalizes a name string by converting to lowercase and removing all non-alphabetic characters.
 */
export const normalizeName = (name = "") => {
  return name.toLowerCase().replace(/[^a-z]/g, "");
};

/**
 * Normalizes a DOB string by removing all non-numeric characters.
 */
export const normalizeDOB = (dob = "") => {
  return (dob || "").replace(/[^0-9]/g, "");
};

/**
 * Compares two documents based on normalized name and normalized DOB.
 */
export const compareDocumentData = (aadhaarData, licenseData) => {
  const aadhaarName = normalizeName(aadhaarData.name);
  const licenseName = normalizeName(licenseData.name);

  const nameMatch =
    aadhaarName.includes(licenseName) ||
    licenseName.includes(aadhaarName);

  const dobMatch =
    normalizeDOB(aadhaarData.dob) ===
    normalizeDOB(licenseData.dob);

  return { nameMatch, dobMatch };
};
