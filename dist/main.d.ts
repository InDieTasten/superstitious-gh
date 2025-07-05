import * as github from '@actions/github';
import { SuperstitiousConfig } from './defaultConfig';
interface UnluckyItem {
    type: 'issue' | 'pr';
    item: any;
}
/**
 * Load configuration from the specified YAML file
 */
declare function loadConfig(configPath: string): SuperstitiousConfig;
/**
 * Check if a number is unlucky according to configuration
 */
declare function isUnluckyNumber(number: number, unluckyNumbers: number[]): boolean;
/**
 * Find all unlucky numbers in a range
 */
declare function findUnluckyNumbersInRange(startNumber: number, endNumber: number, unluckyNumbers: number[]): number[];
/**
 * Clean up placeholder issues
 */
declare function cleanupPlaceholderIssues(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, placeholderIssues: any[], config: SuperstitiousConfig, dryRun?: boolean): Promise<void>;
/**
 * Get existing unlucky issues/PRs for clearing mode
 */
declare function getExistingUnluckyItems(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, unluckyNumbers: number[]): Promise<UnluckyItem[]>;
/**
 * Duplicate an issue with a safe number
 */
declare function duplicateIssue(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, originalIssue: any, config: SuperstitiousConfig, dryRun: boolean): Promise<any>;
/**
 * Duplicate a pull request (create issue since we can't duplicate PRs)
 */
declare function duplicatePullRequest(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, originalPR: any, config: SuperstitiousConfig, dryRun: boolean): Promise<any>;
/**
 * Close an unlucky item after duplication
 */
declare function closeUnluckyItem(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, item: any, type: string, newItemNumber: number, dryRun: boolean, deletionMode?: boolean): Promise<void>;
/**
 * Main action function
 */
declare function run(): Promise<void>;
export { run, loadConfig, isUnluckyNumber, findUnluckyNumbersInRange, getExistingUnluckyItems, duplicateIssue, duplicatePullRequest, closeUnluckyItem, cleanupPlaceholderIssues };
