'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { parseCSV } from '@/lib/utils';
import { TradeInput } from '@/lib/validations/trade';
import { TradeType, AssetClass } from '@prisma/client';
import { Upload, FileText, CheckCircle, AlertCircle, Download, X } from 'lucide-react';
import Papa from 'papaparse';

interface CSVImportProps {
  onImport: (trades: TradeInput[]) => Promise<void>;
  onCancel?: () => void;
}

interface ParsedTrade {
  [key: string]: string | number | Date;
}

interface ColumnMapping {
  [csvColumn: string]: string;
}

const REQUIRED_FIELDS = [
  'symbol',
  'side',
  'assetClass',
  'entryDate',
  'entryPrice',
  'quantity',
] as const;

const OPTIONAL_FIELDS = [
  'exitDate',
  'exitPrice',
  'entryFees',
  'exitFees',
  'stopLoss',
  'takeProfit',
  'riskAmount',
  'notes',
  'lessons',
] as const;

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export function CSVImport({ onImport, onCancel }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validTrades, setValidTrades] = useState<TradeInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [importing, setImporting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setErrors([]);

    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map(err => err.message));
          return;
        }

        const data = results.data as string[][];
        
        // Remove empty rows
        const filteredData = data.filter(row => 
          row.some(cell => cell && cell.trim() !== '')
        );

        if (filteredData.length < 2) {
          setErrors(['CSV file must contain at least a header row and one data row']);
          return;
        }

        setCsvData(filteredData);
        
        // Auto-detect column mappings
        const headers = filteredData[0];
        const autoMapping: ColumnMapping = {};
        
        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().trim();
          
          // Auto-map common column names
          if (normalizedHeader.includes('symbol') || normalizedHeader.includes('ticker')) {
            autoMapping[header] = 'symbol';
          } else if (normalizedHeader.includes('side') || normalizedHeader.includes('type')) {
            autoMapping[header] = 'side';
          } else if (normalizedHeader.includes('asset') || normalizedHeader.includes('class')) {
            autoMapping[header] = 'assetClass';
          } else if (normalizedHeader.includes('entry') && normalizedHeader.includes('date')) {
            autoMapping[header] = 'entryDate';
          } else if (normalizedHeader.includes('entry') && normalizedHeader.includes('price')) {
            autoMapping[header] = 'entryPrice';
          } else if (normalizedHeader.includes('exit') && normalizedHeader.includes('date')) {
            autoMapping[header] = 'exitDate';
          } else if (normalizedHeader.includes('exit') && normalizedHeader.includes('price')) {
            autoMapping[header] = 'exitPrice';
          } else if (normalizedHeader.includes('quantity') || normalizedHeader.includes('size')) {
            autoMapping[header] = 'quantity';
          } else if (normalizedHeader.includes('fee') && normalizedHeader.includes('entry')) {
            autoMapping[header] = 'entryFees';
          } else if (normalizedHeader.includes('fee') && normalizedHeader.includes('exit')) {
            autoMapping[header] = 'exitFees';
          } else if (normalizedHeader.includes('stop') && normalizedHeader.includes('loss')) {
            autoMapping[header] = 'stopLoss';
          } else if (normalizedHeader.includes('take') && normalizedHeader.includes('profit')) {
            autoMapping[header] = 'takeProfit';
          } else if (normalizedHeader.includes('risk')) {
            autoMapping[header] = 'riskAmount';
          } else if (normalizedHeader.includes('note')) {
            autoMapping[header] = 'notes';
          }
        });
        
        setColumnMapping(autoMapping);
        setStep('mapping');
      },
      header: false,
      skipEmptyLines: true,
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const validateAndParseData = () => {
    if (csvData.length < 2) return;

    const headers = csvData[0];
    const rows = csvData.slice(1);
    const newErrors: string[] = [];
    const parsed: ParsedTrade[] = [];
    const valid: TradeInput[] = [];

    // Check if all required fields are mapped
    const mappedFields = Object.values(columnMapping);
    const missingRequired = REQUIRED_FIELDS.filter(field => !mappedFields.includes(field));
    
    if (missingRequired.length > 0) {
      newErrors.push(`Missing required field mappings: ${missingRequired.join(', ')}`);
      setErrors(newErrors);
      return;
    }

    rows.forEach((row, index) => {
      try {
        const trade: any = {};
        
        headers.forEach((header, headerIndex) => {
          const mappedField = columnMapping[header];
          if (mappedField && row[headerIndex]) {
            let value: any = row[headerIndex];
            
            // Type conversions
            if (['entryPrice', 'exitPrice', 'quantity', 'entryFees', 'exitFees', 'stopLoss', 'takeProfit', 'riskAmount'].includes(mappedField)) {
              value = parseFloat(value);
              if (isNaN(value)) {
                throw new Error(`Invalid number in ${mappedField}: ${row[headerIndex]}`);
              }
            } else if (['entryDate', 'exitDate'].includes(mappedField)) {
              value = new Date(value);
              if (isNaN(value.getTime())) {
                throw new Error(`Invalid date in ${mappedField}: ${row[headerIndex]}`);
              }
            } else if (mappedField === 'side') {
              value = value.toUpperCase();
              if (!['LONG', 'SHORT'].includes(value)) {
                throw new Error(`Invalid side value: ${value}. Must be LONG or SHORT`);
              }
            } else if (mappedField === 'assetClass') {
              value = value.toUpperCase();
              if (!Object.values(AssetClass).includes(value as AssetClass)) {
                throw new Error(`Invalid asset class: ${value}`);
              }
            }
            
            trade[mappedField] = value;
          }
        });

        // Validate required fields
        for (const field of REQUIRED_FIELDS) {
          if (!trade[field] && trade[field] !== 0) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        parsed.push(trade);
        valid.push(trade as TradeInput);
      } catch (error) {
        newErrors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    setParsedTrades(parsed);
    setValidTrades(valid);
    setErrors(newErrors);
    setStep('preview');
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      await onImport(validTrades);
    } catch (error) {
      console.error('Import error:', error);
      setErrors([error instanceof Error ? error.message : 'Import failed']);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['symbol', 'side', 'assetClass', 'entryDate', 'entryPrice', 'quantity', 'exitDate', 'exitPrice', 'entryFees', 'exitFees', 'stopLoss', 'takeProfit', 'riskAmount', 'notes'],
      ['AAPL', 'LONG', 'STOCK', '2024-01-15 09:30:00', '150.00', '100', '2024-01-15 15:30:00', '155.00', '1.00', '1.00', '145.00', '160.00', '500.00', 'Breakout trade'],
      ['TSLA', 'SHORT', 'STOCK', '2024-01-16 10:00:00', '200.00', '50', '', '', '0.50', '', '210.00', '190.00', '500.00', 'Reversal setup']
    ];

    const csvContent = template.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'trading_journal_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImport = () => {
    setFile(null);
    setCsvData([]);
    setParsedTrades([]);
    setColumnMapping({});
    setValidTrades([]);
    setErrors([]);
    setStep('upload');
    setImporting(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Trades from CSV</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a CSV file to bulk import your trading data
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-gray-600 dark:text-gray-400">Drop the CSV file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag & drop your CSV file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">CSV files up to 10MB</p>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetImport}
                    className="ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="mt-4 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-danger-800 dark:text-danger-200">
                      Errors found:
                    </h4>
                    <ul className="mt-1 text-sm text-danger-700 dark:text-danger-300 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Map Columns</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Map your CSV columns to the trading journal fields. Required fields are marked with *.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">Your CSV Headers</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {csvData[0].map((header, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                    >
                      {header}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Field Mapping</h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {ALL_FIELDS.map(field => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>
                        {field}
                        {REQUIRED_FIELDS.includes(field as any) && (
                          <span className="text-danger-600 ml-1">*</span>
                        )}
                      </Label>
                      <Select
                        value={
                          Object.entries(columnMapping).find(([_, mapped]) => mapped === field)?.[0] || ''
                        }
                        onChange={(e) => {
                          const csvColumn = e.target.value;
                          const newMapping = { ...columnMapping };
                          
                          // Remove previous mapping for this field
                          Object.keys(newMapping).forEach(key => {
                            if (newMapping[key] === field) {
                              delete newMapping[key];
                            }
                          });
                          
                          // Add new mapping
                          if (csvColumn) {
                            newMapping[csvColumn] = field;
                          }
                          
                          setColumnMapping(newMapping);
                        }}
                      >
                        <option value="">-- Select Column --</option>
                        {csvData[0].map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={validateAndParseData}>
                Next: Preview Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Preview & Import</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {csvData.length - 1}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Rows
                  </div>
                </div>
                <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-success-600">
                    {validTrades.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Valid Trades
                  </div>
                </div>
                <div className="text-center p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-danger-600">
                    {errors.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Errors
                  </div>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-danger-800 dark:text-danger-200 mb-2">
                        Import Errors:
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="text-sm text-danger-700 dark:text-danger-300 list-disc list-inside space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  Back
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={resetImport}>
                    Start Over
                  </Button>
                  <Button 
                    onClick={handleImport}
                    disabled={validTrades.length === 0 || importing}
                  >
                    {importing ? 'Importing...' : `Import ${validTrades.length} Trades`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Table */}
          {validTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trade Preview (First 10 rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Symbol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Side
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Entry Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Entry Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Exit Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {validTrades.slice(0, 10).map((trade, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {trade.symbol}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {trade.side}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {trade.entryDate.toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            ${trade.entryPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {trade.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : 'Open'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validTrades.length > 10 && (
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Showing 10 of {validTrades.length} trades
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}