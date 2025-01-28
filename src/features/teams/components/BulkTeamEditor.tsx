import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components';
import { useTeamMutations } from '../hooks/useTeams';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import type { TeamCreate } from '../types/team.types';

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    reason: string;
  }>;
  duplicates: Array<{
    name: string;
    rows: number[];
  }>;
}

export function BulkTeamEditor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createTeam } = useTeamMutations();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => {
        const [name, description, members, skills] = row.split(',').map(cell => cell.trim());
        return { name, description, members, skills };
      });

      // Skip header row
      const dataRows = rows.slice(1);

      // Validate and find duplicates
      const duplicateNames = new Map<string, number[]>();
      dataRows.forEach((row, index) => {
        if (!row.name) return;
        const existing = duplicateNames.get(row.name) || [];
        duplicateNames.set(row.name, [...existing, index + 2]); // +2 for header and 1-based indexing
      });

      const duplicates = Array.from(duplicateNames.entries())
        .filter(([_, rows]) => rows.length > 1)
        .map(([name, rows]) => ({ name, rows }));

      if (duplicates.length > 0) {
        setResult({
          success: 0,
          failed: 0,
          errors: [],
          duplicates
        });
        setShowDuplicates(true);
        return;
      }

      // Process rows in parallel with rate limiting
      const batchSize = 5;
      const results: BulkOperationResult = {
        success: 0,
        failed: 0,
        errors: [],
        duplicates: []
      };

      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (row, batchIndex) => {
            const rowIndex = i + batchIndex + 2; // +2 for header and 1-based indexing
            try {
              if (!row.name) {
                throw new Error('Team name is required');
              }

              const team: TeamCreate = {
                name: row.name,
                description: row.description || ''
              };

              await createTeam.mutateAsync(team);
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                row: rowIndex,
                reason: (error as Error).message
              });
            }
          })
        );

        // Rate limiting delay between batches
        if (i + batchSize < dataRows.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setResult(results);
    } catch (error) {
      console.error('Failed to process CSV:', error);
      setResult({
        success: 0,
        failed: 1,
        errors: [{
          row: 0,
          reason: 'Failed to process CSV file'
        }],
        duplicates: []
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'name,description,members,skills\nExample Team,Team description,"user1,user2","skill1,skill2"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <UIErrorBoundary boundaryName="bulk-team-editor">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Team Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Import CSV'}
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-sm">
                    <span className="font-medium">Successful:</span>{' '}
                    {result.success}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Failed:</span>{' '}
                    {result.failed}
                  </div>
                </div>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Errors</h3>
                    <div className="text-sm space-y-1">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-destructive"
                        >
                          Row {error.row}: {error.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicates */}
                {result.duplicates.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Duplicate Team Names</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDuplicates(!showDuplicates)}
                      >
                        {showDuplicates ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    {showDuplicates && (
                      <div className="text-sm space-y-1">
                        {result.duplicates.map((duplicate, index) => (
                          <div key={index}>
                            {duplicate.name} (rows: {duplicate.rows.join(', ')})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </UIErrorBoundary>
  );
} 