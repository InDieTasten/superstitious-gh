/**
 * Default configuration for Superstitious GitHub Action
 */

const DEFAULT_CONFIG = {
  unlucky_numbers: [7, 13, 666],
  reservation_space: 1,
  clearing_mode: true,
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

module.exports = {
  DEFAULT_CONFIG
};