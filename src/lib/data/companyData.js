export const company = {
  name: 'Meerman Industries',
  proprietor: 'Dries Meerman',
  activity: 'Software development',
  kvkNumber: '42174874',
  establishmentNumber: '000066808715',
  legalForm: 'Eenmanszaak',
  city: 'Amsterdam',
  country: 'The Netherlands',
  // The visiting address is shielded in the KVK register and intentionally omitted.
  // Set the public btw-id when issued; null keeps the entire row off the page.
  /** @type {string | null} */
  vatId: null,
  /** @type {string | null} */
  phone: null
};

// Basic harvesting deterrent, not encryption. Decode only after visitor interaction.
const contactCharacters = [109, 101, 101, 114, 109, 97, 110, 116, 101, 99, 104, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];

export function getCompanyEmail() {
  return String.fromCharCode(...contactCharacters);
}
