/**
 * Output service for formatted console output
 */

import chalk from 'chalk';
import type { IOutputService } from '../core/interfaces/services.js';

export class OutputService implements IOutputService {
  private readonly noColor: boolean;

  constructor(options?: { noColor?: boolean }) {
    this.noColor = options?.noColor ?? false;
  }

  public json(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
  }

  public jsonError(data: unknown): void {
    console.error(JSON.stringify(data));
  }

  public table(headers: string[], rows: string[][]): void {
    if (rows.length === 0) {
      return;
    }

    // Calculate column widths
    const widths = headers.map((header, index) => {
      const maxRowWidth = Math.max(
        ...rows.map((row) => (row[index] || '').length)
      );
      return Math.max(header.length, maxRowWidth);
    });

    // Print header
    const headerRow = headers
      .map((header, index) => header.padEnd(widths[index]))
      .join('  ');

    console.log(this.format(headerRow, chalk.bold));

    // Print separator
    console.log(widths.map((width) => '-'.repeat(width)).join('  '));

    // Print rows
    for (const row of rows) {
      const formattedRow = row
        .map((cell, index) => (cell || '').padEnd(widths[index]))
        .join('  ');
      console.log(formattedRow);
    }
  }

  public success(message: string): void {
    const symbol = this.format('✓', chalk.green);
    console.log(`${symbol} ${message}`);
  }

  public error(message: string): void {
    const symbol = this.format('✗', chalk.red);
    console.error(`${symbol} ${message}`);
  }

  public warning(message: string): void {
    const symbol = this.format('⚠', chalk.yellow);
    console.warn(`${symbol} ${message}`);
  }

  public info(message: string): void {
    const symbol = this.format('ℹ', chalk.blue);
    console.log(`${symbol} ${message}`);
  }

  public text(message: string): void {
    console.log(message);
  }

  public formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format text with chalk, respecting noColor option
   */
  public format(text: string, formatter: (text: string) => string): string {
    if (this.noColor) {
      return text;
    }
    return formatter(text);
  }

  /**
   * Get a dimmed text formatter
   */
  public dim(text: string): string {
    return this.format(text, chalk.dim);
  }

  /**
   * Get a cyan text formatter (for highlighting)
   */
  public highlight(text: string): string {
    return this.format(text, chalk.cyan);
  }

  /**
   * Get a bold text formatter
   */
  public bold(text: string): string {
    return this.format(text, chalk.bold);
  }

  public red(text: string): string {
    return this.format(text, chalk.red);
  }

  public green(text: string): string {
    return this.format(text, chalk.green);
  }

  public yellow(text: string): string {
    return this.format(text, chalk.yellow);
  }

  public cyan(text: string): string {
    return this.format(text, chalk.cyan);
  }

  public magenta(text: string): string {
    return this.format(text, chalk.magenta);
  }

  public gray(text: string): string {
    return this.format(text, chalk.gray);
  }

  public blue(text: string): string {
    return this.format(text, chalk.blue);
  }

  public underline(text: string): string {
    return this.format(text, chalk.underline);
  }
}
