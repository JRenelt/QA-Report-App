import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, CheckCircle, XCircle, AlertCircle, Clock, Edit, Trash2, Eye, FileText } from 'lucide-react';

interface TestCase {
  id: number;
  test_id: string;
  name: string;
  description?: string;
  priority: number;
  expected_result?: string;
  sort_order: number;
  test_suite_id: number;
  is_predefined: boolean;
  created_by?: number;
  created_at: string;
}

interface TestResult {
  id: number;
  status: 'success' | 'error' | 'warning' | 'skipped';
  notes?: string;
  test_case_id: number;
  executed_by: number;
  execution_date: string;
  session_id?: string;
}

interface TestSuiteManagerProps {
  testSuite: any;
  authToken: string;
  language: 'de' | 'en';
  onClose: () => void;
}

const TestSuiteManager: React.FC<TestSuiteManagerProps> = ({ testSuite, authToken, language, onClose }) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<{ [key: number]: TestResult }>({});
  const [loading, setLoading] = useState(true);
  const [executionMode, setExecutionMode] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [notes, setNotes] = useState('');

  const translations = {
    de: {
      testSuite: 'Test-Suite',
      testCases: 'Testfälle',
      addTest: 'Test hinzufügen',
      startTesting: 'Tests starten',
      stopTesting: 'Tests stoppen',
      previousTest: 'Vorheriger Test',
      nextTest: 'Nächster Test',
      testId: 'Test-ID',
      testName: 'Test-Name',
      priority: 'Priorität',
      status: 'Status',
      actions: 'Aktionen',
      notes: 'Notizen',
      expectedResult: 'Erwartetes Ergebnis',
      testResult: 'Test-Ergebnis',
      success: 'Erfolgreich',
      error: 'Fehler',
      warning: 'Warnung',
      skipped: 'Übersprungen',
      notTested: 'Nicht getestet',
      saveResult: 'Ergebnis speichern',
      close: 'Schließen',
      description: 'Beschreibung',
      executionProgress: 'Ausführungsfortschritt',
      completed: 'Abgeschlossen',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig'
    },
    en: {
      testSuite: 'Test Suite',
      testCases: 'Test Cases',
      addTest: 'Add Test',
      startTesting: 'Start Testing',
      stopTesting: 'Stop Testing',
      previousTest: 'Previous Test',
      nextTest: 'Next Test',
      testId: 'Test ID',
      testName: 'Test Name',
      priority: 'Priority',
      status: 'Status',
      actions: 'Actions',
      notes: 'Notes',
      expectedResult: 'Expected Result',
      testResult: 'Test Result',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      skipped: 'Skipped',
      notTested: 'Not Tested',
      saveResult: 'Save Result',
      close: 'Close',
      description: 'Description',
      executionProgress: 'Execution Progress',
      completed: 'Completed',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadTestCases();
  }, [testSuite.id]);

  const loadTestCases = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/test-cases/suite/${testSuite.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTestCases(data);
      }
    } catch (error) {
      console.error('Error loading test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return t.high;
      case 2: return t.medium;
      case 3: return t.low;
      default: return t.low;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'skipped': return <Clock className="h-5 w-5 text-gray-600" />;
      default: return <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'success': return t.success;
      case 'error': return t.error;
      case 'warning': return t.warning;
      case 'skipped': return t.skipped;
      default: return t.notTested;
    }
  };

  const handleExecutionModeToggle = () => {
    setExecutionMode(!executionMode);
    if (!executionMode) {
      setCurrentTestIndex(0);
      setNotes('');
    }
  };

  const handleTestResult = async (status: 'success' | 'error' | 'warning' | 'skipped') => {
    const currentTest = testCases[currentTestIndex];
    if (!currentTest) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/test-results/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_case_id: currentTest.id,
          status: status,
          notes: notes,
          session_id: `session_${Date.now()}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => ({
          ...prev,
          [currentTest.id]: result
        }));
        setNotes('');
        
        // Move to next test
        if (currentTestIndex < testCases.length - 1) {
          setCurrentTestIndex(currentTestIndex + 1);
        }
      }
    } catch (error) {
      console.error('Error saving test result:', error);
    }
  };

  const completedTests = Object.keys(testResults).length;
  const progressPercentage = testCases.length > 0 ? (completedTests / testCases.length) * 100 : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qa-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{testSuite.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-qa-gray-900">
                {testSuite.name}
              </h2>
              <p className="text-sm text-qa-gray-600">{testSuite.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExecutionModeToggle}
              className={executionMode ? 'btn-secondary' : 'btn-primary'}
            >
              {executionMode ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  {t.stopTesting}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t.startTesting}
                </>
              )}
            </button>
            <button onClick={onClose} className="text-qa-gray-400 hover:text-qa-gray-600">
              ✕
            </button>
          </div>
        </div>

        {executionMode ? (
          /* Execution Mode */
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-qa-gray-600 mb-2">
                <span>{t.executionProgress}</span>
                <span>{completedTests}/{testCases.length} {t.completed}</span>
              </div>
              <div className="w-full bg-qa-gray-200 rounded-full h-2">
                <div 
                  className="bg-qa-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {testCases[currentTestIndex] && (
              <div className="bg-qa-gray-50 rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-qa-primary-600">
                      {testCases[currentTestIndex].test_id}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(testCases[currentTestIndex].priority)}`}>
                      {getPriorityLabel(testCases[currentTestIndex].priority)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-qa-gray-900 mb-2">
                    {testCases[currentTestIndex].name}
                  </h3>
                  {testCases[currentTestIndex].description && (
                    <p className="text-qa-gray-600 mb-4">
                      {testCases[currentTestIndex].description}
                    </p>
                  )}
                  {testCases[currentTestIndex].expected_result && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <strong className="text-blue-900">{t.expectedResult}:</strong>
                      <p className="text-blue-800">{testCases[currentTestIndex].expected_result}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-qa-gray-700 mb-2">
                    {t.notes}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full input-field min-h-[80px]"
                    placeholder="Notizen zum Testergebnis..."
                  />
                </div>

                {/* Result Buttons */}
                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={() => handleTestResult('success')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 inline" />
                    {t.success}
                  </button>
                  <button
                    onClick={() => handleTestResult('error')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2 inline" />
                    {t.error}
                  </button>
                  <button
                    onClick={() => handleTestResult('warning')}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 inline" />
                    {t.warning}
                  </button>
                  <button
                    onClick={() => handleTestResult('skipped')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <Clock className="h-4 w-4 mr-2 inline" />
                    {t.skipped}
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentTestIndex(Math.max(0, currentTestIndex - 1))}
                    disabled={currentTestIndex === 0}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.previousTest}
                  </button>
                  <span className="text-sm text-qa-gray-600 py-2">
                    {currentTestIndex + 1} von {testCases.length}
                  </span>
                  <button
                    onClick={() => setCurrentTestIndex(Math.min(testCases.length - 1, currentTestIndex + 1))}
                    disabled={currentTestIndex === testCases.length - 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.nextTest}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Management Mode */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-qa-gray-900">{t.testCases}</h3>
              <button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                {t.addTest}
              </button>
            </div>

            {testCases.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-qa-gray-400 mx-auto mb-4" />
                <p className="text-qa-gray-500">Keine Testfälle vorhanden</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-qa-gray-200">
                  <thead className="bg-qa-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                        {t.testId}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                        {t.testName}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                        {t.priority}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                        {t.status}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-qa-gray-200">
                    {testCases.map((testCase) => (
                      <tr key={testCase.id} className="hover:bg-qa-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-qa-primary-600">
                          {testCase.test_id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-qa-gray-900">{testCase.name}</div>
                          {testCase.description && (
                            <div className="text-sm text-qa-gray-500">{testCase.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(testCase.priority)}`}>
                            {getPriorityLabel(testCase.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(testResults[testCase.id]?.status)}
                            <span className="ml-2 text-sm text-qa-gray-900">
                              {getStatusLabel(testResults[testCase.id]?.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="text-qa-primary-600 hover:text-qa-primary-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-yellow-600 hover:text-yellow-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSuiteManager;