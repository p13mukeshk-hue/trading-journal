'use client';

import React, { useState, useCallback } from 'react';
import { TradeForm } from './TradeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Check, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { TradeInput } from '@/lib/validations/trade';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeTab {
  id: string;
  title: string;
  isCompleted: boolean;
  data?: Partial<TradeInput>;
  hasErrors?: boolean;
}

interface MultiTradeFormProps {
  onSubmit: (trades: TradeInput[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function MultiTradeForm({ onSubmit, onCancel, isLoading = false }: MultiTradeFormProps) {
  const [tabs, setTabs] = useState<TradeTab[]>([
    { id: '1', title: 'Trade 1', isCompleted: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [completedTrades, setCompletedTrades] = useState<TradeInput[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const addNewTab = useCallback(() => {
    if (tabs.length >= 10) return;
    
    const newId = (Math.max(...tabs.map(t => parseInt(t.id))) + 1).toString();
    const newTab: TradeTab = {
      id: newId,
      title: `Trade ${newId}`,
      isCompleted: false
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  }, [tabs]);

  const removeTab = useCallback((tabId: string) => {
    if (tabs.length <= 1) return;
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    setCompletedTrades(prev => prev.filter((_, index) => tabs[index]?.id !== tabId));
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs[0]?.id || '1');
    }
  }, [tabs, activeTabId]);

  const handleTradeComplete = useCallback((tabId: string, tradeData: TradeInput) => {
    // Update tab status
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, isCompleted: true, data: tradeData, hasErrors: false }
        : tab
    ));

    // Update completed trades
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1) {
      setCompletedTrades(prev => {
        const newTrades = [...prev];
        newTrades[tabIndex] = tradeData;
        return newTrades;
      });
    }
  }, [tabs]);

  const handleTradeValidationError = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, hasErrors: true, isCompleted: false }
        : tab
    ));
  }, []);

  const handleSubmitAll = async () => {
    const validTrades = completedTrades.filter(trade => trade);
    if (validTrades.length === 0) return;
    
    try {
      await onSubmit(validTrades);
    } catch (error) {
      console.error('Error submitting trades:', error);
    }
  };

  const getCompletedCount = () => tabs.filter(tab => tab.isCompleted).length;
  const canSubmit = getCompletedCount() > 0 && !isLoading;

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Multi-Trade Entry
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create up to 10 trades efficiently with our tabbed interface
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getCompletedCount()}/{tabs.length} Completed
                </span>
              </div>
              
              {canSubmit && (
                <Button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Submit All ({getCompletedCount()})
                </Button>
              )}
              
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <AnimatePresence>
                {tabs.map((tab) => (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex-shrink-0"
                  >
                    <div
                      onClick={() => setActiveTabId(tab.id)}
                      className={`relative group flex items-center space-x-2 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        activeTabId === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {tab.isCompleted ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : tab.hasErrors ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium whitespace-nowrap">
                          {tab.title}
                        </span>
                      </div>

                      {tabs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTab(tab.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20 ${
                            activeTabId === tab.id ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {activeTabId === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg -z-10"
                          initial={false}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tabs.length < 10 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addNewTab}
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                >
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Trade Form */}
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TradeForm
                initialData={activeTab.data}
                onSubmit={async (data) => handleTradeComplete(activeTabId, data)}
                onValidationError={() => handleTradeValidationError(activeTabId)}
                mode="create"
                isLoading={isLoading}
                showSubmitButton={true}
                submitButtonText={activeTab.isCompleted ? "Update Trade" : "Save Trade"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Confirmation Modal */}
        <AnimatePresence>
          {showSubmitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSubmitModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Submit {getCompletedCount()} Trades?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    This will add all completed trades to your journal.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSubmitModal(false);
                        handleSubmitAll();
                      }}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Submit All
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}