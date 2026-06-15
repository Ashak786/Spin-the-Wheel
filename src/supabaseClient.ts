import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question } from './types';
import { defaultQuestions } from './data/defaultQuestions';

// Simple key storage names for local configuration persistence
const URL_KEY = 'spin_wheel_supabase_url';
const ANON_KEY = 'spin_wheel_supabase_anon_key';

export function getSavedCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const savedUrl = (typeof localStorage !== 'undefined') ? localStorage.getItem(URL_KEY) : null;
  const savedKey = (typeof localStorage !== 'undefined') ? localStorage.getItem(ANON_KEY) : null;

  return {
    url: savedUrl || envUrl,
    anonKey: savedKey || envKey,
    isUsingEnv: !savedUrl && !!envUrl
  };
}

export function saveCredentials(url: string, anonKey: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(URL_KEY, url);
    localStorage.setItem(ANON_KEY, anonKey);
  }
}

export function clearCredentials() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(URL_KEY);
    localStorage.removeItem(ANON_KEY);
  }
}

let clientInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSavedCredentials();
  
  if (!url || !anonKey) {
    clientInstance = null;
    return null;
  }

  // Rebuild if credentials changed
  if (!clientInstance || currentUrl !== url || currentKey !== anonKey) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
      currentUrl = url;
      currentKey = anonKey;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      clientInstance = null;
    }
  }

  return clientInstance;
}

/**
 * Checks if the Supabase table exists and works.
 */
export async function testConnection(): Promise<{ success: boolean; message: string; rowCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase URL or Anon Key is missing. Check database settings.' };
  }

  try {
    // Attempt to query the 'questions' table
    const { data, error, count } = await client
      .from('questions')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      // Check if it's a specific table absence error
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Connected to Supabase successfully, but the table "questions" does not exist. Please create or seed the table.' 
        };
      }
      return { success: false, message: `Query error: ${error.message} (Code: ${error.code})` };
    }

    const { count: fullCount, error: countError } = await client
      .from('questions')
      .select('id', { count: 'exact', head: true });

    const totalCount = countError ? (data?.length || 0) : (fullCount || 0);

    return { 
      success: true, 
      message: 'Successfully connected and verified the "questions" table!',
      rowCount: totalCount
    };
  } catch (err: any) {
    return { success: false, message: `Network exception: ${err.message || err}` };
  }
}

/**
 * Seeds the default question objects into the user's Supabase instance
 */
export async function seedQuestionsTable(): Promise<{ success: boolean; message: string; rowsInserted?: number }> {
  const client = getSavedCredentials().url ? getSupabaseClient() : null;
  if (!client) {
    return { success: false, message: 'Supabase client not initialized.' };
  }

  try {
    // Insert the category, Questions, answer, and options columns into the questions table
    const rowsToInsert = defaultQuestions.map((q) => ({
      category: q.category,
      Questions: q.question_text,
      answer: q.answer,
      options: q.options
    }));

    const { data, error } = await client
      .from('questions')
      .insert(rowsToInsert)
      .select();

    if (error) {
      return { success: false, message: `Insertion failed: ${error.message} (Code: ${error.code})` };
    }

    return { 
      success: true, 
      message: `Successfully seeded ${rowsToInsert.length} questions into your "questions" table.`,
      rowsInserted: data?.length || rowsToInsert.length
    };
  } catch (err: any) {
    return { success: false, message: `Seeding exception: ${err.message || err}` };
  }
}

/**
 * Loose matching helper to identify category matchups despite spelling/naming variations in user databases
 */
export function isCategoryMatch(dbCategory: string, wheelCategory: string): boolean {
  const dbLower = (dbCategory || '').trim().toLowerCase();
  const wheelLower = wheelCategory.trim().toLowerCase();
  
  if (dbLower === wheelLower) return true;
  
  if (wheelCategory === "Facts on EV Car") {
    return (
      dbLower.includes('ev') || 
      dbLower.includes('myth') || 
      dbLower.includes('fact') ||
      dbLower.includes('electric')
    );
  }
  if (wheelCategory === "Car Lease Trivia") {
    return (
      dbLower.includes('lease') || 
      dbLower.includes('price') || 
      dbLower.includes('trivia') || 
      dbLower.includes('cap') ||
      dbLower.includes('residual')
    );
  }
  if (wheelCategory === "Car Quiz") {
    return (
      dbLower.includes('quiz') || 
      dbLower.includes('general') || 
      dbLower.includes('test')
    );
  }
  return false;
}

/**
 * Fetches distinct categories dynamically from the user's Supabase database
 */
