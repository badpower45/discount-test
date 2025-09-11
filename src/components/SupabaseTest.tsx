// Test component to verify Supabase connection
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkTables } from '../lib/database';

interface TestResult {
  hasUrl: boolean;
  hasKey: boolean;
  connection: 'success' | 'failed' | 'testing';
  tables: { restaurants: boolean; users: boolean; coupons: boolean };
  message: string;
}

export function SupabaseTest() {
  const [result, setResult] = useState<TestResult>({
    hasUrl: false,
    hasKey: false,
    connection: 'testing',
    tables: { restaurants: false, users: false, coupons: false },
    message: 'Testing connection...'
  });

  useEffect(() => {
    async function testConnection() {
      try {
        // Check environment variables
        const hasUrl = !!(import.meta.env.VITE_SUPABASE_URL || 
                         (typeof process !== 'undefined' && process.env?.SUPABASE_URL));
        const hasKey = !!(import.meta.env.VITE_SUPABASE_ANON_KEY || 
                         (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY));

        console.log('🔧 Environment check:', { hasUrl, hasKey });
        console.log('🔧 Meta env:', import.meta.env);

        if (!hasUrl || !hasKey) {
          setResult({
            hasUrl,
            hasKey,
            connection: 'failed',
            tables: { restaurants: false, users: false, coupons: false },
            message: 'Missing Supabase credentials in environment'
          });
          return;
        }

        // Test basic connection
        const { data, error } = await supabase.from('_test_').select('*').limit(1);
        
        // Check if tables exist
        const tables = await checkTables();
        
        setResult({
          hasUrl,
          hasKey,
          connection: error ? 'failed' : 'success',
          tables,
          message: error 
            ? `Connection failed: ${error.message}`
            : 'Connected successfully to Supabase!'
        });

      } catch (error) {
        console.error('Connection test error:', error);
        setResult({
          hasUrl: false,
          hasKey: false,
          connection: 'failed',
          tables: { restaurants: false, users: false, coupons: false },
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border max-w-md mx-auto m-4">
      <h3 className="text-lg font-semibold mb-4 text-center">🔧 Supabase Connection Test</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>URL Available:</span>
          <span className={result.hasUrl ? 'text-green-600' : 'text-red-600'}>
            {result.hasUrl ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Key Available:</span>
          <span className={result.hasKey ? 'text-green-600' : 'text-red-600'}>
            {result.hasKey ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Connection:</span>
          <span className={
            result.connection === 'success' ? 'text-green-600' : 
            result.connection === 'failed' ? 'text-red-600' : 'text-yellow-600'
          }>
            {result.connection === 'success' ? '✅' : 
             result.connection === 'failed' ? '❌' : '⏳'}
          </span>
        </div>
        
        <hr className="my-3"/>
        <h4 className="font-medium">Database Tables:</h4>
        
        <div className="flex items-center justify-between">
          <span>Restaurants:</span>
          <span className={result.tables.restaurants ? 'text-green-600' : 'text-red-600'}>
            {result.tables.restaurants ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Users:</span>
          <span className={result.tables.users ? 'text-green-600' : 'text-red-600'}>
            {result.tables.users ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Coupons:</span>
          <span className={result.tables.coupons ? 'text-green-600' : 'text-red-600'}>
            {result.tables.coupons ? '✅' : '❌'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <p className="text-xs text-gray-700">{result.message}</p>
      </div>
      
      {(!result.tables.restaurants || !result.tables.users || !result.tables.coupons) && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-xs text-yellow-800">
            ⚠️ Some database tables are missing. Please create them in your Supabase dashboard.
          </p>
        </div>
      )}
    </div>
  );
}