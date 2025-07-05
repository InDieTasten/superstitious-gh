/**
 * Default configuration for Superstitious GitHub Action
 */
export interface PlaceholderConfig {
  title: string;
  body: string;
  labels: string[];
}

export interface ClearingConfig {
  preserve_content: boolean;
  title_suffix: string;
  add_explanation_comment: boolean;
  explanation_comment: string;
}

export interface SuperstitiousConfig {
  unlucky_numbers: number[];
  reservation_space: number;
  clearing_mode: boolean;
  deletion_mode?: boolean;
  placeholder: PlaceholderConfig;
  clearing?: ClearingConfig;
}

export const DEFAULT_CONFIG: SuperstitiousConfig = {
  unlucky_numbers: [7, 13, 66, 77, 666, 777, 1313, 1337],
  reservation_space: 5,
  clearing_mode: false,
  deletion_mode: false,
  placeholder: {
    title: "🔮 Reserved for superstitious purposes",
    body: "This issue was created automatically to prevent an unlucky number from being assigned.\n\n**This is a placeholder issue and will be deleted shortly.**",
    labels: ["superstitious", "placeholder"]
  },
  clearing: {
    preserve_content: true,
    title_suffix: " (moved from unlucky number)",
    add_explanation_comment: true,
    explanation_comment: "This issue was moved from #{original_number} to avoid an unlucky number.\nThe original issue has been closed and this is the continuation."
  }
};