export async function fetchDatabaseCategories(): Promise<string[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('questions')
      .select('category');
    
    if (error || !data) return [];
    
    const categoryList = data
      .map(r => r.category ? String(r.category).trim() : '')
      .filter(Boolean);
    
    const distinct: string[] = [];
    for (const cat of categoryList) {
      if (!distinct.some(d => d.toLowerCase() === cat.toLowerCase())) {
        distinct.push(cat);
      }
    }
    return distinct;
  } catch (e) {
    console.error('Failed to discover database categories:', e);
    return [];
  }
}

/**
 * Fetches a random, unique question for a specific category
 */
export async function fetchRandomQuestionFromCategory(
  category: string,
  answeredIds: (string | number)[]
): Promise<{ question: Question; source: 'supabase' | 'default' }> {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      // Query ALL rows from the questions table to evaluate complete database-only choices
      const { data, error } = await client
        .from('questions')
        .select('id, category, Questions, answer, options');

      if (!error && data && data.length > 0) {
        // Find custom database rows that match the lands-on category via loose matching
        let matchingPool = data.filter(q => isCategoryMatch(q.category || '', category));
        
        let pool = [];
        if (matchingPool.length > 0) {
          // Filter out already answered to maintain unique game challenge
          const unspent = matchingPool.filter(q => !answeredIds.includes(q.id));
          pool = unspent.length > 0 ? unspent : matchingPool;
        } else {
          // DATABASE ONLY FALLBACK: If no questions match the selected category specifically,
          // prefer using any other questions from the database instead of falling back to default/local deck!
          const unspent = data.filter(q => !answeredIds.includes(q.id));
          pool = unspent.length > 0 ? unspent : data;
        }

        // Pick a random question from our computed DB database pool
        const randomIndex = Math.floor(Math.random() * pool.length);
        const dbQuestion = pool[randomIndex];

        // Format raw DB entry to standard Question interface
        const qText = (dbQuestion as any).Questions || '';
        const rawAnswer = (dbQuestion as any).answer || '';
        const rawOptions = (dbQuestion as any).options;

        let parsedOptions: string[] | undefined = undefined;
        if (rawOptions) {
          if (Array.isArray(rawOptions)) {
            parsedOptions = rawOptions;
          } else if (typeof rawOptions === 'string') {
            try {
              parsedOptions = JSON.parse(rawOptions);
            } catch (e) {
              console.warn('Failed to parse options JSON string', e);
            }
          }
        }

        const matchedDefault = defaultQuestions.find(dq => dq.question_text === qText);
        
        // Build suitable fallback options if none are stored in database
        if (!parsedOptions) {
          const matchedCategory = dbQuestion.category || category;
          if (isCategoryMatch(matchedCategory, 'Facts on EV Car')) {
            parsedOptions = ['Fact', 'Myth'];
          } else if (matchedDefault) {
            parsedOptions = matchedDefault.options;
          } else {
            // Default 4-choice fallback if there are no default questions matching
            parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
          }
        }

        return {
          question: {
            id: dbQuestion.id,
            category: dbQuestion.category || category,
            question_text: qText,
            answer: rawAnswer || matchedDefault?.answer || '',
            options: parsedOptions,
            source: 'supabase'
          },
          source: 'supabase'
        };
      } else {
        // If client is connected but table is empty, return a custom alert database row rather than local questions
        return {
          question: {
            id: -2,
            category: category,
            question_text: "Your database 'questions' table is connected but contains no trivias. Please seed or add question rows in your Supabase dashboard to start playing!",
            answer: "Ok",
            options: ["Ok"],
            source: 'supabase'
          },
          source: 'supabase'
        };
      }
    } catch (e) {
      console.warn('Supabase fetch failed, returning dynamic alert card', e);
      return {
        question: {
          id: -3,
          category: category,
          question_text: "Failed to load from database. Ensure your Supabase RLS policies permit reading and that your network is connected.",
          answer: "Retry",
          options: ["Retry"],
          source: 'supabase'
        },
        source: 'supabase'
      };
    }
  }

  // Fallback to beautiful local static set ONLY if client is entirely unconfigured
  let pool = defaultQuestions.filter(
    q => isCategoryMatch(q.category || '', category) && !answeredIds.includes(q.id)
  );
  
  if (pool.length === 0) {
    // If we run out of unspent questions for this category, reuse the same category questions but randomly
    pool = defaultQuestions.filter(q => isCategoryMatch(q.category || '', category));
  }
  
  if (pool.length === 0) {
    // Fallback if no questions matched this category name at all: pick from any unspent questions
    pool = defaultQuestions.filter(q => !answeredIds.includes(q.id));
  }
  
  if (pool.length === 0) {
    // Ultimate fallback: pick from all questions
    pool = defaultQuestions;
  }
  
  const randomIndex = Math.floor(Math.random() * pool.length);
  const returnedLocal = { ...pool[randomIndex] };
  returnedLocal.source = 'default';

  return {
    question: returnedLocal,
    source: 'default'
  };
}
