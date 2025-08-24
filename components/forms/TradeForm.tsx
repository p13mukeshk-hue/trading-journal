'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TradeType, AssetClass, EmotionLevel, MarketCondition, VolatilityLevel } from '@prisma/client';
import { tradeSchema, type TradeInput } from '@/lib/validations/trade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, calculatePnL, calculateRMultiple } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Calculator, TrendingUp, TrendingDown } from 'lucide-react';

interface TradeFormProps {
  initialData?: Partial<TradeInput>;
  onSubmit: (data: TradeInput) => Promise<void>;
  onCancel?: () => void;
  onValidationError?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  showSubmitButton?: boolean;
  submitButtonText?: string;
}

export function TradeForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  onValidationError,
  isLoading = false,
  mode = 'create',
  showSubmitButton = true,
  submitButtonText = 'Save Trade'
}: TradeFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    pnl?: number;
    pnlPercent?: number;
    rMultiple?: number;
    riskRewardRatio?: number;
  }>({});


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<TradeInput>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      entryDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD string
      entryFees: 0,
      exitFees: 0,
      confidence: 5,
      ...initialData,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const { side, entryPrice, exitPrice, quantity, entryFees, exitFees, stopLoss, takeProfit, riskAmount } = watchedValues;

  // LocalStorage key for persisting form data
  const storageKey = `trade-form-${mode}`;
  
  // Clear localStorage when form is submitted successfully
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && mode === 'create') {
      const savedData = localStorage.getItem(storageKey);
      if (savedData && !initialData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Only restore if it's recent (less than 24 hours old)
          if (parsedData.timestamp && Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000) {
            Object.keys(parsedData.data).forEach(key => {
              if (parsedData.data[key] !== undefined && parsedData.data[key] !== null) {
                setValue(key as keyof TradeInput, parsedData.data[key]);
              }
            });
          }
        } catch (error) {
          console.error('Failed to restore form data:', error);
        }
      }
    }
  }, [mode, setValue, initialData, storageKey]);

  // Save form data to localStorage on changes (debounced)
  useEffect(() => {
    if (typeof window !== 'undefined' && mode === 'create' && Object.keys(watchedValues).some(key => watchedValues[key as keyof TradeInput])) {
      const timeoutId = setTimeout(() => {
        const dataToSave = {
          data: watchedValues,
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, mode, storageKey]);

  // Calculate metrics in real-time
  const updateCalculations = useCallback(() => {
    if (!entryPrice || !quantity) return;

    const metrics: typeof calculatedMetrics = {};

    // Calculate P&L if exit price is available
    if (exitPrice) {
      const pnlData = calculatePnL(
        side as 'LONG' | 'SHORT',
        entryPrice,
        exitPrice,
        quantity,
        entryFees || 0,
        exitFees || 0
      );
      metrics.pnl = pnlData.pnl;
      metrics.pnlPercent = pnlData.pnlPercent;

      // Calculate R-Multiple if risk amount is provided
      if (riskAmount) {
        const rMultiple = pnlData.pnl !== null ? calculateRMultiple(pnlData.pnl!, riskAmount) : null;
        metrics.rMultiple = rMultiple || undefined;
      }
    }

    // Calculate risk-reward ratio
    if (stopLoss && takeProfit) {
      const risk = side === TradeType.LONG 
        ? entryPrice - stopLoss 
        : stopLoss - entryPrice;
      const reward = side === TradeType.LONG 
        ? takeProfit - entryPrice 
        : entryPrice - takeProfit;
      
      if (risk > 0) {
        metrics.riskRewardRatio = reward / risk;
      }
    }

    setCalculatedMetrics(metrics);
  }, [side, entryPrice, exitPrice, quantity, entryFees, exitFees, stopLoss, takeProfit, riskAmount]);

  // Update calculations when relevant values change
  useEffect(() => {
    updateCalculations();
  }, [updateCalculations]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: TradeInput) => {
    try {
      // Get time values from the form
      const entryTimeInput = document.getElementById('entryTime') as HTMLInputElement;
      const exitTimeInput = document.getElementById('exitTime') as HTMLInputElement;
      
      // Add uploaded files and time data to form data
      const formDataWithFiles = {
        ...data,
        screenshots: uploadedFiles,
        entryTime: entryTimeInput?.value || '12:00',
        exitTime: exitTimeInput?.value || '16:00',
      };
      await onSubmit(formDataWithFiles as any);
      if (mode === 'create') {
        reset();
        setUploadedFiles([]);
        clearSavedData(); // Clear localStorage on successful submission
      }
    } catch (error) {
      console.error('Error submitting trade:', error);
      onValidationError?.();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {mode === 'edit' ? 'Edit Trade' : 'New Trade Entry'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {mode === 'edit' ? 'Update your trade details' : 'Record a new trade in your journal'}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Trade Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol *</Label>
            <Select {...register('symbol')} className={errors.symbol ? 'border-danger-500' : ''}>
              <option value="">Select asset</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="ARB">Arbitrum (ARB)</option>
              <option value="AAVE">Aave (AAVE)</option>
              <option value="SOL">Solana (SOL)</option>
              <option value="AAPL">Apple Inc. (AAPL)</option>
              <option value="NVDA">NVIDIA Corp. (NVDA)</option>
              <option value="MSFT">Microsoft Corp. (MSFT)</option>
              <option value="TSLA">Tesla Inc. (TSLA)</option>
              <option value="NIFTY">Nifty 50 (NIFTY)</option>
            </Select>
            {errors.symbol && (
              <p className="text-sm text-danger-600">{errors.symbol.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="side">Side *</Label>
            <Select {...register('side')} className={errors.side ? 'border-danger-500' : ''}>
              <option value="">Select side</option>
              <option value={TradeType.LONG}>Long</option>
              <option value={TradeType.SHORT}>Short</option>
            </Select>
            {errors.side && (
              <p className="text-sm text-danger-600">{errors.side.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetClass">Asset Class *</Label>
            <Select {...register('assetClass')} className={errors.assetClass ? 'border-danger-500' : ''}>
              <option value="">Select asset class</option>
              <option value={AssetClass.STOCK}>Stock</option>
              <option value={AssetClass.FOREX}>Forex</option>
              <option value={AssetClass.CRYPTO}>Crypto</option>
              <option value={AssetClass.OPTIONS}>Options</option>
              <option value={AssetClass.FUTURES}>Futures</option>
              <option value={AssetClass.COMMODITY}>Commodity</option>
            </Select>
            {errors.assetClass && (
              <p className="text-sm text-danger-600">{errors.assetClass.message}</p>
            )}
          </div>
        </div>

        {/* Entry Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-success-600" />
            Entry Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date *</Label>
              <Input
                id="entryDate"
                type="date"
                {...register('entryDate')}
                className={errors.entryDate ? 'border-danger-500' : ''}
              />
              {errors.entryDate && (
                <p className="text-sm text-danger-600">{errors.entryDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entryTime">Entry Time</Label>
              <Input
                id="entryTime"
                type="time"
                defaultValue="12:00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price *</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.01"
                placeholder="100.00"
                {...register('entryPrice', {
                  setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                })}
                className={errors.entryPrice ? 'border-danger-500' : ''}
              />
              {errors.entryPrice && (
                <p className="text-sm text-danger-600">{errors.entryPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                placeholder="100"
                {...register('quantity', {
                  setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                })}
                className={errors.quantity ? 'border-danger-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-danger-600">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryFees">Entry Fees</Label>
              <Input
                id="entryFees"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('entryFees', {
                  setValueAs: (v) => v === '' ? 0 : parseFloat(v)
                })}
                className={errors.entryFees ? 'border-danger-500' : ''}
              />
              {errors.entryFees && (
                <p className="text-sm text-danger-600">{errors.entryFees.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Exit Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-danger-600" />
            Exit Details (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="exitDate">Exit Date</Label>
              <Input
                id="exitDate"
                type="date"
                {...register('exitDate')}
                className={errors.exitDate ? 'border-danger-500' : ''}
              />
              {errors.exitDate && (
                <p className="text-sm text-danger-600">{errors.exitDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exitTime">Exit Time</Label>
              <Input
                id="exitTime"
                type="time"
                defaultValue="16:00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.01"
                placeholder="110.00"
                {...register('exitPrice', {
                  setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                })}
                className={errors.exitPrice ? 'border-danger-500' : ''}
              />
              {errors.exitPrice && (
                <p className="text-sm text-danger-600">{errors.exitPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitFees">Exit Fees</Label>
              <Input
                id="exitFees"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('exitFees', {
                  setValueAs: (v) => v === '' ? 0 : parseFloat(v)
                })}
                className={errors.exitFees ? 'border-danger-500' : ''}
              />
              {errors.exitFees && (
                <p className="text-sm text-danger-600">{errors.exitFees.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                placeholder="95.00"
                {...register('stopLoss', {
                  setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                })}
                className={errors.stopLoss ? 'border-danger-500' : ''}
              />
              {errors.stopLoss && (
                <p className="text-sm text-danger-600">{errors.stopLoss.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.01"
                placeholder="115.00"
                {...register('takeProfit', {
                  setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                })}
                className={errors.takeProfit ? 'border-danger-500' : ''}
              />
              {errors.takeProfit && (
                <p className="text-sm text-danger-600">{errors.takeProfit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskAmount">Risk Amount ($)</Label>
              <Input
                id="riskAmount"
                type="number"
                step="0.01"
                placeholder="500.00"
                {...register('riskAmount', {
                  setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                })}
                className={errors.riskAmount ? 'border-danger-500' : ''}
              />
              {errors.riskAmount && (
                <p className="text-sm text-danger-600">{errors.riskAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence (1-10)</Label>
              <Input
                id="confidence"
                type="number"
                min="1"
                max="10"
                {...register('confidence', {
                  setValueAs: (v) => v === '' ? undefined : parseInt(v)
                })}
                className={errors.confidence ? 'border-danger-500' : ''}
              />
              {errors.confidence && (
                <p className="text-sm text-danger-600">{errors.confidence.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Calculated Metrics Display */}
        {Object.keys(calculatedMetrics).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Calculated Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {calculatedMetrics.pnl !== undefined && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">P&L</p>
                  <p className={`text-lg font-semibold ${calculatedMetrics.pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {formatCurrency(calculatedMetrics.pnl)}
                  </p>
                </div>
              )}
              {calculatedMetrics.pnlPercent !== undefined && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">P&L %</p>
                  <p className={`text-lg font-semibold ${calculatedMetrics.pnlPercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {calculatedMetrics.pnlPercent.toFixed(2)}%
                  </p>
                </div>
              )}
              {calculatedMetrics.rMultiple !== undefined && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">R-Multiple</p>
                  <p className={`text-lg font-semibold ${calculatedMetrics.rMultiple >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {calculatedMetrics.rMultiple.toFixed(2)}R
                  </p>
                </div>
              )}
              {calculatedMetrics.riskRewardRatio !== undefined && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Risk:Reward</p>
                  <p className={`text-lg font-semibold ${calculatedMetrics.riskRewardRatio >= 1 ? 'text-success-600' : 'text-warning-600'}`}>
                    1:{calculatedMetrics.riskRewardRatio.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Context & Psychology */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Context</h3>
            
            <div className="space-y-2">
              <Label htmlFor="marketCondition">Market Condition</Label>
              <Select {...register('marketCondition')}>
                <option value="">Select condition</option>
                <option value={MarketCondition.TRENDING_UP}>Trending Up</option>
                <option value={MarketCondition.TRENDING_DOWN}>Trending Down</option>
                <option value={MarketCondition.RANGING}>Ranging</option>
                <option value={MarketCondition.VOLATILE}>Volatile</option>
                <option value={MarketCondition.LOW_VOLUME}>Low Volume</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volatility">Volatility</Label>
              <Select {...register('volatility')}>
                <option value="">Select volatility</option>
                <option value={VolatilityLevel.LOW}>Low</option>
                <option value={VolatilityLevel.MEDIUM}>Medium</option>
                <option value={VolatilityLevel.HIGH}>High</option>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Psychology</h3>
            
            <div className="space-y-2">
              <Label htmlFor="emotionBefore">Emotion Before</Label>
              <Select {...register('emotionBefore')}>
                <option value="">Select emotion</option>
                <option value={EmotionLevel.VERY_NEGATIVE}>Very Negative</option>
                <option value={EmotionLevel.NEGATIVE}>Negative</option>
                <option value={EmotionLevel.NEUTRAL}>Neutral</option>
                <option value={EmotionLevel.POSITIVE}>Positive</option>
                <option value={EmotionLevel.VERY_POSITIVE}>Very Positive</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotionAfter">Emotion After</Label>
              <Select {...register('emotionAfter')}>
                <option value="">Select emotion</option>
                <option value={EmotionLevel.VERY_NEGATIVE}>Very Negative</option>
                <option value={EmotionLevel.NEGATIVE}>Negative</option>
                <option value={EmotionLevel.NEUTRAL}>Neutral</option>
                <option value={EmotionLevel.POSITIVE}>Positive</option>
                <option value={EmotionLevel.VERY_POSITIVE}>Very Positive</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Notes and Lessons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="notes">Trade Notes</Label>
            <Textarea
              id="notes"
              placeholder="What was your reasoning for this trade? Market analysis, setup details, etc."
              rows={4}
              {...register('notes')}
              className={errors.notes ? 'border-danger-500' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-danger-600">{errors.notes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessons">Lessons Learned</Label>
            <Textarea
              id="lessons"
              placeholder="What did you learn from this trade? What would you do differently?"
              rows={4}
              {...register('lessons')}
              className={errors.lessons ? 'border-danger-500' : ''}
            />
            {errors.lessons && (
              <p className="text-sm text-danger-600">{errors.lessons.message}</p>
            )}
          </div>
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Screenshots</h3>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-gray-600 dark:text-gray-400">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop chart screenshots here, or click to select
                </p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
              </div>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-danger-600 text-white rounded-full p-1 hover:bg-danger-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        {showSubmitButton && (
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="min-w-[120px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? 'Saving...' : submitButtonText}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}