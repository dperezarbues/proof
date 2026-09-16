// Section-heading translations, keyed by section id then language code.
// Only covers the fixed set of known section ids rendered by sections.typ —
// user-defined/custom sections (render-generic) have no fixed id to key off
// and are intentionally left untranslated.
#let section-titles = (
  summary: (en: "Summary", es: "Resumen", de: "Zusammenfassung", fr: "Résumé"),
  experience: (en: "Experience", es: "Experiencia", de: "Berufserfahrung", fr: "Expérience"),
  awards: (en: "Awards", es: "Premios", de: "Auszeichnungen", fr: "Distinctions"),
  skills: (en: "Skills", es: "Habilidades", de: "Fähigkeiten", fr: "Compétences"),
  education: (en: "Education", es: "Educación", de: "Ausbildung", fr: "Formation"),
  languages: (en: "Languages", es: "Idiomas", de: "Sprachen", fr: "Langues"),
  certifications: (en: "Certifications", es: "Certificaciones", de: "Zertifizierungen", fr: "Certifications"),
  side_projects: (
    en: "Side Projects & Interests",
    es: "Proyectos Personales e Intereses",
    de: "Nebenprojekte & Interessen",
    fr: "Projets Personnels & Centres d'Intérêt",
  ),
  core_strengths: (en: "Core Strengths", es: "Fortalezas Clave", de: "Kernkompetenzen", fr: "Points Forts"),
  leadership_profile: (
    en: "Leadership Profile",
    es: "Perfil de Liderazgo",
    de: "Führungsprofil",
    fr: "Profil de Leadership",
  ),
  contact: (en: "Contact", es: "Contacto", de: "Kontakt", fr: "Contact"),
)

/// Looks up the translated title for a known section id. Falls back to the
/// English title if the language is unrecognised, and to a humanised id if
/// the section itself isn't in the table (shouldn't happen for known ids,
/// but keeps this safe to call defensively).
#let section-title(id, lang) = {
  let entry = section-titles.at(id, default: none)
  if entry == none { return id.replace("_", " ") }
  entry.at(lang, default: entry.en)
}
