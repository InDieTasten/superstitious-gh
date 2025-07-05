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
export declare const DEFAULT_CONFIG: SuperstitiousConfig;
