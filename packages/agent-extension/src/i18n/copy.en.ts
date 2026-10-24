/**
 * English catalog: the single source of truth for source-reference label keys.
 *
 * These labels are authored by the product, not by the model: the model writes
 * the answer, MCode writes the label in front of it. They are therefore product
 * copy and follow the interface language, the same as every other surface.
 *
 * The English object defines the key shape, so a missing translation is a
 * compile error instead of an English label leaking into a localized answer.
 */
export const EN_SOURCE_REFERENCE_COPY = {
  /** Header in front of an appended list of web sources. */
  'sourceList.label': 'Sources: ',
  /** Header in front of a list of web sources, one per bullet. */
  'sourceList.itemLabel': 'Source: ',
  /** Separator between the entries of an appended source list. */
  'sourceList.separator': ', ',
  /** Separator between a rendered file citation and the prose that follows it. */
  'citation.labelSeparator': ': ',
} as const;

/** Every key the source-reference catalog defines. */
export type SourceReferenceCopyKey = keyof typeof EN_SOURCE_REFERENCE_COPY;

/** Shape every translation of the source-reference catalog must satisfy. */
export type SourceReferenceTranslations = Readonly<Record<SourceReferenceCopyKey, string>>;
