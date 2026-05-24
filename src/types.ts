import type { Token, WebIDLErrorData as ValidationResult } from "webidl2";

export type * from "webidl2";

export type { ValidationResult };

/**
 * Represents a single location in a WebIDL source file by its 0-based line and
 * column numbers as well as the absolute character offset from the start of
 * the file. For a user-facing display of the location, the line and column
 * numbers can be converted to 1-based values, which is what the interface
 * {@linkcode DisplayLocation} extends this type with.
 *
 * @category Types
 */
export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

/** */
export interface DisplayLocation extends SourceLocation {
  displayLine: number;
  displayColumn: number;
}

export interface SourceRange<T extends SourceLocation = SourceLocation> {
  /**
   * The starting location of the source range, inclusive. This is the
   * position of the first character of the range.
   */
  start: T;

  /**
   * The ending location of the source range, exclusive. This is the position
   * immediately after the last character of the range. Note that in some
   * cases, such as when the error is associated with a token rather than a
   * specific location, the end position may not be explicitly provided. In
   * such cases, the range can be inferred from the token's length or other
   * contextual information.
   */
  end: T;

  /**
   * The "width" of the source range in characters, which can be useful for
   * display purposes, especially if an explicit end location is unavailable
   * or if the diagnostic spans multiple lines.
   *
   * @remarks
   * The width is either calculated via a simple difference of the start and
   * end offsets when both are available, or is derived as a reduction of the
   * token lengths associated with the error.
   */
  width: number;

  /**
   * The "height" of the source range in lines, which can be useful for display
   * purposes, especially if an explicit end location is unavailable or if the
   * diagnostic spans multiple lines.
   *
   * @remarks
   * The height is calculated as the difference between the start and end line
   * numbers when both are available, or is derived from the number of line
   * breaks in the input text associated with the error.
   */
  height: number;
}

export interface EnrichedToken<T extends SourceLocation = DisplayLocation>
  extends Token, SourceRange<T> {}

export interface EnrichedValidationResult<
  T extends SourceLocation = DisplayLocation,
> extends ValidationResult, Partial<SourceRange<T>> {
  tokens: EnrichedToken<T>[];
}
